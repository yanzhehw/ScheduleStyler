import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { CalendarEvent, TemplateConfig, ThemeFamilyId, BackgroundType, SelectableExportComponent, ResizeEdge, OnboardingComponent } from '../types';
import { DETECT_IF_ON_BOARDED } from '../config';
import { useMobileDetect } from '../hooks/useMobileDetect';
import { MobileFooterToolbar, MobileTab } from './MobileFooterToolbar';
import { CalendarCanvas } from './CalendarCanvas';
import { ToggleSwitch } from './ToggleSwitch';
import { VerticalSlider } from './VerticalSlider';
import { downloadCalendarExport } from '../services/exportPipeline';
import { Download, Layout, Type, Palette, MapPin, Grid, Clock, ChevronRight, ChevronDown, ChevronUp, SlidersHorizontal, Monitor, Smartphone, Tag, Maximize2, Minimize2, ZoomIn, ZoomOut, X, TypeIcon, Image, Droplet } from 'lucide-react';
import { GlowButton } from './ui/glow-button';
import { GlassRadioGroup } from './ui/glass-radio-group';
import { ThemedDropdown } from './ui/themed-dropdown';
import { THEME_FAMILY_LIST, getThemeColors, COLOR_PALETTES, getPalette, ColorPalette } from '../themes';
import acrylicTextureUrl from '../assets/Texture_Acrylic.png';
import { useBackgrounds } from '../contexts/BackgroundsContext';
import { getDefaultLandscapeId } from '../assets/backgrounds';
import { ExportSidebar, FontSection, SidebarSection, FontPair, FontPairId, TextColorField } from './export/sidebar';

// Import lockscreen mockup overlay (webp with png fallback)
import lockscreenMockupWebp from '../assets/backgrounds/lock-screen-mockup.webp';
import lockscreenMockupPng from '../assets/backgrounds/lock-screen-mockup.png';

interface ExportStepProps {
  events: CalendarEvent[];
  template: TemplateConfig;
  onUpdateTemplate: (t: TemplateConfig) => void;
  onUpdateEvents: (events: CalendarEvent[]) => void;
  onBack: () => void;
}

export const ExportStep: React.FC<ExportStepProps> = ({ events, template, onUpdateTemplate, onUpdateEvents, onBack }) => {
  // Backgrounds from R2 storage
  const { landscapes, portraits, isLoading: isBackgroundsLoading, error: backgroundsError } = useBackgrounds();

  const supportsZoom = typeof window !== 'undefined'
    && typeof window.CSS?.supports === 'function'
    && window.CSS.supports('zoom', '1');
  const [isExporting, setIsExporting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSidebarSection, setActiveSidebarSection] = useState<'theme' | 'background' | 'scale' | 'layout' | 'grid' | 'font'>('theme');
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [isScaleRatioExpanded, setIsScaleRatioExpanded] = useState(true);
  const [isBackgroundExpanded, setIsBackgroundExpanded] = useState(false);
  const [showExportAdvice, setShowExportAdvice] = useState(true);
  const [showBlockAdvice, setShowBlockAdvice] = useState(true);
  const [showBackgroundColorPicker, setShowBackgroundColorPicker] = useState(false);
  const [showBackgroundGallery, setShowBackgroundGallery] = useState(false);
  const backgroundFileInputRef = useRef<HTMLInputElement>(null);

  // Header/Time column text editing
  const [headerTextEditorOpen, setHeaderTextEditorOpen] = useState(false);
  const [timeColumnEditorOpen, setTimeColumnEditorOpen] = useState(false);
  // Initialize zoom from sessionStorage if available (for persistence when navigating back)
  const [zoom, setZoom] = useState(() => {
    const savedZoom = sessionStorage.getItem('exportStepZoom');
    return savedZoom ? parseFloat(savedZoom) : 1;
  });
  const [isZoomToolbarOpen, setIsZoomToolbarOpen] = useState(true);
  
  // Selected event for color picking
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [applyColorToAll, setApplyColorToAll] = useState(false);
  const [showFontSelector, setShowFontSelector] = useState(false);
  const [showPalettePicker, setShowPalettePicker] = useState(false);
  const [activePaletteId, setActivePaletteId] = useState<string | null>(null);

  // Calendar card selection and resize state
  const [selectedComponent, setSelectedComponent] = useState<SelectableExportComponent>('none');
  const [hoveredEdge, setHoveredEdge] = useState<ResizeEdge>(null);
  const [hoverResetToken, setHoverResetToken] = useState(0);
  const resizeUserSelectRef = useRef<string | null>(null);
  const [resizeDragState, setResizeDragState] = useState<{
    isResizing: boolean;
    edge: ResizeEdge;
    startMousePos: { x: number; y: number };
    startInsets: { top: number; bottom: number; left: number; right: number };
  } | null>(null);

  type OnboardingSeenState = {
    calendarCard: boolean;
    dayHeader: boolean;
    timeColumn: boolean;
    eventBlock: boolean;
  };

  const [onboardingSeen, setOnboardingSeen] = useState<OnboardingSeenState>(() => {
    if (typeof window === 'undefined') {
      return { calendarCard: false, dayHeader: false, timeColumn: false, eventBlock: false };
    }
    if (!DETECT_IF_ON_BOARDED) {
      localStorage.removeItem('export-onboarding-seen');
      return { calendarCard: false, dayHeader: false, timeColumn: false, eventBlock: false };
    }
    const stored = localStorage.getItem('export-onboarding-seen');
    if (!stored) {
      return { calendarCard: false, dayHeader: false, timeColumn: false, eventBlock: false };
    }
    if (stored === 'true') {
      return { calendarCard: true, dayHeader: true, timeColumn: true, eventBlock: true };
    }
    try {
      const parsed = JSON.parse(stored);
      return {
        calendarCard: Boolean(parsed?.calendarCard),
        dayHeader: Boolean(parsed?.dayHeader),
        timeColumn: Boolean(parsed?.timeColumn),
        eventBlock: Boolean(parsed?.eventBlock),
      };
    } catch {
      return { calendarCard: false, dayHeader: false, timeColumn: false, eventBlock: false };
    }
  });

  const onboardingPending = {
    calendarCard: !onboardingSeen.calendarCard,
    dayHeader: !onboardingSeen.dayHeader,
    timeColumn: !onboardingSeen.timeColumn,
    eventBlock: !onboardingSeen.eventBlock,
  };

  const completeOnboardingFor = React.useCallback((component: OnboardingComponent) => {
    const key = component as OnboardingComponent;
    setOnboardingSeen((prev) => {
      if (prev[key]) return prev;
      return { ...prev, [key]: true };
    });
  }, []);

  const previousSelectedRef = useRef<SelectableExportComponent>('none');
  const [onboardingEventId, setOnboardingEventId] = useState<string | null>(null);
  const eventOnboardingTouchedRef = useRef(false);

  // Persist zoom to sessionStorage when it changes
  useEffect(() => {
    sessionStorage.setItem('exportStepZoom', zoom.toString());
  }, [zoom]);

  // Persist aspect ratio to sessionStorage when it changes in export mode
  useEffect(() => {
    sessionStorage.setItem('exportStepAspectRatio', template.aspectRatio.toString());
  }, [template.aspectRatio]);

  // Restore aspect ratio from sessionStorage on mount (when returning to export step)
  useEffect(() => {
    const savedAspectRatio = sessionStorage.getItem('exportStepAspectRatio');
    if (savedAspectRatio !== null) {
      const ratio = parseFloat(savedAspectRatio);
      if (!isNaN(ratio) && ratio !== template.aspectRatio) {
        onUpdateTemplate({ ...template, aspectRatio: ratio });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  useEffect(() => {
    const previous = previousSelectedRef.current;
    if (previous !== 'none' && previous !== selectedComponent) {
      completeOnboardingFor(previous);
    }
    previousSelectedRef.current = selectedComponent;
  }, [selectedComponent, completeOnboardingFor]);

  useEffect(() => {
    if (!onboardingPending.eventBlock) {
      setOnboardingEventId(null);
      eventOnboardingTouchedRef.current = false;
      return;
    }
    if (events.length === 0) {
      setOnboardingEventId(null);
      return;
    }
    if (onboardingEventId && events.some((event) => event.id === onboardingEventId)) {
      return;
    }
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    setOnboardingEventId(randomEvent.id);
  }, [events, onboardingPending.eventBlock, onboardingEventId]);

  useEffect(() => {
    if (!onboardingPending.eventBlock || !onboardingEventId) return;
    if (selectedEventId === onboardingEventId) {
      eventOnboardingTouchedRef.current = true;
      return;
    }
    if (eventOnboardingTouchedRef.current) {
      completeOnboardingFor('eventBlock');
      eventOnboardingTouchedRef.current = false;
    }
  }, [selectedEventId, onboardingEventId, onboardingPending.eventBlock, completeOnboardingFor]);

  useEffect(() => {
    if (typeof window === 'undefined' || !DETECT_IF_ON_BOARDED) return;
    const allSeen = onboardingSeen.calendarCard
      && onboardingSeen.dayHeader
      && onboardingSeen.timeColumn
      && onboardingSeen.eventBlock;
    localStorage.setItem(
      'export-onboarding-seen',
      allSeen ? 'true' : JSON.stringify(onboardingSeen)
    );
  }, [onboardingSeen]);

  // When theme changes to Acrylic, Solid Grain, or Glass, unify colors with random selection (if apply-to-all is enabled)
  useEffect(() => {
    const isGlassOrAcrylic = template.themeFamily === 'acrylic' || template.themeFamily === 'solid-grain' || template.themeFamily === 'glass';
    if (isGlassOrAcrylic && applyColorToAll && events.length > 0) {
      // Apply uniform random color to all blocks only if apply-to-all is enabled
      const themeColorPalette = getThemeColors(template.themeFamily, template.themeVariant);
      const randomColor = themeColorPalette[Math.floor(Math.random() * themeColorPalette.length)];
      const updatedEvents = events.map(e => ({ ...e, color: randomColor }));
      onUpdateEvents(updatedEvents);
    }
  }, [template.themeFamily]);
  const [openTextColorPicker, setOpenTextColorPicker] = useState<'title' | 'subtitle' | 'details' | null>(null);

  // Available fonts for selection (loaded from Google Fonts)
  const availableFonts = [
    'Inter',
    'Poppins',
    'Nunito',
    'Outfit',
    'DM Sans',
    'DM Serif Display',
    'Montserrat',
    'EB Garamond',
    'Playfair Display',
    'Lora',
    'JetBrains Mono',
    'Fira Code',
    'Space Mono',
  ];

  // Template font pairs - predefined font combinations
  type FontPairId = 'none' | 'classic-serif' | 'modern-mix' | 'clean-sans' | 'editorial';
  
  interface FontPair {
    id: FontPairId;
    name: string;
    description: string;
    titleFont: string;
    subtitleFont: string;
    detailsFont: string;
  }

  const fontPairs: FontPair[] = [
    {
      id: 'none',
      name: 'Custom',
      description: 'Choose fonts individually',
      titleFont: '',
      subtitleFont: '',
      detailsFont: '',
    },
    {
      id: 'clean-sans',
      name: 'Clean Sans',
      description: 'Inter for all fields',
      titleFont: 'Inter',
      subtitleFont: 'Inter',
      detailsFont: 'Inter',
    },
    {
      id: 'classic-serif',
      name: 'Classic Serif',
      description: 'DM Serif Display + Lora',
      titleFont: 'DM Serif Display',
      subtitleFont: 'DM Serif Display',
      detailsFont: 'Lora',
    },
    {
      id: 'modern-mix',
      name: 'Modern Mix',
      description: 'Montserrat + EB Garamond',
      titleFont: 'Montserrat',
      subtitleFont: 'Montserrat',
      detailsFont: 'EB Garamond',
    },
    {
      id: 'editorial',
      name: 'Editorial',
      description: 'Playfair Display + Nunito',
      titleFont: 'Playfair Display',
      subtitleFont: 'Playfair Display',
      detailsFont: 'Nunito',
    },
  ];

  // Track selected font pair
  const [selectedFontPairId, setSelectedFontPairId] = useState<FontPairId>('clean-sans');

  // Apply font pair to template
  const applyFontPair = (pairId: FontPairId) => {
    setSelectedFontPairId(pairId);
    const pair = fontPairs.find(p => p.id === pairId);
    if (pair && pairId !== 'none') {
      onUpdateTemplate({
        ...template,
        titleFont: pair.titleFont,
        subtitleFont: pair.subtitleFont,
        detailsFont: pair.detailsFont,
      });
    }
  };
  type CalloutPosition = {
    x: number;
    y: number;
    placement: 'top' | 'bottom' | 'left' | 'right';
    arrowOffset: number; // Offset from center for arrow positioning (in pixels)
  };
  const [colorPickerPosition, setColorPickerPosition] = useState<CalloutPosition | null>(null);
  const [headerEditorPosition, setHeaderEditorPosition] = useState<CalloutPosition | null>(null);
  const [timeEditorPosition, setTimeEditorPosition] = useState<CalloutPosition | null>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const previewPanelRef = useRef<HTMLDivElement>(null);

  // Mobile detection and active tab state
  const isMobile = useMobileDetect();
  const [mobileActiveTab, setMobileActiveTab] = useState<string | null>(null);

  // Track previous theme family to detect changes
  const prevThemeFamilyRef = useRef<ThemeFamilyId>(template.themeFamily);
  // Track if theme colors have been applied on first mount
  const hasAppliedInitialColorsRef = useRef(false);

  // Cache for toggle states before compact mode
  const [cachedToggles, setCachedToggles] = useState<{
    showClassType: boolean;
    showTime: boolean;
    showLocation: boolean;
    showNotes: boolean;
  } | null>(null);

  // Get theme colors for the picker (with variant support for acrylic, or from selected palette)
  const themeColors = useMemo(() => {
    if (activePaletteId) {
      return getPalette(activePaletteId).colors;
    }
    return getThemeColors(template.themeFamily, template.themeVariant);
  }, [template.themeFamily, template.themeVariant, activePaletteId]);

  // Current palette info for display
  const currentPalette = useMemo(() => {
    if (activePaletteId) {
      return getPalette(activePaletteId);
    }
    // Find default palette for current theme
    const defaultPaletteId = (template.themeFamily === 'acrylic' || template.themeFamily === 'solid-grain')
      ? (template.themeVariant === 'dark' ? 'dark-slate' : 'light-silk')
      : template.themeFamily === 'glass'
        ? 'fresh-tint'
        : 'saturated';
    return getPalette(defaultPaletteId);
  }, [activePaletteId, template.themeFamily, template.themeVariant]);
  
  // Get the selected event
  const selectedEvent = useMemo(() => events.find(e => e.id === selectedEventId), [events, selectedEventId]);

  const getCalloutPosition = (
    target: HTMLElement,
    calloutSize: { width: number; height: number }
  ): CalloutPosition | null => {
    const panel = previewPanelRef.current;
    if (!panel) return null;
    const elementRect = target.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const padding = 12;

    const spaceAbove = elementRect.top - panelRect.top;
    const spaceBelow = panelRect.bottom - elementRect.bottom;
    const spaceRight = panelRect.right - elementRect.right;
    const spaceLeft = elementRect.left - panelRect.left;

    const elementCenterX = elementRect.left - panelRect.left + panel.scrollLeft + elementRect.width / 2;
    const elementCenterY = elementRect.top - panelRect.top + panel.scrollTop + elementRect.height / 2;

    let placement: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
    let x = elementCenterX;
    let y = elementRect.bottom - panelRect.top + panel.scrollTop + 8;
    let arrowOffset = 0;

    const hasSpaceBelow = spaceBelow >= calloutSize.height + padding;
    const hasSpaceAbove = spaceAbove >= calloutSize.height + padding;

    if (hasSpaceBelow || hasSpaceAbove) {
      placement = hasSpaceBelow ? 'bottom' : 'top';
      y = placement === 'top'
        ? elementRect.top - panelRect.top + panel.scrollTop - 8
        : elementRect.bottom - panelRect.top + panel.scrollTop + 8;

      const calloutLeft = x - calloutSize.width / 2;
      const calloutRight = x + calloutSize.width / 2;
      const panelVisibleWidth = panelRect.width;

      if (calloutLeft < padding) {
        const shift = padding - calloutLeft;
        x += shift;
        arrowOffset = -shift;
      } else if (calloutRight > panelVisibleWidth - padding) {
        const shift = calloutRight - (panelVisibleWidth - padding);
        x -= shift;
        arrowOffset = shift;
      }

      if (placement === 'top') {
        y = Math.max(calloutSize.height + padding, y);
      } else {
        y = Math.min(panelRect.height + panel.scrollTop - padding, y);
      }
    } else if (spaceRight >= calloutSize.width + padding) {
      placement = 'right';
      x = elementRect.right - panelRect.left + panel.scrollLeft + 8;
      y = Math.min(Math.max(calloutSize.height / 2 + padding, elementCenterY), panelRect.height - calloutSize.height / 2 - padding);
    } else {
      placement = 'left';
      x = elementRect.left - panelRect.left + panel.scrollLeft - 8;
      y = Math.min(Math.max(calloutSize.height / 2 + padding, elementCenterY), panelRect.height - calloutSize.height / 2 - padding);
    }

    return { x, y, placement, arrowOffset };
  };

  const getRightCenteredCalloutPosition = (
    target: HTMLElement,
    calloutSize: { width: number; height: number }
  ): CalloutPosition | null => {
    const panel = previewPanelRef.current;
    if (!panel) return null;
    const elementRect = target.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const padding = 12;

    const elementCenterY = elementRect.top - panelRect.top + panel.scrollTop + elementRect.height / 2;
    const x = elementRect.right - panelRect.left + panel.scrollLeft + 10;
    const minY = calloutSize.height / 2 + padding;
    const maxY = panelRect.height - calloutSize.height / 2 - padding;
    const y = Math.min(Math.max(elementCenterY, minY), maxY);

    return { x, y, placement: 'right', arrowOffset: 0 };
  };

  // Handle event click - show color picker with smart positioning
  const handleEventClick = (event: CalendarEvent) => {
    clearComponentSelection();
    setHeaderTextEditorOpen(false);
    setTimeColumnEditorOpen(false);

    // On mobile, open the color tab instead of showing floating color picker
    if (isMobile) {
      setSelectedEventId(event.id);
      setMobileActiveTab('color');
      return;
    }

    const clickedElement = document.querySelector(`[data-event-id="${event.id}"]`);
    const panel = previewPanelRef.current;

    if (clickedElement && panel) {
      const elementRect = clickedElement.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();

      // Picker dimensions
      const pickerHeight = 260;
      const pickerWidth = 180;
      const padding = 16;

      // Calculate available space in each direction (using visible panel area)
      const spaceAbove = elementRect.top - panelRect.top;
      const spaceBelow = panelRect.bottom - elementRect.bottom;
      const spaceRight = panelRect.right - elementRect.right;
      const spaceLeft = elementRect.left - panelRect.left;

      // Element center position relative to panel
      const elementCenterX = elementRect.left - panelRect.left + panel.scrollLeft + elementRect.width / 2;
      const elementCenterY = elementRect.top - panelRect.top + panel.scrollTop + elementRect.height / 2;

      // Determine best placement (prefer bottom, then top, then right, then left)
      let placement: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
      let x: number, y: number;
      let arrowOffset = 0;

      // Check if we have enough space below or above
      const hasSpaceBelow = spaceBelow >= pickerHeight + padding;
      const hasSpaceAbove = spaceAbove >= pickerHeight + padding;

      if (hasSpaceBelow || hasSpaceAbove) {
        // Prefer bottom, fall back to top
        placement = hasSpaceBelow ? 'bottom' : 'top';

        // Start with centered position
        x = elementCenterX;
        y = placement === 'top'
          ? elementRect.top - panelRect.top + panel.scrollTop - 8
          : elementRect.bottom - panelRect.top + panel.scrollTop + 8;

        // Check for horizontal overflow and adjust
        const pickerLeft = x - pickerWidth / 2;
        const pickerRight = x + pickerWidth / 2;
        const panelVisibleWidth = panelRect.width;

        if (pickerLeft < padding) {
          // Would overflow left - shift picker right, offset arrow left
          const shift = padding - pickerLeft;
          x += shift;
          arrowOffset = -shift; // Arrow moves left relative to picker center
        } else if (pickerRight > panelVisibleWidth - padding) {
          // Would overflow right - shift picker left, offset arrow right
          const shift = pickerRight - (panelVisibleWidth - padding);
          x -= shift;
          arrowOffset = shift; // Arrow moves right relative to picker center
        }

        // Clamp vertical position to stay within visible area
        if (placement === 'top') {
          y = Math.max(pickerHeight + padding, y);
        } else {
          y = Math.min(panelRect.height + panel.scrollTop - padding, y);
        }
      } else if (spaceRight >= pickerWidth + padding) {
        placement = 'right';
        x = elementRect.right - panelRect.left + panel.scrollLeft + 8;
        y = Math.min(Math.max(pickerHeight / 2 + padding, elementCenterY), panelRect.height - pickerHeight / 2 - padding);
      } else if (spaceLeft >= pickerWidth + padding) {
        placement = 'left';
        x = elementRect.left - panelRect.left + panel.scrollLeft - 8;
        y = Math.min(Math.max(pickerHeight / 2 + padding, elementCenterY), panelRect.height - pickerHeight / 2 - padding);
      } else {
        // Fallback: place at center of visible area
        placement = 'bottom';
        x = panelRect.width / 2;
        y = panel.scrollTop + panelRect.height / 2;
      }

      setColorPickerPosition({ x, y, placement, arrowOffset });
    }
    setSelectedEventId(event.id);
    setShowFontSelector(false); // Close font selector when clicking an event block
  };

  const clearComponentSelection = () => {
    setSelectedComponent('none');
    setHoverResetToken((value) => value + 1);
    setHeaderTextEditorOpen(false);
    setTimeColumnEditorOpen(false);
    setHeaderEditorPosition(null);
    setTimeEditorPosition(null);
  };

  const handleOnboardingOk = (component: OnboardingComponent) => {
    if (component === 'eventBlock') {
      setSelectedEventId(null);
      return;
    }
    if (selectedComponent === component) {
      clearComponentSelection();
    }
  };

  // Handle blank click - close color picker and deselect components
  const handleBlankClick = () => {
    setSelectedEventId(null);
    setColorPickerPosition(null);
    setShowPalettePicker(false);
    clearComponentSelection();
  };

  // Reset calendar card to fill canvas
  const handleResetToFill = () => {
    onUpdateTemplate({
      ...template,
      calendarCardInsets: { top: 0, bottom: 0, left: 0, right: 0 }
    });
  };

  // Check if card has been resized (has non-zero insets)
  const hasCardInsets = template.calendarCardInsets.top !== 0 ||
    template.calendarCardInsets.bottom !== 0 ||
    template.calendarCardInsets.left !== 0 ||
    template.calendarCardInsets.right !== 0;

  const cardHeightPercent = 100 - template.calendarCardInsets.top - template.calendarCardInsets.bottom;
  const verticalSlackPercent = Math.max(0, template.calendarCardInsets.top + template.calendarCardInsets.bottom);
  const showVerticalTranslateSlider = selectedComponent === 'calendarCard'
    && verticalSlackPercent > 10
    && cardHeightPercent < 90;
  const verticalTranslateValue = verticalSlackPercent > 0
    ? (template.calendarCardInsets.top / verticalSlackPercent) * 100
    : 0;
  const sliderValue = 100 - verticalTranslateValue;

  // Track canvas dimensions for resize calculations
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 600,
    height: 400,
    minCardWidth: 600,
    minCardHeight: 400,
  });

  // Calculate optimal zoom to fit canvas in container
  const calculateAutoFitZoom = useCallback(() => {
    if (!previewPanelRef.current) return 1;
    const container = previewPanelRef.current;
    const containerWidth = container.clientWidth - 48; // padding
    const containerHeight = container.clientHeight - 48;

    const scaleX = containerWidth / canvasDimensions.width;
    const scaleY = containerHeight / canvasDimensions.height;

    return Math.min(Math.max(Math.min(scaleX, scaleY), 0.3), 1.5);
  }, [canvasDimensions.width, canvasDimensions.height]);

  // Track if initial auto-fit zoom has been applied
  const hasAppliedInitialZoomRef = useRef(false);

  // Apply auto-fit zoom on initial load (when canvas dimensions are ready)
  useEffect(() => {
    if (hasAppliedInitialZoomRef.current) return;
    if (canvasDimensions.width > 0 && canvasDimensions.height > 0 && previewPanelRef.current) {
      // Small delay to ensure container is properly sized
      const timer = setTimeout(() => {
        if (!hasAppliedInitialZoomRef.current) {
          const newZoom = calculateAutoFitZoom();
          setZoom(newZoom);
          hasAppliedInitialZoomRef.current = true;
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [canvasDimensions.width, canvasDimensions.height, calculateAutoFitZoom]);

  // Recalculate zoom on window resize
  useEffect(() => {
    const handleResize = () => {
      const newZoom = calculateAutoFitZoom();
      setZoom(newZoom);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateAutoFitZoom]);

  // Handle resize start
  const handleResizeStart = (edge: ResizeEdge, mousePos: { x: number; y: number }) => {
    if (!edge) return;
    if (typeof document !== 'undefined') {
      resizeUserSelectRef.current = document.body.style.userSelect;
      document.body.style.userSelect = 'none';
    }
    setResizeDragState({
      isResizing: true,
      edge,
      startMousePos: mousePos,
      startInsets: { ...template.calendarCardInsets },
    });
  };

  // Clamp utility
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

  const handleVerticalTranslateChange = (value: number) => {
    if (verticalSlackPercent <= 0) return;
    const clamped = clamp(value, 0, 100);
    const nextTop = (verticalSlackPercent * clamped) / 100;
    const nextBottom = verticalSlackPercent - nextTop;
    onUpdateTemplate({
      ...template,
      calendarCardInsets: {
        ...template.calendarCardInsets,
        top: nextTop,
        bottom: nextBottom,
      },
    });
  };

  const [sliderLeft, setSliderLeft] = useState<number | null>(null);
  const sliderHeight = Math.min(280, canvasDimensions.height * zoom);

  const updateSliderLeft = () => {
    const panel = previewPanelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    const canvasWidth = canvasDimensions.width * zoom;
    const cardWidthPercent = 100 - template.calendarCardInsets.left - template.calendarCardInsets.right;
    const cardHalfWidth = (canvasWidth * cardWidthPercent) / 200;
    const cardCenterOffset = (canvasWidth * (template.calendarCardInsets.left - template.calendarCardInsets.right)) / 200;
    const nextLeft = rect.left + rect.width / 2 + cardCenterOffset + cardHalfWidth + 25;
    setSliderLeft(nextLeft);
  };

  useEffect(() => {
    updateSliderLeft();
  }, [
    zoom,
    canvasDimensions.width,
    isSidebarOpen,
    template.lockscreenMockup,
    template.calendarCardInsets.left,
    template.calendarCardInsets.right,
  ]);

  useEffect(() => {
    const handleResize = () => updateSliderLeft();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle resize drag
  useEffect(() => {
    if (!resizeDragState?.isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { edge, startMousePos, startInsets } = resizeDragState;
      if (!edge) return;

      const deltaX = e.clientX - startMousePos.x;
      const deltaY = e.clientY - startMousePos.y;

      // Convert pixel delta to percentage of background dimensions
      // Account for zoom level
      const effectiveZoom = zoom;
      const bgWidth = canvasDimensions.width * effectiveZoom;
      const bgHeight = canvasDimensions.height * effectiveZoom;

      const deltaXPercent = (deltaX / bgWidth) * 100;
      const deltaYPercent = (deltaY / bgHeight) * 100;
      const minWidthPercent = Math.max(
        40,
        Math.min(100, (canvasDimensions.minCardWidth / canvasDimensions.width) * 100)
      );
      const minHeightPercent = Math.max(
        20,
        Math.min(100, (canvasDimensions.minCardHeight / canvasDimensions.height) * 100)
      );

      const maxHorizontalInset = Math.min(30, (100 - minWidthPercent) / 2);
      const maxTopInset = Math.min(45, 100 - minHeightPercent - startInsets.bottom);
      const maxBottomInset = Math.min(45, 100 - minHeightPercent - startInsets.top);

      const newInsets = { ...startInsets };

      switch (edge) {
        case 'top':
          // Independent - only top changes
          newInsets.top = clamp(startInsets.top + deltaYPercent, 0, maxTopInset);
          break;

        case 'bottom':
          // Independent - only bottom changes
          newInsets.bottom = clamp(startInsets.bottom - deltaYPercent, 0, maxBottomInset);
          break;

        case 'left':
          // Symmetric - left and right change together
          const leftChange = deltaXPercent * 2;
          newInsets.left = clamp(startInsets.left + leftChange, 0, maxHorizontalInset);
          newInsets.right = newInsets.left; // Symmetric
          break;

        case 'right':
          // Symmetric - left and right change together
          const rightChange = -deltaXPercent * 2;
          newInsets.right = clamp(startInsets.right + rightChange, 0, maxHorizontalInset);
          newInsets.left = newInsets.right; // Symmetric
          break;
      }

      // Minimum size constraint - card must be at least 20% of background
      const remainingWidth = 100 - newInsets.left - newInsets.right;
      const remainingHeight = 100 - newInsets.top - newInsets.bottom;

      if (remainingWidth < minWidthPercent || remainingHeight < minHeightPercent) {
        return; // Don't apply change
      }

      onUpdateTemplate({
        ...template,
        calendarCardInsets: newInsets,
      });
    };

    const handleMouseUp = () => {
      setResizeDragState(null);
      if (typeof document !== 'undefined' && resizeUserSelectRef.current !== null) {
        document.body.style.userSelect = resizeUserSelectRef.current;
        resizeUserSelectRef.current = null;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (typeof document !== 'undefined' && resizeUserSelectRef.current !== null) {
        document.body.style.userSelect = resizeUserSelectRef.current;
        resizeUserSelectRef.current = null;
      }
    };
  }, [resizeDragState, zoom, canvasDimensions, template, onUpdateTemplate]);

  // Update color for events - handles apply to all, course groups, and type differentiation
  const handleColorSelect = (newColor: string) => {
    if (!selectedEvent) return;

    const updatedEvents = events.map(e => {
      // Apply to all blocks mode
      if (applyColorToAll) {
        return { ...e, color: newColor };
      }

      // Must match the same course
      if (e.displayTitle !== selectedEvent.displayTitle) {
        return e;
      }

      // When differentiateTypes is ON, separate lecture and lab/tutorial color groups
      if (template.differentiateTypes) {
        const isSelectedLabOrTutorial = selectedEvent.classType === 'Lab' || selectedEvent.classType === 'Tutorial';
        const isEventLabOrTutorial = e.classType === 'Lab' || e.classType === 'Tutorial';

        // Only update events in the same type group
        if (isSelectedLabOrTutorial === isEventLabOrTutorial) {
          return { ...e, color: newColor };
        }
        return e;
      }

      // When differentiateTypes is OFF, update all events of the same course
      return { ...e, color: newColor };
    });
    onUpdateEvents(updatedEvents);
  };

  // Helper to adjust color for differentiation (shift to different palette color)
  const adjustColor = (hex: string, degree: number) => {
    const idx = themeColors.indexOf(hex);
    if (idx === -1) return hex;
    return themeColors[(idx + 2) % themeColors.length]; 
  };

  // Shuffle colors for all events - assigns unique colors per course, avoiding duplicates
  const shuffleColorsForEvents = (differentiateTypes: boolean) => {
    // Get unique display titles (course codes)
    const displayTitlesSet = new Set<string>();
    events.forEach(e => displayTitlesSet.add(e.displayTitle));
    const displayTitles = Array.from(displayTitlesSet);

    // Create a shuffled copy of theme colors
    const shuffledColors = [...themeColors].sort(() => Math.random() - 0.5);

    // Assign unique colors to each course, avoiding duplicates where possible
    const colorMap = new Map<string, string>();
    const usedColors = new Set<string>();

    displayTitles.forEach((title, index) => {
      // Find an unused color if possible
      let assignedColor: string | null = null;
      for (const color of shuffledColors) {
        if (!usedColors.has(color)) {
          assignedColor = color;
          usedColors.add(color);
          break;
        }
      }
      // If all colors used, start reusing from shuffled order
      if (!assignedColor) {
        assignedColor = shuffledColors[index % shuffledColors.length];
      }
      colorMap.set(title, assignedColor);
    });

    // Apply colors to events, with Lab/Tutorial differentiation if enabled
    const updatedEvents = events.map(event => {
      const baseColor = colorMap.get(event.displayTitle) || shuffledColors[0];

      if (differentiateTypes && (event.classType === 'Lab' || event.classType === 'Tutorial')) {
        // Assign a different color for Lab/Tutorial
        const baseIdx = shuffledColors.indexOf(baseColor);
        // Find a color that's not the base color
        let shiftedColor = shuffledColors[(baseIdx + 2) % shuffledColors.length];
        if (shiftedColor === baseColor && shuffledColors.length > 1) {
          shiftedColor = shuffledColors[(baseIdx + 1) % shuffledColors.length];
        }
        return { ...event, color: shiftedColor };
      }

      return { ...event, color: baseColor };
    });

    onUpdateEvents(updatedEvents);
  };

  // Trigger color differentiation for Labs/Tutorials
  const triggerColorUpdate = (diff: boolean) => {
    // Update template setting
    onUpdateTemplate({ ...template, differentiateTypes: diff });

    // Get unique display titles and their lecture colors
    const lectureColorMap = new Map<string, string>();
    events.forEach(e => {
      // Use lecture color as base, or first event's color if no lecture
      if (e.classType === 'Lecture' || !lectureColorMap.has(e.displayTitle)) {
        lectureColorMap.set(e.displayTitle, e.color || themeColors[0]);
      }
    });

    const updatedEvents = events.map(event => {
      const lectureColor = lectureColorMap.get(event.displayTitle) || themeColors[0];

      if (diff) {
        // Differentiate: Labs/Tutorials get a different color
        if (event.classType === 'Lab' || event.classType === 'Tutorial') {
          return { ...event, color: adjustColor(lectureColor, 2) };
        }
        // Lectures keep their color
        return { ...event, color: lectureColor };
      } else {
        // Not differentiating: All types of same course share the lecture color
        return { ...event, color: lectureColor };
      }
    });
    onUpdateEvents(updatedEvents);
  };

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        // Check if click is on an event block
        const target = e.target as HTMLElement;
        if (!target.closest('[data-component="EventBlock"]')) {
          setSelectedEventId(null);
          setColorPickerPosition(null);
        }
      }
    };

    if (selectedEventId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [selectedEventId]);

  // Apply theme colors when theme family or variant changes
  const applyThemeColors = (newThemeFamily: ThemeFamilyId, newVariant?: 'light' | 'dark') => {
    const variant = newVariant ?? template.themeVariant;
    // Reset to theme's default palette when switching themes
    setActivePaletteId(null);
    const newThemeColors = getThemeColors(newThemeFamily, variant);

    // For Acrylic, Solid Grain, and Glass themes with applyColorToAll, use a single random color
    const isGlassOrAcrylic = newThemeFamily === 'acrylic' || newThemeFamily === 'solid-grain' || newThemeFamily === 'glass';
    if (isGlassOrAcrylic && applyColorToAll) {
      const randomColor = newThemeColors[Math.floor(Math.random() * newThemeColors.length)];
      const updatedEvents = events.map(event => ({
        ...event,
        color: randomColor
      }));
      onUpdateEvents(updatedEvents);
      return;
    }

    // Get unique display titles and assign colors
    const displayTitlesSet = new Set<string>();
    events.forEach(e => displayTitlesSet.add(e.displayTitle));
    const displayTitles = Array.from(displayTitlesSet);
    const colorMap = new Map<string, string>();
    displayTitles.forEach((title, index) => {
      colorMap.set(title, newThemeColors[index % newThemeColors.length]);
    });

    // Update all events with new theme colors
    const updatedEvents = events.map(event => ({
      ...event,
      color: colorMap.get(event.displayTitle) || event.color
    }));

    onUpdateEvents(updatedEvents);
  };

  // Apply theme colors on first mount when entering Export for the first time
  useEffect(() => {
    if (hasAppliedInitialColorsRef.current || events.length === 0) return;
    hasAppliedInitialColorsRef.current = true;
    // Apply theme colors based on current theme family
    applyThemeColors(template.themeFamily, template.themeVariant);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length]); // Run when events are available

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.3));
  const handleZoomReset = () => setZoom(calculateAutoFitZoom());

  const handleDownload = async () => {
    // Fire-and-forget download tracking
    fetch('/api/track/download', { method: 'POST' });

    setIsExporting(true);
    // Allow React to render the hidden export canvas with exportMode=true
    // Longer timeout to ensure fonts are loaded
    await new Promise(r => setTimeout(r, 300));
    // Use the hidden export canvas which has exportMode=true for proper rendering
    await downloadCalendarExport('calendar-export-hidden', 'my-beautiful-calendar');
    setIsExporting(false);
  };

  // Mobile tab content: Theme
  const themeTabContent = (
    <div className="space-y-4">
      {/* Theme Family Dropdown */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400 font-medium">Theme Style</label>
        <ThemedDropdown
          options={THEME_FAMILY_LIST.map((family) => ({
            id: family.id,
            label: family.name,
            value: family.id as ThemeFamilyId,
          }))}
          value={template.themeFamily}
          onChange={(newFamily) => {
            const needsImageBg = newFamily === 'acrylic' || newFamily === 'glass';
            onUpdateTemplate({
              ...template,
              themeFamily: newFamily,
              theme: `${newFamily}-dark` as any,
              themeVariant: 'dark',
              themeSubVariant: undefined,
              backgroundType: needsImageBg ? 'image' : 'none',
              backgroundImage: newFamily === 'default'
                ? undefined
                : (template.backgroundImage || getDefaultLandscapeId() || 'l1'),
              customBackgroundImage: newFamily === 'default' ? undefined : template.customBackgroundImage,
              eventOpacity: 1,
            });
            if (newFamily !== prevThemeFamilyRef.current) {
              applyThemeColors(newFamily);
              prevThemeFamilyRef.current = newFamily;
            }
          }}
          className="w-full"
        />
      </div>

    </div>
  );

  // Mobile tab content: Background
  const backgroundTabContent = (
    <div className="space-y-4">
      {/* Background Type Toggle */}
      <GlassRadioGroup
        name="mobile-background-type"
        options={[
          { id: 'none', label: 'None', value: 'none' as const },
          { id: 'image', label: 'Image', value: 'image' as const },
          { id: 'color', label: 'Color', value: 'color' as const },
        ]}
        value={template.backgroundType}
        onChange={(val) => {
          onUpdateTemplate({ ...template, backgroundType: val });
          if (val === 'color') {
            setShowBackgroundColorPicker(true);
          }
        }}
      />

      {/* Image Gallery */}
      {template.backgroundType === 'image' && (
        <div className="space-y-2">
          {isBackgroundsLoading && (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
              <span className="ml-2 text-gray-400 text-xs">Loading backgrounds...</span>
            </div>
          )}
          {!isBackgroundsLoading && !backgroundsError && (
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {[...landscapes, ...portraits].slice(0, 9).map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => onUpdateTemplate({
                    ...template,
                    backgroundImage: bg.id,
                    customBackgroundImage: undefined
                  })}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    template.backgroundImage === bg.id
                      ? 'border-blue-500 ring-2 ring-blue-400/50'
                      : 'border-[var(--border-default)]'
                  }`}
                >
                  <img
                    src={bg.thumbnailUrl}
                    alt={bg.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowBackgroundGallery(true)}
            className="w-full px-3 py-2 button-ghost-themed rounded-lg text-xs text-gray-200 font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Image size={14} /> Browse All
          </button>
        </div>
      )}

      {/* Color Picker */}
      {template.backgroundType === 'color' && (
        <div className="space-y-2">
          <span className="text-xs text-gray-400">Background Color</span>
          <div className="grid grid-cols-8 gap-1.5">
            {['#1f2937', '#111827', '#0f172a', '#000000', '#374151', '#4b5563', '#ef4444', '#3b82f6'].map((color) => (
              <button
                key={color}
                onClick={() => onUpdateTemplate({ ...template, backgroundColor: color })}
                className={`w-6 h-6 rounded border-2 transition-all ${
                  template.backgroundColor === color ? 'border-white scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Blur & Overlay Sliders */}
      {template.backgroundType === 'image' && template.backgroundImage && (
        <div className="space-y-3 pt-2 border-t border-[var(--border-muted)]">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Blur</span>
              <span className="text-xs text-gray-500">{template.backgroundBlur}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={template.backgroundBlur}
              onChange={(e) => onUpdateTemplate({ ...template, backgroundBlur: parseInt(e.target.value) })}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer slider-accent slider-track-themed"
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Darken</span>
              <span className="text-xs text-gray-500">{template.backgroundOverlay}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              step="5"
              value={template.backgroundOverlay}
              onChange={(e) => onUpdateTemplate({ ...template, backgroundOverlay: parseInt(e.target.value) })}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer slider-accent slider-track-themed"
            />
          </div>
        </div>
      )}
    </div>
  );

  // Mobile tab content: Scale/Ratio
  const scaleTabContent = (
    <div className="space-y-4">
      {/* Aspect Ratio Slider */}
      <div className={`space-y-2 ${template.lockscreenMockup ? 'opacity-40 pointer-events-none' : ''}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Aspect Ratio</span>
          <span className="text-xs text-gray-500">
            {template.aspectRatio <= 0.5 ? 'Landscape' : 'Portrait'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">16:9</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={template.aspectRatio}
            onChange={(e) => onUpdateTemplate({ ...template, aspectRatio: parseFloat(e.target.value) })}
            className="flex-1 h-2 rounded-lg appearance-none cursor-pointer slider-accent slider-track-themed"
            disabled={template.lockscreenMockup}
          />
          <span className="text-xs text-gray-500">9:16</span>
        </div>
        <GlassRadioGroup
          name="mobile-aspect-ratio"
          options={[
            { id: 'desktop', label: <><Monitor size={14} /> Desktop</>, value: 'desktop' as const },
            { id: 'mobile', label: <><Smartphone size={14} /> Mobile</>, value: 'mobile' as const },
          ]}
          value={template.aspectRatio <= 0.5 ? 'desktop' : 'mobile'}
          onChange={(val) => onUpdateTemplate({ ...template, aspectRatio: val === 'desktop' ? 0 : 1 })}
          disabled={template.lockscreenMockup}
        />
      </div>

      {/* Lockscreen Mockup */}
      <div className="flex items-center justify-between p-3 rounded-lg card-section-themed">
        <span className="text-xs text-gray-300">iPhone Mockup</span>
        <div
          onClick={() => {
            const newMockupState = !template.lockscreenMockup;
            onUpdateTemplate({
              ...template,
              lockscreenMockup: newMockupState,
              ...(newMockupState && { aspectRatio: 1 })
            });
          }}
          className={`w-10 h-5 rounded-full relative transition-all duration-300 cursor-pointer ${template.lockscreenMockup ? 'toggle-accent-bg' : 'toggle-off-bg'}`}
        >
          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${template.lockscreenMockup ? 'left-6' : 'left-1'}`} />
        </div>
      </div>
    </div>
  );

  // Mobile tab content: Content options
  const contentTabContent = (
    <div className="space-y-2">
      {/* Compact View */}
      <div className="p-3 rounded-lg border card-section-themed">
        <ToggleSwitch
          enabled={template.compact}
          onToggle={() => {
            const newCompact = !template.compact;
            if (newCompact) {
              setCachedToggles({
                showClassType: template.showClassType,
                showTime: template.showTime,
                showLocation: template.showLocation,
                showNotes: template.showNotes
              });
              onUpdateTemplate({
                ...template,
                compact: true,
                showClassType: false,
                showTime: false,
                showLocation: false,
                showNotes: false
              });
            } else {
              if (cachedToggles) {
                onUpdateTemplate({ ...template, compact: false, ...cachedToggles });
              } else {
                onUpdateTemplate({ ...template, compact: false });
              }
            }
          }}
          label={<span className="text-sm text-gray-200 font-medium">Compact View</span>}
        />
      </div>

      {/* Other toggles */}
      <div className={`space-y-1 ${template.compact ? 'opacity-40 pointer-events-none' : ''}`}>
        <div className="p-3 rounded-lg card-section-themed">
          <ToggleSwitch
            enabled={template.showClassType}
            onToggle={() => onUpdateTemplate({ ...template, showClassType: !template.showClassType })}
            label={<span className="flex items-center gap-3 text-sm text-gray-300"><Tag size={14} /> Class Type</span>}
            disabled={template.compact}
          />
        </div>
        <div className="p-3 rounded-lg card-section-themed">
          <ToggleSwitch
            enabled={template.showTime}
            onToggle={() => onUpdateTemplate({ ...template, showTime: !template.showTime })}
            label={<span className="flex items-center gap-3 text-sm text-gray-300"><Clock size={14} /> Time</span>}
            disabled={template.compact}
          />
        </div>
        <div className="p-3 rounded-lg card-section-themed">
          <ToggleSwitch
            enabled={template.showLocation}
            onToggle={() => onUpdateTemplate({ ...template, showLocation: !template.showLocation })}
            label={<span className="flex items-center gap-3 text-sm text-gray-300"><MapPin size={14} /> Location</span>}
            disabled={template.compact}
          />
        </div>
      </div>

      {/* Grid Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg card-section-themed mt-4">
        <span className="flex items-center gap-2 text-sm text-gray-300"><Grid size={14} /> Show Grid</span>
        <div
          onClick={() => onUpdateTemplate({ ...template, showGrid: !template.showGrid })}
          className={`w-10 h-5 rounded-full relative transition-all duration-300 cursor-pointer ${template.showGrid ? 'toggle-accent-bg' : 'toggle-off-bg'}`}
        >
          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${template.showGrid ? 'left-6' : 'left-1'}`} />
        </div>
      </div>
    </div>
  );

  // Mobile tab content: Color (event color picker)
  const colorTabContent = selectedEvent ? (
    <div className="space-y-2">
      {/* Apply to All + Shuffle row */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 px-2 py-1.5 rounded-lg card-section-themed">
          <span className="text-xs text-gray-300">All Blocks</span>
          <div
            onClick={() => {
              const newValue = !applyColorToAll;
              setApplyColorToAll(newValue);
              if (newValue && selectedEvent) {
                const currentOpacity = selectedEvent.opacity ?? template.eventOpacity;
                const updatedEvents = events.map(e => ({
                  ...e,
                  color: selectedEvent.color,
                  opacity: currentOpacity,
                }));
                onUpdateEvents(updatedEvents);
                onUpdateTemplate({ ...template, eventOpacity: currentOpacity });
              } else if (!newValue) {
                shuffleColorsForEvents(template.differentiateTypes);
              }
            }}
            className={`w-9 h-4 rounded-full relative transition-all duration-300 cursor-pointer ${applyColorToAll ? 'toggle-accent-bg' : 'toggle-off-bg'}`}
          >
            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-200 ${applyColorToAll ? 'left-5' : 'left-0.5'}`} />
          </div>
        </div>
        {!applyColorToAll && (
          <button
            onClick={() => shuffleColorsForEvents(template.differentiateTypes)}
            className="px-2 py-1.5 text-xs font-medium text-gray-300 rounded-lg border border-[var(--border-default)] button-ghost-themed"
          >
            🎲 Shuffle
          </button>
        )}
      </div>

      {/* Color swatches - compact */}
      <div className="grid grid-cols-6 gap-1.5">
        {themeColors.map(color => (
          <button
            key={color}
            onClick={() => handleColorSelect(color)}
            className={`w-8 h-8 rounded-full border-2 transition-all ${
              selectedEvent.color === color
                ? 'border-white ring-2 ring-blue-400 ring-offset-1 ring-offset-gray-900'
                : 'border-transparent'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Palette Picker - inline */}
      <button
        onClick={() => setShowPalettePicker(!showPalettePicker)}
        className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors cursor-pointer flex items-center gap-1 ml-auto"
      >
        <Palette size={10} />
        {showPalettePicker ? 'Hide' : `${currentPalette.name} · Change`}
      </button>

      {showPalettePicker && (
        <div className="p-2 rounded-lg border card-section-themed max-h-[120px] overflow-y-auto">
          {COLOR_PALETTES.map((palette: ColorPalette) => (
            <button
              key={palette.id}
              onClick={() => {
                setActivePaletteId(palette.id);
                const newColors = palette.colors;
                if (applyColorToAll) {
                  const randomColor = newColors[Math.floor(Math.random() * newColors.length)];
                  const updatedEvents = events.map(e => ({ ...e, color: randomColor }));
                  onUpdateEvents(updatedEvents);
                } else {
                  const courseColorMap = new Map<string, string>();
                  let colorIndex = 0;
                  const updatedEvents = events.map(e => {
                    const key = template.differentiateTypes
                      ? `${e.displayTitle}-${e.classType}`
                      : e.displayTitle;
                    if (!courseColorMap.has(key)) {
                      courseColorMap.set(key, newColors[colorIndex % newColors.length]);
                      colorIndex++;
                    }
                    return { ...e, color: courseColorMap.get(key)! };
                  });
                  onUpdateEvents(updatedEvents);
                }
                setShowPalettePicker(false);
              }}
              className={`w-full flex items-center gap-2 p-1 rounded transition-all ${
                currentPalette.id === palette.id ? 'bg-blue-600/30' : 'hover:opacity-80'
              }`}
            >
              <div className="flex gap-0.5">
                {palette.colors.slice(0, 5).map((color, idx) => (
                  <div key={idx} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                ))}
              </div>
              <span className="text-[10px] text-gray-300">{palette.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Compact toggles row */}
      <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-muted)]">
        {/* Opacity - only for certain themes */}
        {(template.themeFamily === 'acrylic' || template.themeFamily === 'solid-grain' || template.themeFamily === 'glass') && (
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[10px] text-gray-400">Opacity</span>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={applyColorToAll ? template.eventOpacity : (selectedEvent.opacity ?? template.eventOpacity)}
              onChange={(e) => {
                const newOpacity = parseFloat(e.target.value);
                if (applyColorToAll) {
                  onUpdateTemplate({ ...template, eventOpacity: newOpacity });
                  const updatedEvents = events.map(ev => ({ ...ev, opacity: undefined }));
                  onUpdateEvents(updatedEvents);
                } else {
                  const updatedEvents = events.map(ev =>
                    ev.displayTitle === selectedEvent?.displayTitle
                      ? { ...ev, opacity: newOpacity }
                      : ev
                  );
                  onUpdateEvents(updatedEvents);
                }
              }}
              className="w-16 h-1 rounded-lg appearance-none cursor-pointer slider-accent slider-track-themed"
            />
          </div>
        )}

        {/* No Borders - only for certain themes */}
        {(template.themeFamily === 'acrylic' || template.themeFamily === 'solid-grain' || template.themeFamily === 'glass') && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400">No Border</span>
            <div
              onClick={() => onUpdateTemplate({ ...template, eventBlockNoBorders: !template.eventBlockNoBorders })}
              className={`w-7 h-3.5 rounded-full relative transition-all cursor-pointer ${template.eventBlockNoBorders ? 'toggle-accent-bg' : 'toggle-off-bg'}`}
            >
              <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-all ${template.eventBlockNoBorders ? 'left-4' : 'left-0.5'}`} />
            </div>
          </div>
        )}

        {/* Diff Colors */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400">Diff Lab</span>
          <div
            onClick={() => triggerColorUpdate(!template.differentiateTypes)}
            className={`w-7 h-3.5 rounded-full relative transition-all cursor-pointer ${template.differentiateTypes ? 'toggle-accent-bg' : 'toggle-off-bg'}`}
          >
            <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-all ${template.differentiateTypes ? 'left-4' : 'left-0.5'}`} />
          </div>
        </div>
      </div>

      {/* Edit Fonts Button - compact */}
      <button
        onClick={() => setShowFontSelector(true)}
        className="w-full px-2 py-1.5 button-ghost-themed rounded-lg text-xs text-gray-200 font-medium transition-colors flex items-center justify-center gap-1.5 border-t border-[var(--border-muted)] mt-1"
      >
        <TypeIcon size={12} /> Edit Fonts
      </button>
    </div>
  ) : (
    <div className="text-xs text-gray-400 italic text-center py-2">
      Tap an event to edit color
    </div>
  );

  // Mobile tab content: Day Header
  const headerTabContent = (
    <div className="space-y-4">
      <div className="text-xs text-gray-400 font-medium italic">Day Header Style</div>

      {/* Color swatches */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400 font-medium">Text Color</label>
        <div className="grid grid-cols-6 gap-2">
          {['#111827', '#374151', '#6b7280', '#9ca3af', '#f3f4f6', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'].map((color) => (
            <button
              key={color}
              onClick={() => onUpdateTemplate({ ...template, headerTextColor: color })}
              className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
                template.headerTextColor === color
                  ? 'border-white scale-110 ring-2 ring-blue-400 ring-offset-1 ring-offset-gray-900'
                  : 'border-[var(--border-default)] hover:border-[var(--text-muted)]'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Backdrop Blur */}
      <div className="space-y-2 pt-3 border-t border-[var(--border-muted)]">
        <label className="text-xs text-gray-400 font-medium">Backdrop Blur</label>
        <input
          type="range"
          min="0"
          max="20"
          step="1"
          value={template.headerBlurAmount}
          onChange={(e) => onUpdateTemplate({ ...template, headerBlurAmount: parseInt(e.target.value) })}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer slider-accent slider-track-themed"
        />
        <GlassRadioGroup
          name="header-blur-mode-mobile"
          options={[
            { id: 'bar', label: 'Entire Row', value: 'bar' as const },
            { id: 'cells', label: 'Each Cell', value: 'cells' as const },
          ]}
          value={template.headerBlurMode}
          onChange={(val) => onUpdateTemplate({ ...template, headerBlurMode: val })}
        />
      </div>

      {/* Reset Button */}
      <button
        onClick={() => onUpdateTemplate({ ...template, headerTextColor: undefined, headerBlurAmount: 0 })}
        className="w-full px-3 py-2 button-ghost-themed rounded-lg text-sm text-gray-200 font-medium transition-colors"
      >
        Reset to Default
      </button>
    </div>
  );

  // Mobile tab content: Time Column
  const timeTabContent = (
    <div className="space-y-4">
      <div className="text-xs text-gray-400 font-medium italic">Time Column Style</div>

      {/* Color swatches */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400 font-medium">Text Color</label>
        <div className="grid grid-cols-6 gap-2">
          {['#111827', '#374151', '#6b7280', '#9ca3af', '#f3f4f6', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'].map((color) => (
            <button
              key={color}
              onClick={() => onUpdateTemplate({ ...template, timeColumnTextColor: color })}
              className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
                template.timeColumnTextColor === color
                  ? 'border-white scale-110 ring-2 ring-blue-400 ring-offset-1 ring-offset-gray-900'
                  : 'border-[var(--border-default)] hover:border-[var(--text-muted)]'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Backdrop Blur */}
      <div className="space-y-2 pt-3 border-t border-[var(--border-muted)]">
        <label className="text-xs text-gray-400 font-medium">Backdrop Blur</label>
        <input
          type="range"
          min="0"
          max="20"
          step="1"
          value={template.timeColumnBlurAmount}
          onChange={(e) => onUpdateTemplate({ ...template, timeColumnBlurAmount: parseInt(e.target.value) })}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer slider-accent slider-track-themed"
        />
        <GlassRadioGroup
          name="time-blur-mode-mobile"
          options={[
            { id: 'bar', label: 'Entire Column', value: 'bar' as const },
            { id: 'cells', label: 'Each Cell', value: 'cells' as const },
          ]}
          value={template.timeColumnBlurMode}
          onChange={(val) => onUpdateTemplate({ ...template, timeColumnBlurMode: val })}
        />
      </div>

      {/* Reset Button */}
      <button
        onClick={() => onUpdateTemplate({ ...template, timeColumnTextColor: undefined, timeColumnBlurAmount: 0 })}
        className="w-full px-3 py-2 button-ghost-themed rounded-lg text-sm text-gray-200 font-medium transition-colors"
      >
        Reset to Default
      </button>
    </div>
  );

  // Mobile tabs configuration - dynamic based on selection
  const mobileExportTabs: MobileTab[] = selectedEventId ? [
    // When an event is selected, show color tab
    {
      id: 'color',
      label: 'Color',
      icon: <Droplet size={20} />,
      content: colorTabContent,
    },
  ] : selectedComponent === 'dayHeader' ? [
    // When header is selected, show header tab
    {
      id: 'header',
      label: 'Header',
      icon: <Type size={20} />,
      content: headerTabContent,
    },
  ] : selectedComponent === 'timeColumn' ? [
    // When time column is selected, show time tab
    {
      id: 'time',
      label: 'Time',
      icon: <Clock size={20} />,
      content: timeTabContent,
    },
  ] : [
    // Default tabs
    {
      id: 'theme',
      label: 'Theme',
      icon: <Palette size={20} />,
      content: themeTabContent,
    },
    {
      id: 'background',
      label: 'Background',
      icon: <Image size={20} />,
      content: backgroundTabContent,
    },
    {
      id: 'scale',
      label: 'Scale',
      icon: <Maximize2 size={20} />,
      content: scaleTabContent,
    },
    {
      id: 'content',
      label: 'Content',
      icon: <Layout size={20} />,
      content: contentTabContent,
    },
  ];

  // Mobile layout for Export step
  if (isMobile) {
    return (
      <div className="flex flex-col h-full min-h-0 relative">
        {/* Mobile Header Bar */}
        <div
          className="flex items-center justify-between px-3 py-2 rounded-xl mb-2"
          style={{ backgroundColor: 'var(--panel-background)', borderColor: 'var(--panel-border)' }}
        >
          <button
            onClick={onBack}
            className="px-3 py-1.5 text-sm text-gray-300 hover:text-white transition-colors rounded-lg"
            style={{ backgroundColor: 'var(--button-ghost)' }}
          >
            ← Back
          </button>
          <h3 className="font-semibold text-white text-sm">Visual Style</h3>
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 btn-accent text-white text-sm font-medium rounded-lg disabled:opacity-50"
          >
            <Download size={14} />
            {isExporting ? '...' : 'Download'}
          </button>
        </div>

        {/* Preview Panel with zoom controls */}
        <div className="flex-1 min-h-0 relative mb-[72px]">
          {/* Zoom Toolbar */}
          {isZoomToolbarOpen && (
            <div className="absolute top-4 right-4 z-50">
              <div className="relative flex items-center gap-2 rounded-2xl border p-2 shadow-[0_12px_24px_rgba(2,6,23,0.35)] toolbar-themed">
                <button
                  onClick={handleZoomOut}
                  className="h-10 w-11 rounded-xl border shadow-[inset_0_1px_2px_rgba(255,255,255,0.12)] transition-all active:scale-95 toolbar-button-themed inline-btn"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} className="mx-auto text-gray-200" />
                </button>
                <button
                  onClick={handleZoomReset}
                  className="h-10 min-w-[72px] rounded-xl border px-3 text-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.12)] transition-all active:scale-95 toolbar-button-themed inline-btn"
                  title="Fit to View"
                >
                  <span className="text-xs font-mono text-gray-100">
                    {Math.round(zoom * 100)}%
                  </span>
                </button>
                <button
                  onClick={handleZoomIn}
                  className="h-10 w-11 rounded-xl border shadow-[inset_0_1px_2px_rgba(255,255,255,0.12)] transition-all active:scale-95 toolbar-button-themed inline-btn"
                  title="Zoom In"
                >
                  <ZoomIn size={16} className="mx-auto text-gray-200" />
                </button>
                <button
                  onClick={() => setIsZoomToolbarOpen(false)}
                  className="absolute -top-2 -right-2 rounded-lg border p-1.5 shadow-lg transition-all active:scale-95 toolbar-button-themed inline-btn"
                  title="Hide zoom controls"
                >
                  <Minimize2 size={12} className="text-gray-200" />
                </button>
              </div>
            </div>
          )}

          {/* Collapsed zoom button */}
          {!isZoomToolbarOpen && (
            <button
              onClick={() => setIsZoomToolbarOpen(true)}
              className="absolute top-4 right-4 z-50 h-10 w-10 rounded-xl border shadow-lg transition-all active:scale-95 toolbar-themed inline-btn"
              title="Show zoom controls"
            >
              <ZoomIn size={16} className="mx-auto text-gray-200" />
            </button>
          )}

          <div
            data-component="MobilePreviewPanel"
            ref={previewPanelRef}
            className="absolute inset-0 overflow-auto"
            style={{ touchAction: 'manipulation' }}
            onMouseDown={(e) => {
              const target = e.target as HTMLElement;
              if (colorPickerRef.current?.contains(target)) return;
              handleBlankClick();
            }}
            onTouchEnd={(e: React.TouchEvent) => {
              const target = e.target as HTMLElement;
              if (colorPickerRef.current?.contains(target)) return;
              // Only trigger blank click if tapping on the panel itself, not on interactive elements
              if (target.closest('[data-component="EventBlock"]') ||
                  target.closest('[data-component="DayHeader"]') ||
                  target.closest('[data-component="TimeColumn"]') ||
                  target.closest('[data-component="DayColumn"]') ||
                  target.closest('[data-component="CalendarCard"]')) return;
              handleBlankClick();
            }}
          >
            {/* Scale spacer - provides scrollable area for transform scale */}
            <div
              className="min-h-full p-4 flex items-start justify-center"
              style={zoom > 1 ? {
                minWidth: canvasDimensions.width * zoom + 32,
                minHeight: canvasDimensions.height * zoom + 32,
                width: '100%',
              } : { width: '100%' }}
            >
            <div
              className="transition-all duration-200 origin-top"
              style={(supportsZoom ? { zoom } : { transform: `scale(${zoom})`, transformOrigin: 'top center' }) as React.CSSProperties}
            >
                {template.lockscreenMockup ? (
                <div data-component="LockscreenMockup" className="relative">
                  <div
                    id="calendar-export-node"
                    className="relative z-40"
                    style={{ borderRadius: '8%' }}
                  >
                    <CalendarCanvas
                      events={events}
                      template={template}
                      interactive={true}
                      onEventClick={handleEventClick}
                      onBlankClick={handleBlankClick}
                      visualScale={supportsZoom ? 1 : zoom}
                      showFullTitle={template.showCourseSection}
                      mockupClipBorderRadius="8%"
                      mockupOverlay={
                        <div
                          className="absolute pointer-events-none"
                          style={{
                            width: `${(3772 / 3345) * 100}%`,
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 30,
                          }}
                        >
                          <picture>
                            <source srcSet={lockscreenMockupWebp} type="image/webp" />
                            <img
                              src={lockscreenMockupPng}
                              alt="iPhone Lockscreen Frame"
                              className="w-full h-auto"
                            />
                          </picture>
                        </div>
                      }
                      onHeaderClick={() => {
                        setSelectedEventId(null);
                        setSelectedComponent('dayHeader');
                        setMobileActiveTab('header');
                      }}
                      onTimeColumnClick={() => {
                        setSelectedEventId(null);
                        setSelectedComponent('timeColumn');
                        setMobileActiveTab('time');
                      }}
                      isCalendarCardSelected={selectedComponent === 'calendarCard'}
                      onCalendarCardSelect={() => {
                        setSelectedComponent('calendarCard');
                        setSelectedEventId(null);
                        setMobileActiveTab('scale');
                      }}
                      highlightMode={selectedComponent}
                      onboardingComponents={onboardingPending}
                      onboardingEventId={onboardingEventId}
                      onOnboardingOk={handleOnboardingOk}
                      onDimensionsComputed={setCanvasDimensions}
                    />
                  </div>
                </div>
              ) : (
                <div id="calendar-export-node">
                  <CalendarCanvas
                    events={events}
                    template={template}
                    interactive={true}
                    onEventClick={handleEventClick}
                    onBlankClick={handleBlankClick}
                    visualScale={supportsZoom ? 1 : zoom}
                    showFullTitle={template.showCourseSection}
                    onHeaderClick={() => {
                      setSelectedEventId(null);
                      setSelectedComponent('dayHeader');
                      setMobileActiveTab('header');
                    }}
                    onTimeColumnClick={() => {
                      setSelectedEventId(null);
                      setSelectedComponent('timeColumn');
                      setMobileActiveTab('time');
                    }}
                    isCalendarCardSelected={selectedComponent === 'calendarCard'}
                    onCalendarCardSelect={() => {
                      setSelectedComponent('calendarCard');
                      setSelectedEventId(null);
                      setMobileActiveTab('scale');
                    }}
                    highlightMode={selectedComponent}
                    onboardingComponents={onboardingPending}
                    onboardingEventId={onboardingEventId}
                    onOnboardingOk={handleOnboardingOk}
                    onDimensionsComputed={setCanvasDimensions}
                  />
                </div>
              )}
            </div>
          </div>
          </div>
        </div>

        {/* Hidden export canvas */}
        <div
          style={{
            position: 'fixed',
            left: isExporting ? '0' : '-9999px',
            top: isExporting ? '0' : '-9999px',
            zIndex: isExporting ? -1 : -9999,
            pointerEvents: 'none',
            visibility: isExporting ? 'visible' : 'hidden',
          }}
        >
          <div id="calendar-export-hidden">
            <CalendarCanvas
              events={events}
              template={template}
              interactive={false}
              showFullTitle={template.showCourseSection}
            />
          </div>
        </div>

        {/* Mobile Footer Toolbar */}
        <MobileFooterToolbar
          tabs={mobileExportTabs}
          activeTabId={mobileActiveTab}
          onTabChange={setMobileActiveTab}
          onPanelClose={() => {
            // Deselect elements when closing/collapsing the panel
            if (selectedEventId) {
              setSelectedEventId(null);
            }
            if (selectedComponent !== 'none') {
              setSelectedComponent('none');
            }
          }}
        />

        {/* Background Gallery Modal */}
        {showBackgroundGallery && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowBackgroundGallery(false)}>
            <div
              className="relative border rounded-2xl popup-themed shadow-2xl w-[95vw] max-w-lg max-h-[80vh] flex flex-col mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-[var(--border-muted)]">
                <h2 className="text-lg font-semibold text-white">Backgrounds</h2>
                <button onClick={() => setShowBackgroundGallery(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-3 gap-2">
                  {[...landscapes, ...portraits].map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => {
                        onUpdateTemplate({ ...template, backgroundImage: bg.id, customBackgroundImage: undefined });
                        setShowBackgroundGallery(false);
                      }}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        template.backgroundImage === bg.id
                          ? 'border-blue-500 ring-2 ring-blue-400/50'
                          : 'border-[var(--border-default)]'
                      }`}
                    >
                      <img src={bg.thumbnailUrl} alt={bg.name} className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div
      data-component="ExportLayout"
      className="flex h-full min-h-0 gap-6 relative"
    >

      {/* BACK TO EDIT BUTTON - Fixed top left of canvas area */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-300"
        style={{
          backgroundColor: 'transparent',
          borderColor: 'var(--panel-border)',
          color: 'var(--text-muted)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--surface-elevated)';
          e.currentTarget.style.borderColor = 'var(--panel-border)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.borderColor = 'var(--panel-border)';
          e.currentTarget.style.color = 'var(--text-muted)';
        }}
        title="Back to Edit"
      >
        <ChevronRight size={16} className="rotate-180" />
        <span className="text-sm font-medium">Edit</span>
      </button>

      {/* ZOOM TOOLBAR - Fixed position, adapts horizontally when sidebar collapses */}
      {isZoomToolbarOpen && (
        <div
          data-component="ZoomToolbar"
          className="absolute top-4 z-50 transition-all duration-500"
          style={{ right: isSidebarOpen ? '340px' : '24px' }}
        >
          <div className="relative flex items-center gap-2 rounded-2xl border p-2 shadow-[0_12px_24px_rgba(2,6,23,0.35)] toolbar-themed">
            <button
              onClick={handleZoomOut}
              className="h-10 w-11 rounded-xl border shadow-[inset_0_1px_2px_rgba(255,255,255,0.12)] transition-all active:scale-95 toolbar-button-themed"
              title="Zoom Out"
            >
              <ZoomOut size={16} className="mx-auto text-gray-200" />
            </button>
            <button
              onClick={handleZoomReset}
              className="h-10 min-w-[72px] rounded-xl border px-3 text-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.12)] transition-all active:scale-95 toolbar-button-themed"
              title="Reset to 100%"
            >
              <span className="text-xs font-mono text-gray-100">
                {Math.round(zoom * 100)}%
              </span>
            </button>
            <button
              onClick={handleZoomIn}
              className="h-10 w-11 rounded-xl border shadow-[inset_0_1px_2px_rgba(255,255,255,0.12)] transition-all active:scale-95 toolbar-button-themed"
              title="Zoom In"
            >
              <ZoomIn size={16} className="mx-auto text-gray-200" />
            </button>
            <button
              onClick={() => setIsZoomToolbarOpen(false)}
              className="absolute -top-2 -right-2 rounded-lg border p-1.5 shadow-lg transition-all active:scale-95 toolbar-button-themed"
              title="Hide zoom controls"
              aria-label="Hide zoom controls"
            >
              <Minimize2 size={12} className="text-gray-200" />
            </button>
          </div>
        </div>
      )}

      {/* PREVIEW PANEL - The dark container that holds the calendar preview */}
      <div
        data-component="PreviewPanel"
        ref={previewPanelRef}
        className="flex-1 min-h-0 overflow-auto relative"
        style={{ touchAction: 'pan-x pan-y' }}
        onMouseDown={(e) => {
          const target = e.target as HTMLElement;
          if (colorPickerRef.current?.contains(target)) return;
          if (target.closest('[data-component="HeaderTextEditorCallout"]')) return;
          if (target.closest('[data-component="TimeColumnEditorCallout"]')) return;
          if (target.closest('[data-component="ZoomToolbar"]')) return;
          if (target.closest('[data-component="VerticalTranslateSlider"]')) return;
          if (target.closest('[data-component="BackgroundContainer"]')) return;
          handleBlankClick();
        }}
      >

        {/* PREVIEW VIEWPORT - Centers the calendar */}
        <div
          data-component="PreviewViewport"
          className="p-6 flex items-start justify-center"
          style={zoom > 1 ? {
            minWidth: canvasDimensions.width * zoom + 48,
            minHeight: canvasDimensions.height * zoom + 48,
            width: '100%',
          } : { minHeight: '100%', width: '100%' }}
        >
            {/* ZOOM WRAPPER - Applies zoom transform */}
            <div
              data-component="ZoomWrapper"
              className="transition-all duration-200 origin-top flex items-start"
              style={
                (supportsZoom
                  ? { zoom }
                  : { transform: `scale(${zoom})`, transformOrigin: 'top center' }) as React.CSSProperties
              }
            >
            {/* LOCKSCREEN MOCKUP WRAPPER - When enabled, shows iPhone frame border around canvas */}
            {template.lockscreenMockup ? (
              <div data-component="LockscreenMockup" className="relative">
                {/* EXPORT NODE - with border-radius to match phone screen shape */}
                {/* z-40 ensures callouts/highlights appear above mockup (z-30) */}
                {/* overflow: visible allows callouts to escape, ContentClipper handles background clipping */}
                <div
                  data-component="ExportNode"
                  id="calendar-export-node"
                  className="relative z-40"
                  style={{
                    borderRadius: '8%',
                  }}
                >
                  <CalendarCanvas
                    events={events}
                    template={template}
                    interactive={true}
                    onEventClick={handleEventClick}
                    onBlankClick={handleBlankClick}
                    visualScale={supportsZoom ? 1 : zoom}
                    showFullTitle={template.showCourseSection}
                    mockupClipBorderRadius="8%"
                    mockupOverlay={
                      <div
                        className="absolute pointer-events-none"
                        style={{
                          width: `${(3772 / 3345) * 100}%`,
                          left: '50%',
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                          zIndex: 30,
                        }}
                      >
                        <picture>
                          <source srcSet={lockscreenMockupWebp} type="image/webp" />
                          <img
                            src={lockscreenMockupPng}
                            alt="iPhone Lockscreen Frame"
                            className="w-full h-auto"
                          />
                        </picture>
                      </div>
                    }
                      onHeaderClick={() => {
                        setHeaderTextEditorOpen(true);
                        setTimeColumnEditorOpen(false);
                        setTimeEditorPosition(null);
                        setSelectedEventId(null);
                        setColorPickerPosition(null);
                        setSelectedComponent('dayHeader');
                        const target = previewPanelRef.current?.querySelector('[data-component="ExportNode"] [data-component="DayHeader"]') as HTMLElement | null;
                        setHeaderEditorPosition(target ? getCalloutPosition(target, { width: 240, height: 210 }) : null);
                      }}
                      onTimeColumnClick={() => {
                        setTimeColumnEditorOpen(true);
                        setHeaderTextEditorOpen(false);
                        setHeaderEditorPosition(null);
                        setSelectedEventId(null);
                        setColorPickerPosition(null);
                        setSelectedComponent('timeColumn');
                        const target = previewPanelRef.current?.querySelector('[data-component="ExportNode"] [data-component="TimeColumn"]') as HTMLElement | null;
                        setTimeEditorPosition(target ? getRightCenteredCalloutPosition(target, { width: 240, height: 230 }) : null);
                      }}
                    isCalendarCardSelected={selectedComponent === 'calendarCard'}
                    onCalendarCardSelect={() => {
                      setSelectedComponent('calendarCard');
                      setHeaderTextEditorOpen(false);
                      setTimeColumnEditorOpen(false);
                      setSelectedEventId(null);
                      setColorPickerPosition(null);
                    }}
                    showResetToFill={hasCardInsets && selectedComponent === 'calendarCard'}
                    onResetToFill={handleResetToFill}
                    highlightMode={selectedComponent}
                    onboardingComponents={onboardingPending}
                    onboardingEventId={onboardingEventId}
                    onOnboardingOk={handleOnboardingOk}
                    hoveredResizeEdge={hoveredEdge}
                    onEdgeHover={setHoveredEdge}
                    onResizeStart={handleResizeStart}
                    hoverResetToken={hoverResetToken}
                    onDimensionsComputed={setCanvasDimensions}
                  />
                </div>
              </div>
            ) : (
              /* EXPORT NODE - Visible interactive canvas (normal mode) */
              <div data-component="ExportNodeWrapper" className="relative">
                <div data-component="ExportNode" id="calendar-export-node">
                  <CalendarCanvas
                    events={events}
                    template={template}
                    interactive={true}
                    onEventClick={handleEventClick}
                    onBlankClick={handleBlankClick}
                    visualScale={supportsZoom ? 1 : zoom}
                    showFullTitle={template.showCourseSection}
                  onHeaderClick={() => {
                    setHeaderTextEditorOpen(true);
                    setTimeColumnEditorOpen(false);
                    setTimeEditorPosition(null);
                    setSelectedEventId(null);
                    setColorPickerPosition(null);
                    setSelectedComponent('dayHeader');
                    const target = previewPanelRef.current?.querySelector('[data-component="ExportNode"] [data-component="DayHeader"]') as HTMLElement | null;
                    setHeaderEditorPosition(target ? getCalloutPosition(target, { width: 240, height: 210 }) : null);
                  }}
                  onTimeColumnClick={() => {
                    setTimeColumnEditorOpen(true);
                    setHeaderTextEditorOpen(false);
                    setHeaderEditorPosition(null);
                    setSelectedEventId(null);
                    setColorPickerPosition(null);
                    setSelectedComponent('timeColumn');
                    const target = previewPanelRef.current?.querySelector('[data-component="ExportNode"] [data-component="TimeColumn"]') as HTMLElement | null;
                    setTimeEditorPosition(target ? getRightCenteredCalloutPosition(target, { width: 240, height: 230 }) : null);
                  }}
                  isCalendarCardSelected={selectedComponent === 'calendarCard'}
                  onCalendarCardSelect={() => {
                    setSelectedComponent('calendarCard');
                    setHeaderTextEditorOpen(false);
                    setTimeColumnEditorOpen(false);
                    setSelectedEventId(null);
                    setColorPickerPosition(null);
                  }}
                  showResetToFill={hasCardInsets && selectedComponent === 'calendarCard'}
                  onResetToFill={handleResetToFill}
                  highlightMode={selectedComponent}
                  onboardingComponents={onboardingPending}
                  onboardingEventId={onboardingEventId}
                  onOnboardingOk={handleOnboardingOk}
                  hoveredResizeEdge={hoveredEdge}
                    onEdgeHover={setHoveredEdge}
                    onResizeStart={handleResizeStart}
                    hoverResetToken={hoverResetToken}
                    onDimensionsComputed={setCanvasDimensions}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {showVerticalTranslateSlider && sliderLeft !== null && (
          <div
            data-component="VerticalTranslateSlider"
            className="fixed z-50 flex items-center"
            style={{
              left: `${sliderLeft}px`,
              top: '60%',
              transform: 'translateY(-50%)',
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <VerticalSlider
              value={sliderValue / 100}
              onChange={(v) => handleVerticalTranslateChange((1 - v) * 100)}
              height={sliderHeight}
            />
          </div>
        )}

        {/* HIDDEN EXPORT CANVAS - Used for actual image export */}
        <div
          style={{
            position: 'fixed',
            left: isExporting ? '0' : '-9999px',
            top: isExporting ? '0' : '-9999px',
            zIndex: isExporting ? -1 : -9999,
            pointerEvents: 'none',
            visibility: isExporting ? 'visible' : 'hidden',
          }}
        >
          <div id="calendar-export-hidden">
            <CalendarCanvas
              events={events}
              template={template}
              interactive={false}
              showFullTitle={template.showCourseSection}
            />
          </div>
        </div>

        {/* FLOATING COLOR PICKER - Smart positioning based on available space */}
        {selectedEvent && colorPickerPosition && (
          <div
            ref={colorPickerRef}
            className="absolute z-[100] animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
            style={{
              left: colorPickerPosition.x,
              top: colorPickerPosition.y,
              transform: colorPickerPosition.placement === 'top' ? 'translate(-50%, -100%)' :
                         colorPickerPosition.placement === 'bottom' ? 'translate(-50%, 0%)' :
                         colorPickerPosition.placement === 'right' ? 'translate(0%, -50%)' :
                         'translate(-100%, -50%)'
            }}
          >
            <div className="backdrop-blur-xl rounded-xl border popup-themed shadow-2xl p-3 relative">
              {/* Arrow pointer - direction based on placement, with offset */}
              {colorPickerPosition.placement === 'top' && (
                <div
                  className="absolute -bottom-2 w-4 h-4 border-r border-b popup-themed"
                  style={{ left: `calc(50% + ${colorPickerPosition.arrowOffset}px - 8px)`, transform: 'rotate(45deg)' }}
                />
              )}
              {colorPickerPosition.placement === 'bottom' && (
                <div
                  className="absolute -top-2 w-4 h-4 border-l border-t popup-themed"
                  style={{ left: `calc(50% + ${colorPickerPosition.arrowOffset}px - 8px)`, transform: 'rotate(45deg)' }}
                />
              )}
              {colorPickerPosition.placement === 'right' && (
                <div
                  className="absolute -left-2 w-4 h-4 border-l border-b popup-themed"
                  style={{ top: 'calc(50% - 8px)', transform: 'rotate(45deg)' }}
                />
              )}
              {colorPickerPosition.placement === 'left' && (
                <div
                  className="absolute -right-2 w-4 h-4 border-r border-t popup-themed"
                  style={{ top: 'calc(50% - 8px)', transform: 'rotate(45deg)' }}
                />
              )}

              {/* Header */}
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-xs text-gray-400 font-medium italic">
                  {applyColorToAll ? 'Color (applies to all blocks)' : `Color (applies to all ${selectedEvent.displayTitle})`}
                </span>
                <button
                  onClick={() => {
                    setSelectedEventId(null);
                    setColorPickerPosition(null);
                    setShowPalettePicker(false);
                  }}
                  className="text-gray-500 hover:text-white transition-colors flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Apply to All Toggle */}
              <div className="flex items-center justify-between gap-3 px-1 py-1.5 mb-2 rounded-lg card-section-themed">
                <span className="text-xs text-gray-300 font-medium whitespace-nowrap">Apply to All Blocks</span>
                <div
                  onClick={() => {
                    const newValue = !applyColorToAll;
                    setApplyColorToAll(newValue);
                    if (newValue && selectedEvent) {
                      // When toggling ON, apply current color and opacity to all blocks
                      const currentOpacity = selectedEvent.opacity ?? template.eventOpacity;
                      const updatedEvents = events.map(e => ({
                        ...e,
                        color: selectedEvent.color,
                        opacity: currentOpacity,
                      }));
                      onUpdateEvents(updatedEvents);
                      // Also update template opacity to match
                      onUpdateTemplate({ ...template, eventOpacity: currentOpacity });
                    } else if (!newValue) {
                      // When toggling OFF, shuffle colors so courses have different colors
                      shuffleColorsForEvents(template.differentiateTypes);
                    }
                  }}
                  className={`w-10 h-5 rounded-full relative transition-all duration-300 cursor-pointer flex-shrink-0 ${applyColorToAll ? 'toggle-accent-bg' : 'toggle-off-bg'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${applyColorToAll ? 'left-6' : 'left-1'}`} />
                </div>
              </div>

              {/* Shuffle Colors Button - Only when Apply to All is OFF */}
              {!applyColorToAll && (
                <button
                  onClick={() => shuffleColorsForEvents(template.differentiateTypes)}
                  className="w-full mb-2 px-3 py-1.5 text-xs font-medium text-gray-300 rounded-lg transition-colors border border-[var(--border-default)] button-ghost-themed hover:opacity-90"
                >
                  🎲 Shuffle Colors
                </button>
              )}

              {/* Color swatches - 2 rows grid */}
              <div className="grid grid-cols-6 gap-1.5 mb-2">
                {themeColors.map(color => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 relative overflow-hidden ${
                      selectedEvent.color === color
                        ? 'border-white scale-110 ring-2 ring-blue-400 ring-offset-1 ring-offset-gray-900'
                        : 'border-transparent hover:border-[var(--border-default)]'
                    }`}
                    style={{
                      // For acrylic: neutral gray base + color layers; solid-grain: direct color with opacity
                      backgroundColor: template.themeFamily === 'acrylic' ? '#6b7280' : template.themeFamily === 'solid-grain' ? color : color,
                    }}
                    title={color}
                  >
                    {/* Color layer for acrylic theme - higher opacity for picker visibility */}
                    {template.themeFamily === 'acrylic' && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: `${color}ad`, // ad hex = ~68% opacity
                          borderRadius: 'inherit',
                        }}
                      />
                    )}
                    {/* Solid-grain: show color at 70% opacity to match theme */}
                    {template.themeFamily === 'solid-grain' && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: `${color}b3`, // b3 hex = ~70% opacity
                          borderRadius: 'inherit',
                        }}
                      />
                    )}
                    {/* Grain texture overlay for acrylic theme only */}
                    {template.themeFamily === 'acrylic' && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundImage: `url('${acrylicTextureUrl}')`,
                          backgroundRepeat: 'repeat',
                          backgroundSize: '64px 64px',
                          opacity: 0.1,
                          pointerEvents: 'none',
                          borderRadius: 'inherit',
                        }}
                      />
                    )}
                    {/* White overlay for acrylic theme only */}
                    {template.themeFamily === 'acrylic' && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: 'inherit',
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Use Different Palette */}
              <div className="relative">
                <button
                  onClick={() => setShowPalettePicker(!showPalettePicker)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer mb-2 flex items-center gap-1 ml-auto"
                >
                  <Palette size={12} />
                  {showPalettePicker ? 'Hide palettes' : `Using ${currentPalette.name} · Change`}
                </button>

                {/* Palette Options Panel */}
                {showPalettePicker && (
                  <div className="mb-2 p-2 rounded-lg border card-section-themed">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Other Palettes</div>
                    <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                      {COLOR_PALETTES.map((palette: ColorPalette) => (
                        <button
                          key={palette.id}
                          onClick={() => {
                            setActivePaletteId(palette.id);
                            // Re-shuffle colors with new palette
                            const newColors = palette.colors;
                            if (applyColorToAll) {
                              const randomColor = newColors[Math.floor(Math.random() * newColors.length)];
                              const updatedEvents = events.map(e => ({ ...e, color: randomColor }));
                              onUpdateEvents(updatedEvents);
                            } else {
                              // Assign colors by course
                              const courseColorMap = new Map<string, string>();
                              let colorIndex = 0;
                              const updatedEvents = events.map(e => {
                                const key = template.differentiateTypes
                                  ? `${e.displayTitle}-${e.classType}`
                                  : e.displayTitle;
                                if (!courseColorMap.has(key)) {
                                  courseColorMap.set(key, newColors[colorIndex % newColors.length]);
                                  colorIndex++;
                                }
                                return { ...e, color: courseColorMap.get(key)! };
                              });
                              onUpdateEvents(updatedEvents);
                            }
                            setShowPalettePicker(false);
                          }}
                          className={`w-full flex items-center gap-2 p-1.5 rounded-md transition-all ${
                            currentPalette.id === palette.id
                              ? 'bg-blue-600/30 border border-blue-500/50'
                              : 'hover:opacity-80 border border-transparent'
                          }`}
                        >
                          {/* Palette preview - first 6 colors */}
                          <div className="flex gap-0.5 flex-shrink-0">
                            {palette.colors.slice(0, 6).map((color, idx) => (
                              <div
                                key={idx}
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <span className={`text-xs ${currentPalette.id === palette.id ? 'text-blue-300 font-medium' : 'text-gray-300'}`}>
                            {palette.name}
                          </span>
                          {currentPalette.id === palette.id && (
                            <span className="ml-auto text-[10px] text-blue-400">Active</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Color Opacity Slider - Only for acrylic, solid-grain, and glass themes */}
              {(template.themeFamily === 'acrylic' || template.themeFamily === 'solid-grain' || template.themeFamily === 'glass') && (
                <div className="pt-2 border-t border-[var(--border-muted)]">
                  <div className="px-1 py-1.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-300 font-medium">Color Opacity</span>
                      <span className="text-xs text-gray-500">
                        {Math.round((applyColorToAll ? template.eventOpacity : (selectedEvent?.opacity ?? template.eventOpacity)) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={applyColorToAll ? template.eventOpacity : (selectedEvent?.opacity ?? template.eventOpacity)}
                      onChange={(e) => {
                        const newOpacity = parseFloat(e.target.value);
                        if (applyColorToAll) {
                          // Apply to all: update template and clear per-event opacities
                          onUpdateTemplate({ ...template, eventOpacity: newOpacity });
                          const updatedEvents = events.map(ev => ({ ...ev, opacity: undefined }));
                          onUpdateEvents(updatedEvents);
                        } else {
                          // Apply to same course only
                          const updatedEvents = events.map(ev =>
                            ev.displayTitle === selectedEvent?.displayTitle
                              ? { ...ev, opacity: newOpacity }
                              : ev
                          );
                          onUpdateEvents(updatedEvents);
                        }
                      }}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer slider-accent slider-track-themed"
                    />
                  </div>
                </div>
              )}

              {/* No Borders Toggle - Only for Acrylic/Solid Grain/Glass themes */}
              {(template.themeFamily === 'acrylic' || template.themeFamily === 'solid-grain' || template.themeFamily === 'glass') && (
                <div className="pt-2 border-t border-[var(--border-muted)]">
                  <div className="flex items-center justify-between gap-3 px-1 py-1.5 rounded-lg card-section-themed">
                    <span className="text-xs text-gray-300 font-medium whitespace-nowrap">No Borders</span>
                    <div
                      onClick={() => onUpdateTemplate({ ...template, eventBlockNoBorders: !template.eventBlockNoBorders })}
                      className={`w-10 h-5 rounded-full relative transition-all duration-300 cursor-pointer flex-shrink-0 ${template.eventBlockNoBorders ? 'toggle-accent-bg' : 'toggle-off-bg'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${template.eventBlockNoBorders ? 'left-6' : 'left-1'}`} />
                    </div>
                  </div>
                </div>
              )}

              {/* Different Lab/Tutorial Colors Toggle */}
              <div className="pt-2 border-t border-[var(--border-muted)]">
                <div className="flex items-center justify-between gap-3 px-1 py-1.5 rounded-lg card-section-themed">
                  <span className="text-xs text-gray-300 font-medium whitespace-nowrap">Different Lab/Tutorial Colors</span>
                  <div
                    onClick={() => triggerColorUpdate(!template.differentiateTypes)}
                    className={`w-10 h-5 rounded-full relative transition-all duration-300 cursor-pointer flex-shrink-0 ${template.differentiateTypes ? 'toggle-accent-bg' : 'toggle-off-bg'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${template.differentiateTypes ? 'left-6' : 'left-1'}`} />
                  </div>
                </div>
              </div>

              {/* Edit Fonts Button - Switches sidebar to Font panel */}
              <div className="pt-2 border-t border-[var(--border-muted)]">
                <button
                  onClick={() => {
                    setActiveSidebarSection('font');
                    setIsSidebarOpen(true);
                    setColorPickerPosition(null);
                    // Keep selectedEventId so font panel can show the preview
                  }}
                  className="w-full px-3 py-2 button-ghost-themed rounded-lg text-xs text-gray-200 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <TypeIcon size={14} /> Edit Fonts/Color
                </button>
              </div>
            </div>
          </div>
        )}

        {headerTextEditorOpen && headerEditorPosition && (
          <div
            data-component="HeaderTextEditorCallout"
            className="absolute z-[100] animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
            style={{
              left: headerEditorPosition.x,
              top: headerEditorPosition.y,
              transform: headerEditorPosition.placement === 'top' ? 'translate(-50%, -100%)' :
                         headerEditorPosition.placement === 'bottom' ? 'translate(-50%, 0%)' :
                         headerEditorPosition.placement === 'right' ? 'translate(0%, -50%)' :
                         'translate(-100%, -50%)'
            }}
          >
            <div className="backdrop-blur-xl rounded-xl border popup-themed shadow-2xl p-3 relative w-[240px]">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearComponentSelection();
                }}
                className="absolute top-2 right-2 p-1 text-gray-400 transition hover:text-gray-200 rounded border border-[var(--border-default)]"
                aria-label="Close day header editor"
              >
                <X size={14} />
              </button>
              {headerEditorPosition.placement === 'top' && (
                <div
                  className="absolute -bottom-2 w-4 h-4 border-r border-b popup-themed"
                  style={{ left: `calc(50% + ${headerEditorPosition.arrowOffset}px - 8px)`, transform: 'rotate(45deg)' }}
                />
              )}
              {headerEditorPosition.placement === 'bottom' && (
                <div
                  className="absolute -top-2 w-4 h-4 border-l border-t popup-themed"
                  style={{ left: `calc(50% + ${headerEditorPosition.arrowOffset}px - 8px)`, transform: 'rotate(45deg)' }}
                />
              )}
              {headerEditorPosition.placement === 'right' && (
                <div className="absolute -left-2 w-4 h-4 border-l border-b popup-themed" style={{ top: 'calc(50% - 8px)', transform: 'rotate(45deg)' }} />
              )}
              {headerEditorPosition.placement === 'left' && (
                <div className="absolute -right-2 w-4 h-4 border-r border-t popup-themed" style={{ top: 'calc(50% - 8px)', transform: 'rotate(45deg)' }} />
              )}

              <div className="text-xs text-gray-400 font-medium italic mb-2">Day Header</div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="grid grid-cols-6 gap-1.5">
                    {['#111827', '#374151', '#6b7280', '#9ca3af', '#f3f4f6', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'].map((color) => (
                      <button
                        key={color}
                        onClick={() => onUpdateTemplate({ ...template, headerTextColor: color })}
                        className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
                          template.headerTextColor === color
                            ? 'border-white scale-110 ring-2 ring-blue-400 ring-offset-1 ring-offset-gray-900'
                            : 'border-[var(--border-default)] hover:border-[var(--text-muted)]'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-[var(--border-muted)]">
                  <label className="text-[10px] text-gray-400 font-medium">Backdrop Blur</label>
                  <div className="space-y-1">
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={template.headerBlurAmount}
                      onChange={(e) => onUpdateTemplate({ ...template, headerBlurAmount: parseInt(e.target.value) })}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer slider-accent slider-track-themed"
                    />
                  </div>
                  <GlassRadioGroup
                    name="header-blur-mode"
                    options={[
                      { id: 'bar', label: 'Entire Row', value: 'bar' as const },
                      { id: 'cells', label: 'Each Cell', value: 'cells' as const },
                    ]}
                    value={template.headerBlurMode}
                    onChange={(val) => onUpdateTemplate({ ...template, headerBlurMode: val })}
                  />
                </div>

                <button
                  onClick={() => onUpdateTemplate({ ...template, headerTextColor: undefined, headerBlurAmount: 0 })}
                  className="w-full px-3 py-2 button-ghost-themed rounded-lg text-xs text-gray-200 font-medium transition-colors"
                >
                  Reset to Default
                </button>
              </div>
            </div>
          </div>
        )}

        {timeColumnEditorOpen && timeEditorPosition && (
          <div
            data-component="TimeColumnEditorCallout"
            className="absolute z-[100] animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
            style={{
              left: timeEditorPosition.x,
              top: timeEditorPosition.y,
              transform: timeEditorPosition.placement === 'top' ? 'translate(-50%, -100%)' :
                         timeEditorPosition.placement === 'bottom' ? 'translate(-50%, 0%)' :
                         timeEditorPosition.placement === 'right' ? 'translate(0%, -50%)' :
                         'translate(-100%, -50%)'
            }}
          >
            <div className="backdrop-blur-xl rounded-xl border popup-themed shadow-2xl p-3 relative w-[240px]">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearComponentSelection();
                }}
                className="absolute top-2 right-2 p-1 text-gray-400 transition hover:text-gray-200 rounded border border-[var(--border-default)]"
                aria-label="Close time column editor"
              >
                <X size={14} />
              </button>
              {timeEditorPosition.placement === 'top' && (
                <div className="absolute -bottom-2 w-4 h-4 border-r border-b popup-themed" style={{ left: `calc(50% + ${timeEditorPosition.arrowOffset}px - 8px)`, transform: 'rotate(45deg)' }} />
              )}
              {timeEditorPosition.placement === 'bottom' && (
                <div className="absolute -top-2 w-4 h-4 border-l border-t popup-themed" style={{ left: `calc(50% + ${timeEditorPosition.arrowOffset}px - 8px)`, transform: 'rotate(45deg)' }} />
              )}
              {timeEditorPosition.placement === 'right' && (
                <div className="absolute -left-2 w-4 h-4 border-l border-b popup-themed" style={{ top: 'calc(50% - 8px)', transform: 'rotate(45deg)' }} />
              )}
              {timeEditorPosition.placement === 'left' && (
                <div className="absolute -right-2 w-4 h-4 border-r border-t popup-themed" style={{ top: 'calc(50% - 8px)', transform: 'rotate(45deg)' }} />
              )}

              <div className="text-xs text-gray-400 font-medium italic mb-2">Time Column</div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="grid grid-cols-6 gap-1.5">
                    {['#111827', '#374151', '#6b7280', '#9ca3af', '#f3f4f6', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'].map((color) => (
                      <button
                        key={color}
                        onClick={() => onUpdateTemplate({ ...template, timeColumnTextColor: color })}
                        className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
                          template.timeColumnTextColor === color
                            ? 'border-white scale-110 ring-2 ring-blue-400 ring-offset-1 ring-offset-gray-900'
                            : 'border-[var(--border-default)] hover:border-[var(--text-muted)]'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-[var(--border-muted)]">
                  <label className="text-[10px] text-gray-400 font-medium">Backdrop Blur</label>
                  <div className="space-y-1">
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={template.timeColumnBlurAmount}
                      onChange={(e) => onUpdateTemplate({ ...template, timeColumnBlurAmount: parseInt(e.target.value) })}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer slider-accent slider-track-themed"
                    />
                  </div>
                  <GlassRadioGroup
                    name="time-blur-mode"
                    options={[
                      { id: 'bar', label: 'Entire Column', value: 'bar' as const },
                      { id: 'cells', label: 'Each Cell', value: 'cells' as const },
                    ]}
                    value={template.timeColumnBlurMode}
                    onChange={(val) => onUpdateTemplate({ ...template, timeColumnBlurMode: val })}
                  />
                </div>

                <button
                  onClick={() => onUpdateTemplate({ ...template, timeColumnTextColor: undefined, timeColumnBlurAmount: 0 })}
                  className="w-full px-3 py-2 button-ghost-themed rounded-lg text-xs text-gray-200 font-medium transition-colors"
                >
                  Reset to Default
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Collapsed Zoom Button - Shows when zoom toolbar is hidden */}
      {!isZoomToolbarOpen && (
        <button
          data-component="ZoomToggle"
          onClick={() => setIsZoomToolbarOpen(true)}
          className="absolute top-4 z-50 h-10 w-10 rounded-xl border shadow-[0_10px_20px_rgba(2,6,23,0.35)] transition-all duration-500 active:scale-95 toolbar-themed"
          style={{ right: isSidebarOpen ? '340px' : '24px' }}
          title="Show zoom controls"
          aria-label="Show zoom controls"
        >
          <ZoomIn size={16} className="mx-auto text-gray-200" />
        </button>
      )}

      {/* Collapsed Sidebar Button - Shows below zoom toolbar when sidebar is hidden */}
      {!isSidebarOpen && (
        <button
          data-component="SidebarToggle"
          onClick={() => setIsSidebarOpen(true)}
          className="absolute z-50 h-10 w-10 rounded-xl border bg-transparent text-gray-200 shadow-[0_10px_20px_rgba(2,6,23,0.2)] transition-all duration-500 active:scale-95 toolbar-themed"
          style={{
            right: '24px',
            top: isZoomToolbarOpen ? '80px' : '64px'
          }}
          title="Show sidebar"
          aria-label="Show sidebar"
        >
          <SlidersHorizontal size={18} className="mx-auto" />
        </button>
      )}

      {/* HEADER/TIME COLUMN EDITORS - Inline callouts rendered in preview */}
      {/* SETTINGS SIDEBAR - Right panel with all style controls */}
      <ExportSidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        activeSidebarSection={activeSidebarSection}
        setActiveSidebarSection={setActiveSidebarSection}
        themeProps={{
          template,
          onUpdateTemplate,
          applyThemeColors,
          prevThemeFamilyRef,
          colorPalettes: COLOR_PALETTES,
          activePaletteId,
          onPaletteChange: (paletteId: string) => {
            setActivePaletteId(paletteId);
            // Re-shuffle colors with new palette
            const newColors = getPalette(paletteId).colors;
            if (applyColorToAll) {
              const randomColor = newColors[Math.floor(Math.random() * newColors.length)];
              const updatedEvents = events.map(event => ({ ...event, color: randomColor }));
              onUpdateEvents(updatedEvents);
            } else {
              const displayTitlesSet = new Set<string>();
              events.forEach(e => displayTitlesSet.add(e.displayTitle));
              const displayTitles = Array.from(displayTitlesSet);
              const colorMap: Record<string, string> = {};
              displayTitles.forEach((title, idx) => {
                colorMap[title] = newColors[idx % newColors.length];
              });
              const updatedEvents = events.map(event => ({
                ...event,
                color: colorMap[event.displayTitle],
              }));
              onUpdateEvents(updatedEvents);
            }
          },
          onTextColorPresetChange: (preset: 'light' | 'dark') => {
            onUpdateTemplate({
              ...template,
              textColorPreset: preset,
              // Clear custom text colors when switching presets
              titleTextColor: undefined,
              subtitleTextColor: undefined,
              detailsTextColor: undefined,
              headerTextColor: undefined,
              timeColumnTextColor: undefined,
            });
          },
        }}
        fontProps={{
          template,
          onUpdateTemplate,
          availableFonts,
          fontPairs,
          selectedFontPairId,
          setSelectedFontPairId,
          applyFontPair,
          openTextColorPicker,
          setOpenTextColorPicker,
        }}
        backgroundProps={{
          template,
          onUpdateTemplate,
          setShowBackgroundGallery,
          landscapes,
          portraits,
          isBackgroundsLoading,
          backgroundsError: !!backgroundsError,
          showBackgroundColorPicker,
          setShowBackgroundColorPicker,
          backgroundFileInputRef,
        }}
        scaleProps={{
          template,
          onUpdateTemplate,
          onEnableMockup: () => {
            setSelectedComponent('calendarCard');
            setHeaderTextEditorOpen(false);
            setTimeColumnEditorOpen(false);
            setSelectedEventId(null);
            setColorPickerPosition(null);
          },
        }}
        layoutProps={{
          template,
          onUpdateTemplate,
          cachedToggles,
          setCachedToggles,
        }}
        gridProps={{
          template,
          onUpdateTemplate,
        }}
        isExporting={isExporting}
        onDownload={handleDownload}
      />

      {/* Background Gallery Popup */}
      {showBackgroundGallery && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowBackgroundGallery(false)}>
          <div
            data-component="BackgroundGallery"
            className="relative border rounded-2xl popup-themed shadow-2xl w-[95vw] max-w-4xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gallery Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-muted)]">
              <h2 className="text-lg font-semibold text-white">Background Gallery</h2>
              <button
                onClick={() => setShowBackgroundGallery(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Gallery Content */}
            <div className="flex-1 h-0 overflow-y-auto custom-scrollbar">
              <div className="p-5">
              {/* Loading state */}
              {isBackgroundsLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                  <span className="ml-3 text-gray-400 text-sm">Loading backgrounds...</span>
                </div>
              )}
              {/* Error state */}
              {backgroundsError && !isBackgroundsLoading && (
                <div className="text-red-400 text-sm py-8 text-center">
                  Failed to load backgrounds. Please try again.
                </div>
              )}
              {/* Gallery grid */}
              {!isBackgroundsLoading && !backgroundsError && (
              <div className="flex gap-6">
                {/* Landscape section */}
                <div className="w-[55%] space-y-3">
                  <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Landscape</span>
                  <div className="grid grid-cols-2 gap-2">
                    {landscapes.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => {
                          onUpdateTemplate({ ...template, backgroundImage: bg.id, customBackgroundImage: undefined });
                          setShowBackgroundGallery(false);
                        }}
                        className={`relative w-full aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.03] hover:shadow-lg ${
                          template.backgroundImage === bg.id
                            ? 'border-blue-500 ring-2 ring-blue-400/50'
                            : 'border-[var(--border-default)] hover:border-[var(--text-muted)]'
                        }`}
                      >
                        <img src={bg.thumbnailUrl} alt={bg.name} className="w-full h-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Portrait section */}
                <div className="w-[45%] space-y-3">
                  <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Portrait</span>
                  <div className="grid grid-cols-3 gap-2">
                    {portraits.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => {
                          onUpdateTemplate({ ...template, backgroundImage: bg.id, customBackgroundImage: undefined });
                          setShowBackgroundGallery(false);
                        }}
                        className={`relative w-full aspect-[9/16] rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.03] hover:shadow-lg ${
                          template.backgroundImage === bg.id
                            ? 'border-blue-500 ring-2 ring-blue-400/50'
                            : 'border-[var(--border-default)] hover:border-[var(--text-muted)]'
                        }`}
                      >
                        <img src={bg.thumbnailUrl} alt={bg.name} className="w-full h-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
