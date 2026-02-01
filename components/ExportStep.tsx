import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CalendarEvent, TemplateConfig, ThemeFamilyId, BackgroundType, SelectableExportComponent, ResizeEdge, OnboardingComponent } from '../types';
import { CalendarCanvas } from './CalendarCanvas';
import { ToggleSwitch } from './ToggleSwitch';
import { VerticalSlider } from './VerticalSlider';
import { downloadCalendarExport } from '../services/exportPipeline';
import { Download, Layout, Type, Palette, MapPin, Grid, Clock, ChevronRight, ChevronDown, ChevronUp, SlidersHorizontal, Monitor, Smartphone, Tag, Maximize2, Minimize2, Sun, Moon, ZoomIn, ZoomOut, X, TypeIcon, Camera, MousePointerClick, Image, Upload, Droplet, AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, Bold, Italic } from 'lucide-react';
import { THEME_FAMILY_LIST, THEME_FAMILIES, getThemeColors, COLOR_PALETTES, getPalette, ColorPalette } from '../themes';
import acrylicTextureUrl from '../assets/Texture_Acrylic.png';
import { useBackgrounds } from '../contexts/BackgroundsContext';
import { getDefaultLandscapeId } from '../assets/backgrounds';

// Import lockscreen mockup overlay
import lockscreenMockupImg from '../assets/backgrounds/lock-screen-mockup.png';

interface ExportStepProps {
  events: CalendarEvent[];
  template: TemplateConfig;
  onUpdateTemplate: (t: TemplateConfig) => void;
  onUpdateEvents: (events: CalendarEvent[]) => void;
  onBack: () => void;
}

export const ExportStep: React.FC<ExportStepProps> = ({ events, template, onUpdateTemplate, onUpdateEvents, onBack }) => {
  const DETECT_IF_ON_BOARDED = false;
  
  // Backgrounds from R2 storage
  const { landscapes, portraits, isLoading: isBackgroundsLoading, error: backgroundsError } = useBackgrounds();

  const supportsZoom = typeof window !== 'undefined'
    && typeof window.CSS?.supports === 'function'
    && window.CSS.supports('zoom', '1');
  const [isExporting, setIsExporting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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
  const [zoom, setZoom] = useState(1);
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

  // When theme changes to Acrylic or Glass, unify colors with random selection (if apply-to-all is enabled)
  useEffect(() => {
    const isGlassOrAcrylic = template.themeFamily === 'acrylic' || template.themeFamily === 'glass';
    if (isGlassOrAcrylic && applyColorToAll && events.length > 0) {
      // Apply uniform random color to all blocks only if apply-to-all is enabled
      const themeColorPalette = getThemeColors(template.themeFamily, template.themeVariant);
      const randomColor = themeColorPalette[Math.floor(Math.random() * themeColorPalette.length)];
      const updatedEvents = events.map(e => ({ ...e, color: randomColor }));
      onUpdateEvents(updatedEvents);
    }
  }, [template.themeFamily]);
  const [openFontDropdown, setOpenFontDropdown] = useState<'title' | 'subtitle' | 'details' | null>(null);
  const [openTextColorPicker, setOpenTextColorPicker] = useState<'title' | 'subtitle' | 'details' | null>(null);
  const [fontPairDropdownOpen, setFontPairDropdownOpen] = useState(false);

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

  // Track previous theme family to detect changes
  const prevThemeFamilyRef = useRef<ThemeFamilyId>(template.themeFamily);

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
    const defaultPaletteId = template.themeFamily === 'acrylic'
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

  // Close font dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-component="FontSelectorPanel"]')) {
        setOpenFontDropdown(null);
      }
    };

    if (openFontDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openFontDropdown]);

  // Apply theme colors when theme family or variant changes
  const applyThemeColors = (newThemeFamily: ThemeFamilyId, newVariant?: 'light' | 'dark') => {
    const variant = newVariant ?? template.themeVariant;
    // Reset to theme's default palette when switching themes
    setActivePaletteId(null);
    const newThemeColors = getThemeColors(newThemeFamily, variant);

    // For Acrylic and Glass themes with applyColorToAll, use a single random color
    const isGlassOrAcrylic = newThemeFamily === 'acrylic' || newThemeFamily === 'glass';
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

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.3));
  const handleZoomReset = () => setZoom(1);

  const handleDownload = async () => {
    setIsExporting(true);
    // Allow React to render the hidden export canvas with exportMode=true
    // Longer timeout to ensure fonts are loaded
    await new Promise(r => setTimeout(r, 300));
    // Use the hidden export canvas which has exportMode=true for proper rendering
    await downloadCalendarExport('calendar-export-hidden', 'my-beautiful-calendar');
    setIsExporting(false);
  };

  return (
    <div data-component="ExportLayout" className="flex h-full gap-6 relative">
      
      {/* PREVIEW PANEL - The dark container that holds the calendar preview */}
      <div
        data-component="PreviewPanel"
        ref={previewPanelRef}
        className="flex-1 overflow-auto relative"
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
        
        {/* ZOOM TOOLBAR - Absolute positioned, overlays on calendar */}
        {isZoomToolbarOpen && (
          <div data-component="ZoomToolbar" className="absolute top-4 right-4 z-50">
            <div className="relative flex items-center gap-2 rounded-2xl border border-slate-600/70 bg-slate-900/70 p-2 shadow-[0_12px_24px_rgba(2,6,23,0.35)] backdrop-blur-md">
              <button
                onClick={handleZoomOut}
                className="h-10 w-11 rounded-xl border border-slate-600/70 bg-slate-800/80 shadow-[inset_0_1px_2px_rgba(255,255,255,0.12)] transition-all hover:bg-slate-700/80 active:scale-95"
                title="Zoom Out"
              >
                <ZoomOut size={16} className="mx-auto text-gray-200" />
              </button>
              <button
                onClick={handleZoomReset}
                className="h-10 min-w-[72px] rounded-xl border border-slate-600/70 bg-slate-800/80 px-3 text-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.12)] transition-all hover:bg-slate-700/80 active:scale-95"
                title="Reset to 100%"
              >
                <span className="text-xs font-mono text-gray-100">
                  {Math.round(zoom * 100)}%
                </span>
              </button>
              <button
                onClick={handleZoomIn}
                className="h-10 w-11 rounded-xl border border-slate-600/70 bg-slate-800/80 shadow-[inset_0_1px_2px_rgba(255,255,255,0.12)] transition-all hover:bg-slate-700/80 active:scale-95"
                title="Zoom In"
              >
                <ZoomIn size={16} className="mx-auto text-gray-200" />
              </button>
              <button
                onClick={() => setIsZoomToolbarOpen(false)}
                className="absolute -top-2 -right-2 rounded-lg border border-slate-600/70 bg-slate-800/90 p-1.5 shadow-lg transition-all hover:bg-slate-700/90 active:scale-95"
                title="Hide zoom controls"
                aria-label="Hide zoom controls"
              >
                <Minimize2 size={12} className="text-gray-200" />
              </button>
            </div>
          </div>
        )}

        {/* PREVIEW VIEWPORT - Centers the calendar */}
        <div
          data-component="PreviewViewport"
          className="min-h-full p-6 flex items-start justify-center"
        >
          {/* ZOOM WRAPPER - Applies zoom transform */}
          <div
            data-component="ZoomWrapper"
            className="transition-all duration-200 origin-top flex items-start"
            style={
              (supportsZoom
                ? { zoom }
                : { transform: `scale(${zoom})` }) as React.CSSProperties
            }
          >
            {/* LOCKSCREEN MOCKUP WRAPPER - When enabled, shows iPhone frame border around canvas */}
            {template.lockscreenMockup ? (
              <div data-component="LockscreenMockup" className="relative">
                {/* iPhone frame border - wraps around the canvas */}
                <div
                  className="absolute pointer-events-none z-10"
                  style={{
                    // Frame extends outside the canvas by ~3% on each side
                    inset: '-3%',
                    width: '106%',
                    height: '106%',
                  }}
                >
                  <img
                    src={lockscreenMockupImg}
                    alt="iPhone Lockscreen Frame"
                    className="w-full h-full object-fill"
                  />
                </div>
                {/* EXPORT NODE */}
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
            <div className="bg-gray-900/95 backdrop-blur-xl rounded-xl border border-gray-700 shadow-2xl p-3 relative">
              {/* Arrow pointer - direction based on placement, with offset */}
              {colorPickerPosition.placement === 'top' && (
                <div
                  className="absolute -bottom-2 w-4 h-4 bg-gray-900/95 border-r border-b border-gray-700"
                  style={{ left: `calc(50% + ${colorPickerPosition.arrowOffset}px - 8px)`, transform: 'rotate(45deg)' }}
                />
              )}
              {colorPickerPosition.placement === 'bottom' && (
                <div
                  className="absolute -top-2 w-4 h-4 bg-gray-900/95 border-l border-t border-gray-700"
                  style={{ left: `calc(50% + ${colorPickerPosition.arrowOffset}px - 8px)`, transform: 'rotate(45deg)' }}
                />
              )}
              {colorPickerPosition.placement === 'right' && (
                <div
                  className="absolute -left-2 w-4 h-4 bg-gray-900/95 border-l border-b border-gray-700"
                  style={{ top: 'calc(50% - 8px)', transform: 'rotate(45deg)' }}
                />
              )}
              {colorPickerPosition.placement === 'left' && (
                <div
                  className="absolute -right-2 w-4 h-4 bg-gray-900/95 border-r border-t border-gray-700"
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
              <div className="flex items-center justify-between gap-3 px-1 py-1.5 mb-2 bg-gray-800/50 rounded-lg">
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
                  className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer flex-shrink-0 ${applyColorToAll ? 'bg-blue-600' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${applyColorToAll ? 'left-6' : 'left-1'}`} />
                </div>
              </div>

              {/* Shuffle Colors Button - Only when Apply to All is OFF */}
              {!applyColorToAll && (
                <button
                  onClick={() => shuffleColorsForEvents(template.differentiateTypes)}
                  className="w-full mb-2 px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors border border-gray-600/50 hover:border-gray-500/50"
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
                        : 'border-transparent hover:border-gray-500'
                    }`}
                    style={{
                      // For acrylic: neutral gray base + color layers
                      backgroundColor: template.themeFamily === 'acrylic' ? '#6b7280' : color,
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
                    {/* Grain texture overlay for acrylic theme */}
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
                    {/* White overlay for acrylic theme */}
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
                  <div className="mb-2 p-2 bg-gray-800/80 rounded-lg border border-gray-700/50">
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
                              : 'hover:bg-gray-700/50 border border-transparent'
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

              {/* Color Opacity Slider - Only for acrylic and glass themes */}
              {(template.themeFamily === 'acrylic' || template.themeFamily === 'glass') && (
                <div className="pt-2 border-t border-gray-700/50">
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
                      className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* No Borders Toggle - Only for Acrylic/Glass themes */}
              {(template.themeFamily === 'acrylic' || template.themeFamily === 'glass') && (
                <div className="pt-2 border-t border-gray-700/50">
                  <div className="flex items-center justify-between gap-3 px-1 py-1.5 bg-gray-800/50 rounded-lg">
                    <span className="text-xs text-gray-300 font-medium whitespace-nowrap">No Borders</span>
                    <div
                      onClick={() => onUpdateTemplate({ ...template, eventBlockNoBorders: !template.eventBlockNoBorders })}
                      className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer flex-shrink-0 ${template.eventBlockNoBorders ? 'bg-blue-600' : 'bg-gray-700'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${template.eventBlockNoBorders ? 'left-6' : 'left-1'}`} />
                    </div>
                  </div>
                </div>
              )}

              {/* Different Lab/Tutorial Colors Toggle */}
              <div className="pt-2 border-t border-gray-700/50">
                <div className="flex items-center justify-between gap-3 px-1 py-1.5 bg-gray-800/50 rounded-lg">
                  <span className="text-xs text-gray-300 font-medium whitespace-nowrap">Different Lab/Tutorial Colors</span>
                  <div
                    onClick={() => triggerColorUpdate(!template.differentiateTypes)}
                    className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer flex-shrink-0 ${template.differentiateTypes ? 'bg-blue-600' : 'bg-gray-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${template.differentiateTypes ? 'left-6' : 'left-1'}`} />
                  </div>
                </div>
              </div>

              {/* Edit Fonts Button */}
              <div className="pt-2 border-t border-gray-700/50">
                <button
                  onClick={() => {
                    setShowFontSelector(true);
                    setColorPickerPosition(null);
                    // Keep selectedEventId so font panel can show the preview
                  }}
                  className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-200 font-medium transition-colors flex items-center justify-center gap-2"
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
            <div className="bg-gray-900/95 backdrop-blur-xl rounded-xl border border-gray-700 shadow-2xl p-3 relative w-[240px]">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearComponentSelection();
                }}
                className="absolute top-2 right-2 p-1 text-gray-400 transition hover:text-gray-200"
                aria-label="Close day header editor"
              >
                <X size={14} />
              </button>
              {headerEditorPosition.placement === 'top' && (
                <div
                  className="absolute -bottom-2 w-4 h-4 bg-gray-900/95 border-r border-b border-gray-700"
                  style={{ left: `calc(50% + ${headerEditorPosition.arrowOffset}px - 8px)`, transform: 'rotate(45deg)' }}
                />
              )}
              {headerEditorPosition.placement === 'bottom' && (
                <div
                  className="absolute -top-2 w-4 h-4 bg-gray-900/95 border-l border-t border-gray-700"
                  style={{ left: `calc(50% + ${headerEditorPosition.arrowOffset}px - 8px)`, transform: 'rotate(45deg)' }}
                />
              )}
              {headerEditorPosition.placement === 'right' && (
                <div className="absolute -left-2 w-4 h-4 bg-gray-900/95 border-l border-b border-gray-700" style={{ top: 'calc(50% - 8px)', transform: 'rotate(45deg)' }} />
              )}
              {headerEditorPosition.placement === 'left' && (
                <div className="absolute -right-2 w-4 h-4 bg-gray-900/95 border-r border-t border-gray-700" style={{ top: 'calc(50% - 8px)', transform: 'rotate(45deg)' }} />
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
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-700/50">
                  <label className="text-[10px] text-gray-400 font-medium">Backdrop Blur</label>
                  <div className="space-y-1">
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={template.headerBlurAmount}
                      onChange={(e) => onUpdateTemplate({ ...template, headerBlurAmount: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                  <div className="flex bg-gray-700/50 rounded-lg p-0.5">
                    <button
                      onClick={() => onUpdateTemplate({ ...template, headerBlurMode: 'bar' })}
                      className={`flex-1 px-2 py-1.5 rounded-md text-[10px] transition-colors ${
                        template.headerBlurMode === 'bar'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Entire Row
                    </button>
                    <button
                      onClick={() => onUpdateTemplate({ ...template, headerBlurMode: 'cells' })}
                      className={`flex-1 px-2 py-1.5 rounded-md text-[10px] transition-colors ${
                        template.headerBlurMode === 'cells'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Each Cell
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => onUpdateTemplate({ ...template, headerTextColor: undefined, headerBlurAmount: 0 })}
                  className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-200 font-medium transition-colors"
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
            <div className="bg-gray-900/95 backdrop-blur-xl rounded-xl border border-gray-700 shadow-2xl p-3 relative w-[240px]">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearComponentSelection();
                }}
                className="absolute top-2 right-2 p-1 text-gray-400 transition hover:text-gray-200"
                aria-label="Close time column editor"
              >
                <X size={14} />
              </button>
              {timeEditorPosition.placement === 'top' && (
                <div className="absolute -bottom-2 w-4 h-4 bg-gray-900/95 border-r border-b border-gray-700" style={{ left: `calc(50% + ${timeEditorPosition.arrowOffset}px - 8px)`, transform: 'rotate(45deg)' }} />
              )}
              {timeEditorPosition.placement === 'bottom' && (
                <div className="absolute -top-2 w-4 h-4 bg-gray-900/95 border-l border-t border-gray-700" style={{ left: `calc(50% + ${timeEditorPosition.arrowOffset}px - 8px)`, transform: 'rotate(45deg)' }} />
              )}
              {timeEditorPosition.placement === 'right' && (
                <div className="absolute -left-2 w-4 h-4 bg-gray-900/95 border-l border-b border-gray-700" style={{ top: 'calc(50% - 8px)', transform: 'rotate(45deg)' }} />
              )}
              {timeEditorPosition.placement === 'left' && (
                <div className="absolute -right-2 w-4 h-4 bg-gray-900/95 border-r border-t border-gray-700" style={{ top: 'calc(50% - 8px)', transform: 'rotate(45deg)' }} />
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
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-700/50">
                  <label className="text-[10px] text-gray-400 font-medium">Backdrop Blur</label>
                  <div className="space-y-1">
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={template.timeColumnBlurAmount}
                      onChange={(e) => onUpdateTemplate({ ...template, timeColumnBlurAmount: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                  <div className="flex bg-gray-700/50 rounded-lg p-0.5">
                    <button
                      onClick={() => onUpdateTemplate({ ...template, timeColumnBlurMode: 'bar' })}
                      className={`flex-1 px-2 py-1.5 rounded-md text-[10px] transition-colors ${
                        template.timeColumnBlurMode === 'bar'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Entire Column
                    </button>
                    <button
                      onClick={() => onUpdateTemplate({ ...template, timeColumnBlurMode: 'cells' })}
                      className={`flex-1 px-2 py-1.5 rounded-md text-[10px] transition-colors ${
                        template.timeColumnBlurMode === 'cells'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Each Cell
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => onUpdateTemplate({ ...template, timeColumnTextColor: undefined, timeColumnBlurAmount: 0 })}
                  className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-200 font-medium transition-colors"
                >
                  Reset to Default
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {(!isZoomToolbarOpen || !isSidebarOpen) && (
        <div data-component="CanvasControls" className="flex flex-col items-center gap-3 pt-4">
          {!isZoomToolbarOpen && (
            <button
              onClick={() => setIsZoomToolbarOpen(true)}
              className="h-10 w-10 rounded-xl border border-slate-600/70 bg-slate-900/70 shadow-[0_10px_20px_rgba(2,6,23,0.35)] backdrop-blur-md transition-all hover:bg-slate-800/80 active:scale-95"
              title="Show zoom controls"
              aria-label="Show zoom controls"
            >
              <ZoomIn size={16} className="mx-auto text-gray-200" />
            </button>
          )}
          {!isSidebarOpen && (
            <button
              data-component="SidebarToggle"
              onClick={() => setIsSidebarOpen(true)}
              className="h-10 w-10 rounded-xl border border-slate-600/70 bg-transparent text-gray-200 shadow-[0_10px_20px_rgba(2,6,23,0.2)] transition-all hover:bg-slate-800/40 active:scale-95"
              title="Show sidebar"
              aria-label="Show sidebar"
            >
              <SlidersHorizontal size={18} className="mx-auto" />
            </button>
          )}
        </div>
      )}

      {/* TEXT FONT/COLORS PANEL - Shows between canvas and sidebar when editing fonts */}
      {showFontSelector && selectedEvent && (
        <div
          data-component="FontSelectorPanel"
          className="w-72 bg-gray-900 rounded-2xl border border-gray-800 flex flex-col shadow-xl z-50 max-h-[calc(100vh-2rem)] overflow-hidden"
          style={{ pointerEvents: 'auto' }}
          onClick={(e) => {
            // Close dropdowns when clicking on blank areas within the panel
            const target = e.target as HTMLElement;
            if (target.closest('[data-dropdown]') || target.closest('[data-color-picker]')) return;
            setOpenFontDropdown(null);
            setOpenTextColorPicker(null);
            setFontPairDropdownOpen(false);
          }}
        >
          {/* Panel Header */}
          <div className="p-4 border-b border-gray-800 flex justify-between items-center flex-shrink-0">
            <h3 className="font-semibold text-white text-sm">Text Font/Colors</h3>
            <button
              onClick={() => setShowFontSelector(false)}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Sample Block Preview */}
          <div className="p-4 border-b border-gray-800 flex-shrink-0">
            <div
              className="p-3 rounded-lg relative overflow-hidden flex"
              style={{
                backgroundColor: 'transparent',
                minHeight: '80px',
                justifyContent: template.textAlignHorizontal === 'center' ? 'center' : template.textAlignHorizontal === 'right' ? 'flex-end' : 'flex-start',
                alignItems: template.textAlignVertical === 'center' ? 'center' : template.textAlignVertical === 'bottom' ? 'flex-end' : 'flex-start',
              }}
            >
              {/* Background layer with opacity */}
              <div
                className="absolute inset-0 rounded-lg"
                style={{
                  backgroundColor: selectedEvent.color || '#60a5fa',
                  opacity: template.eventOpacity,
                }}
              />
              {/* Content layer - no opacity applied */}
              <div className="relative z-10" style={{ textAlign: template.textAlignHorizontal }}>
                <div
                  className="uppercase tracking-wide mb-1"
                  style={{
                    fontFamily: template.titleFont,
                    fontSize: `${template.fontScale * 0.75}rem`,
                    fontWeight: template.titleBold ? 700 : 400,
                    fontStyle: template.titleItalic ? 'italic' : 'normal',
                    color: template.titleTextColor || (template.themeFamily === 'acrylic' && template.themeVariant === 'dark' ? '#fff' : '#1f2937'),
                  }}
                >
                  {selectedEvent.displayTitle}
                </div>
                {template.showClassType && (
                  <div
                    className="opacity-90 mb-1"
                    style={{
                      fontFamily: template.subtitleFont,
                      fontSize: `${template.fontScale * 0.6}rem`,
                      fontWeight: template.subtitleBold ? 600 : 400,
                      fontStyle: template.subtitleItalic ? 'italic' : 'normal',
                      color: template.subtitleTextColor || (template.themeFamily === 'acrylic' && template.themeVariant === 'dark' ? 'rgba(255,255,255,0.9)' : '#1f2937'),
                    }}
                  >
                    {selectedEvent.classType === 'Custom' ? selectedEvent.customClassType : selectedEvent.classType}
                  </div>
                )}
                {template.showTime && (
                  <div
                    className="opacity-80"
                    style={{
                      fontFamily: template.detailsFont,
                      fontSize: `${template.fontScale * 0.6}rem`,
                      fontWeight: template.detailsBold ? 600 : 400,
                      fontStyle: template.detailsItalic ? 'italic' : 'normal',
                      color: template.detailsTextColor || (template.themeFamily === 'acrylic' && template.themeVariant === 'dark' ? 'rgba(255,255,255,0.8)' : '#374151'),
                    }}
                  >
                    {selectedEvent.startTime} - {selectedEvent.endTime}
                  </div>
                )}
                {template.showLocation && selectedEvent.location && (
                  <div
                    className={`flex items-center gap-1 opacity-75 mt-0.5 ${template.textAlignHorizontal === 'center' ? 'justify-center' : template.textAlignHorizontal === 'right' ? 'justify-end' : ''}`}
                    style={{
                      fontFamily: template.detailsFont,
                      fontSize: `${template.fontScale * 0.6}rem`,
                      fontWeight: template.detailsBold ? 600 : 400,
                      fontStyle: template.detailsItalic ? 'italic' : 'normal',
                      color: template.detailsTextColor || (template.themeFamily === 'acrylic' && template.themeVariant === 'dark' ? 'rgba(255,255,255,0.75)' : '#374151'),
                    }}
                  >
                    <MapPin size={10} className="shrink-0" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Font & Color Selectors */}
          <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">

            {/* Template Font Pairs Dropdown */}
            <div className="space-y-2" data-dropdown>
              <label className="text-xs text-gray-400 font-medium">Template Font Pairs</label>
              <div className="relative">
                <button
                  onClick={() => {
                    setFontPairDropdownOpen(!fontPairDropdownOpen);
                    setOpenFontDropdown(null);
                    setOpenTextColorPicker(null);
                  }}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-left flex items-center justify-between hover:border-gray-600 transition-colors"
                >
                  <div>
                    <span className="text-sm font-medium text-white" style={{ fontFamily: fontPairs.find(p => p.id === selectedFontPairId)?.titleFont || 'Inter' }}>
                      {fontPairs.find(p => p.id === selectedFontPairId)?.name}
                    </span>
                    <span className="text-[10px] text-gray-500 block">{fontPairs.find(p => p.id === selectedFontPairId)?.description}</span>
                  </div>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${fontPairDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {fontPairDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                    {fontPairs.map((pair) => (
                      <button
                        key={pair.id}
                        onClick={() => {
                          applyFontPair(pair.id);
                          setFontPairDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2.5 text-left transition-colors flex items-center justify-between ${
                          selectedFontPairId === pair.id
                            ? 'bg-blue-600/20 text-white'
                            : 'hover:bg-gray-700 text-gray-300'
                        }`}
                      >
                        <div>
                          <span className="text-sm font-medium" style={{ fontFamily: pair.titleFont || 'Inter' }}>
                            {pair.name}
                          </span>
                          <span className="text-[10px] text-gray-500 block">{pair.description}</span>
                        </div>
                        {selectedFontPairId === pair.id && (
                          <span className="text-blue-400 text-sm">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Text Alignment Controls */}
            <div className="space-y-3 pt-2 border-t border-gray-700/50">
              <label className="text-xs text-gray-400 font-medium">Text Alignment</label>
              <div className="flex gap-4">
                {/* Horizontal Alignment */}
                <div className="flex-1">
                  <span className="text-[10px]  block mb-1.5"></span>
                  <div className="flex bg-gray-800 rounded-lg p-0.5 border border-gray-700">
                    <button
                      onClick={() => onUpdateTemplate({ ...template, textAlignHorizontal: 'left' })}
                      className={`flex-1 p-1.5 rounded-md transition-colors ${template.textAlignHorizontal === 'left' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                      title="Align Left"
                    >
                      <AlignLeft size={14} className="mx-auto" />
                    </button>
                    <button
                      onClick={() => onUpdateTemplate({ ...template, textAlignHorizontal: 'center' })}
                      className={`flex-1 p-1.5 rounded-md transition-colors ${template.textAlignHorizontal === 'center' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                      title="Align Center"
                    >
                      <AlignCenter size={14} className="mx-auto" />
                    </button>
                    <button
                      onClick={() => onUpdateTemplate({ ...template, textAlignHorizontal: 'right' })}
                      className={`flex-1 p-1.5 rounded-md transition-colors ${template.textAlignHorizontal === 'right' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                      title="Align Right"
                    >
                      <AlignRight size={14} className="mx-auto" />
                    </button>
                  </div>
                </div>
                {/* Vertical Alignment */}
                <div className="flex-1">
                  <span className="text-[10px]  block mb-1.5"></span>
                  <div className="flex bg-gray-800 rounded-lg p-0.5 border border-gray-700">
                    <button
                      onClick={() => onUpdateTemplate({ ...template, textAlignVertical: 'top' })}
                      className={`flex-1 p-1.5 rounded-md transition-colors ${template.textAlignVertical === 'top' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                      title="Align Top"
                    >
                      <AlignVerticalJustifyStart size={14} className="mx-auto" />
                    </button>
                    <button
                      onClick={() => onUpdateTemplate({ ...template, textAlignVertical: 'center' })}
                      className={`flex-1 p-1.5 rounded-md transition-colors ${template.textAlignVertical === 'center' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                      title="Align Middle"
                    >
                      <AlignVerticalJustifyCenter size={14} className="mx-auto" />
                    </button>
                    <button
                      onClick={() => onUpdateTemplate({ ...template, textAlignVertical: 'bottom' })}
                      className={`flex-1 p-1.5 rounded-md transition-colors ${template.textAlignVertical === 'bottom' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                      title="Align Bottom"
                    >
                      <AlignVerticalJustifyEnd size={14} className="mx-auto" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Individual Font Selectors - Always visible, auto-switches to Custom when changed */}
            <div className="space-y-3 pt-2 border-t border-gray-700/50" data-dropdown>
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400 font-medium">Fonts</label>
                <button
                  onClick={() => {
                    onUpdateTemplate({
                      ...template,
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
                    });
                    setSelectedFontPairId('none');
                  }}
                  className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Reset to default
                </button>
              </div>

              {/* Title Font */}
              <div className="space-y-1">
                <span className="text-[10px] text-gray-500">Class Title</span>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <button
                      onClick={() => { setOpenFontDropdown(openFontDropdown === 'title' ? null : 'title'); setOpenTextColorPicker(null); setFontPairDropdownOpen(false); }}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 text-left flex items-center justify-between hover:border-gray-600 transition-colors"
                    >
                      <span style={{ fontFamily: template.titleFont, fontWeight: template.titleBold ? 700 : 400, fontStyle: template.titleItalic ? 'italic' : 'normal' }}>{template.titleFont}</span>
                      <ChevronDown size={14} className={`transition-transform ${openFontDropdown === 'title' ? 'rotate-180' : ''}`} />
                    </button>
                    {openFontDropdown === 'title' && (
                      <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                        {availableFonts.map((font) => (
                          <button
                            key={font}
                            onClick={() => {
                              onUpdateTemplate({ ...template, titleFont: font });
                              setSelectedFontPairId('none');
                              setOpenFontDropdown(null);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-700 transition-colors flex items-center justify-between ${template.titleFont === font ? 'bg-gray-700/50 text-white' : 'text-gray-300'}`}
                            style={{ fontFamily: font, fontWeight: 700 }}
                          >
                            {font}
                            {template.titleFont === font && <span className="text-blue-400">✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Bold/Italic buttons */}
                  <div className="flex bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => onUpdateTemplate({ ...template, titleBold: !template.titleBold })}
                      className={`px-2 py-2 transition-colors ${template.titleBold ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                      title="Bold"
                    >
                      <Bold size={14} />
                    </button>
                    <button
                      onClick={() => onUpdateTemplate({ ...template, titleItalic: !template.titleItalic })}
                      className={`px-2 py-2 transition-colors border-l border-gray-700 ${template.titleItalic ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                      title="Italic"
                    >
                      <Italic size={14} />
                    </button>
                  </div>
                  {/* Font size input with arrows */}
                  <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                    <input
                      type="number"
                      value={template.titleFontSize}
                      onChange={(e) => onUpdateTemplate({ ...template, titleFontSize: Math.max(6, Math.min(24, Number(e.target.value) || 12)) })}
                      className="w-10 px-1 py-2 bg-transparent text-center text-sm text-gray-200 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      min={6}
                      max={24}
                    />
                    <div className="flex flex-col border-l border-gray-700">
                      <button
                        onClick={() => onUpdateTemplate({ ...template, titleFontSize: Math.min(24, template.titleFontSize + 1) })}
                        className="px-1.5 py-0.5 hover:bg-gray-700 transition-colors"
                      >
                        <ChevronUp size={10} className="text-gray-400" />
                      </button>
                      <button
                        onClick={() => onUpdateTemplate({ ...template, titleFontSize: Math.max(6, template.titleFontSize - 1) })}
                        className="px-1.5 py-0.5 hover:bg-gray-700 transition-colors border-t border-gray-700"
                      >
                        <ChevronDown size={10} className="text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subtitle Font */}
              <div className="space-y-1">
                <span className="text-[10px] text-gray-500">Class Type</span>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <button
                      onClick={() => { setOpenFontDropdown(openFontDropdown === 'subtitle' ? null : 'subtitle'); setOpenTextColorPicker(null); setFontPairDropdownOpen(false); }}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 text-left flex items-center justify-between hover:border-gray-600 transition-colors"
                    >
                      <span style={{ fontFamily: template.subtitleFont, fontWeight: template.subtitleBold ? 600 : 400, fontStyle: template.subtitleItalic ? 'italic' : 'normal' }}>{template.subtitleFont}</span>
                      <ChevronDown size={14} className={`transition-transform ${openFontDropdown === 'subtitle' ? 'rotate-180' : ''}`} />
                    </button>
                    {openFontDropdown === 'subtitle' && (
                      <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                        {availableFonts.map((font) => (
                          <button
                            key={font}
                            onClick={() => {
                              onUpdateTemplate({ ...template, subtitleFont: font });
                              setSelectedFontPairId('none');
                              setOpenFontDropdown(null);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-700 transition-colors flex items-center justify-between ${template.subtitleFont === font ? 'bg-gray-700/50 text-white' : 'text-gray-300'}`}
                            style={{ fontFamily: font, fontWeight: 600 }}
                          >
                            {font}
                            {template.subtitleFont === font && <span className="text-blue-400">✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Bold/Italic buttons */}
                  <div className="flex bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => onUpdateTemplate({ ...template, subtitleBold: !template.subtitleBold })}
                      className={`px-2 py-2 transition-colors ${template.subtitleBold ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                      title="Bold"
                    >
                      <Bold size={14} />
                    </button>
                    <button
                      onClick={() => onUpdateTemplate({ ...template, subtitleItalic: !template.subtitleItalic })}
                      className={`px-2 py-2 transition-colors border-l border-gray-700 ${template.subtitleItalic ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                      title="Italic"
                    >
                      <Italic size={14} />
                    </button>
                  </div>
                  {/* Font size input with arrows */}
                  <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                    <input
                      type="number"
                      value={template.subtitleFontSize}
                      onChange={(e) => onUpdateTemplate({ ...template, subtitleFontSize: Math.max(6, Math.min(24, Number(e.target.value) || 10)) })}
                      className="w-10 px-1 py-2 bg-transparent text-center text-sm text-gray-200 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      min={6}
                      max={24}
                    />
                    <div className="flex flex-col border-l border-gray-700">
                      <button
                        onClick={() => onUpdateTemplate({ ...template, subtitleFontSize: Math.min(24, template.subtitleFontSize + 1) })}
                        className="px-1.5 py-0.5 hover:bg-gray-700 transition-colors"
                      >
                        <ChevronUp size={10} className="text-gray-400" />
                      </button>
                      <button
                        onClick={() => onUpdateTemplate({ ...template, subtitleFontSize: Math.max(6, template.subtitleFontSize - 1) })}
                        className="px-1.5 py-0.5 hover:bg-gray-700 transition-colors border-t border-gray-700"
                      >
                        <ChevronDown size={10} className="text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details Font */}
              <div className="space-y-1">
                <span className="text-[10px] text-gray-500">Location/Details</span>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <button
                      onClick={() => { setOpenFontDropdown(openFontDropdown === 'details' ? null : 'details'); setOpenTextColorPicker(null); setFontPairDropdownOpen(false); }}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 text-left flex items-center justify-between hover:border-gray-600 transition-colors"
                    >
                      <span style={{ fontFamily: template.detailsFont, fontWeight: template.detailsBold ? 600 : 400, fontStyle: template.detailsItalic ? 'italic' : 'normal' }}>{template.detailsFont}</span>
                      <ChevronDown size={14} className={`transition-transform ${openFontDropdown === 'details' ? 'rotate-180' : ''}`} />
                    </button>
                    {openFontDropdown === 'details' && (
                      <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                        {availableFonts.map((font) => (
                          <button
                            key={font}
                            onClick={() => {
                              onUpdateTemplate({ ...template, detailsFont: font });
                              setSelectedFontPairId('none');
                              setOpenFontDropdown(null);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-700 transition-colors flex items-center justify-between ${template.detailsFont === font ? 'bg-gray-700/50 text-white' : 'text-gray-300'}`}
                            style={{ fontFamily: font, fontWeight: 400 }}
                          >
                            {font}
                            {template.detailsFont === font && <span className="text-blue-400">✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Bold/Italic buttons */}
                  <div className="flex bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => onUpdateTemplate({ ...template, detailsBold: !template.detailsBold })}
                      className={`px-2 py-2 transition-colors ${template.detailsBold ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                      title="Bold"
                    >
                      <Bold size={14} />
                    </button>
                    <button
                      onClick={() => onUpdateTemplate({ ...template, detailsItalic: !template.detailsItalic })}
                      className={`px-2 py-2 transition-colors border-l border-gray-700 ${template.detailsItalic ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                      title="Italic"
                    >
                      <Italic size={14} />
                    </button>
                  </div>
                  {/* Font size input with arrows */}
                  <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                    <input
                      type="number"
                      value={template.detailsFontSize}
                      onChange={(e) => onUpdateTemplate({ ...template, detailsFontSize: Math.max(6, Math.min(24, Number(e.target.value) || 10)) })}
                      className="w-10 px-1 py-2 bg-transparent text-center text-sm text-gray-200 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      min={6}
                      max={24}
                    />
                    <div className="flex flex-col border-l border-gray-700">
                      <button
                        onClick={() => onUpdateTemplate({ ...template, detailsFontSize: Math.min(24, template.detailsFontSize + 1) })}
                        className="px-1.5 py-0.5 hover:bg-gray-700 transition-colors"
                      >
                        <ChevronUp size={10} className="text-gray-400" />
                      </button>
                      <button
                        onClick={() => onUpdateTemplate({ ...template, detailsFontSize: Math.max(6, template.detailsFontSize - 1) })}
                        className="px-1.5 py-0.5 hover:bg-gray-700 transition-colors border-t border-gray-700"
                      >
                        <ChevronDown size={10} className="text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Text Colors Section */}
            <div className="space-y-2 pt-2 border-t border-gray-700/50">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400 font-medium">Text Colors</label>
                <button
                  onClick={() => {
                    onUpdateTemplate({
                      ...template,
                      titleTextColor: undefined,
                      subtitleTextColor: undefined,
                      detailsTextColor: undefined,
                    });
                  }}
                  className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Reset to default
                </button>
              </div>

              {/* Color buttons row */}
              <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-2" data-color-picker>
                {/* Title color */}
                <div className="flex-1 flex flex-col items-center gap-1 relative">
                  <span className="text-[9px] text-gray-400 whitespace-nowrap">Class Title</span>
                  <button
                    onClick={() => {
                      setOpenTextColorPicker(openTextColorPicker === 'title' ? null : 'title');
                      setOpenFontDropdown(null);
                      setFontPairDropdownOpen(false);
                    }}
                    className={`w-7 h-7 rounded-md border-2 transition-colors shadow-sm ${openTextColorPicker === 'title' ? 'border-blue-400' : 'border-gray-500 hover:border-gray-400'}`}
                    style={{ backgroundColor: template.titleTextColor || (template.themeVariant === 'dark' ? '#ffffff' : '#1f2937') }}
                  />
                </div>

                {/* Subtitle color */}
                <div className="flex-1 flex flex-col items-center gap-1 relative">
                  <span className="text-[9px] text-gray-400 whitespace-nowrap">Class Type</span>
                  <button
                    onClick={() => {
                      setOpenTextColorPicker(openTextColorPicker === 'subtitle' ? null : 'subtitle');
                      setOpenFontDropdown(null);
                      setFontPairDropdownOpen(false);
                    }}
                    className={`w-7 h-7 rounded-md border-2 transition-colors shadow-sm ${openTextColorPicker === 'subtitle' ? 'border-blue-400' : 'border-gray-500 hover:border-gray-400'}`}
                    style={{ backgroundColor: template.subtitleTextColor || (template.themeVariant === 'dark' ? '#e5e7eb' : '#1f2937') }}
                  />
                </div>

                {/* Details color */}
                <div className="flex-1 flex flex-col items-center gap-1 relative">
                  <span className="text-[9px] text-gray-400 whitespace-nowrap">Location/Details</span>
                  <button
                    onClick={() => {
                      setOpenTextColorPicker(openTextColorPicker === 'details' ? null : 'details');
                      setOpenFontDropdown(null);
                      setFontPairDropdownOpen(false);
                    }}
                    className={`w-7 h-7 rounded-md border-2 transition-colors shadow-sm ${openTextColorPicker === 'details' ? 'border-blue-400' : 'border-gray-500 hover:border-gray-400'}`}
                    style={{ backgroundColor: template.detailsTextColor || (template.themeVariant === 'dark' ? '#d1d5db' : '#374151') }}
                  />
                </div>
              </div>

              {/* Color picker callout - appears below the buttons */}
              {openTextColorPicker && (
                <div className="relative" data-color-picker>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3">
                    {/* Arrow pointing up */}
                    <div
                      className="absolute -top-2 w-4 h-4 bg-gray-800 border-r border-b border-gray-700 rotate-45"
                      style={{
                        left: openTextColorPicker === 'title' ? '16%' : openTextColorPicker === 'subtitle' ? '50%' : '84%',
                        transform: 'translateX(-50%) rotate(45deg)'
                      }}
                    />
                    <div className="text-[10px] text-gray-400 mb-2">
                      {openTextColorPicker === 'title' ? 'Class Title Color' : openTextColorPicker === 'subtitle' ? 'Class Type Color' : 'Location/Details Color'}
                    </div>
                    <div className="grid grid-cols-8 gap-1.5">
                      {['#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563', '#374151', '#1f2937', '#111827', '#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'].map((color) => {
                        const currentColor = openTextColorPicker === 'title' ? template.titleTextColor : openTextColorPicker === 'subtitle' ? template.subtitleTextColor : template.detailsTextColor;
                        const isSelected = currentColor === color;
                        return (
                          <button
                            key={color}
                            onClick={() => {
                              if (openTextColorPicker === 'title') {
                                onUpdateTemplate({ ...template, titleTextColor: color });
                              } else if (openTextColorPicker === 'subtitle') {
                                onUpdateTemplate({ ...template, subtitleTextColor: color });
                              } else {
                                onUpdateTemplate({ ...template, detailsTextColor: color });
                              }
                              setOpenTextColorPicker(null);
                            }}
                            className={`w-5 h-5 rounded border-2 transition-all hover:scale-110 ${isSelected ? 'border-blue-400 scale-110 ring-2 ring-blue-400/50' : 'border-gray-600 hover:border-gray-500'}`}
                            style={{ backgroundColor: color }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Done Button */}
            <button
              onClick={() => setShowFontSelector(false)}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors flex-shrink-0"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* HEADER/TIME COLUMN EDITORS - Inline callouts rendered in preview */}
      {/* SETTINGS SIDEBAR - Right panel with all style controls */}
      <div 
        data-component="SettingsSidebar"
        className={`
         bg-gray-900 rounded-2xl border border-gray-800 flex flex-col shadow-xl transition-all duration-300
         ${isSidebarOpen ? 'w-80 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-10 overflow-hidden border-0 p-0'}
      `}>
        {/* SIDEBAR HEADER - Navigation and title */}
        <div data-component="SidebarHeader" className="p-4 border-b border-gray-800 flex justify-between items-center whitespace-nowrap">
          <button onClick={onBack} className="text-gray-400 hover:text-white text-sm">← Back</button>
          <div className="flex items-center gap-2">
             <h3 className="font-semibold text-white text-lg">Visual Style</h3>
             <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-white">
               <ChevronRight size={18} />
             </button>
          </div>
        </div>

        {/* SIDEBAR CONTENT - Scrollable settings area */}
        <div data-component="SidebarContent" className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
          
          {/* Theme Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-300 font-medium">
              <Palette size={16} /> Theme
            </div>
            
            {/* Theme Family Dropdown & Light/Dark Toggle on Same Line */}
            <div className="flex gap-2">
              <select
                value={template.themeFamily}
                onChange={(e) => {
                  const newFamily = e.target.value as ThemeFamilyId;
                  const isGlassOrAcrylicNew = newFamily === 'acrylic' || newFamily === 'glass';
                  const newFamilyObj = THEME_FAMILIES[newFamily];
                  // Set default sub-variant for families with extended variants
                  const defaultSubVariant = newFamilyObj?.extendedVariants?.[0];
                  const newVariant = defaultSubVariant?.baseVariant ?? template.themeVariant;
                  onUpdateTemplate({
                    ...template,
                    themeFamily: newFamily,
                    theme: `${newFamily}-${newVariant}` as any,
                    themeVariant: newVariant,
                    themeSubVariant: defaultSubVariant?.id,
                    // Set image background for Acrylic/Glass, none for others
                    backgroundType: isGlassOrAcrylicNew ? 'image' : 'none',
                    // Set a default image if switching to Acrylic/Glass and no image selected
                    backgroundImage: isGlassOrAcrylicNew && !template.backgroundImage ? (getDefaultLandscapeId() || 'l1') : template.backgroundImage,
                    eventOpacity: 1,
                  });
                  // Apply theme colors when switching themes (except default)
                  if (newFamily !== prevThemeFamilyRef.current) {
                    applyThemeColors(newFamily);
                    prevThemeFamilyRef.current = newFamily;
                  }
                }}
                className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all cursor-pointer hover:bg-gray-750"
              >
                {THEME_FAMILY_LIST.map((family) => (
                  <option key={family.id} value={family.id}>
                    {family.name}
                  </option>
                ))}
              </select>

              {/* Variant selector: dropdown for extended variants, toggle for light/dark */}
              {(() => {
                const family = THEME_FAMILIES[template.themeFamily];
                if (family?.extendedVariants) {
                  return (
                    <select
                      value={template.themeSubVariant || ''}
                      onChange={(e) => {
                        const subVariantId = e.target.value;
                        const variant = family.extendedVariants!.find(v => v.id === subVariantId);
                        if (variant) {
                          onUpdateTemplate({
                            ...template,
                            themeSubVariant: subVariantId,
                            themeVariant: variant.baseVariant,
                            theme: `${template.themeFamily}-${variant.baseVariant}` as any,
                            eventOpacity: 1,
                          });
                          applyThemeColors(template.themeFamily as ThemeFamilyId, variant.baseVariant);
                        }
                      }}
                      className="w-32 px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all cursor-pointer hover:bg-gray-750"
                    >
                      {family.extendedVariants.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  );
                }
                return (
                  <button
                    onClick={() => {
                      const newVariant = template.themeVariant === 'light' ? 'dark' : 'light';
                      onUpdateTemplate({
                        ...template,
                        themeVariant: newVariant,
                        theme: `${template.themeFamily}-${newVariant}` as any,
                        eventOpacity: 1,
                      });
                      applyThemeColors(template.themeFamily, newVariant);
                    }}
                    className="px-4 py-2.5 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 border border-gray-600 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg active:scale-[0.98] flex items-center gap-2 group"
                  >
                    {template.themeVariant === 'light' ? (
                      <>
                        <Sun size={16} className="text-yellow-400" />
                        <span className="text-gray-200">Light</span>
                      </>
                    ) : (
                      <>
                        <Moon size={16} className="text-blue-400" />
                        <span className="text-gray-200">Dark</span>
                      </>
                    )}
                    <span className="text-lg group-hover:scale-110 transition-transform">⇄</span>
                  </button>
                );
              })()}
            </div>
          </div>

          {/* Background Section - Collapsible */}
          <div className={`space-y-3 p-3 rounded-xl border transition-all duration-300 ${isBackgroundExpanded ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-800/10 border-gray-800/30'}`}>
            <button
              onClick={() => setIsBackgroundExpanded(!isBackgroundExpanded)}
              className="flex items-center justify-between w-full text-sm text-gray-300 font-medium hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <Image size={16} /> Background
              </div>
              {isBackgroundExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-out ${isBackgroundExpanded ? 'max-h-[900px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="space-y-4 pt-2">
                {/* Background Type Toggle */}
                <div className="space-y-2">
                  <div className="flex bg-gray-700/50 rounded-lg p-0.5">
                    <button
                      onClick={() => onUpdateTemplate({ ...template, backgroundType: 'none' })}
                      className={`flex-1 px-2 py-2 rounded-md text-xs transition-colors ${template.backgroundType === 'none' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      None
                    </button>
                    <button
                      onClick={() => onUpdateTemplate({ ...template, backgroundType: 'image' })}
                      className={`flex-1 px-2 py-2 rounded-md text-xs transition-colors ${template.backgroundType === 'image' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      Image
                    </button>
                    <button
                      onClick={() => {
                        onUpdateTemplate({ ...template, backgroundType: 'color' });
                        setShowBackgroundColorPicker(true);
                      }}
                      className={`flex-1 px-2 py-2 rounded-md text-xs transition-colors ${template.backgroundType === 'color' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      Color
                    </button>
                  </div>
                </div>

                {/* Image Gallery - only shown when type is 'image' */}
                {template.backgroundType === 'image' && (
                  <div className="space-y-2">
                    {/* Loading state */}
                    {isBackgroundsLoading && (
                      <div className="flex items-center justify-center py-6">
                        <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                        <span className="ml-2 text-gray-400 text-xs">Loading backgrounds...</span>
                      </div>
                    )}
                    {/* Error state */}
                    {backgroundsError && !isBackgroundsLoading && (
                      <div className="text-red-400 text-xs py-4 text-center">
                        Failed to load backgrounds
                      </div>
                    )}
                    {/* Side-by-side: 1 column landscape, 2 columns portrait */}
                    {!isBackgroundsLoading && !backgroundsError && (
                    <div className="flex gap-3 max-h-45 overflow-y-auto custom-scrollbar pr-1">
                      {/* Landscape column - single column, wider */}
                      <div className="w-[45%] flex-shrink-0 space-y-1.5">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wide">Landscape</span>
                        <div className="space-y-1.5">
                          {landscapes.map((bg) => (
                            <button
                              key={bg.id}
                              onClick={() => onUpdateTemplate({
                                ...template,
                                backgroundImage: bg.id,
                                customBackgroundImage: undefined
                              })}
                              className={`relative w-full aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.02] ${
                                template.backgroundImage === bg.id && !template.customBackgroundImage
                                  ? 'border-blue-500 ring-2 ring-blue-400/50'
                                  : 'border-gray-600 hover:border-gray-500'
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
                      </div>
                      {/* Portrait columns - 2-column grid, narrower section */}
                      <div className="w-[46%] flex-shrink-0 space-y-1.5">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wide">Portrait</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {portraits.map((bg) => (
                            <button
                              key={bg.id}
                              onClick={() => onUpdateTemplate({
                                ...template,
                                backgroundImage: bg.id,
                                customBackgroundImage: undefined
                              })}
                              className={`relative w-full aspect-[9/16] rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.02] ${
                                template.backgroundImage === bg.id && !template.customBackgroundImage
                                  ? 'border-blue-500 ring-2 ring-blue-400/50'
                                  : 'border-gray-600 hover:border-gray-500'
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
                      </div>
                    </div>
                    )}
                    {/* Custom uploaded image thumbnail */}
                    {template.customBackgroundImage && (
                      <div className="pt-2 border-t border-gray-700/50">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wide mb-1.5 block">Custom Upload</span>
                        <button
                          onClick={() => onUpdateTemplate({
                            ...template,
                            backgroundImage: 'custom'
                          })}
                          className={`relative w-20 aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                            template.backgroundImage === 'custom'
                              ? 'border-blue-500 ring-2 ring-blue-400/50'
                              : 'border-gray-600 hover:border-gray-500'
                          }`}
                        >
                          <img
                            src={template.customBackgroundImage}
                            alt="Custom"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      </div>
                    )}

                    {/* Upload Button */}
                    <input
                      ref={backgroundFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const dataUrl = event.target?.result as string;
                            onUpdateTemplate({
                              ...template,
                              customBackgroundImage: dataUrl,
                              backgroundImage: 'custom'
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowBackgroundGallery(true)}
                        className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-200 font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Image size={14} /> Browse Gallery
                      </button>
                      <button
                        onClick={() => backgroundFileInputRef.current?.click()}
                        className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-200 font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Upload size={14} /> Upload Custom
                      </button>
                    </div>
                  </div>
                )}

                {/* Color Picker - only shown when type is 'color' */}
                {template.backgroundType === 'color' && (
                  <div className="space-y-2">
                    <span className="text-xs text-gray-400">Background Color</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-10 h-10 rounded-lg border-2 border-gray-600 cursor-pointer relative overflow-hidden"
                        style={{ backgroundColor: template.backgroundColor || '#1f2937' }}
                        onClick={() => setShowBackgroundColorPicker(!showBackgroundColorPicker)}
                      />
                      <input
                        type="text"
                        value={template.backgroundColor || '#1f2937'}
                        onChange={(e) => onUpdateTemplate({ ...template, backgroundColor: e.target.value })}
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 font-mono"
                        placeholder="#1f2937"
                      />
                    </div>
                    {showBackgroundColorPicker && (
                      <div className="grid grid-cols-8 gap-1.5 p-2 bg-gray-800/50 rounded-lg">
                        {[
                          '#1f2937', '#111827', '#0f172a', '#000000',
                          '#374151', '#4b5563', '#6b7280', '#9ca3af',
                          '#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db',
                          '#ef4444', '#f97316', '#eab308', '#22c55e',
                          '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
                          '#14b8a6', '#06b6d4', '#0ea5e9', '#f43f5e',
                        ].map((color) => (
                          <button
                            key={color}
                            onClick={() => {
                              onUpdateTemplate({ ...template, backgroundColor: color });
                              setShowBackgroundColorPicker(false);
                            }}
                            className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 ${
                              template.backgroundColor === color
                                ? 'border-white scale-110'
                                : 'border-transparent hover:border-gray-500'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Blur & Reduce Highlights Sliders - only shown when image is selected */}
                {template.backgroundType === 'image' && (template.backgroundImage || template.customBackgroundImage) && (
                  <div className="space-y-3 pt-2 border-t border-gray-700/50">
                    {/* Blur Slider */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 flex items-center gap-1.5">
                          <Droplet size={12} /> Blur
                        </span>
                        <span className="text-xs text-gray-500">{template.backgroundBlur}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        step="1"
                        value={template.backgroundBlur}
                        onChange={(e) => onUpdateTemplate({ ...template, backgroundBlur: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>

                    {/* Reduce Highlights Slider */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 flex items-center gap-1.5">
                          <Moon size={12} /> Reduce Highlights
                        </span>
                        <span className="text-xs text-gray-500">{template.backgroundOverlay}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="80"
                        step="5"
                        value={template.backgroundOverlay}
                        onChange={(e) => onUpdateTemplate({ ...template, backgroundOverlay: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* Scale/Ratio Section - Collapsible */}
          <div className={`space-y-3 p-3 rounded-xl border transition-all duration-300 ${isScaleRatioExpanded ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-800/10 border-gray-800/30'}`}>
            <button
              onClick={() => setIsScaleRatioExpanded(!isScaleRatioExpanded)}
              className="flex items-center justify-between w-full text-sm text-gray-300 font-medium hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <Maximize2 size={16} /> Content Scale / Ratio
              </div>
              {isScaleRatioExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-out ${isScaleRatioExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="space-y-4 pt-2">
                {/* Background Aspect Ratio */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Background Ratio</span>
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
                      className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <span className="text-xs text-gray-500">9:19.5</span>
                  </div>
                  {/* Quick Presets */}
                  <div className="flex bg-gray-700/50 rounded-lg p-0.5">
                    <button
                      onClick={() => onUpdateTemplate({ ...template, aspectRatio: 0 })}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs transition-colors ${template.aspectRatio <= 0.5 ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      <Monitor size={14} /> Desktop
                    </button>
                    <button
                      onClick={() => onUpdateTemplate({ ...template, aspectRatio: 1 })}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs transition-colors ${template.aspectRatio > 0.5 ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      <Smartphone size={14} /> Mobile
                    </button>
                  </div>
                </div>

                {/* Lockscreen Mockup */}
                <div className="space-y-2 pt-3 border-t border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                      <Smartphone size={12} /> Iphone Lockscreen Mockup
                    </span>
                    <div
                      onClick={() => {
                        const newMockupState = !template.lockscreenMockup;
                        onUpdateTemplate({
                          ...template,
                          lockscreenMockup: newMockupState,
                          // When enabling mockup, set portrait background ratio
                          ...(newMockupState && {
                            aspectRatio: 1,
                          })
                        });
                        if (newMockupState) {
                          setSelectedComponent('calendarCard');
                          setHeaderTextEditorOpen(false);
                          setTimeColumnEditorOpen(false);
                          setSelectedEventId(null);
                          setColorPickerPosition(null);
                        }
                      }}
                      className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer flex-shrink-0 ${template.lockscreenMockup ? 'bg-blue-600' : 'bg-gray-700'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${template.lockscreenMockup ? 'left-6' : 'left-1'}`} />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500">Preview with iPhone lock screen frame. </p>
                </div>
              </div>
            </div>
          </div>

          {/* Layout Options - Collapsible */}
          <div className={`space-y-3 p-3 rounded-xl border transition-all duration-300 ${isContentExpanded ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-800/10 border-gray-800/30'}`}>
            <button
              onClick={() => setIsContentExpanded(!isContentExpanded)}
              className="flex items-center justify-between w-full text-sm text-gray-300 font-medium hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <Layout size={16} /> Content Selection
              </div>
              {isContentExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-out ${isContentExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="space-y-1 pt-2">
                {/* Compact View at top - toggles off other options when enabled */}
                <div className="p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-gray-600 transition-colors">
                  <ToggleSwitch
                    enabled={template.compact}
                    onToggle={() => {
                      const newCompact = !template.compact;
                      if (newCompact) {
                        // Cache current toggle states before enabling compact
                        setCachedToggles({
                          showClassType: template.showClassType,
                          showTime: template.showTime,
                          showLocation: template.showLocation,
                          showNotes: template.showNotes
                        });
                        // Disable all content options
                        onUpdateTemplate({
                          ...template,
                          compact: true,
                          showClassType: false,
                          showTime: false,
                          showLocation: false,
                          showNotes: false
                        });
                      } else {
                        // Restore cached toggle states
                        if (cachedToggles) {
                          onUpdateTemplate({
                            ...template,
                            compact: false,
                            ...cachedToggles
                          });
                        } else {
                          onUpdateTemplate({ ...template, compact: false });
                        }
                      }
                    }}
                    label={<span className="text-sm text-gray-200 font-medium">Compact View</span>}
                  />
                </div>

                {/* Other content options - disabled when compact is on */}
                <div className={`space-y-1 ${template.compact ? 'opacity-40 pointer-events-none' : ''}`}>
                  <div className="p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-transparent hover:border-gray-700 transition-colors">
                    <ToggleSwitch
                      enabled={template.showClassType}
                      onToggle={() => onUpdateTemplate({ ...template, showClassType: !template.showClassType })}
                      label={<span className="flex items-center gap-3 text-sm text-gray-300"><Tag size={14} /> Show Class Type</span>}
                      disabled={template.compact}
                    />
                  </div>

                  <div className="p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-transparent hover:border-gray-700 transition-colors">
                    <ToggleSwitch
                      enabled={template.showTime}
                      onToggle={() => onUpdateTemplate({ ...template, showTime: !template.showTime })}
                      label={<span className="flex items-center gap-3 text-sm text-gray-300"><Clock size={14} /> Show Time</span>}
                      disabled={template.compact}
                    />
                  </div>

                  <div className="p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-transparent hover:border-gray-700 transition-colors">
                    <ToggleSwitch
                      enabled={template.showLocation}
                      onToggle={() => onUpdateTemplate({ ...template, showLocation: !template.showLocation })}
                      label={<span className="flex items-center gap-3 text-sm text-gray-300"><MapPin size={14} /> Show Location</span>}
                      disabled={template.compact}
                    />
                  </div>

                  <div className="p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-transparent hover:border-gray-700 transition-colors">
                    <ToggleSwitch
                      enabled={template.showNotes}
                      onToggle={() => onUpdateTemplate({ ...template, showNotes: !template.showNotes })}
                      label={<span className="flex items-center gap-3 text-sm text-gray-300"><Type size={14} /> Show Notes</span>}
                      disabled={template.compact}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Section */}
          <div className={`space-y-3 p-3 rounded-xl border transition-all duration-300 ${template.showGrid ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-800/10 border-gray-800/30'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-300 font-medium">
                <Grid size={16} /> Grid
              </div>
              <div
                onClick={() => onUpdateTemplate({ ...template, showGrid: !template.showGrid })}
                className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer flex-shrink-0 ${template.showGrid ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${template.showGrid ? 'left-6' : 'left-1'}`} />
              </div>
            </div>
            {/* Grid Line Style Toggle - only shown when grid is visible */}
            <div className={`overflow-hidden transition-all duration-300 ease-out ${template.showGrid ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="flex bg-gray-700/50 rounded-lg p-0.5">
                <button
                  onClick={() => onUpdateTemplate({ ...template, gridLineStyle: 'bright' })}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs transition-colors ${template.gridLineStyle === 'bright' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <Sun size={14} /> Bright
                </button>
                <button
                  onClick={() => onUpdateTemplate({ ...template, gridLineStyle: 'dark' })}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs transition-colors ${template.gridLineStyle === 'dark' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <Moon size={14} /> Dark
                </button>
              </div>
            </div>
          </div>

          {/* Download Button - Standalone */}
          <div className="pt-2">
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {isExporting ? 'Exporting...' : <><Download size={18} /> Download</>}
            </button>
          </div>

        </div>
      </div>

      {/* Background Gallery Popup */}
      {showBackgroundGallery && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowBackgroundGallery(false)}>
          <div
            className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-[95vw] max-w-4xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gallery Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Background Gallery</h2>
              <button
                onClick={() => setShowBackgroundGallery(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Gallery Content */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
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
                  <div className="grid grid-cols-3 gap-2">
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
                            : 'border-gray-700 hover:border-gray-500'
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
                            : 'border-gray-700 hover:border-gray-500'
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
      )}

    </div>
  );
};
