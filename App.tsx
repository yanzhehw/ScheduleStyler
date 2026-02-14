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
import { LandingPage } from './components/LandingPage';
import { AboutPage } from './components/pages/AboutPage';
import { BlogPage } from './components/pages/BlogPage';
import { CommunityPage } from './components/pages/CommunityPage';
import { MeetTheTeamPage } from './components/pages/MeetTheTeamPage';
import { SupportPage } from './components/pages/SupportPage';
import { ConfirmModal } from './components/popups';
import { BackgroundsProvider } from './contexts/BackgroundsContext';
import { ExamplesProvider } from './contexts/ExamplesContext';
import faviconLight from './assets/FavIcon_WhiteLine.png';
import { getDefaultLandscapeId } from './assets/backgrounds';
import { LOG_RESPONSES } from './config';

const GITHUB_REPO_URL = 'https://github.com/yanzhehw/ScheduleStyler';

// Route paths
const ROUTES = {
  HOME: '/',
  UPLOAD: '/upload',
  EDIT: '/edit',
  EXPORT: '/export',
  ABOUT: '/about',
  BLOG: '/blog',
  COMMUNITY: '/community',
  MEET_THE_TEAM: '/meet-the-team',
  SUPPORT: '/support',
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
  textColorPreset: 'dark',
  headerTextColor: '#f3f4f6',
  timeColumnTextColor: 'rgba(255, 255, 255, 0.5)',
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
  // Reupload confirmation modal state for header navigation
  const [showHeaderReuploadConfirm, setShowHeaderReuploadConfirm] = useState(false);
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
      // Pass activationToken to the API - token is marked as USED atomically after successful extraction
      const data = await extractCalendarFromImage(base64, apiKey, activationToken);
      setEvents(data.events);
      setCategories(data.categories);
      setHasStartedSession(true);
      navigate(ROUTES.EDIT);
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

  const handleNavigateToExport = () => {
    if (!hasVisitedExport) {
      // Set acrylic theme and first landscape background as default when first arriving at Export
      const defaultBg = getDefaultLandscapeId() || 'l1';
      setTemplate(prev => ({
        ...prev,
        themeFamily: 'acrylic',
        theme: 'acrylic-dark',
        themeVariant: 'dark',
        textColorPreset: 'light',
        headerTextColor: undefined,
        timeColumnTextColor: undefined,
        backgroundType: 'image',
        backgroundImage: defaultBg,
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

  // Handle header step click - only backward navigation allowed
  const handleStepClick = (stepIndex: number) => {
    const currentIdx = STEP_INFO.findIndex(s => s.path === location.pathname);
    // Only allow backward navigation
    if (stepIndex >= currentIdx) return;

    if (stepIndex === 0) {
      // Going to Upload - show confirmation if session started
      if (hasStartedSession) {
        setShowHeaderReuploadConfirm(true);
      } else {
        navigate(ROUTES.UPLOAD);
      }
    } else if (stepIndex === 1 && currentIdx === 2) {
      // Going from Export to Edit
      handleNavigateBackToEdit();
    }
  };

  // Handle logo/brand click
  const handleLogoClick = () => {
    if (hasStartedSession && location.pathname !== ROUTES.HOME) {
      setShowHeaderReuploadConfirm(true);
    } else {
      navigate(ROUTES.HOME);
    }
  };

  // Determine current step index for header highlighting
  const currentStepIndex = STEP_INFO.findIndex(s => s.path === location.pathname);
  const isLandingPage = location.pathname === ROUTES.HOME;
  const isStaticPage = [ROUTES.ABOUT, ROUTES.BLOG, ROUTES.COMMUNITY, ROUTES.MEET_THE_TEAM, ROUTES.SUPPORT].includes(location.pathname as typeof ROUTES.ABOUT);

  // Landing page renders full-screen without header
  if (isLandingPage) {
    return (
      <BackgroundsProvider>
        <ExamplesProvider>
          <LandingPage onGetStarted={() => navigate(ROUTES.UPLOAD)} />
        </ExamplesProvider>
      </BackgroundsProvider>
    );
  }

  // Static pages (About, Blog, Community) render without app header
  if (isStaticPage) {
    return (
      <BackgroundsProvider>
        <Routes>
          <Route path={ROUTES.ABOUT} element={<AboutPage />} />
          <Route path={ROUTES.BLOG} element={<BlogPage />} />
          <Route path={ROUTES.COMMUNITY} element={<CommunityPage />} />
          <Route path={ROUTES.MEET_THE_TEAM} element={<MeetTheTeamPage />} />
          <Route path={ROUTES.SUPPORT} element={<SupportPage />} />
        </Routes>
      </BackgroundsProvider>
    );
  }

  return (
    <BackgroundsProvider>
    <div className="h-screen overflow-hidden flex flex-col text-slate-100 font-sans" style={{ backgroundColor: 'var(--surface-app)' }}>

      {/* Header */}
      <header className="h-14 md:h-16 border-b flex items-center justify-between px-3 md:px-8 backdrop-blur-sm sticky top-0 z-50" style={{ backgroundColor: 'var(--surface-header)', borderColor: 'var(--border-default)' }}>
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg overflow-hidden bg-gray-900/60 flex items-center justify-center">
            <img src={faviconLight} alt="ScheduleStyler" className="w-5 h-5 md:w-6 md:h-6 object-contain" />
          </div>
          <span className="hidden sm:inline font-bold text-lg md:text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            ScheduleStyler
          </span>
        </button>

        <div className="flex gap-1 md:gap-2">
          {STEP_INFO.map((step, idx) => {
             const isActive = idx === currentStepIndex;
             const isPast = currentStepIndex > idx;
             const isClickable = isPast; // Only past steps are clickable
             return (
               <div key={step.path} className="flex items-center gap-1 md:gap-2">
                 <button
                   onClick={() => isClickable && handleStepClick(idx)}
                   disabled={!isClickable}
                   className={`
                    px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-semibold transition-all whitespace-nowrap inline-btn
                    ${isActive ? 'step-indicator-active text-white' :
                      isPast ? 'cursor-pointer' : 'cursor-default'}
                 `}
                   style={!isActive ? {
                     backgroundColor: isPast ? 'var(--surface-elevated)' : 'transparent',
                     color: isPast ? 'var(--text-secondary)' : 'var(--text-muted)',
                   } : undefined}
                 >
                   {idx + 1}. {step.label}
                 </button>
                 {idx < 2 && <div className="w-2 md:w-4 h-0.5" style={{ backgroundColor: 'var(--border-muted)' }}></div>}
               </div>
             )
          })}
        </div>

        {/* GitHub Star Button - hidden on mobile */}
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="github-star-btn hidden md:flex items-center gap-0 rounded-full"
        >
          <div className="hidden sm:flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2">
            <span className="text-xs md:text-sm font-semibold">Star On GitHub</span>
          </div>
          <div className="flex items-center gap-1 px-2 md:px-3 py-1.5 md:py-2 sm:bg-slate-900/80 sm:rounded-r-full sm:border-l sm:border-blue-500/30">
            <Star size={14} className="text-white fill-white md:w-4 md:h-4" />
            <span className="text-xs md:text-sm font-medium text-slate-200">{starCount}</span>
          </div>
        </a>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0 p-2 md:p-6 overflow-auto">
        <Routes>
          <Route
            path={ROUTES.UPLOAD}
            element={
              <UploadStep
                onFileSelect={handleFileUpload}
                onLoadSample={handleLoadSample}
                onLoadMcGillSample={handleLoadMcGillSample}
                onEnterManually={handleEnterManually}
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
              <EditStep
                events={events}
                categories={categories}
                template={hasVisitedExport ? template : { ...template, backgroundType: 'none', backgroundIndependent: false }}
                onUpdateEvents={setEvents}
                onUpdateTemplate={setTemplate}
                onNext={() => {
                  // Mark session as started when navigating from edit (for direct /edit access)
                  if (!hasStartedSession) {
                    setHasStartedSession(true);
                  }
                  handleNavigateToExport();
                }}
                onReupload={handleReupload}
              />
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

          {/* Catch-all redirect to home */}
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>
      </main>

      {/* Reupload Confirmation Modal */}
      <ConfirmModal
        isOpen={showHeaderReuploadConfirm}
        onClose={() => setShowHeaderReuploadConfirm(false)}
        onConfirm={handleReupload}
        title="Start over?"
        message="Your current progress will be lost. Are you sure you want to continue?"
        confirmText="Yes, start over"
        confirmVariant="danger"
      />
    </div>
    </BackgroundsProvider>
  );
};

export default App;
