import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { AppStep, CalendarEvent, Category, TemplateConfig, CATEGORY_COLORS } from './types';
import { extractCalendarFromImage } from './services/geminiService';
import { convertFileToBase64 } from './services/imageUtils';
import { SAMPLE_EVENTS, SAMPLE_CATEGORIES, MCGILL_RAW_API_RESPONSE } from './services/sampleData';
import { processRawEvents } from './services/geminiService';
import { UploadStep } from './components/UploadStep';
import { EditStep } from './components/EditStep';
import { ExportStep } from './components/ExportStep';
import { BackgroundsProvider } from './contexts/BackgroundsContext';
import faviconDark from './assets/Favicon_BlackLine.png';
import faviconLight from './assets/FavIcon_WhiteLine.png';
import { getDefaultLandscapeId } from './assets/backgrounds';
import { LOG_RESPONSES } from './config';

// Placeholder star count - will be replaced with real API
const GITHUB_STAR_COUNT = '2';
const GITHUB_REPO_URL = 'https://github.com/yanzhehw/ScheduleStyler';

const DEFAULT_TEMPLATE: TemplateConfig = {
  id: 'default',
  name: 'Modern Clean',
  fontScale: 1,
  showNotes: true,
  compact: false,
  themeFamily: 'default',
  themeVariant: 'dark',
  theme: 'default-dark',
  primaryColor: '#3b82f6',
  borderRadius: '16px',
  showTime: true,
  showLocation: true,
  showGrid: true,
  showClassType: true,
  viewMode: 'desktop',
  aspectRatio: 0.6, // Default: near natural content ratio (0 = 16:9, 1 = 9:16)
  differentiateTypes: false, // Differentiate Labs/Tutorials with different colors
  showCourseSection: false, // Show full course section in title
  eventBlockNoBorders: false, // Remove borders from event blocks
  gridLineStyle: 'dark', // Grid line style: 'bright' or 'dark'
  eventOpacity: 1, // Event block color layer opacity (0-1, default 100%)
  titleFont: 'Inter', // Font for event block title
  subtitleFont: 'Inter', // Font for event block subtitle
  detailsFont: 'Inter', // Font for event block details
  titleFontSize: 12, // Title font size in pixels
  subtitleFontSize: 10, // Subtitle font size in pixels
  detailsFontSize: 10, // Details font size in pixels
  titleBold: true, // Bold for title text
  titleItalic: false, // Italic for title text
  subtitleBold: true, // Bold for subtitle text
  subtitleItalic: false, // Italic for subtitle text
  detailsBold: false, // Bold for details text
  detailsItalic: false, // Italic for details text
  textAlignHorizontal: 'left', // Horizontal text alignment
  textAlignVertical: 'top', // Vertical text alignment
  headerBlurAmount: 0, // Day header backdrop blur (0-20px)
  headerBlurMode: 'bar', // 'bar' for entire row, 'cells' for individual cells
  timeColumnBlurAmount: 0, // Time column backdrop blur (0-20px)
  timeColumnBlurMode: 'bar', // 'bar' for entire column, 'cells' for individual cells
  backgroundType: 'image', // Background type: 'none', 'image', or 'color'
  backgroundImage: getDefaultLandscapeId() || 'l1', // First landscape background as default
  backgroundBlur: 0, // Background blur amount (0-20px)
  backgroundOverlay: 0, // Background overlay/highlight opacity (0-100)
  calendarCardInsets: { top: 0, bottom: 0, left: 0, right: 0 }, // Calendar card insets from background edges
  lockscreenMockup: false, // Show iPhone lockscreen mockup overlay
};

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
  const [isProcessing, setIsProcessing] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [template, setTemplate] = useState<TemplateConfig>(DEFAULT_TEMPLATE);
  const [hasVisitedExport, setHasVisitedExport] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [keyMode, setKeyMode] = useState<'invite' | 'byok'>('invite');
  const [appliedApiKey, setAppliedApiKey] = useState<string | null>(null);

  const handleFileUpload = async (file: File, apiKey?: string, activationToken?: string) => {
    setIsProcessing(true);
    setApiKeyError(null);
    setStep(AppStep.PROCESSING); // Technically visual state within UploadStep
    try {
      const base64 = await convertFileToBase64(file);
      const data = await extractCalendarFromImage(base64, apiKey);
      setEvents(data.events);
      setCategories(data.categories);
      setStep(AppStep.EDIT);

      // Mark the invitation code as used after successful extraction
      if (activationToken) {
        console.log('[mark-used] Calling /api/mark-used with activationToken:', activationToken);
        try {
          const markResponse = await fetch('/api/mark-used', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activationToken }),
          });
          const markResult = await markResponse.json();
          console.log('[mark-used] Response status:', markResponse.status);
          console.log('[mark-used] Response body:', markResult);
          if (markResponse.ok) {
            console.log('[mark-used] ✅ Invitation code successfully marked as USED');
          } else {
            console.warn('[mark-used] ⚠️ Failed to mark code as used:', markResult.error);
          }
        } catch (markError) {
          // Log but don't fail the extraction if marking fails
          console.error("[mark-used] ❌ Failed to mark invitation code as used:", markError);
        }
      }
    } catch (error) {
      console.error("Extraction error", error);
      if (apiKey) {
        // BYOK mode - show error in the upload step and reset applied key so user can edit
        setApiKeyError("Request failed. Please double-check the validity of your API key.");
        setAppliedApiKey(null);
        setStep(AppStep.UPLOAD);
      } else {
        alert("Failed to analyze the image. Please try a clearer screenshot.");
        setStep(AppStep.UPLOAD);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = () => {
    setEvents([...SAMPLE_EVENTS]);
    setCategories([...SAMPLE_CATEGORIES]);
    setStep(AppStep.EDIT);
  };

  const handleLoadMcGillSample = () => {
    if (LOG_RESPONSES) {
      // Process raw API data through the same pipeline as real API calls
      console.log('=== McGill Sample - Raw API Response ===');
      console.log(JSON.stringify(MCGILL_RAW_API_RESPONSE, null, 2));
    }

    const processed = processRawEvents(MCGILL_RAW_API_RESPONSE);

    if (LOG_RESPONSES) {
      console.log('=== McGill Sample - Processed Events ===');
      console.log(JSON.stringify(processed.events, null, 2));
      console.log(`Total: ${processed.events.length} events, ${processed.categories.length} categories`);
    }
    setEvents(processed.events);
    setCategories(processed.categories);
    setStep(AppStep.EDIT);
  };

  const handleEnterManually = () => {
    // Start with empty schedule - CalendarCanvas defaults to Mon-Fri, 8am-6pm
    setEvents([]);
    setCategories([]);
    setStep(AppStep.EDIT);
  };

  // DEV: Mock waiting state for testing the loading UI
  const handleMockWaiting = () => {
    setIsProcessing(true);
    // Auto-reset after 15 seconds (or manually navigate away)
    setTimeout(() => setIsProcessing(false), 15000);
  };

  return (
    <BackgroundsProvider>
    <div className="h-screen overflow-hidden flex flex-col bg-[#0f172a] text-slate-100 font-sans selection:bg-blue-500/30">
      
      {/* Header */}
      <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <picture className="w-8 h-8 rounded-lg overflow-hidden bg-gray-900/60 flex items-center justify-center">
            <source srcSet={faviconLight} media="(prefers-color-scheme: dark)" />
            <img src={faviconDark} alt="ScheduleStyler" className="w-6 h-6 object-contain" />
          </picture>
          <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            ScheduleStyler
          </span>
        </div>
        
        <div className="flex gap-2">
          {[AppStep.UPLOAD, AppStep.EDIT, AppStep.EXPORT].map((s, idx) => {
             const isActive = step === s;
             const isPast = [AppStep.UPLOAD, AppStep.EDIT, AppStep.EXPORT].indexOf(step) > idx;
             return (
               <div key={s} className="flex items-center gap-2">
                 <div className={`
                    px-3 py-1 rounded-full text-xs font-semibold transition-all
                    ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' :
                      isPast ? 'bg-gray-800 text-gray-400' : 'text-gray-600'}
                 `}>
                   {idx + 1}. {s.charAt(0) + s.slice(1).toLowerCase()}
                 </div>
                 {idx < 2 && <div className="w-4 h-0.5 bg-gray-800"></div>}
               </div>
             )
          })}
        </div>

        {/* GitHub Star Button */}
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-0 rounded-full border border-blue-500/50 bg-gradient-to-r from-blue-600/90 to-blue-700/90 hover:from-blue-500/90 hover:to-blue-600/90 transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-800/30 hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="flex items-center gap-2 px-4 py-2">
            <span className="text-sm font-semibold text-white">Star On GitHub</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-2 bg-slate-900/80 rounded-r-full border-l border-blue-500/30">
            <Star size={16} className="text-white fill-white" />
            <span className="text-sm font-medium text-slate-200">{GITHUB_STAR_COUNT}</span>
          </div>
        </a>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0 p-6 overflow-hidden">
        {step === AppStep.UPLOAD && (
          <UploadStep
            onFileSelect={handleFileUpload}
            onLoadSample={handleLoadSample}
            onLoadMcGillSample={handleLoadMcGillSample}
            onEnterManually={handleEnterManually}
            onMockWaiting={handleMockWaiting}
            isProcessing={isProcessing}
            apiKeyError={apiKeyError}
            onDismissApiKeyError={() => setApiKeyError(null)}
            keyMode={keyMode}
            onKeyModeChange={setKeyMode}
            appliedApiKey={appliedApiKey}
            onAppliedApiKeyChange={setAppliedApiKey}
          />
        )}

        {step === AppStep.PROCESSING && (
          <UploadStep
            onFileSelect={() => {}}
            onLoadSample={() => {}}
            onLoadMcGillSample={() => {}}
            onEnterManually={() => {}}
            isProcessing={true}
            keyMode={keyMode}
            onKeyModeChange={() => {}}
            appliedApiKey={appliedApiKey}
            onAppliedApiKeyChange={() => {}}
          />
        )}

        {step === AppStep.EDIT && (
          <EditStep
            events={events}
            categories={categories}
            template={hasVisitedExport ? template : { ...template, backgroundType: 'none', backgroundIndependent: false }}
            onUpdateEvents={setEvents}
            onUpdateTemplate={setTemplate}
            onNext={() => {
              // Set acrylic theme and appropriate background when entering Export view for the first time
              if (!hasVisitedExport) {
                const defaultBg = getDefaultLandscapeId() || 'l1';
                setTemplate(prev => ({
                  ...prev,
                  // Switch to acrylic theme on first visit to Export
                  themeFamily: 'acrylic',
                  themeVariant: 'dark',
                  themeSubVariant: 'dark-slate',
                  theme: 'acrylic-dark',
                  // Set image background for acrylic theme
                  backgroundType: 'image',
                  backgroundImage: prev.backgroundImage || defaultBg,
                }));
              }
              setHasVisitedExport(true);
              setStep(AppStep.EXPORT);
            }}
            onReupload={() => setStep(AppStep.UPLOAD)}
          />
        )}

        {step === AppStep.EXPORT && (
          <ExportStep 
            events={events}
            template={template}
            onUpdateTemplate={setTemplate}
            onUpdateEvents={setEvents}
            onBack={() => setStep(AppStep.EDIT)}
          />
        )}
      </main>
    </div>
    </BackgroundsProvider>
  );
};

export default App;
