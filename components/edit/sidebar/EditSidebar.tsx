import React from 'react';
import { RotateCcw } from 'lucide-react';
import { CalendarEvent, TemplateConfig, ClassType } from '../../../types';
import { AddCourseSection } from './AddCourseSection';
import { ContentDisplaySection } from './ContentDisplaySection';
import { AspectRatioSection } from './AspectRatioSection';
import { EventEditorSection } from './EventEditorSection';
import { AddCourseDraft, AddCourseErrors, CachedToggles } from './types';

export interface EditSidebarProps {
  // Core data
  events: CalendarEvent[];
  template: TemplateConfig;
  onUpdateEvents: (events: CalendarEvent[]) => void;
  onUpdateTemplate: (template: TemplateConfig) => void;

  // Selected event
  selectedEvent: CalendarEvent | null;
  isSelectedEventOverlapping: boolean;
  onDeselectEvent: () => void;
  onDeleteEvent: () => void;

  // Navigation
  onNext: () => void;
  onReupload: () => void;

  // Add Course section
  isAddCourseExpanded: boolean;
  setIsAddCourseExpanded: (expanded: boolean) => void;
  addCourseDraft: AddCourseDraft;
  setAddCourseDraft: (draft: AddCourseDraft) => void;
  addCourseErrors: AddCourseErrors;
  setAddCourseErrors: (errors: AddCourseErrors) => void;
  onAddCourse: () => void;
  onClearAddCourseForm: () => void;

  // Content Display section
  isContentDisplayExpanded: boolean;
  setIsContentDisplayExpanded: (expanded: boolean) => void;
  cachedToggles: CachedToggles | null;
  setCachedToggles: (toggles: CachedToggles | null) => void;
  hasValidCourseSections: boolean;

  // Time editing for selected event
  pendingTimeChanges: { startTime: string; endTime: string } | null;
  setPendingTimeChanges: (changes: { startTime: string; endTime: string } | null) => void;
  timeError: string | null;
  setTimeError: (error: string | null) => void;
}

export const EditSidebar: React.FC<EditSidebarProps> = ({
  events,
  template,
  onUpdateEvents,
  onUpdateTemplate,
  selectedEvent,
  isSelectedEventOverlapping,
  onDeselectEvent,
  onDeleteEvent,
  onNext,
  onReupload,
  isAddCourseExpanded,
  setIsAddCourseExpanded,
  addCourseDraft,
  setAddCourseDraft,
  addCourseErrors,
  setAddCourseErrors,
  onAddCourse,
  onClearAddCourseForm,
  isContentDisplayExpanded,
  setIsContentDisplayExpanded,
  cachedToggles,
  setCachedToggles,
  hasValidCourseSections,
  pendingTimeChanges,
  setPendingTimeChanges,
  timeError,
  setTimeError,
}) => {
  return (
    <div
      data-component="EditSidebarWrapper"
      className="w-[320px] min-w-[280px] max-w-[360px] rounded-2xl border flex flex-col shadow-xl min-h-0 max-h-full"
      style={{
        backgroundColor: 'var(--panel-background)',
        borderColor: 'var(--panel-border)',
      }}
    >
      {/* SIDEBAR HEADER */}
      <div
        className="p-4 border-b flex items-center justify-between shrink-0"
        style={{ borderColor: 'var(--panel-border)' }}
      >
        <h3 className="font-semibold text-lg shrink-0" style={{ color: 'var(--text-primary)' }}>
          {selectedEvent ? 'Edit Event' : 'Edit Schedule'}
        </h3>
        {selectedEvent ? (
          <button
            onClick={onDeselectEvent}
            className="px-4 py-1.5 btn-accent text-white text-sm font-medium rounded-lg"
          >
            Done
          </button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onReupload}
              className="p-1.5 border rounded-lg transition-all button-ghost-themed hover:opacity-90"
              style={{ borderColor: 'var(--border-default)' }}
              title="Re-upload"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={onNext}
              className="px-4 py-1.5 btn-accent text-white text-sm font-medium rounded-lg"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* SIDEBAR CONTENT */}
      <div
        data-component="EditSidebar"
        className="flex-1 h-0 overflow-y-auto custom-scrollbar"
      >
        <div className="p-4 space-y-6">
          {/* Global Settings (when no event selected) */}
          {!selectedEvent && (
            <>
              <AddCourseSection
                template={template}
                onUpdateTemplate={onUpdateTemplate}
                events={events}
                onUpdateEvents={onUpdateEvents}
                isExpanded={isAddCourseExpanded}
                setIsExpanded={setIsAddCourseExpanded}
                draft={addCourseDraft}
                setDraft={setAddCourseDraft}
                errors={addCourseErrors}
                setErrors={setAddCourseErrors}
                onAddCourse={onAddCourse}
                onClearForm={onClearAddCourseForm}
              />

              <ContentDisplaySection
                template={template}
                onUpdateTemplate={onUpdateTemplate}
                events={events}
                onUpdateEvents={onUpdateEvents}
                isExpanded={isContentDisplayExpanded}
                setIsExpanded={setIsContentDisplayExpanded}
                cachedToggles={cachedToggles}
                setCachedToggles={setCachedToggles}
                hasValidCourseSections={hasValidCourseSections}
              />

              <AspectRatioSection
                template={template}
                onUpdateTemplate={onUpdateTemplate}
              />
            </>
          )}

          {/* Event Editor (when event is selected) */}
          {selectedEvent && (
            <EventEditorSection
              template={template}
              onUpdateTemplate={onUpdateTemplate}
              events={events}
              onUpdateEvents={onUpdateEvents}
              selectedEvent={selectedEvent}
              isSelectedEventOverlapping={isSelectedEventOverlapping}
              pendingTimeChanges={pendingTimeChanges}
              setPendingTimeChanges={setPendingTimeChanges}
              timeError={timeError}
              setTimeError={setTimeError}
              onDeleteEvent={onDeleteEvent}
              onDeselectEvent={onDeselectEvent}
            />
          )}
        </div>
      </div>
    </div>
  );
};
