import React from 'react';
import {
  Edit3,
  CirclePlus,
  Layout,
  Maximize2,
  X,
  Monitor,
  Smartphone,
  Tag,
  Clock,
  MapPin,
  Type,
  RotateCcw,
} from 'lucide-react';
import { CalendarEvent, TemplateConfig, ClassType } from '../../../types';
import { CalendarCanvas } from '../../CalendarCanvas';
import { MobileFooterToolbar, MobileTab } from '../../small_utility/MobileFooterToolbar';
import { ConfirmModal } from '../../popups';
import { ToggleSwitch } from '../../small_utility/ToggleSwitch';
import { ThemedDropdown } from '../../ui/themed-dropdown';
import { GlassRadioGroup } from '../../ui/glass-radio-group';
import { MobileEditEventPanel } from './MobileEditEventPanel';
import { MobileHeaderBar, headerGhostBtnClass, headerAccentBtnClass } from '../../small_utility/MobileHeaderBar';
import { MobileExportZoomToolbar } from '../../export/mobile/MobileExportZoomToolbar';

const CLASS_TYPES: ClassType[] = ['Lecture', 'Tutorial', 'Lab', 'Seminar', 'Unknown', 'Custom'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface MobileEditLayoutProps {
  // Events & template
  events: CalendarEvent[];
  template: TemplateConfig;
  onUpdateEvents: (events: CalendarEvent[]) => void;
  onUpdateTemplate: (template: TemplateConfig) => void;

  // Selection
  selectedEvent: CalendarEvent | undefined;
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  isSelectedEventOverlapping: boolean;
  hasOverlaps: boolean;

  // Navigation
  onNext: () => void;
  onReupload: () => void;

  // Overlap warning modal state
  showOverlapWarning: boolean;
  setShowOverlapWarning: (show: boolean) => void;

  // Re-upload confirm modal state
  showReuploadConfirm: boolean;
  setShowReuploadConfirm: (show: boolean) => void;

  // New event modal state
  newEventSlot: { dayIndex: number; startTime: string; endTime: string } | null;
  newEventDraft: { title: string; classType: ClassType; customClassType: string; location: string } | null;
  setNewEventDraft: (draft: { title: string; classType: ClassType; customClassType: string; location: string } | null) => void;
  onCloseNewEventModal: () => void;
  onCreateNewEvent: () => void;

  // Add course form state
  addCourseDraft: {
    courseCode: string;
    classType: ClassType;
    customClassType: string;
    location: string;
    selectedDays: boolean[];
    startTime: string;
    endTime: string;
  };
  setAddCourseDraft: (draft: any) => void;
  addCourseErrors: { courseCode?: string; days?: string; time?: string };
  setAddCourseErrors: (errors: any) => void;
  onBulkCreateCoursesWithValidation: () => void;
  onClearAddCourseForm: () => void;

  // Content display state
  cachedToggles: { showClassType: boolean; showTime: boolean; showLocation: boolean; showNotes: boolean } | null;
  setCachedToggles: (toggles: any) => void;
  hasValidCourseSections: boolean;

  // Event editing state
  pendingTimeChanges: { startTime: string; endTime: string } | null;
  timeError: string | null;
  hasUnsavedTimeChanges: boolean | null | undefined;
  onUpdateEvent: (key: keyof CalendarEvent, value: any) => void;
  onDeleteEvent: () => void;
  onPendingTimeChange: (field: 'startTime' | 'endTime', value: string) => void;
  onSaveTimeChanges: () => void;

  // Mobile tab state
  mobileActiveTab: string | null;
  setMobileActiveTab: (tab: string | null) => void;

  // Canvas / zoom state
  canvasContainerRef: React.RefObject<HTMLDivElement>;
  zoom: number;
  isZoomReady: boolean;
  isZoomToolbarOpen: boolean;
  setIsZoomToolbarOpen: (open: boolean) => void;
  supportsZoom: boolean;
  canvasDimensions: { width: number; height: number };
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onDimensionsComputed: (dims: { width: number; height: number; minCardWidth: number; minCardHeight: number }) => void;

  // Onboarding
  showEditOnboarding: boolean;
  setShowEditOnboarding: (show: boolean) => void;
  onboardingEvent: CalendarEvent | null;

  // Canvas event handlers
  onEventClickWithPending: (event: CalendarEvent) => void;
  onBlankClick: () => void;
  onEventTimeChange: (eventId: string, updates: { startTime: string; endTime: string; dayIndex: number }) => void;
  onEventDragEnd: (eventId: string, original: { startTime: string; endTime: string; dayIndex: number }, updated: { startTime: string; endTime: string; dayIndex: number }) => void;
  onOpenNewEventModal: (slot: { dayIndex: number; startTime: string; endTime: string }) => void;
  overlappingEventIds: string[];
}

export const MobileEditLayout: React.FC<MobileEditLayoutProps> = ({
  events,
  template,
  onUpdateEvents,
  onUpdateTemplate,
  selectedEvent,
  selectedEventId,
  setSelectedEventId,
  isSelectedEventOverlapping,
  hasOverlaps,
  onNext,
  onReupload,
  showOverlapWarning,
  setShowOverlapWarning,
  showReuploadConfirm,
  setShowReuploadConfirm,
  newEventSlot,
  newEventDraft,
  setNewEventDraft,
  onCloseNewEventModal,
  onCreateNewEvent,
  addCourseDraft,
  setAddCourseDraft,
  addCourseErrors,
  setAddCourseErrors,
  onBulkCreateCoursesWithValidation,
  onClearAddCourseForm,
  cachedToggles,
  setCachedToggles,
  hasValidCourseSections,
  pendingTimeChanges,
  timeError,
  hasUnsavedTimeChanges,
  onUpdateEvent,
  onDeleteEvent,
  onPendingTimeChange,
  onSaveTimeChanges,
  mobileActiveTab,
  setMobileActiveTab,
  canvasContainerRef,
  zoom,
  isZoomReady,
  isZoomToolbarOpen,
  setIsZoomToolbarOpen,
  supportsZoom,
  canvasDimensions,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onDimensionsComputed,
  showEditOnboarding,
  setShowEditOnboarding,
  onboardingEvent,
  onEventClickWithPending,
  onBlankClick,
  onEventTimeChange,
  onEventDragEnd,
  onOpenNewEventModal,
  overlappingEventIds,
}) => {
  // Add course tab content
  const addCourseContent = (
    <div className="space-y-2">
      {/* Days of Week */}
      <div>
        <div className="flex gap-1.5">
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
              className="flex-1 relative py-1 rounded-md transition-all flex flex-col items-center gap-0.5"
            >
              {addCourseDraft.selectedDays[index] && (
                <div
                  className="absolute inset-0 rounded-md opacity-80"
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.5) 0%, rgba(59, 130, 246, 0.2) 50%, transparent 70%)',
                  }}
                />
              )}
              <span className={`relative z-10 text-xs font-semibold transition-colors ${addCourseDraft.selectedDays[index]
                  ? 'text-blue-300'
                  : addCourseErrors.days
                    ? 'text-red-400/70'
                    : 'text-gray-500 hover:text-gray-300'
                }`}>
                {day}
              </span>
              <div className={`relative z-10 w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-all ${addCourseDraft.selectedDays[index]
                  ? 'border-blue-400 bg-blue-500'
                  : addCourseErrors.days
                    ? 'border-red-400/50'
                    : 'border-[var(--border-default)]'
                }`}>
                {addCourseDraft.selectedDays[index] && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
        {addCourseErrors.days && (
          <p className="text-[10px] text-red-400 mt-0.5">{addCourseErrors.days}</p>
        )}
      </div>

      {/* Course Code & Class Type */}
      <div>
        <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Course Code & Type</label>
        <div className="flex gap-1.5 min-w-0">
          <input
            type="text"
            value={addCourseDraft.courseCode}
            onChange={(e) => {
              setAddCourseDraft({ ...addCourseDraft, courseCode: e.target.value });
              if (addCourseErrors.courseCode) setAddCourseErrors({ ...addCourseErrors, courseCode: undefined });
            }}
            className={`w-[12.5rem] shrink-0 rounded-md px-2 py-1 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs input-themed ${
              addCourseErrors.courseCode ? 'border-red-500' : ''
            }`}
            placeholder="e.g. CS 101"
          />
          <ThemedDropdown
            options={CLASS_TYPES.map((type) => ({
              id: type,
              label: type,
              value: type,
            }))}
            value={addCourseDraft.classType}
            onChange={(val) => setAddCourseDraft({ ...addCourseDraft, classType: val as ClassType })}
            className="flex-1 min-w-0"
          />
        </div>
        {addCourseErrors.courseCode && (
          <p className="text-[10px] text-red-400 mt-0.5">{addCourseErrors.courseCode}</p>
        )}
      </div>

      {/* Custom Class Type */}
      {addCourseDraft.classType === 'Custom' && (
        <div>
          <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Custom Type</label>
          <input
            type="text"
            value={addCourseDraft.customClassType}
            onChange={(e) => setAddCourseDraft({ ...addCourseDraft, customClassType: e.target.value })}
            className="w-full rounded-md input-themed px-2 py-1 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
            placeholder="e.g. Workshop"
          />
        </div>
      )}

      {/* Start / End / Location — single row */}
      <div>
        <label className={`block text-[10px] font-medium mb-0.5 ${addCourseErrors.time ? 'text-red-400' : 'text-gray-400'}`}>
          Time & Location
        </label>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={addCourseDraft.startTime}
            onChange={(e) => {
              const val = e.target.value;
              if (/^[0-9:]*$/.test(val) && val.length <= 5) {
                setAddCourseDraft({ ...addCourseDraft, startTime: val });
                if (addCourseErrors.time) setAddCourseErrors({ ...addCourseErrors, time: undefined });
              }
            }}
            placeholder="09:00"
            className={`w-[72px] shrink-0 rounded-md px-2 py-1 text-white text-xs outline-none focus:border-blue-500 font-mono text-center input-themed ${
              addCourseErrors.time ? 'border-red-500' : ''
            }`}
          />
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
            placeholder="10:00"
            className={`w-[72px] shrink-0 rounded-md px-2 py-1 text-white text-xs outline-none focus:border-blue-500 font-mono text-center input-themed ${
              addCourseErrors.time ? 'border-red-500' : ''
            }`}
          />
          <input
            type="text"
            value={addCourseDraft.location}
            onChange={(e) => setAddCourseDraft({ ...addCourseDraft, location: e.target.value })}
            placeholder="Location"
            className="flex-1 min-w-0 rounded-md input-themed px-2 py-1 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
          />
        </div>
        {addCourseErrors.time && (
          <p className="text-[10px] text-red-400 mt-0.5">{addCourseErrors.time}</p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onClearAddCourseForm}
          className="inline-btn flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs hover:text-white rounded-lg transition-colors button-ghost-themed"
          style={{ color: 'var(--text-secondary)' }}
        >
          <RotateCcw size={12} /> Clear
        </button>
        <button
          type="button"
          onClick={onBulkCreateCoursesWithValidation}
          className="inline-btn flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium btn-accent text-white rounded-lg"
        >
          <CirclePlus size={12} /> Add
        </button>
      </div>
    </div>
  );

  const contentDisplayContent = (
    <div className="space-y-2">
      {/* Row 1: Compact + Course Section */}
      <div className="grid grid-cols-2 gap-1.5">
        <div className="p-2 rounded-lg border" style={{ borderColor: 'var(--border-default)' }}>
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
            label={<span className="text-[11px]">Compact</span>}
          />
        </div>
        {hasValidCourseSections && (
          <div className="p-2 rounded-lg">
            <ToggleSwitch
              enabled={template.showCourseSection}
              onToggle={() => onUpdateTemplate({ ...template, showCourseSection: !template.showCourseSection })}
              label={<span className="flex items-center gap-1 text-[11px]"><Tag size={10} /> Section</span>}
            />
          </div>
        )}
      </div>

      {/* Row 2-3: 2x2 grid of content toggles */}
      <div className={`grid grid-cols-2 gap-1.5 ${template.compact ? 'opacity-40 pointer-events-none' : ''}`}>
        <div className="p-2 rounded-lg">
          <ToggleSwitch
            enabled={template.showClassType}
            onToggle={() => onUpdateTemplate({ ...template, showClassType: !template.showClassType })}
            label={<span className="flex items-center gap-1 text-[11px]"><Tag size={10} /> Type</span>}
            disabled={template.compact}
          />
        </div>
        <div className="p-2 rounded-lg">
          <ToggleSwitch
            enabled={template.showTime}
            onToggle={() => onUpdateTemplate({ ...template, showTime: !template.showTime })}
            label={<span className="flex items-center gap-1 text-[11px]"><Clock size={10} /> Time</span>}
            disabled={template.compact}
          />
        </div>
        <div className="p-2 rounded-lg">
          <ToggleSwitch
            enabled={template.showLocation}
            onToggle={() => onUpdateTemplate({ ...template, showLocation: !template.showLocation })}
            label={<span className="flex items-center gap-1 text-[11px]"><MapPin size={10} /> Location</span>}
            disabled={template.compact}
          />
        </div>
        <div className="p-2 rounded-lg">
          <ToggleSwitch
            enabled={template.showNotes}
            onToggle={() => {
              const updatedEvents = events.map(e => ({ ...e, includeNotes: undefined }));
              onUpdateEvents(updatedEvents);
              onUpdateTemplate({ ...template, showNotes: !template.showNotes });
            }}
            label={<span className="flex items-center gap-1 text-[11px]"><Type size={10} /> Notes</span>}
            disabled={template.compact}
          />
        </div>
      </div>
    </div>
  );

  const aspectRatioContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-300 font-medium">
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
          className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer slider-accent slider-track-themed"
        />
        <span className="text-[10px] text-gray-500">9:16</span>
      </div>

      {/* Quick Presets */}
      <GlassRadioGroup
        name="edit-aspect-ratio-mobile"
        options={[
          { id: 'desktop', label: <><Monitor size={12} /> Desktop</>, value: 'desktop' as const },
          { id: 'mobile', label: <><Smartphone size={12} /> Mobile</>, value: 'mobile' as const },
        ]}
        value={template.aspectRatio <= 0.5 ? 'desktop' : 'mobile'}
        onChange={(val) => onUpdateTemplate({ ...template, aspectRatio: val === 'desktop' ? 0 : 1 })}
      />
    </div>
  );

  // Mobile tabs configuration
  const mobileTabs: MobileTab[] = selectedEvent ? [
    {
      id: 'edit-event',
      label: 'Edit',
      icon: <Edit3 size={16} />,
      content: (
        <MobileEditEventPanel
          selectedEvent={selectedEvent}
          events={events}
          isSelectedEventOverlapping={isSelectedEventOverlapping}
          showCourseSection={template.showCourseSection}
          pendingTimeChanges={pendingTimeChanges}
          timeError={timeError}
          hasUnsavedTimeChanges={hasUnsavedTimeChanges}
          onUpdateEvent={onUpdateEvent}
          onDeleteEvent={onDeleteEvent}
          onUpdateEvents={onUpdateEvents}
          onPendingTimeChange={onPendingTimeChange}
          onSaveTimeChanges={onSaveTimeChanges}
        />
      ),
    },
  ] : [
    {
      id: 'add-course',
      label: 'Add',
      icon: <CirclePlus size={16} />,
      content: addCourseContent,
    },
    {
      id: 'display',
      label: 'Display',
      icon: <Layout size={16} />,
      content: contentDisplayContent,
    },
    {
      id: 'ratio',
      label: 'Ratio',
      icon: <Maximize2 size={16} />,
      content: aspectRatioContent,
    },
  ];

  // Canvas component
  const canvasComponent = (
    <div
      ref={canvasContainerRef}
      className="flex-1 min-h-0 rounded-2xl border relative mb-[56px]"
      style={{ backgroundColor: 'var(--surface-app)', borderColor: 'var(--border-muted)' }}
    >
      <MobileExportZoomToolbar
        isZoomToolbarOpen={isZoomToolbarOpen}
        setIsZoomToolbarOpen={setIsZoomToolbarOpen}
        zoom={zoom}
        handleZoomIn={onZoomIn}
        handleZoomOut={onZoomOut}
        handleZoomReset={onZoomReset}
      />

      {/* Scrollable canvas area */}
      <div
        className="absolute inset-0 p-6 overflow-auto"
        style={{ touchAction: 'pan-x pan-y' }}
      >
        {/* Scale spacer - provides scrollable area when zoomed */}
        <div
          className="flex justify-center"
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
              onEventClick={onEventClickWithPending}
              onBlankClick={onBlankClick}
              showFullTitle={template.showCourseSection}
              selectedEventId={selectedEventId}
              onEventTimeChange={onEventTimeChange}
              onEventDragEnd={onEventDragEnd}
              onEmptyBlockClick={onOpenNewEventModal}
              hideUnselectedBorders={true}
              overlappingEventIds={overlappingEventIds}
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
              onDimensionsComputed={onDimensionsComputed}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <MobileHeaderBar
        left={
          <button onClick={() => setShowReuploadConfirm(true)} className={headerGhostBtnClass} style={{ backgroundColor: 'var(--button-ghost)' }}>
            Re-upload
          </button>
        }
        title={selectedEvent ? 'Editing Block' : 'Edit Calendar'}
        right={
          selectedEvent ? (
            <button onClick={() => setSelectedEventId(null)} className={headerAccentBtnClass}>
              Done
            </button>
          ) : (
            <button
              onClick={() => {
                if (hasOverlaps) { setShowOverlapWarning(true); return; }
                onNext();
              }}
              className={headerAccentBtnClass}
            >
              Next
            </button>
          )
        }
      />

      {canvasComponent}

      <MobileFooterToolbar
        tabs={mobileTabs}
        activeTabId={mobileActiveTab}
        onTabChange={setMobileActiveTab}
        onPanelClose={() => {
          // Deselect event when closing/collapsing the edit panel
          if (mobileActiveTab === 'edit-event') {
            setSelectedEventId(null);
          }
        }}
      />

      {/* Modals */}
      {showOverlapWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center popup-overlay-themed backdrop-blur-sm">
          <div className="w-full max-w-[18rem] sm:max-w-md rounded-lg sm:rounded-2xl border shadow-2xl p-3 sm:p-5 mx-4 popup-themed">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-white text-xs sm:text-base font-semibold">Overlaps detected</h4>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                  Some blocks overlap. Please fix if not intended.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 sm:pt-5">
              <button
                onClick={() => setShowOverlapWarning(false)}
                className="inline-btn px-2.5 py-1 text-[11px] sm:text-sm text-gray-300 hover:text-white transition-colors"
              >
                Back to Edit
              </button>
              <button
                onClick={() => {
                  setShowOverlapWarning(false);
                  onNext();
                }}
                className="inline-btn px-2.5 py-1 text-[11px] sm:text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
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
          className="fixed inset-0 z-[60] flex items-center justify-center popup-overlay-themed backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onCloseNewEventModal();
            }
          }}
        >
          <div className="w-full max-w-[18rem] sm:max-w-sm rounded-lg border shadow-2xl p-2.5 sm:p-4 mx-4 popup-themed">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h4 className="text-white text-[11px] sm:text-sm font-semibold">Add Class</h4>
                <p className="text-[9px] sm:text-[10px] text-gray-400">
                  {DAY_LABELS[newEventSlot.dayIndex]} • {newEventSlot.startTime} - {newEventSlot.endTime}
                </p>
              </div>
              <button
                onClick={onCloseNewEventModal}
                className="inline-btn text-gray-500 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>

            <form
              className="mt-2 space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                onCreateNewEvent();
              }}
            >
              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Course Title</label>
                <input
                  type="text"
                  value={newEventDraft.title}
                  onChange={(e) => setNewEventDraft({ ...newEventDraft, title: e.target.value })}
                  className="w-full rounded-md input-themed px-2 py-1.5 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                  placeholder="e.g. CS 101"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Class Type</label>
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
                  <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Custom Class Type</label>
                  <input
                    type="text"
                    value={newEventDraft.customClassType}
                    onChange={(e) => setNewEventDraft({ ...newEventDraft, customClassType: e.target.value })}
                    className="w-full rounded-md input-themed px-2 py-1.5 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                    placeholder="e.g. Workshop"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Location</label>
                <input
                  type="text"
                  value={newEventDraft.location}
                  onChange={(e) => setNewEventDraft({ ...newEventDraft, location: e.target.value })}
                  className="w-full rounded-md input-themed px-2 py-1.5 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onCloseNewEventModal}
                  className="inline-btn px-2 py-1 text-[11px] text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-btn px-2.5 py-1 text-[11px] font-medium btn-accent text-white rounded-md"
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
