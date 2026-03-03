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
    <div className="space-y-5">
      {/* Warnings */}
      {selectedEvent.isConfidenceLow && (
        <AlertBox message="Check details (low confidence)." type="warning" />
      )}
      {isSelectedEventOverlapping && (
        <div className="rounded-xl border border-red-500/60 bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-100">
          This course has overlaps. Please drag or edit the block to fix issue.
        </div>
      )}

      {/* Days Selection */}
      <div>
        <div className="flex gap-2">
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
                className={`flex-1 relative py-2 px-2 rounded-lg transition-all flex flex-col items-center gap-1`}
              >
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
                <span className={`relative z-10 text-sm font-semibold transition-colors ${isCurrentDay ? 'text-green-300' : existsOnDay ? 'text-blue-300' : 'text-gray-500'}`}>
                  {day}
                </span>
                <div className={`relative z-10 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${isCurrentDay ? 'border-green-400 bg-green-500' : existsOnDay ? 'border-blue-400 bg-blue-500' : 'border-[var(--border-default)]'}`}>
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
          <span className="text-green-400">●</span> Current &nbsp;
          <span className="text-blue-400">●</span> Add/remove from other days
        </p>
      </div>

      {/* Course Code + Class Type */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Course Code</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={showCourseSection ? selectedEvent.title : selectedEvent.displayTitle}
            onChange={(e) => onUpdateEvent(showCourseSection ? 'title' : 'displayTitle', e.target.value)}
            className="flex-1 rounded-lg input-themed p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
            placeholder="e.g. CS 101"
          />
          <ThemedDropdown
            options={CLASS_TYPES.map((type) => ({ id: type, label: type, value: type }))}
            value={selectedEvent.classType}
            onChange={(val) => onUpdateEvent('classType', val as ClassType)}
            className="w-24"
          />
        </div>
      </div>

      {/* Custom Class Type */}
      {selectedEvent.classType === 'Custom' && (
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Custom Class Type</label>
          <input
            type="text"
            value={selectedEvent.customClassType || ''}
            onChange={(e) => onUpdateEvent('customClassType', e.target.value)}
            className="w-full rounded-lg input-themed p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            placeholder="e.g. Workshop"
          />
        </div>
      )}

      {/* Time */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-400">Time</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Start</label>
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
              className="w-full rounded-md input-themed p-2 text-white text-sm outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">End</label>
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
              className="w-full rounded-md input-themed p-2 text-white text-sm outline-none font-mono"
            />
          </div>
        </div>
        {timeError && <p className="text-xs text-red-400">{timeError}</p>}
        {hasUnsavedTimeChanges && (
          <button
            type="button"
            onClick={onSaveTimeChanges}
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
          onChange={(e) => onUpdateEvent('location', e.target.value)}
          className="w-full rounded-md input-themed p-2 text-white text-sm outline-none"
        />
      </div>

      {/* Delete Button */}
      <div className="pt-4 border-t" style={{ borderColor: 'var(--border-muted)' }}>
        <button
          onClick={onDeleteEvent}
          className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 rounded-md transition-colors text-sm"
        >
          <Trash2 size={14} /> Delete Event
        </button>
      </div>
    </div>
  );
};
