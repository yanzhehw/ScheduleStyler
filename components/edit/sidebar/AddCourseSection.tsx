import React from 'react';
import { CirclePlus, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import { ThemedDropdown } from '../../ui/themed-dropdown';
import { ClassType } from '../../../types';
import { AddCourseSectionProps } from './types';

const CLASS_TYPES: ClassType[] = ['Lecture', 'Tutorial', 'Lab', 'Seminar', 'Unknown', 'Custom'];

export const AddCourseSection: React.FC<AddCourseSectionProps> = ({
  isExpanded,
  setIsExpanded,
  draft,
  setDraft,
  errors,
  setErrors,
  onAddCourse,
  onClearForm,
}) => {
  return (
    <div className="p-4 rounded-xl border card-section-themed">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-sm text-blue-300 font-medium hover:text-blue-200 transition-colors"
      >
        <div className="flex items-center gap-2">
          <CirclePlus size={14} /> Add Course
        </div>
        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      {isExpanded && (
        <div className="space-y-4 mt-4">
          {/* Days of Week */}
          <div>
            <div className="flex gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, index) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    const newSelectedDays = [...draft.selectedDays];
                    newSelectedDays[index] = !newSelectedDays[index];
                    setDraft({ ...draft, selectedDays: newSelectedDays });
                    if (errors.days) setErrors({ ...errors, days: undefined });
                  }}
                  className="flex-1 relative py-2 px-2 rounded-lg transition-all flex flex-col items-center gap-1"
                >
                  {draft.selectedDays[index] && (
                    <div
                      className="absolute inset-0 rounded-lg opacity-80"
                      style={{
                        background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.5) 0%, rgba(59, 130, 246, 0.2) 50%, transparent 70%)',
                      }}
                    />
                  )}
                  <span className={`relative z-10 text-sm font-semibold transition-colors ${draft.selectedDays[index]
                      ? 'text-blue-300'
                      : errors.days
                        ? 'text-red-400/70'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}>
                    {day}
                  </span>
                  <div className={`relative z-10 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${draft.selectedDays[index]
                      ? 'border-blue-400 bg-blue-500'
                      : errors.days
                        ? 'border-red-400/50'
                        : 'border-[var(--border-day-selector)]'
                    }`}>
                    {draft.selectedDays[index] && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
            {errors.days && (
              <p className="text-xs text-red-400 mt-1">{errors.days}</p>
            )}
          </div>

          {/* Course Code & Class Type */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Course Code & Type</label>
            <div className="flex gap-2 min-w-0">
              <input
                type="text"
                value={draft.courseCode}
                onChange={(e) => {
                  setDraft({ ...draft, courseCode: e.target.value });
                  if (errors.courseCode) setErrors({ ...errors, courseCode: undefined });
                }}
                className={`w-35 shrink-0 rounded-lg p-2.5 text-white outline-none text-sm input-themed ${
                  errors.courseCode ? 'border-red-500' : ''
                }`}
                placeholder="e.g. CS 101"
              />
              <ThemedDropdown
                options={CLASS_TYPES.map((type) => ({
                  id: type,
                  label: type,
                  value: type,
                }))}
                value={draft.classType}
                onChange={(val) => setDraft({ ...draft, classType: val as ClassType })}
                className="flex-1 min-w-0"
              />
            </div>
            {errors.courseCode && (
              <p className="text-xs text-red-400 mt-1">{errors.courseCode}</p>
            )}
          </div>

          {/* Custom Class Type */}
          {draft.classType === 'Custom' && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Custom Type Name</label>
              <input
                type="text"
                value={draft.customClassType}
                onChange={(e) => setDraft({ ...draft, customClassType: e.target.value })}
                className="w-full rounded-lg input-themed p-2.5 text-white outline-none text-sm"
                placeholder="e.g. Workshop"
              />
            </div>
          )}

          {/* Start/End Time */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${errors.time ? 'text-red-400' : 'text-gray-400'}`}>
              Time (24h format)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Start</label>
                <input
                  type="text"
                  value={draft.startTime}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[0-9:]*$/.test(val) && val.length <= 5) {
                      setDraft({ ...draft, startTime: val });
                      if (errors.time) setErrors({ ...errors, time: undefined });
                    }
                  }}
                  onBlur={(e) => {
                    let val = e.target.value.replace(/[^0-9]/g, '');
                    if (val.length >= 3 && val.length <= 4) {
                      const hours = val.slice(0, -2).padStart(2, '0');
                      const mins = val.slice(-2);
                      setDraft({ ...draft, startTime: `${hours}:${mins}` });
                    }
                  }}
                  placeholder="09:00"
                  className={`w-full rounded-md p-2 text-white text-sm outline-none focus:border-blue-500 font-mono input-themed ${
                    errors.time ? 'border-red-500' : ''
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">End</label>
                <input
                  type="text"
                  value={draft.endTime}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[0-9:]*$/.test(val) && val.length <= 5) {
                      setDraft({ ...draft, endTime: val });
                      if (errors.time) setErrors({ ...errors, time: undefined });
                    }
                  }}
                  onBlur={(e) => {
                    let val = e.target.value.replace(/[^0-9]/g, '');
                    if (val.length >= 3 && val.length <= 4) {
                      const hours = val.slice(0, -2).padStart(2, '0');
                      const mins = val.slice(-2);
                      setDraft({ ...draft, endTime: `${hours}:${mins}` });
                    }
                  }}
                  placeholder="10:00"
                  className={`w-full rounded-md p-2 text-white text-sm outline-none focus:border-blue-500 font-mono input-themed ${
                    errors.time ? 'border-red-500' : ''
                  }`}
                />
              </div>
            </div>
            {errors.time && (
              <p className="text-xs text-red-400 mt-1">{errors.time}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Location (optional)</label>
            <input
              type="text"
              value={draft.location}
              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              className="w-full rounded-lg input-themed p-2.5 text-white outline-none text-sm"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClearForm}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm hover:text-white rounded-lg transition-colors button-ghost-themed"
              style={{ color: 'var(--text-secondary)' }}
            >
              <RotateCcw size={14} /> Clear
            </button>
            <button
              type="button"
              onClick={onAddCourse}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium btn-accent text-white rounded-lg"
            >
              <CirclePlus size={14} /> Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
