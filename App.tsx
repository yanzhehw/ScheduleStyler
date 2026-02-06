import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { CalendarEvent, Category, TemplateConfig } from './types';
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

const GITHUB_REPO_URL = 'https://github.com/yanzhehw/ScheduleStyler';

// Route paths
const ROUTES = {
  UPLOAD: '/',
  EDIT: '/edit',
  EXPORT: '/export',
} as const;

// Step labels for header display
const STEP_INFO = [
  { path: ROUTES.UPLOAD, label: 'Upload' },
  { path: ROUTES.EDIT, label: 'Edit' },
  { path: ROUTES.EXPORT, label: 'Export' },
];

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
  aspectRatio: 0.6,
  differentiateTypes: false,
  showCourseSection: false,
  eventBlockNoBorders: false,
  gridLineStyle: 'dark',
  eventOpacity: 1,
  titleFont: 'Inter',
  subtitleFont: 'Inter',
  detailsFont: 'Inter',
  titleFontSize: 12,
  subtitleFontSize: 10,
  detailsFontSize: 10,
  titleBold: true,
  titleItalic: false,
  subtitleBold: true,
  subtitleItalic: false,
  detailsBold: false,
  detailsItalic: false,
  textAlignHorizontal: 'left',
  textAlignVertical: 'top',
  headerBlurAmount: 0,
  headerBlurMode: 'bar',
  timeColumnBlurAmount: 0,
  timeColumnBlurMode: 'bar',
  backgroundType: 'image',
  backgroundImage: getDefaultLandscapeId() || 'l1',
  backgroundBlur: 0,
  backgroundOverlay: 0,
  calendarCardInsets: { top: 0, bottom: 0, left: 0, right: 0 },
  lockscreenMockup: false,
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isProcessing, setIsProcessing] = useState(false);
  // Restore persisted state from sessionStorage
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = sessionStorage.getItem('events');
    return saved ? JSON.parse(saved) : [];
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = sessionStorage.getItem('categories');
    return saved ? JSON.parse(saved) : [];
  });
  const [template, setTemplate] = useState<TemplateConfig>(() => {
    const saved = sessionStorage.getItem('template');
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATE;
  });
  const [hasVisitedExport, setHasVisitedExport] = useState(() => {
    return sessionStorage.getItem('hasVisitedExport') === 'true';
  });
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [keyMode, setKeyMode] = useState<'invite' | 'byok'>('invite');
  const [appliedApiKey, setAppliedApiKey] = useState<string | null>(null);
  const [starCount, setStarCount] = useState<number>(0);
  // Track if user has started a session (persisted in sessionStorage for page refresh)
  const [hasStartedSession, setHasStartedSession] = useState(() => {
    return sessionStorage.getItem('hasStartedSession') === 'true';
  });
  // Saved export settings (aspectRatio + calendarCardInsets) to restore when returning to Export
  const [savedExportSettings, setSavedExportSettings] = useState<{
    aspectRatio: number;
    calendarCardInsets: { top: number; bottom: number; left: number; right: number };
  } | null>(null);

  // Track unique users (once per browser) and fetch stats
  useEffect(() => {
    if (!localStorage.getItem('tracked_user')) {
      fetch('/api/track/user', { method: 'POST' });
      localStorage.setItem('tracked_user', 'true');
    }

    // Fetch star count from database
    fetch('/api/track/stats')
      .then(res => res.json())
      .then(data => setStarCount(data.stars || 0))
      .catch(() => {});
  }, []);

  // Persist session state for page refresh
  useEffect(() => {
    if (hasStartedSession) {
      sessionStorage.setItem('hasStartedSession', 'true');
    }
  }, [hasStartedSession]);

  // Persist events, categories, template, and hasVisitedExport to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    sessionStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    sessionStorage.setItem('template', JSON.stringify(template));
  }, [template]);

  useEffect(() => {
    sessionStorage.setItem('hasVisitedExport', hasVisitedExport ? 'true' : 'false');
  }, [hasVisitedExport]);

  const handleFileUpload = async (file: File, apiKey?: string, activationToken?: string) => {
    setIsProcessing(true);
    setApiKeyError(null);
    try {
      const base64 = await convertFileToBase64(file);
      const data = await extractCalendarFromImage(base64, apiKey);
      setEvents(data.events);
      setCategories(data.categories);
      setHasStartedSession(true);
      navigate(ROUTES.EDIT);

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
          console.error("[mark-used] ❌ Failed to mark invitation code as used:", markError);
        }
      }
    } catch (error) {
      console.error("Extraction error", error);
      if (apiKey) {
        setApiKeyError("Request failed. Please double-check the validity of your API key.");
        setAppliedApiKey(null);
      } else {
        alert("Failed to analyze the image. Please try a clearer screenshot.");
      }
      navigate(ROUTES.UPLOAD);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = () => {
    setEvents([...SAMPLE_EVENTS]);
    setCategories([...SAMPLE_CATEGORIES]);
    setHasStartedSession(true);
    navigate(ROUTES.EDIT);
  };

  const handleLoadMcGillSample = () => {
    if (LOG_RESPONSES) {
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
    setHasStartedSession(true);
    navigate(ROUTES.EDIT);
  };

  const handleEnterManually = () => {
    setEvents([]);
    setCategories([]);
    setHasStartedSession(true);
    navigate(ROUTES.EDIT);
  };

  const handleMockWaiting = () => {
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 15000);
  };

  const handleNavigateToExport = () => {
    if (!hasVisitedExport) {
      const defaultBg = getDefaultLandscapeId() || 'l1';
      setTemplate(prev => ({
        ...prev,
        themeFamily: 'acrylic',
        themeVariant: 'dark',
        themeSubVariant: 'dark-slate',
        theme: 'acrylic-dark',
        backgroundType: 'image',
        backgroundImage: prev.backgroundImage || defaultBg,
      }));
    } else if (savedExportSettings) {
      setTemplate((prev: TemplateConfig) => ({
        ...prev,
        aspectRatio: savedExportSettings.aspectRatio,
        calendarCardInsets: { ...savedExportSettings.calendarCardInsets },
      }));
    }
    setHasVisitedExport(true);
    navigate(ROUTES.EXPORT);
  };

  const handleNavigateBackToEdit = () => {
    setSavedExportSettings({
      aspectRatio: template.aspectRatio,
      calendarCardInsets: { ...template.calendarCardInsets },
    });
    setTemplate((prev: TemplateConfig) => ({
      ...prev,
      calendarCardInsets: { top: 0, bottom: 0, left: 0, right: 0 },
    }));
    navigate(ROUTES.EDIT);
  };

  const handleReupload = () => {
    // Clear all session state when re-uploading
    setHasStartedSession(false);
    setEvents([]);
    setCategories([]);
    setTemplate(DEFAULT_TEMPLATE);
    setHasVisitedExport(false);
    setSavedExportSettings(null);
    // Clear sessionStorage
    sessionStorage.removeItem('hasStartedSession');
    sessionStorage.removeItem('events');
    sessionStorage.removeItem('categories');
    sessionStorage.removeItem('template');
    sessionStorage.removeItem('hasVisitedExport');
    navigate(ROUTES.UPLOAD);
  };

  // Determine current step index for header highlighting
  const currentStepIndex = STEP_INFO.findIndex(s => s.path === location.pathname);

  return (
    <BackgroundsProvider>
    <div className="h-screen overflow-hidden flex flex-col text-slate-100 font-sans" style={{ backgroundColor: 'var(--surface-app)' }}>

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
          {STEP_INFO.map((step, idx) => {
             const isActive = idx === currentStepIndex;
             const isPast = currentStepIndex > idx;
             return (
               <div key={step.path} className="flex items-center gap-2">
                 <div className={`
                    px-3 py-1 rounded-full text-xs font-semibold transition-all
                    ${isActive ? 'step-indicator-active text-white' :
                      isPast ? 'bg-gray-800 text-gray-400' : 'text-gray-600'}
                 `}>
                   {idx + 1}. {step.label}
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
          className="github-star-btn flex items-center gap-0 rounded-full"
        >
          <div className="flex items-center gap-2 px-4 py-2">
            <span className="text-sm font-semibold text-white">Star On GitHub</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-2 bg-slate-900/80 rounded-r-full border-l border-blue-500/30">
            <Star size={16} className="text-white fill-white" />
            <span className="text-sm font-medium text-slate-200">{starCount}</span>
          </div>
        </a>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0 p-6 overflow-hidden">
        <Routes>
          <Route
            path={ROUTES.UPLOAD}
            element={
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
            }
          />

          <Route
            path={ROUTES.EDIT}
            element={
              hasStartedSession ? (
                <EditStep
                  events={events}
                  categories={categories}
                  template={hasVisitedExport ? template : { ...template, backgroundType: 'none', backgroundIndependent: false }}
                  onUpdateEvents={setEvents}
                  onUpdateTemplate={setTemplate}
                  onNext={handleNavigateToExport}
                  onReupload={handleReupload}
                />
              ) : (
                <Navigate to={ROUTES.UPLOAD} replace />
              )
            }
          />

          <Route
            path={ROUTES.EXPORT}
            element={
              hasStartedSession ? (
                <ExportStep
                  events={events}
                  template={template}
                  onUpdateTemplate={setTemplate}
                  onUpdateEvents={setEvents}
                  onBack={handleNavigateBackToEdit}
                />
              ) : (
                <Navigate to={ROUTES.UPLOAD} replace />
              )
            }
          />

          {/* Catch-all redirect to upload */}
          <Route path="*" element={<Navigate to={ROUTES.UPLOAD} replace />} />
        </Routes>
      </main>
    </div>
    </BackgroundsProvider>
  );
};

export default App;
