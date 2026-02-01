import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { CalendarEvent, TemplateConfig, Category, ClassType } from '../types';
import { CalendarCanvas } from './CalendarCanvas';
import { ToggleSwitch } from './ToggleSwitch';
import { GuidanceNote } from './GuidanceNote';
import { AlertBox } from './AlertBox';
import { Trash2, ListPlus, Upload, Clock, MapPin, Type, Layout, Monitor, Smartphone, Tag, ChevronDown, ChevronRight, Maximize2, X, Plus, RotateCcw, Save, CirclePlus, ZoomIn, ZoomOut, Minimize2 } from 'lucide-react';
import { getThemeColors } from '../themes';

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

  // Zoom state for edit view
  const [zoom, setZoom] = useState(1);
  const [isZoomToolbarOpen, setIsZoomToolbarOpen] = useState(true);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600, minCardWidth: 800, minCardHeight: 600 });
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const editSidebarRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  // Check if browser supports CSS zoom
  const supportsZoom = typeof window !== 'undefined'
    && typeof window.CSS?.supports === 'function'
    && window.CSS.supports('zoom', '1');

  // Calculate auto-fit zoom to contain the full calendar
  const calculateAutoFitZoom = useCallback(() => {
    if (!canvasContainerRef.current) return 1;
    const container = canvasContainerRef.current;
    const containerWidth = container.clientWidth - 48; // padding
    const containerHeight = container.clientHeight - 48;

    const scaleX = containerWidth / canvasDimensions.width;
    const scaleY = containerHeight / canvasDimensions.height;

    // Use the smaller scale to fit both dimensions, cap between 0.3 and 1.5
    return Math.min(Math.max(Math.min(scaleX, scaleY), 0.3), 1.5);
  }, [canvasDimensions.width, canvasDimensions.height]);

  // On mount: restore saved zoom if returning to edit view, otherwise auto-fit
  useEffect(() => {
    if (!hasInitialized.current) {
      const savedZoom = sessionStorage.getItem('editStepZoom');
      const hasVisitedBefore = sessionStorage.getItem('editStepVisited');

      if (savedZoom && hasVisitedBefore) {
        // Returning to edit view - restore previous zoom
        setZoom(parseFloat(savedZoom));
      } else {
        // First time entering edit view - auto-fit
        const newZoom = calculateAutoFitZoom();
        setZoom(newZoom);
        sessionStorage.setItem('editStepVisited', 'true');
      }
      hasInitialized.current = true;
    }
  }, [calculateAutoFitZoom]);

  // Save zoom to sessionStorage when it changes (for restoration when returning)
  useEffect(() => {
    if (hasInitialized.current) {
      sessionStorage.setItem('editStepZoom', zoom.toString());
    }
  }, [zoom]);

  // Recalculate zoom on window resize
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

  // Pick a random event for onboarding highlight
  const randomOnboardingEvent = useMemo(() => {
    if (events.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * events.length);
    return events[randomIndex];
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

  return (
    <div
      className="flex h-full min-h-0 gap-6"
    >
      {/* Left: Interactive Canvas - centers the schedule when aspect ratio changes */}
      <div
        ref={canvasContainerRef}
        className="flex-1 min-h-0 bg-gray-800/30 rounded-2xl border border-gray-700/50 relative"
      >
        {/* Zoom Toolbar - positioned outside scrollable area */}
        {isZoomToolbarOpen && (
          <div className="absolute top-4 right-4 z-50">
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
                title="Fit to View"
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
            className="absolute top-4 right-4 z-50 h-10 w-10 rounded-xl border border-slate-600/70 bg-slate-900/70 shadow-lg backdrop-blur-md transition-all hover:bg-slate-800/90 active:scale-95"
            title="Show zoom controls"
          >
            <ZoomIn size={16} className="mx-auto text-gray-200" />
          </button>
        )}

        {/* Scrollable canvas area */}
        <div
          className="absolute inset-0 p-6 overflow-auto overscroll-contain flex flex-col items-center"
        >
          {/* Zoom wrapper */}
          <div
            className="transition-all duration-200 origin-top"
            style={
              (supportsZoom
                ? { zoom }
                : { transform: `scale(${zoom})` }) as React.CSSProperties
            }
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
            onboardingComponents={showEditOnboarding && randomOnboardingEvent ? { eventBlock: true } : undefined}
            onboardingEventId={showEditOnboarding ? randomOnboardingEvent?.id : null}
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

      {/* Right: Inspector Panel */}
      <div className="w-96 h-full min-h-0 overflow-hidden bg-gray-900 rounded-2xl border border-gray-800 flex flex-col shadow-xl flex-shrink-0">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900 z-10 rounded-t-2xl">
          <h3 className="font-semibold text-white">{selectedEvent ? 'Editing Block' : 'Edit Calendar'}</h3>
          <div className="flex gap-2">
            {!selectedEvent && (
              <button onClick={onReupload} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5">
                <Upload size={14} />
                Re-upload
              </button>
            )}
            {selectedEvent ? (
              <button
                onClick={() => setSelectedEventId(null)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Done
              </button>
            ) : (
              <button
                onClick={() => {
                  if (hasOverlaps) {
                    setShowOverlapWarning(true);
                    return;
                  }
                  onNext();
                }}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </div>

        <div
          data-component="EditSidebar"
          className="flex-1 h-0 overflow-y-auto overscroll-contain p-4 space-y-6 custom-scrollbar"
          ref={editSidebarRef}
        >

          {/* Global Toggles & Class Mapping */}
          {!selectedEvent && (
            <>

              {/* Add Course Section */}
              <div className="p-4 bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-xl border border-blue-700/50">
                <button
                  onClick={() => setIsAddCourseExpanded(!isAddCourseExpanded)}
                  className="flex items-center justify-between w-full text-sm text-blue-300 font-medium hover:text-blue-200 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CirclePlus size={14} /> Add Course
                  </div>
                  {isAddCourseExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                {isAddCourseExpanded && (
                  <div className="space-y-4 mt-4">
                    {/* Days of Week with Gradient Glow */}
                    <div>
                      <div className="flex gap-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, index) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              const newSelectedDays = [...addCourseDraft.selectedDays];
                              newSelectedDays[index] = !newSelectedDays[index];
                              setAddCourseDraft({ ...addCourseDraft, selectedDays: newSelectedDays });
                              if (addCourseErrors.days) setAddCourseErrors({ ...addCourseErrors, days: undefined });
                            }}
                            className="flex-1 relative py-2 px-2 rounded-lg transition-all flex flex-col items-center gap-1"
                          >
                            {/* Gradient glow background when selected */}
                            {addCourseDraft.selectedDays[index] && (
                              <div
                                className="absolute inset-0 rounded-lg opacity-80"
                                style={{
                                  background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.5) 0%, rgba(59, 130, 246, 0.2) 50%, transparent 70%)',
                                }}
                              />
                            )}
                            <span className={`relative z-10 text-sm font-semibold transition-colors ${addCourseDraft.selectedDays[index]
                                ? 'text-blue-300'
                                : addCourseErrors.days
                                  ? 'text-red-400/70'
                                  : 'text-gray-500 hover:text-gray-300'
                              }`}>
                              {day}
                            </span>
                            {/* Checkbox indicator */}
                            <div className={`relative z-10 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${addCourseDraft.selectedDays[index]
                                ? 'border-blue-400 bg-blue-500'
                                : addCourseErrors.days
                                  ? 'border-red-400/50'
                                  : 'border-gray-600'
                              }`}>
                              {addCourseDraft.selectedDays[index] && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                      {addCourseErrors.days && (
                        <p className="text-xs text-red-400 mt-1">{addCourseErrors.days}</p>
                      )}
                    </div>

                    {/* Course Code & Class Type - Same Line */}
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Course Code & Type</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={addCourseDraft.courseCode}
                          onChange={(e) => {
                            setAddCourseDraft({ ...addCourseDraft, courseCode: e.target.value });
                            if (addCourseErrors.courseCode) setAddCourseErrors({ ...addCourseErrors, courseCode: undefined });
                          }}
                          className={`flex-1 bg-gray-800 border rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm ${
                            addCourseErrors.courseCode ? 'border-red-500' : 'border-gray-700'
                          }`}
                          placeholder="e.g. CS 101"
                        />
                        <select
                          value={addCourseDraft.classType}
                          onChange={(e) => setAddCourseDraft({ ...addCourseDraft, classType: e.target.value as ClassType })}
                          className="text-sm font-medium text-white bg-gray-800 border border-gray-700 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                        >
                          {CLASS_TYPES.map((type) => (
                            <option key={type} value={type} className="bg-gray-900 text-white">
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                      {addCourseErrors.courseCode && (
                        <p className="text-xs text-red-400 mt-1">{addCourseErrors.courseCode}</p>
                      )}
                    </div>

                    {/* Custom Class Type */}
                    {addCourseDraft.classType === 'Custom' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Custom Type Name</label>
                        <input
                          type="text"
                          value={addCourseDraft.customClassType}
                          onChange={(e) => setAddCourseDraft({ ...addCourseDraft, customClassType: e.target.value })}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          placeholder="e.g. Workshop"
                        />
                      </div>
                    )}



                    {/* Start/End Time (24h format with text inputs) */}
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${addCourseErrors.time ? 'text-red-400' : 'text-gray-400'}`}>
                        Time (24h format)
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] text-gray-500 mb-1">Start</label>
                          <input
                            type="text"
                            value={addCourseDraft.startTime}
                            onChange={(e) => {
                              const val = e.target.value;
                              // Allow typing time in HH:MM format
                              if (/^[0-9:]*$/.test(val) && val.length <= 5) {
                                setAddCourseDraft({ ...addCourseDraft, startTime: val });
                                if (addCourseErrors.time) setAddCourseErrors({ ...addCourseErrors, time: undefined });
                              }
                            }}
                            onBlur={(e) => {
                              // Format on blur if needed
                              let val = e.target.value.replace(/[^0-9]/g, '');
                              if (val.length >= 3 && val.length <= 4) {
                                const hours = val.slice(0, -2).padStart(2, '0');
                                const mins = val.slice(-2);
                                setAddCourseDraft({ ...addCourseDraft, startTime: `${hours}:${mins}` });
                              }
                            }}
                            placeholder="09:00"
                            className={`w-full bg-gray-800 border rounded-md p-2 text-white text-sm outline-none focus:border-blue-500 font-mono ${
                              addCourseErrors.time ? 'border-red-500' : 'border-gray-700'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-500 mb-1">End</label>
                          <input
                            type="text"
                            value={addCourseDraft.endTime}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^[0-9:]*$/.test(val) && val.length <= 5) {
                                setAddCourseDraft({ ...addCourseDraft, endTime: val });
                                if (addCourseErrors.time) setAddCourseErrors({ ...addCourseErrors, time: undefined });
                              }
                            }}
                            onBlur={(e) => {
                              let val = e.target.value.replace(/[^0-9]/g, '');
                              if (val.length >= 3 && val.length <= 4) {
                                const hours = val.slice(0, -2).padStart(2, '0');
                                const mins = val.slice(-2);
                                setAddCourseDraft({ ...addCourseDraft, endTime: `${hours}:${mins}` });
                              }
                            }}
                            placeholder="10:00"
                            className={`w-full bg-gray-800 border rounded-md p-2 text-white text-sm outline-none focus:border-blue-500 font-mono ${
                              addCourseErrors.time ? 'border-red-500' : 'border-gray-700'
                            }`}
                          />
                        </div>
                      </div>
                      {addCourseErrors.time && (
                        <p className="text-xs text-red-400 mt-1">{addCourseErrors.time}</p>
                      )}
                    </div>

                    {/* Location (optional) */}
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Location (optional)</label>
                      <input
                        type="text"
                        value={addCourseDraft.location}
                        onChange={(e) => setAddCourseDraft({ ...addCourseDraft, location: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        placeholder="Building/Room"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleClearAddCourseForm}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <RotateCcw size={14} /> Clear
                      </button>
                      <button
                        type="button"
                        onClick={handleBulkCreateCoursesWithValidation}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                      >
                        <CirclePlus size={14} /> Add
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Content Display Options - Collapsible */}
              <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <button
                  onClick={() => setIsContentDisplayExpanded(!isContentDisplayExpanded)}
                  className="flex items-center justify-between w-full text-sm text-gray-300 font-medium hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Layout size={14} /> Content Display
                  </div>
                  {isContentDisplayExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                {isContentDisplayExpanded && (
                  <div className="space-y-2 mt-4">
                    {/* Include Course Section toggle */}
                    {hasValidCourseSections && (
                      <div className="p-2 hover:bg-gray-700/30 rounded-lg transition-colors">
                        <ToggleSwitch
                          enabled={template.showCourseSection}
                          onToggle={() => onUpdateTemplate({ ...template, showCourseSection: !template.showCourseSection })}
                          label={<span className="flex items-center gap-2"><Tag size={12} /> Include Course Section</span>}
                        />
                      </div>
                    )}

                    {/* Compact View at top - toggles off other options when enabled */}
                    <div className="p-2 hover:bg-gray-700/30 rounded-lg transition-colors border border-gray-700">
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
                        label="Compact View"
                      />
                    </div>

                    {/* Other content options - disabled when compact is on */}
                    <div className={`space-y-2 ${template.compact ? 'opacity-40 pointer-events-none' : ''}`}>
                      <div className="p-2 hover:bg-gray-700/30 rounded-lg transition-colors">
                        <ToggleSwitch
                          enabled={template.showClassType}
                          onToggle={() => onUpdateTemplate({ ...template, showClassType: !template.showClassType })}
                          label={<span className="flex items-center gap-2"><Tag size={12} /> Show Class Type</span>}
                          disabled={template.compact}
                        />
                      </div>

                      <div className="p-2 hover:bg-gray-700/30 rounded-lg transition-colors">
                        <ToggleSwitch
                          enabled={template.showTime}
                          onToggle={() => onUpdateTemplate({ ...template, showTime: !template.showTime })}
                          label={<span className="flex items-center gap-2"><Clock size={12} /> Show Time</span>}
                          disabled={template.compact}
                        />
                      </div>

                      <div className="p-2 hover:bg-gray-700/30 rounded-lg transition-colors">
                        <ToggleSwitch
                          enabled={template.showLocation}
                          onToggle={() => onUpdateTemplate({ ...template, showLocation: !template.showLocation })}
                          label={<span className="flex items-center gap-2"><MapPin size={12} /> Show Location</span>}
                          disabled={template.compact}
                        />
                      </div>

                      <div className="p-2 hover:bg-gray-700/30 rounded-lg transition-colors">
                        <ToggleSwitch
                          enabled={template.showNotes}
                          onToggle={() => {
                            // Reset all individual event includeNotes when global changes
                            const updatedEvents = events.map(e => ({ ...e, includeNotes: undefined }));
                            onUpdateEvents(updatedEvents);
                            onUpdateTemplate({ ...template, showNotes: !template.showNotes });
                          }}
                          label={<span className="flex items-center gap-2"><Type size={12} /> Show Notes</span>}
                          disabled={template.compact}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Aspect Ratio Section */}
              <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300 font-medium flex items-center gap-2">
                    <Maximize2 size={14} /> Aspect Ratio
                  </span>
                  <span className="text-xs text-gray-500">
                    {template.aspectRatio <= 0.5 ? 'Landscape' : 'Portrait'}
                  </span>
                </div>
                
                {/* Aspect Ratio Slider */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-500">16:9</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05" 
                    value={template.aspectRatio}
                    onChange={(e) => onUpdateTemplate({ ...template, aspectRatio: parseFloat(e.target.value) })}
                    className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <span className="text-[10px] text-gray-500">9:16</span>
                </div>

                {/* Quick Presets */}
                <div className="flex bg-gray-700/50 rounded-lg p-0.5">
                  <button
                    onClick={() => onUpdateTemplate({ ...template, aspectRatio: 0 })}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${template.aspectRatio <= 0.5 ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Monitor size={12} /> Desktop
                  </button>
                  <button
                    onClick={() => onUpdateTemplate({ ...template, aspectRatio: 1 })}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${template.aspectRatio > 0.5 ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Smartphone size={12} /> Mobile
                  </button>
                </div>
              </div>

            </>
          )}

          {selectedEvent ? (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
              
              {selectedEvent.isConfidenceLow && (
                <AlertBox
                  message="Check details (low confidence)."
                  type="warning"
                />
              )}
              {isSelectedEventOverlapping && (
                <div className="rounded-xl border border-red-500/60 bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-100 shadow-[0_12px_30px_rgba(239,68,68,0.25)]">
                  This course has overlaps. Please drag or edit the block to fix issue.
                </div>
              )}

              {/* Days Selection - Show current day and allow adding to other days */}
              <div>
                <div className="flex gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, index) => {
                    const isCurrentDay = selectedEvent.dayIndex === index;
                    // Check if this course already exists on this day (same course code AND class type)
                    const existsOnDay = events.some(
                      e => e.id !== selectedEvent.id &&
                        e.displayTitle === selectedEvent.displayTitle &&
                        e.classType === selectedEvent.classType &&
                        e.dayIndex === index
                    );
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          if (isCurrentDay) return; // Can't remove current day
                          if (existsOnDay) {
                            // Remove course from this day (same course code AND class type)
                            const eventToRemove = events.find(
                              e => e.id !== selectedEvent.id &&
                                e.displayTitle === selectedEvent.displayTitle &&
                                e.classType === selectedEvent.classType &&
                                e.dayIndex === index
                            );
                            if (eventToRemove) {
                              onUpdateEvents(events.filter(e => e.id !== eventToRemove.id));
                            }
                          } else {
                            // Add course to this day (duplicate with new ID)
                            const newEvent: CalendarEvent = {
                              ...selectedEvent,
                              id: `evt-${Date.now()}-${index}-${Math.random().toString(16).slice(2, 8)}`,
                              dayIndex: index,
                            };
                            onUpdateEvents([...events, newEvent]);
                          }
                        }}
                        className={`flex-1 relative py-2 px-2 rounded-lg transition-all flex flex-col items-center gap-1 ${isCurrentDay ? 'cursor-default' : 'cursor-pointer'
                          }`}
                        title={isCurrentDay ? 'Current day' : existsOnDay ? 'Click to remove from this day' : 'Click to add to this day'}
                      >
                        {/* Gradient glow background when selected */}
                        {(isCurrentDay || existsOnDay) && (
                          <div
                            className="absolute inset-0 rounded-lg opacity-80"
                            style={{
                              background: isCurrentDay
                                ? 'radial-gradient(ellipse at center, rgba(34, 197, 94, 0.5) 0%, rgba(34, 197, 94, 0.2) 50%, transparent 70%)'
                                : 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.5) 0%, rgba(59, 130, 246, 0.2) 50%, transparent 70%)',
                            }}
                          />
                        )}
                        <span className={`relative z-10 text-sm font-semibold transition-colors ${isCurrentDay
                            ? 'text-green-300'
                            : existsOnDay
                              ? 'text-blue-300'
                              : 'text-gray-500 hover:text-gray-300'
                          }`}>
                          {day}
                        </span>
                        {/* Checkbox indicator */}
                        <div className={`relative z-10 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${isCurrentDay
                            ? 'border-green-400 bg-green-500'
                            : existsOnDay
                              ? 'border-blue-400 bg-blue-500'
                              : 'border-gray-600'
                          }`}>
                          {(isCurrentDay || existsOnDay) && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-gray-500 mt-1.5 text-center">
                  <span className="text-green-400">●</span> Current day &nbsp;
                  <span className="text-blue-400">●</span> Click to add/remove from other days
                </p>
              </div>
              
              {/* Course Info - Course Code with Class Type dropdown */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Course Code</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={template.showCourseSection ? selectedEvent.title : selectedEvent.displayTitle}
                    onChange={(e) => handleUpdateEvent(
                      template.showCourseSection ? 'title' : 'displayTitle',
                      e.target.value
                    )}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                    placeholder="e.g. CS 101"
                  />
                  <select
                    value={selectedEvent.classType}
                    onChange={(e) => handleUpdateEvent('classType', e.target.value as ClassType)}
                    className="text-sm font-bold text-white bg-gray-900 border border-gray-700 px-4 py-2.5 rounded-lg whitespace-nowrap shadow-md uppercase tracking-wide cursor-pointer hover:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                  >
                    {CLASS_TYPES.map((type) => (
                      <option key={type} value={type} className="bg-gray-900 text-white">
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom Class Type Input */}
              {selectedEvent.classType === 'Custom' && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Custom Class Type</label>
                  <input
                    type="text"
                    value={selectedEvent.customClassType || ''}
                    onChange={(e) => handleUpdateEvent('customClassType', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="e.g. Workshop, Office Hours"
                  />
                </div>
              )}

              {/* Timing with Save button */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400">Time</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Start (24h)</label>
                    <input
                      type="text"
                      value={pendingTimeChanges?.startTime ?? selectedEvent.startTime}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^[0-9:]*$/.test(val) && val.length <= 5) {
                          handlePendingTimeChange('startTime', val);
                        }
                      }}
                      onBlur={(e) => {
                        let val = e.target.value.replace(/[^0-9]/g, '');
                        if (val.length >= 3 && val.length <= 4) {
                          const hours = val.slice(0, -2).padStart(2, '0');
                          const mins = val.slice(-2);
                          handlePendingTimeChange('startTime', `${hours}:${mins}`);
                        }
                      }}
                      placeholder="09:00"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white text-sm outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">End (24h)</label>
                    <input
                      type="text"
                      value={pendingTimeChanges?.endTime ?? selectedEvent.endTime}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^[0-9:]*$/.test(val) && val.length <= 5) {
                          handlePendingTimeChange('endTime', val);
                        }
                      }}
                      onBlur={(e) => {
                        let val = e.target.value.replace(/[^0-9]/g, '');
                        if (val.length >= 3 && val.length <= 4) {
                          const hours = val.slice(0, -2).padStart(2, '0');
                          const mins = val.slice(-2);
                          handlePendingTimeChange('endTime', `${hours}:${mins}`);
                        }
                      }}
                      placeholder="10:00"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white text-sm outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
                {timeError && (
                  <p className="text-xs text-red-400">{timeError}</p>
                )}
                {hasUnsavedTimeChanges && (
                  <button
                    type="button"
                    onClick={handleSaveTimeChanges}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors mt-2"
                  >
                    <Save size={14} /> Save Time Changes
                  </button>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Location</label>
                <input
                  type="text"
                  value={selectedEvent.location}
                  onChange={(e) => handleUpdateEvent('location', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white text-sm outline-none"
                  placeholder="Building/Room"
                />
              </div>

              {/* Notes - Checkboxes with include/exclude toggle (per-event) */}
              <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-400 flex items-center gap-1">
                    <ListPlus size={12} /> Notes
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500">{(selectedEvent.includeNotes ?? template.showNotes) ? 'Included' : 'Excluded'}</span>
                    <ToggleSwitch
                      enabled={selectedEvent.includeNotes ?? template.showNotes}
                      onToggle={() => handleUpdateEvent('includeNotes', !(selectedEvent.includeNotes ?? template.showNotes))}
                    />
                  </div>
                </div>

                {(selectedEvent.includeNotes ?? template.showNotes) && (
                  <>
                    {/* Metadata options as checkboxes */}
                    {selectedEvent.metadata && selectedEvent.metadata.length > 0 && (
                      <div className="space-y-2">
                        {selectedEvent.metadata.map((meta, idx) => {
                          const currentNotes = selectedEvent.notes || '';
                          const isChecked = currentNotes.includes(meta);
                          return (
                            <label key={idx} className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer hover:bg-gray-700/50 p-1.5 rounded">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  let newNotes = currentNotes;
                                  if (e.target.checked) {
                                    newNotes = currentNotes ? `${currentNotes}\n${meta}` : meta;
                                  } else {
                                    newNotes = currentNotes
                                      .split('\n')
                                      .filter(n => n !== meta)
                                      .join('\n');
                                  }
                                  handleUpdateEvent('notes', newNotes);
                                }}
                                className="w-3.5 h-3.5 text-blue-500 focus:ring-0 bg-gray-700 border-gray-600 rounded"
                              />
                              <span className="opacity-90">{meta}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* Additional content textarea */}
                    <div className="border-t border-gray-700 pt-2">
                      <label className="text-[10px] text-gray-500 mb-1 block">Additional notes</label>
                      <textarea
                        value={selectedEvent.notes || ''}
                        onChange={(e) => handleUpdateEvent('notes', e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white text-sm outline-none h-16 resize-none custom-scrollbar"
                        placeholder="Custom notes..."
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="pt-4 border-t border-gray-800">
                <button 
                  onClick={handleDeleteEvent}
                  className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 rounded-md transition-colors text-sm"
                >
                  <Trash2 size={14} /> Delete Event
                </button>
              </div>

            </div>
          ) : null}
        </div>
      </div>

      {showOverlapWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl p-5">
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

      {newEventSlot && newEventDraft && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeNewEventModal();
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl p-5">
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
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="e.g. CS 101"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Class Type</label>
                <select
                  value={newEventDraft.classType}
                  onChange={(e) => setNewEventDraft({ ...newEventDraft, classType: e.target.value as ClassType })}
                  className="w-full text-sm font-bold text-white bg-gray-900 border border-gray-700 px-4 py-2.5 rounded-lg shadow-md uppercase tracking-wide cursor-pointer hover:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                >
                  {CLASS_TYPES.map((type) => (
                    <option key={type} value={type} className="bg-gray-900 text-white">
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {newEventDraft.classType === 'Custom' && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Custom Class Type</label>
                  <input
                    type="text"
                    value={newEventDraft.customClassType}
                    onChange={(e) => setNewEventDraft({ ...newEventDraft, customClassType: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
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
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="Building/Room"
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
                  className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
