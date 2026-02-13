import React from 'react';
import { CalendarEvent, TemplateConfig, ClassType } from '../../../types';

export interface EditSidebarSectionProps {
  template: TemplateConfig;
  onUpdateTemplate: (template: TemplateConfig) => void;
}

export interface AddCourseSectionProps extends EditSidebarSectionProps {
  events: CalendarEvent[];
  onUpdateEvents: (events: CalendarEvent[]) => void;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  draft: AddCourseDraft;
  setDraft: (draft: AddCourseDraft) => void;
  errors: AddCourseErrors;
  setErrors: (errors: AddCourseErrors) => void;
  onAddCourse: () => void;
  onClearForm: () => void;
}

export interface AddCourseDraft {
  courseCode: string;
  classType: ClassType;
  customClassType: string;
  location: string;
  selectedDays: boolean[];
  startTime: string;
  endTime: string;
}

export interface AddCourseErrors {
  courseCode?: string;
  days?: string;
  time?: string;
}

export interface ContentDisplaySectionProps extends EditSidebarSectionProps {
  events: CalendarEvent[];
  onUpdateEvents: (events: CalendarEvent[]) => void;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  cachedToggles: CachedToggles | null;
  setCachedToggles: (toggles: CachedToggles | null) => void;
  hasValidCourseSections: boolean;
}

export interface CachedToggles {
  showClassType: boolean;
  showTime: boolean;
  showLocation: boolean;
  showNotes: boolean;
}

export interface AspectRatioSectionProps extends EditSidebarSectionProps {}

export interface EventEditorSectionProps extends EditSidebarSectionProps {
  events: CalendarEvent[];
  onUpdateEvents: (events: CalendarEvent[]) => void;
  selectedEvent: CalendarEvent;
  isSelectedEventOverlapping: boolean;
  pendingTimeChanges: { startTime: string; endTime: string } | null;
  setPendingTimeChanges: (changes: { startTime: string; endTime: string } | null) => void;
  timeError: string | null;
  setTimeError: (error: string | null) => void;
  onDeleteEvent: () => void;
  onDeselectEvent: () => void;
}
