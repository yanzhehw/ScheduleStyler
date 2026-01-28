import React, { useState } from 'react';
import { AppStep, CalendarEvent, Category, TemplateConfig, CATEGORY_COLORS } from './types';
import { extractCalendarFromImage } from './services/geminiService';
import { convertFileToBase64 } from './services/imageUtils';
import { SAMPLE_EVENTS, SAMPLE_CATEGORIES, MCGILL_RAW_API_RESPONSE } from './services/sampleData';
import { processRawEvents } from './services/geminiService';
import { UploadStep } from './components/UploadStep';
import { EditStep } from './components/EditStep';
import { ExportStep } from './components/ExportStep';
import faviconDark from './assets/Favicon_BlackLine.png';
import faviconLight from './assets/FavIcon_WhiteLine.png';

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
  gridLineStyle: 'dark', // Grid line style: 'bright' or 'dark'
  eventOpacity: 1, // Event block color layer opacity (0-1, default 100%)
  titleFont: 'Inter', // Font for event block title
  subtitleFont: 'Inter', // Font for event block subtitle
  detailsFont: 'Inter', // Font for event block details
  titleFontSize: 12, // Title font size in pixels
  subtitleFontSize: 10, // Subtitle font size in pixels
  detailsFontSize: 10, // Details font size in pixels
  headerBlurAmount: 0, // Day header backdrop blur (0-20px)
  headerBlurMode: 'bar', // 'bar' for entire row, 'cells' for individual cells
  timeColumnBlurAmount: 0, // Time column backdrop blur (0-20px)
  timeColumnBlurMode: 'bar', // 'bar' for entire column, 'cells' for individual cells
  backgroundType: 'image', // Background type: 'none', 'image', or 'color'
  backgroundImage: 'l1', // First landscape background as default
  backgroundBlur: 0, // Background blur amount (0-20px)
  backgroundOverlay: 0, // Background overlay/highlight opacity (0-100)
  backgroundIndependent: false, // Whether background has independent aspect ratio
  backgroundAspectRatio: 0.6, // Background aspect ratio when independent
  lockscreenMockup: false, // Show iPhone lockscreen mockup overlay
  lockscreenOffset: 15, // Vertical offset for calendar within lockscreen (0-100%)
};

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
  const [isProcessing, setIsProcessing] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [template, setTemplate] = useState<TemplateConfig>(DEFAULT_TEMPLATE);
  const [hasVisitedExport, setHasVisitedExport] = useState(false);

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setStep(AppStep.PROCESSING); // Technically visual state within UploadStep
    try {
      const base64 = await convertFileToBase64(file);
      const data = await extractCalendarFromImage(base64);
      setEvents(data.events);
      setCategories(data.categories);
      setStep(AppStep.EDIT);
    } catch (error) {
      console.error("Extraction error", error);
      alert("Failed to analyze the image. Please try a clearer screenshot.");
      setStep(AppStep.UPLOAD);
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
    // Process raw API data through the same pipeline as real API calls
    console.log('=== McGill Sample - Raw API Response ===');
    console.log(JSON.stringify(MCGILL_RAW_API_RESPONSE, null, 2));
    
    const processed = processRawEvents(MCGILL_RAW_API_RESPONSE);
    
    console.log('=== McGill Sample - Processed Events ===');
    console.log(JSON.stringify(processed.events, null, 2));
    console.log(`Total: ${processed.events.length} events, ${processed.categories.length} categories`);
    
    setEvents(processed.events);
    setCategories(processed.categories);
    setStep(AppStep.EDIT);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] text-slate-100 font-sans selection:bg-blue-500/30">
      
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
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-hidden">
        {step === AppStep.UPLOAD && (
          <UploadStep
            onFileSelect={handleFileUpload}
            onLoadSample={handleLoadSample}
            onLoadMcGillSample={handleLoadMcGillSample}
            isProcessing={isProcessing}
          />
        )}

        {step === AppStep.PROCESSING && (
          <UploadStep
            onFileSelect={() => {}}
            onLoadSample={() => {}}
            onLoadMcGillSample={() => {}}
            isProcessing={true}
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
              // Set appropriate background type based on theme when entering Export view for the first time
              if (!hasVisitedExport) {
                const isGlassOrAcrylic = template.themeFamily === 'acrylic' || template.themeFamily === 'glass';
                setTemplate(prev => ({
                  ...prev,
                  backgroundType: isGlassOrAcrylic ? 'image' : 'none',
                  backgroundImage: isGlassOrAcrylic && !prev.backgroundImage ? 'l1' : prev.backgroundImage
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
  );
};

export default App;
