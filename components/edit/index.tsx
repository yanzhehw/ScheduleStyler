import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { CalendarEvent, TemplateConfig, Category, ClassType } from '../../types';
import { CalendarCanvas } from '../CalendarCanvas';
import { ToggleSwitch } from '../small_utility/ToggleSwitch';
import { GuidanceNote } from '../small_utility/GuidanceNote';
import { AlertBox } from '../small_utility/AlertBox';
import { Trash2, ListPlus, Upload, Clock, MapPin, Type, Layout, Monitor, Smartphone, Tag, ChevronDown, ChevronRight, Maximize2, X, Plus, RotateCcw, Save, CirclePlus, ZoomIn, ZoomOut, Minimize2, Edit3 } from 'lucide-react';
import { GlassRadioGroup } from '../ui/glass-radio-group';
import { ThemedDropdown } from '../ui/themed-dropdown';
import { getThemeColors } from '../../themes';
import { useMobileDetect } from '../../hooks/useMobileDetect';
import { MobileFooterToolbar, MobileTab } from '../small_utility/MobileFooterToolbar';
import { EditSidebar, AddCourseDraft, AddCourseErrors, CachedToggles } from './sidebar';
import { ConfirmModal } from '../popups';
import { MobileEditEventPanel, MobileEditLayout } from './mobile';

interface EditStepProps {
  events: CalendarEvent[];
  categories: Category[];
  template: TemplateConfig;
  onUpdateEvents: (events: CalendarEvent[]) => void;
  onUpdateTemplate: (template: TemplateConfig) => void;
  onNext: () => void;
  onReupload: () => void;
}

const CLASS_TYPES: ClassType[] = ['Lecture', 'Tutorial', 'Lab', 'Seminar', 'Unknown', 'Custom'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const roundToNearestHalfHour = (timeInHours: number): number => {
  return Math.round(timeInHours * 2) / 2;
};

const parseTimeToHours = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours + (minutes || 0) / 60;
};

const getAlignedRange = (startTime: string, endTime: string) => {
  const startVal = parseTimeToHours(startTime);
  const endVal = parseTimeToHours(endTime);
  const alignedStart = roundToNearestHalfHour(startVal);
  const alignedEnd = roundToNearestHalfHour(endVal);
  const duration = Math.max(0.5, alignedEnd - alignedStart);
  return { start: alignedStart, end: alignedStart + duration };
};

const getOverlappingEventIds = (events: CalendarEvent[]): Set<string> => {
  const overlaps = new Set<string>();
  const byDay = new Map<number, Array<{ id: string; start: number; end: number }>>();

  events.forEach((event) => {
    const range = getAlignedRange(event.startTime, event.endTime);
    const list = byDay.get(event.dayIndex) ?? [];
    list.push({ id: event.id, start: range.start, end: range.end });
    byDay.set(event.dayIndex, list);
  });

  byDay.forEach((ranges) => {
    ranges.sort((a, b) => (a.start - b.start) || (a.end - b.end));
    const active: Array<{ id: string; start: number; end: number }> = [];
    ranges.forEach((range) => {
      for (let i = active.length - 1; i >= 0; i -= 1) {
        if (active[i].end <= range.start) {
          active.splice(i, 1);
        }
      }
      if (active.length > 0) {
        overlaps.add(range.id);
        active.forEach((existing) => overlaps.add(existing.id));
      }
      active.push(range);
    });
  });

  return overlaps;
};

const doesEventOverlap = (
  eventId: string,
  candidate: { startTime: string; endTime: string; dayIndex: number },
  events: CalendarEvent[]
): boolean => {
  const candidateRange = getAlignedRange(candidate.startTime, candidate.endTime);
  return events.some((event) => {
    if (event.id === eventId || event.dayIndex !== candidate.dayIndex) return false;
    const range = getAlignedRange(event.startTime, event.endTime);
    return candidateRange.start < range.end && candidateRange.end > range.start;
  });
};

export const EditStep: React.FC<EditStepProps> = ({
  events,
  categories,
  template,
  onUpdateEvents,
  onUpdateTemplate,
  onNext,
  onReupload
}) => {
  // Lazy-load template fonts (11 families) on first visit to /edit
  useEffect(() => {
    const id = 'template-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=JetBrains+Mono:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Nunito:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Fira+Code:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Lora:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isContentDisplayExpanded, setIsContentDisplayExpanded] = useState(true);
  const [showGuidanceNote, setShowGuidanceNote] = useState(true);
  const [showOverlapWarning, setShowOverlapWarning] = useState(false);
  const [newEventSlot, setNewEventSlot] = useState<{
    dayIndex: number;
    startTime: string;
    endTime: string;
  } | null>(null);
  const [newEventDraft, setNewEventDraft] = useState<{
    title: string;
    classType: ClassType;
    customClassType: string;
    location: string;
  } | null>(null);

  // Cache for toggle states before compact mode
  const [cachedToggles, setCachedToggles] = useState<{
    showClassType: boolean;
    showTime: boolean;
    showLocation: boolean;
    showNotes: boolean;
  } | null>(null);

  // Time validation error message
  const [timeError, setTimeError] = useState<string | null>(null);

  // Add Course section state
  const [isAddCourseExpanded, setIsAddCourseExpanded] = useState(true);
  const [addCourseDraft, setAddCourseDraft] = useState({
    courseCode: '',
    classType: 'Lecture' as ClassType,
    customClassType: '',
    location: '',
    selectedDays: [false, false, false, false, false] as boolean[], // Mon-Fri
    startTime: '09:00',
    endTime: '10:00',
  });

  // Pending time changes for selected event (requires save)
  const [pendingTimeChanges, setPendingTimeChanges] = useState<{
    startTime: string;
    endTime: string;
  } | null>(null);

  // Add Course validation errors (shown when Add is clicked)
  const [addCourseErrors, setAddCourseErrors] = useState<{
    courseCode?: string;
    days?: string;
    time?: string;
  }>({});

  // Onboarding state for edit view
  const [showEditOnboarding, setShowEditOnboarding] = useState(true);
  const [onboardingEventId, setOnboardingEventId] = useState<string | null>(null);

  // Re-upload confirmation state
  const [showReuploadConfirm, setShowReuploadConfirm] = useState(false);

  // Zoom state for edit view
  const [zoom, setZoom] = useState(1);
  const [isZoomReady, setIsZoomReady] = useState(false); // Prevents initial zoom glitch
  const [isZoomToolbarOpen, setIsZoomToolbarOpen] = useState(true);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600, minCardWidth: 800, minCardHeight: 600 });
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);
  const hasAppliedInitialZoom = useRef(false);

  // Mobile detection and active tab state
  const isMobile = useMobileDetect();
  const [mobileActiveTab, setMobileActiveTab] = useState<string | null>(null);

  // Auto-open edit panel when an event is selected on mobile
  useEffect(() => {
    if (isMobile && selectedEventId) {
      setMobileActiveTab('edit-event');
    } else if (isMobile && !selectedEventId && mobileActiveTab === 'edit-event') {
      setMobileActiveTab(null);
    }
  }, [isMobile, selectedEventId]);

  // Check if browser supports CSS zoom
  const supportsZoom = typeof window !== 'undefined'
    && typeof window.CSS?.supports === 'function'
    && window.CSS.supports('zoom', '1');

  // Calculate auto-fit zoom to contain the full calendar
  const calculateAutoFitZoom = useCallback(() => {
    if (!canvasContainerRef.current) {
      return 1;
    }
    const container = canvasContainerRef.current;
    const containerWidth = container.clientWidth - 48; // padding
    const containerHeight = container.clientHeight - 48;

    const scaleX = containerWidth / canvasDimensions.width;
    const scaleY = containerHeight / canvasDimensions.height;

    const result = Math.min(Math.max(Math.min(scaleX, scaleY), 0.3), 1.5);
    return result;
  }, [canvasDimensions.width, canvasDimensions.height]);

  // Calculate optimal aspect ratio based on container dimensions to best fit
  const calculateOptimalAspectRatio = useCallback(() => {
    if (!canvasContainerRef.current) return null;
    const container = canvasContainerRef.current;
    const containerWidth = container.clientWidth - 48; // padding
    const containerHeight = container.clientHeight - 48;

    // Container aspect ratio: width/height
    const containerAR = containerWidth / containerHeight;

    // Map container AR to template aspect ratio for best fit
    // containerAR > 1.6 (wide) -> 0 (landscape 16:9)
    // containerAR < 0.6 (tall) -> 1 (portrait 9:16)
    // Linear interpolation between these extremes
    const minAR = 0.6;  // Below this -> full portrait
    const maxAR = 1.23;  // Above this -> full landscape

    if (containerAR >= maxAR) {
      return 0.45; // Full landscape
    } else if (containerAR <= minAR) {
      return 1; // Full portrait
    } else {
      // Linear interpolation: map [0.6, 1.6] -> [1, 0]
      const normalized = (containerAR - minAR) / (maxAR - minAR); // 0 to 1
      return 1 - normalized; // Invert: wide container -> low aspectRatio (landscape)
    }
  }, []);

  // Store template ref for initial setup to avoid dependency issues
  const templateRef = useRef(template);
  templateRef.current = template;

  // Track the last computed dimensions to detect real changes
  const lastComputedDimensions = useRef({ width: 0, height: 0 });

  // On mount: set optimal aspect ratio
  useEffect(() => {
    if (!hasInitialized.current) {
      const optimalAR = calculateOptimalAspectRatio();
      if (optimalAR !== null) {
        onUpdateTemplate({ ...templateRef.current, aspectRatio: optimalAR });
      }
      hasInitialized.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply auto-fit zoom when canvas dimensions actually change from CalendarCanvas
  useEffect(() => {
    const { width, height } = canvasDimensions;
    const lastWidth = lastComputedDimensions.current.width;
    const lastHeight = lastComputedDimensions.current.height;

    // Only proceed if dimensions actually changed (not initial default values)
    const dimensionsChanged = width !== lastWidth || height !== lastHeight;
    const isValidDimensions = width > 0 && height > 0;

    if (dimensionsChanged && isValidDimensions) {
      lastComputedDimensions.current = { width, height };

      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        if (canvasContainerRef.current) {
          const newZoom = calculateAutoFitZoom();
          setZoom(newZoom);
          hasAppliedInitialZoom.current = true;
          // Wait for React to apply the zoom before revealing canvas
          // Use requestAnimationFrame to ensure render cycle completes
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (!isZoomReady) {
                setIsZoomReady(true);
              }
            });
          });
        }
      }, 50);
    }
  }, [canvasDimensions.width, canvasDimensions.height, calculateAutoFitZoom]);


  // Recalculate zoom on window resize (aspect ratio stays as user-set)
  useEffect(() => {
    const handleResize = () => {
      const newZoom = calculateAutoFitZoom();
      setZoom(newZoom);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateAutoFitZoom]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.3));
  const handleZoomReset = () => setZoom(calculateAutoFitZoom());

  // Pick the earliest event for onboarding highlight (random if tie)
  const onboardingEvent = useMemo(() => {
    if (events.length === 0) return null;

    // Find the earliest start time
    let earliestTime = Infinity;
    for (const event of events) {
      const time = parseTimeToHours(event.startTime);
      if (time < earliestTime) {
        earliestTime = time;
      }
    }

    // Get all events with the earliest start time
    const earliestEvents = events.filter(
      event => parseTimeToHours(event.startTime) === earliestTime
    );

    // Pick randomly from the earliest events
    const randomIndex = Math.floor(Math.random() * earliestEvents.length);
    return earliestEvents[randomIndex];
  }, [events.length > 0 ? events[0]?.id : null]); // Only recalculate when events first load

  const selectedEvent = events.find(e => e.id === selectedEventId);

  // Check if any events have valid course sections (not NaN)
  const hasValidCourseSections = useMemo(() => {
    return events.some(e => !isNaN(e.classSection) && e.classSection !== null && e.classSection !== undefined);
  }, [events]);

  // Get theme-specific colors based on current theme family and variant
  const themeColors = useMemo(() => {
    return getThemeColors(template.themeFamily, template.themeVariant);
  }, [template.themeFamily, template.themeVariant]);

  const overlappingEventIds = useMemo(() => {
    return getOverlappingEventIds(events);
  }, [events]);
  const hasOverlaps = overlappingEventIds.size > 0;
  const isSelectedEventOverlapping = selectedEvent ? overlappingEventIds.has(selectedEvent.id) : false;

  const handleBlankClick = () => {
    setSelectedEventId(null);
    setPendingTimeChanges(null);
  };

  const handleUpdateEvent = (key: keyof CalendarEvent, value: any) => {
    if (!selectedEventId) return;

    const updated = events.map(e => {
      if (e.id === selectedEventId) {
        const newEvent = { ...e, [key]: value };

        // If Title changed, update displayTitle and assign color based on course code grouping
        if (key === 'title') {
           // Extract displayTitle from the new title (remove section number if present)
           // Format like "CS 101 - 001" -> "CS 101" or just use the title as-is
           const titleParts = value.split(' - ');
           const newDisplayTitle = titleParts[0].trim();
           newEvent.displayTitle = newDisplayTitle;

           // Find existing event with same displayTitle (course code) to reuse its color
           const existingEventWithSameCode = events.find(
             evt => evt.id !== selectedEventId && evt.displayTitle === newDisplayTitle
           );

           if (existingEventWithSameCode?.color) {
             // Use the same color as existing events with this course code
             newEvent.color = existingEventWithSameCode.color;
           } else {
             // Assign new color based on unique course codes count
             const uniqueTitles = Array.from(new Set(
               events.filter(evt => evt.id !== selectedEventId).map(evt => evt.displayTitle)
             ));
             newEvent.color = themeColors[uniqueTitles.length % themeColors.length];
           }
        }

        // If displayTitle changed directly (when showCourseSection is OFF), also update title
        if (key === 'displayTitle') {
           const newDisplayTitle = value.trim();
           newEvent.displayTitle = newDisplayTitle;

           // Preserve section number if it exists, otherwise just use the new displayTitle
           const oldTitle = e.title;
           const oldDisplayTitle = e.displayTitle;
           if (oldTitle !== oldDisplayTitle && oldTitle.startsWith(oldDisplayTitle)) {
             // Has section - preserve it: "CS 101 - 001" -> "NEW CODE - 001"
             const sectionPart = oldTitle.slice(oldDisplayTitle.length);
             newEvent.title = newDisplayTitle + sectionPart;
           } else {
             // No section - just update title to match
             newEvent.title = newDisplayTitle;
           }

           // Find existing event with same displayTitle (course code) to reuse its color
           const existingEventWithSameCode = events.find(
             evt => evt.id !== selectedEventId && evt.displayTitle === newDisplayTitle
           );

           if (existingEventWithSameCode?.color) {
             newEvent.color = existingEventWithSameCode.color;
           } else {
             const uniqueTitles = Array.from(new Set(
               events.filter(evt => evt.id !== selectedEventId).map(evt => evt.displayTitle)
             ));
             newEvent.color = themeColors[uniqueTitles.length % themeColors.length];
           }
        }

        return newEvent;
      }
      return e;
    });
    onUpdateEvents(updated);
  };

  const handleDeleteEvent = () => {
    if (!selectedEventId) return;
    onUpdateEvents(events.filter(e => e.id !== selectedEventId));
    setSelectedEventId(null);
  };

  const handleEventTimeChange = (eventId: string, updates: { startTime: string; endTime: string; dayIndex: number }) => {
    const updated = events.map((event) =>
      event.id === eventId ? { ...event, ...updates } : event
    );
    onUpdateEvents(updated);
  };

  const handleEventDragEnd = (
    eventId: string,
    original: { startTime: string; endTime: string; dayIndex: number },
    updated: { startTime: string; endTime: string; dayIndex: number }
  ) => {
    if (!doesEventOverlap(eventId, updated, events)) return;
    const reverted = events.map((event) =>
      event.id === eventId ? { ...event, ...original } : event
    );
    onUpdateEvents(reverted);
  };

  const openNewEventModal = (slot: { dayIndex: number; startTime: string; endTime: string }) => {
    setSelectedEventId(null);
    setNewEventSlot(slot);
    setNewEventDraft({
      title: '',
      classType: 'Lecture',
      customClassType: '',
      location: '',
    });
  };

  const closeNewEventModal = () => {
    setNewEventSlot(null);
    setNewEventDraft(null);
  };

  const handleCreateNewEvent = () => {
    if (!newEventSlot || !newEventDraft) return;

    const rawTitle = newEventDraft.title.trim();
    const title = rawTitle || 'Untitled Course';
    const displayTitle = title.split(' - ')[0].trim();
    const existingColor = events.find(e => e.displayTitle === displayTitle)?.color;
    const uniqueTitles = Array.from(new Set(events.map(e => e.displayTitle)));
    const color = existingColor || themeColors[uniqueTitles.length % themeColors.length];

    const newEvent: CalendarEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      title,
      displayTitle,
      classSection: null as unknown as number,
      classType: newEventDraft.classType,
      customClassType: newEventDraft.classType === 'Custom'
        ? (newEventDraft.customClassType.trim() || 'Class')
        : undefined,
      startTime: newEventSlot.startTime,
      endTime: newEventSlot.endTime,
      dayIndex: newEventSlot.dayIndex,
      location: newEventDraft.location.trim(),
      metadata: [],
      notes: '',
      category: title,
      color,
      isConfidenceLow: false,
    };

    onUpdateEvents([...events, newEvent]);
    closeNewEventModal();
  };

  // Get color for a course code (find existing or assign new)
  const getColorForCourseCode = (courseCode: string): string => {
    const displayTitle = courseCode.split(' - ')[0].trim();
    const existingEvent = events.find(e => e.displayTitle === displayTitle);
    if (existingEvent?.color) return existingEvent.color;

    const uniqueTitles = Array.from(new Set(events.map(e => e.displayTitle)));
    return themeColors[uniqueTitles.length % themeColors.length];
  };

  // Handle bulk course creation with validation
  const handleBulkCreateCoursesWithValidation = () => {
    const { courseCode, selectedDays, startTime, endTime } = addCourseDraft;
    const errors: typeof addCourseErrors = {};

    // Validate course code
    if (!courseCode.trim()) {
      errors.courseCode = 'Please enter a course code';
    }

    // Validate days
    if (!selectedDays.some(d => d)) {
      errors.days = 'Please select at least one day';
    }

    // Validate time format and order
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      errors.time = 'Please enter valid times (HH:MM)';
    } else if (parseTimeToHours(endTime) <= parseTimeToHours(startTime)) {
      errors.time = 'End time must be after start time';
    }

    // If any errors, show them and return
    if (Object.keys(errors).length > 0) {
      setAddCourseErrors(errors);
      return;
    }

    // Clear errors and proceed
    setAddCourseErrors({});
    handleBulkCreateCourses();
  };

  // Handle bulk course creation (called after validation)
  const handleBulkCreateCourses = () => {
    const { courseCode, classType, customClassType, location, selectedDays, startTime, endTime } = addCourseDraft;

    const selectedDayIndices = selectedDays
      .map((selected, index) => selected ? index : -1)
      .filter(index => index !== -1);

    const title = courseCode.trim();
    const displayTitle = title.split(' - ')[0].trim();
    const color = getColorForCourseCode(title);

    const newEvents: CalendarEvent[] = selectedDayIndices.map(dayIndex => ({
      id: `evt-${Date.now()}-${dayIndex}-${Math.random().toString(16).slice(2, 8)}`,
      title,
      displayTitle,
      classSection: null as unknown as number,
      classType,
      customClassType: classType === 'Custom' ? (customClassType.trim() || 'Class') : undefined,
      startTime,
      endTime,
      dayIndex,
      location: location.trim(),
      metadata: [],
      notes: '',
      category: title,
      color,
      isConfidenceLow: false,
    }));

    onUpdateEvents([...events, ...newEvents]);

    // Reset form
    setAddCourseDraft({
      courseCode: '',
      classType: 'Lecture',
      customClassType: '',
      location: '',
      selectedDays: [false, false, false, false, false],
      startTime: '09:00',
      endTime: '10:00',
    });
  };

  // Clear add course form
  const handleClearAddCourseForm = () => {
    setAddCourseDraft({
      courseCode: '',
      classType: 'Lecture',
      customClassType: '',
      location: '',
      selectedDays: [false, false, false, false, false],
      startTime: '09:00',
      endTime: '10:00',
    });
  };

  // Handle time change with pending state (for selected event)
  const handlePendingTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    if (!selectedEvent) return;

    const current = pendingTimeChanges || {
      startTime: selectedEvent.startTime,
      endTime: selectedEvent.endTime,
    };

    setPendingTimeChanges({
      ...current,
      [field]: value,
    });
  };

  // Save pending time changes
  const handleSaveTimeChanges = () => {
    if (!selectedEvent || !pendingTimeChanges) return;

    const { startTime: newStart, endTime: newEnd } = pendingTimeChanges;

    // Validate: end must be after start
    if (parseTimeToHours(newEnd) <= parseTimeToHours(newStart)) {
      setTimeError('End time must be after start time');
      return;
    }

    // Valid - clear error and update
    setTimeError(null);
    const updated = events.map(e => {
      if (e.id === selectedEventId) {
        return { ...e, startTime: newStart, endTime: newEnd };
      }
      return e;
    });
    onUpdateEvents(updated);
    setPendingTimeChanges(null);
  };

  // Check if there are unsaved time changes
  const hasUnsavedTimeChanges = pendingTimeChanges !== null && selectedEvent && (
    pendingTimeChanges.startTime !== selectedEvent.startTime ||
    pendingTimeChanges.endTime !== selectedEvent.endTime
  );

  // Initialize pending time changes when selecting an event
  const handleEventClickWithPending = (event: CalendarEvent) => {
    setSelectedEventId(event.id);
    setPendingTimeChanges(null); // Reset pending changes
    setTimeError(null);
    // Dismiss edit view onboarding when user clicks an event
    if (showEditOnboarding) {
      setShowEditOnboarding(false);
    }
  };

  // Mobile layout
  if (isMobile) {
    return (
      <MobileEditLayout
        events={events}
        template={template}
        onUpdateEvents={onUpdateEvents}
        onUpdateTemplate={onUpdateTemplate}
        selectedEvent={selectedEvent}
        selectedEventId={selectedEventId}
        setSelectedEventId={setSelectedEventId}
        isSelectedEventOverlapping={isSelectedEventOverlapping}
        hasOverlaps={hasOverlaps}
        onNext={onNext}
        onReupload={onReupload}
        showOverlapWarning={showOverlapWarning}
        setShowOverlapWarning={setShowOverlapWarning}
        showReuploadConfirm={showReuploadConfirm}
        setShowReuploadConfirm={setShowReuploadConfirm}
        newEventSlot={newEventSlot}
        newEventDraft={newEventDraft}
        setNewEventDraft={setNewEventDraft}
        onCloseNewEventModal={closeNewEventModal}
        onCreateNewEvent={handleCreateNewEvent}
        addCourseDraft={addCourseDraft}
        setAddCourseDraft={setAddCourseDraft}
        addCourseErrors={addCourseErrors}
        setAddCourseErrors={setAddCourseErrors}
        onBulkCreateCoursesWithValidation={handleBulkCreateCoursesWithValidation}
        onClearAddCourseForm={handleClearAddCourseForm}
        cachedToggles={cachedToggles}
        setCachedToggles={setCachedToggles}
        hasValidCourseSections={hasValidCourseSections}
        pendingTimeChanges={pendingTimeChanges}
        timeError={timeError}
        hasUnsavedTimeChanges={hasUnsavedTimeChanges}
        onUpdateEvent={handleUpdateEvent}
        onDeleteEvent={handleDeleteEvent}
        onPendingTimeChange={handlePendingTimeChange}
        onSaveTimeChanges={handleSaveTimeChanges}
        mobileActiveTab={mobileActiveTab}
        setMobileActiveTab={setMobileActiveTab}
        canvasContainerRef={canvasContainerRef}
        zoom={zoom}
        isZoomReady={isZoomReady}
        isZoomToolbarOpen={isZoomToolbarOpen}
        setIsZoomToolbarOpen={setIsZoomToolbarOpen}
        supportsZoom={supportsZoom}
        canvasDimensions={canvasDimensions}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onDimensionsComputed={setCanvasDimensions}
        showEditOnboarding={showEditOnboarding}
        setShowEditOnboarding={setShowEditOnboarding}
        onboardingEvent={onboardingEvent}
        onEventClickWithPending={handleEventClickWithPending}
        onBlankClick={handleBlankClick}
        onEventTimeChange={handleEventTimeChange}
        onEventDragEnd={handleEventDragEnd}
        onOpenNewEventModal={openNewEventModal}
        overlappingEventIds={Array.from(overlappingEventIds)}
      />
    );
  }

  // Desktop layout
  return (
    <>
      <Helmet>
        <title>Create Timetable Wallpaper | Schedule Styler</title>
        <meta name="description" content="Design your perfect lockscreen schedule. Upload a screenshot or create from scratch." />
      </Helmet>
      <div
        className="flex h-full min-h-0 gap-6"
      >
      {/* Left: Interactive Canvas - centers the schedule when aspect ratio changes */}
      <div
        ref={canvasContainerRef}
        className="flex-1 min-h-0 rounded-2xl border relative"
        style={{ backgroundColor: 'var(--surface-app)', borderColor: 'var(--border-muted)' }}
      >
        {/* Zoom Toolbar - positioned outside scrollable area */}
        {isZoomToolbarOpen && (
          <div className="absolute top-4 right-4 z-50">
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
                title="Fit to View"
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
            className="absolute top-4 right-4 z-50 h-10 w-10 rounded-xl border shadow-lg transition-all active:scale-95 toolbar-themed"
            title="Show zoom controls"
          >
            <ZoomIn size={16} className="mx-auto text-gray-200" />
          </button>
        )}

        {/* Scrollable canvas area */}
        <div
          className="absolute inset-0 overflow-auto"
          style={{ touchAction: 'pan-x pan-y' }}
        >
          {/* Scale spacer - provides scrollable area when zoomed */}
          <div
            className="p-6 flex justify-center"
            style={{
              minWidth: canvasDimensions.width * zoom + 48,
              minHeight: canvasDimensions.height * zoom + 48,
              width: '100%',
            }}
          >
            {/* Zoom wrapper - hidden until initial zoom is calculated to prevent glitch */}
            <div
              className="origin-top"
              style={{
                ...(supportsZoom
                  ? { zoom }
                  : { transform: `scale(${zoom})`, transformOrigin: 'top center' }),
                opacity: isZoomReady ? 1 : 0,
                transition: 'opacity 150ms ease-out',
              } as React.CSSProperties}
            >
            <CalendarCanvas
            events={events}
            template={template}
            interactive={true}
            onEventClick={handleEventClickWithPending}
            onBlankClick={handleBlankClick}
            showFullTitle={template.showCourseSection}
            selectedEventId={selectedEventId}
            onEventTimeChange={handleEventTimeChange}
            onEventDragEnd={handleEventDragEnd}
            onEmptyBlockClick={openNewEventModal}
            hideUnselectedBorders={true}
            overlappingEventIds={Array.from(overlappingEventIds)}
            minTimeRange={{ start: 8, end: 18 }}
            onboardingComponents={showEditOnboarding && onboardingEvent ? { eventBlock: true } : undefined}
            onboardingEventId={showEditOnboarding ? onboardingEvent?.id : null}
            eventBlockOnboardingMessage={
              <>
                Click to <strong>Drag</strong> and <strong>edit details</strong>
              </>
            }
            onOnboardingOk={() => setShowEditOnboarding(false)}
            visualScale={supportsZoom ? 1 : zoom}
            onDimensionsComputed={setCanvasDimensions}
          />
            </div>
          </div>
        </div>
      </div>

      {/* Right: Inspector Panel */}
      <EditSidebar
        events={events}
        template={template}
        onUpdateEvents={onUpdateEvents}
        onUpdateTemplate={onUpdateTemplate}
        selectedEvent={selectedEvent}
        isSelectedEventOverlapping={isSelectedEventOverlapping}
        onDeselectEvent={() => setSelectedEventId(null)}
        onDeleteEvent={handleDeleteEvent}
        onNext={onNext}
        onReupload={() => setShowReuploadConfirm(true)}
        isAddCourseExpanded={isAddCourseExpanded}
        setIsAddCourseExpanded={setIsAddCourseExpanded}
        addCourseDraft={addCourseDraft}
        setAddCourseDraft={setAddCourseDraft}
        addCourseErrors={addCourseErrors}
        setAddCourseErrors={setAddCourseErrors}
        onAddCourse={handleBulkCreateCoursesWithValidation}
        onClearAddCourseForm={() => {
          setAddCourseDraft({
            courseCode: '',
            classType: 'Lecture',
            customClassType: '',
            location: '',
            selectedDays: [false, false, false, false, false],
            startTime: '09:00',
            endTime: '10:00',
          });
          setAddCourseErrors({});
        }}
        isContentDisplayExpanded={isContentDisplayExpanded}
        setIsContentDisplayExpanded={setIsContentDisplayExpanded}
        cachedToggles={cachedToggles}
        setCachedToggles={setCachedToggles}
        hasValidCourseSections={hasValidCourseSections}
        pendingTimeChanges={pendingTimeChanges}
        setPendingTimeChanges={setPendingTimeChanges}
        timeError={timeError}
        setTimeError={setTimeError}
      />

      {showOverlapWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center popup-overlay-themed backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border shadow-2xl p-5 popup-themed">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-white font-semibold">Overlaps detected</h4>
                <p className="text-xs text-gray-400 mt-1">
                  Some blocks overlap. Please fix if not intended.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-5">
              <button
                onClick={() => setShowOverlapWarning(false)}
                className="px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                Back to Edit
              </button>
              <button
                onClick={() => {
                  setShowOverlapWarning(false);
                  onNext();
                }}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
              >
                Proceed with Overlap
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showReuploadConfirm}
        onClose={() => setShowReuploadConfirm(false)}
        onConfirm={onReupload}
        title="Re-upload schedule?"
        message="Your current progress will be lost. Are you sure you want to continue?"
        confirmText="Proceed"
        confirmVariant="danger"
      />

      {newEventSlot && newEventDraft && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center popup-overlay-themed backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeNewEventModal();
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border shadow-2xl p-5 popup-themed">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-white font-semibold">Add Class</h4>
                <p className="text-xs text-gray-400 mt-1">
                  {DAY_LABELS[newEventSlot.dayIndex]} • {newEventSlot.startTime} - {newEventSlot.endTime}
                </p>
              </div>
              <button
                onClick={closeNewEventModal}
                className="text-gray-500 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <form
              className="mt-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateNewEvent();
              }}
            >
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Course Title</label>
                <input
                  type="text"
                  value={newEventDraft.title}
                  onChange={(e) => setNewEventDraft({ ...newEventDraft, title: e.target.value })}
                  className="w-full rounded-lg input-themed p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="e.g. CS 101"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Class Type</label>
                <ThemedDropdown
                  options={CLASS_TYPES.map((type) => ({
                    id: type,
                    label: type,
                    value: type,
                  }))}
                  value={newEventDraft.classType}
                  onChange={(val) => setNewEventDraft({ ...newEventDraft, classType: val as ClassType })}
                  className="w-full"
                />
              </div>

              {newEventDraft.classType === 'Custom' && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Custom Class Type</label>
                  <input
                    type="text"
                    value={newEventDraft.customClassType}
                    onChange={(e) => setNewEventDraft({ ...newEventDraft, customClassType: e.target.value })}
                    className="w-full rounded-lg input-themed p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="e.g. Workshop"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Location</label>
                <input
                  type="text"
                  value={newEventDraft.location}
                  onChange={(e) => setNewEventDraft({ ...newEventDraft, location: e.target.value })}
                  className="w-full rounded-lg input-themed p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeNewEventModal}
                  className="px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium btn-accent text-white rounded-lg"
                >
                  Done
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </>
  );
};
