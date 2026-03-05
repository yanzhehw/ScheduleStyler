import React from 'react';
import { Trash2, Save } from 'lucide-react';
import { CalendarEvent, ClassType } from '../../../types';
import { AlertBox } from '../../small_utility/AlertBox';
import { ThemedDropdown } from '../../ui/themed-dropdown';

const CLASS_TYPES: ClassType[] = ['Lecture', 'Tutorial', 'Lab', 'Seminar', 'Unknown', 'Custom'];

interface MobileEditEventPanelProps {
  selectedEvent: CalendarEvent;
  events: CalendarEvent[];
  isSelectedEventOverlapping: boolean;
  showCourseSection: boolean;
  pendingTimeChanges: { startTime: string; endTime: string } | null;
  timeError: string | null;
  hasUnsavedTimeChanges: boolean | null | undefined;
  onUpdateEvent: (key: keyof CalendarEvent, value: any) => void;
  onDeleteEvent: () => void;
  onUpdateEvents: (events: CalendarEvent[]) => void;
  onPendingTimeChange: (field: 'startTime' | 'endTime', value: string) => void;
  onSaveTimeChanges: () => void;
}

export const MobileEditEventPanel: React.FC<MobileEditEventPanelProps> = ({
  selectedEvent,
  events,
  isSelectedEventOverlapping,
  showCourseSection,
  pendingTimeChanges,
  timeError,
  hasUnsavedTimeChanges,
  onUpdateEvent,
  onDeleteEvent,
  onUpdateEvents,
  onPendingTimeChange,
  onSaveTimeChanges,
}) => {
  return (
    <div className="space-y-2">
      {/* Warnings */}
      {selectedEvent.isConfidenceLow && (
        <AlertBox message="Check details (low confidence)." type="warning" />
      )}
      {isSelectedEventOverlapping && (
        <div className="rounded-md border border-red-500/60 bg-red-500/15 px-2 py-1.5 text-xs font-semibold text-red-100">
          This course has overlaps. Drag or edit the block to fix.
        </div>
      )}

      {/* Days Selection */}
      <div>
        <div className="flex gap-1.5">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, index) => {
            const isCurrentDay = selectedEvent.dayIndex === index;
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
                  if (isCurrentDay) return;
                  if (existsOnDay) {
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
                    const newEvent: CalendarEvent = {
                      ...selectedEvent,
                      id: `evt-${Date.now()}-${index}-${Math.random().toString(16).slice(2, 8)}`,
                      dayIndex: index,
                    };
                    onUpdateEvents([...events, newEvent]);
                  }
                }}
                className={`flex-1 relative py-1 rounded-md transition-all flex flex-col items-center gap-0.5`}
              >
                {(isCurrentDay || existsOnDay) && (
                  <div
                    className="absolute inset-0 rounded-md opacity-80"
                    style={{
                      background: isCurrentDay
                        ? 'radial-gradient(ellipse at center, rgba(34, 197, 94, 0.5) 0%, rgba(34, 197, 94, 0.2) 50%, transparent 70%)'
                        : 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.5) 0%, rgba(59, 130, 246, 0.2) 50%, transparent 70%)',
                    }}
                  />
                )}
                <span className={`relative z-10 text-xs font-semibold transition-colors ${isCurrentDay ? 'text-green-300' : existsOnDay ? 'text-blue-300' : 'text-gray-500'}`}>
                  {day}
                </span>
                <div className={`relative z-10 w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-all ${isCurrentDay ? 'border-green-400 bg-green-500' : existsOnDay ? 'border-blue-400 bg-blue-500' : 'border-[var(--border-default)]'}`}>
                  {(isCurrentDay || existsOnDay) && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-gray-500 mt-1 text-center">
          <span className="text-green-400">●</span> Current &nbsp;
          <span className="text-blue-400">●</span> Add/remove from other days
        </p>
      </div>

      {/* Course Code + Class Type */}
      <div>
        <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Course Code & Type</label>
        <div className="flex gap-1.5 min-w-0">
          <input
            type="text"
            value={showCourseSection ? selectedEvent.title : selectedEvent.displayTitle}
            onChange={(e) => onUpdateEvent(showCourseSection ? 'title' : 'displayTitle', e.target.value)}
            className="w-[12.5rem] shrink-0 rounded-md input-themed px-2 py-1 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
            placeholder="e.g. CS 101"
          />
          <ThemedDropdown
            options={CLASS_TYPES.map((type) => ({ id: type, label: type, value: type }))}
            value={selectedEvent.classType}
            onChange={(val) => onUpdateEvent('classType', val as ClassType)}
            className="flex-1 min-w-0"
          />
        </div>
      </div>

      {/* Custom Class Type */}
      {selectedEvent.classType === 'Custom' && (
        <div>
          <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Custom Type</label>
          <input
            type="text"
            value={selectedEvent.customClassType || ''}
            onChange={(e) => onUpdateEvent('customClassType', e.target.value)}
            className="w-full rounded-md input-themed px-2 py-1 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
            placeholder="e.g. Workshop"
          />
        </div>
      )}

      {/* Time & Location — single row like Add form */}
      <div>
        <label className={`block text-[10px] font-medium mb-0.5 ${timeError ? 'text-red-400' : 'text-gray-400'}`}>
          Time & Location
        </label>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={pendingTimeChanges?.startTime ?? selectedEvent.startTime}
            onChange={(e) => {
              const val = e.target.value;
              if (/^[0-9:]*$/.test(val) && val.length <= 5) {
                onPendingTimeChange('startTime', val);
              }
            }}
            onBlur={(e) => {
              let val = e.target.value.replace(/[^0-9]/g, '');
              if (val.length >= 3 && val.length <= 4) {
                const hours = val.slice(0, -2).padStart(2, '0');
                const mins = val.slice(-2);
                onPendingTimeChange('startTime', `${hours}:${mins}`);
              }
            }}
            placeholder="09:00"
            className={`w-[72px] shrink-0 rounded-md px-2 py-1 text-white text-xs outline-none focus:border-blue-500 font-mono text-center input-themed ${timeError ? 'border-red-500' : ''}`}
          />
          <input
            type="text"
            value={pendingTimeChanges?.endTime ?? selectedEvent.endTime}
            onChange={(e) => {
              const val = e.target.value;
              if (/^[0-9:]*$/.test(val) && val.length <= 5) {
                onPendingTimeChange('endTime', val);
              }
            }}
            onBlur={(e) => {
              let val = e.target.value.replace(/[^0-9]/g, '');
              if (val.length >= 3 && val.length <= 4) {
                const hours = val.slice(0, -2).padStart(2, '0');
                const mins = val.slice(-2);
                onPendingTimeChange('endTime', `${hours}:${mins}`);
              }
            }}
            placeholder="10:00"
            className={`w-[72px] shrink-0 rounded-md px-2 py-1 text-white text-xs outline-none focus:border-blue-500 font-mono text-center input-themed ${timeError ? 'border-red-500' : ''}`}
          />
          <input
            type="text"
            value={selectedEvent.location}
            onChange={(e) => onUpdateEvent('location', e.target.value)}
            placeholder="Location"
            className="flex-1 min-w-0 rounded-md input-themed px-2 py-1 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
          />
        </div>
        {timeError && <p className="text-[10px] text-red-400 mt-0.5">{timeError}</p>}
        {hasUnsavedTimeChanges && (
          <button
            type="button"
            onClick={onSaveTimeChanges}
            className="inline-btn w-full flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors mt-1.5"
          >
            <Save size={12} /> Save Time
          </button>
        )}
      </div>

      {/* Delete Button */}
      <div className="pt-2 border-t" style={{ borderColor: 'var(--border-muted)' }}>
        <button
          onClick={onDeleteEvent}
          className="inline-btn w-full flex items-center justify-center gap-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 py-1 rounded-md transition-colors text-xs"
        >
          <Trash2 size={12} /> Delete Event
        </button>
      </div>
    </div>
  );
};
