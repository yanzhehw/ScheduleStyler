import React from 'react';
import { Layout, ChevronDown, ChevronRight, Tag, Clock, MapPin, Type, CalendarDays } from 'lucide-react';
import { ToggleSwitch } from '../../small_utility/ToggleSwitch';
import { ContentDisplaySectionProps } from './types';

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const ContentDisplaySection: React.FC<ContentDisplaySectionProps> = ({
  template,
  onUpdateTemplate,
  events,
  onUpdateEvents,
  isExpanded,
  setIsExpanded,
  cachedToggles,
  setCachedToggles,
  hasValidCourseSections,
}) => {
  return (
    <div className="p-4 rounded-xl border card-section-themed">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-sm text-gray-300 font-medium hover:text-white transition-colors"
      >
        <div className="flex items-center gap-2">
          <Layout size={14} /> Content Display
        </div>
        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      {isExpanded && (
        <div className="space-y-2 mt-4">
          {/* Include Course Section toggle */}
          {hasValidCourseSections && (
            <div className="p-2 hover:opacity-80 rounded-lg transition-colors">
              <ToggleSwitch
                enabled={template.showCourseSection}
                onToggle={() => onUpdateTemplate({ ...template, showCourseSection: !template.showCourseSection })}
                label={<span className="flex items-center gap-2"><Tag size={12} /> Include Course Section</span>}
              />
            </div>
          )}

          {/* Compact View */}
          <div className="p-2 hover:opacity-80 rounded-lg transition-colors border" style={{ borderColor: 'var(--border-default)' }}>
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

          {/* Other content options */}
          <div className={`space-y-2 ${template.compact ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="p-2 hover:opacity-80 rounded-lg transition-colors">
              <ToggleSwitch
                enabled={template.showClassType}
                onToggle={() => onUpdateTemplate({ ...template, showClassType: !template.showClassType })}
                label={<span className="flex items-center gap-2"><Tag size={12} /> Show Class Type</span>}
                disabled={template.compact}
              />
            </div>

            <div className="p-2 hover:opacity-80 rounded-lg transition-colors">
              <ToggleSwitch
                enabled={template.showTime}
                onToggle={() => onUpdateTemplate({ ...template, showTime: !template.showTime })}
                label={<span className="flex items-center gap-2"><Clock size={12} /> Show Time</span>}
                disabled={template.compact}
              />
            </div>

            <div className="p-2 hover:opacity-80 rounded-lg transition-colors">
              <ToggleSwitch
                enabled={template.showLocation}
                onToggle={() => onUpdateTemplate({ ...template, showLocation: !template.showLocation })}
                label={<span className="flex items-center gap-2"><MapPin size={12} /> Show Location</span>}
                disabled={template.compact}
              />
            </div>

            <div className="p-2 hover:opacity-80 rounded-lg transition-colors">
              <ToggleSwitch
                enabled={template.showNotes}
                onToggle={() => {
                  const updatedEvents = events.map(e => ({ ...e, includeNotes: undefined }));
                  onUpdateEvents(updatedEvents);
                  onUpdateTemplate({ ...template, showNotes: !template.showNotes });
                }}
                label={<span className="flex items-center gap-2"><Type size={12} /> Show Notes</span>}
                disabled={template.compact}
              />
            </div>
          </div>

          {/* Include Weekend */}
          <div className="p-2 hover:opacity-80 rounded-lg transition-colors">
            <ToggleSwitch
              enabled={template.includeWeekend}
              onToggle={() => onUpdateTemplate({ ...template, includeWeekend: !template.includeWeekend })}
              label={<span className="flex items-center gap-2"><CalendarDays size={12} /> Include Weekend</span>}
            />
          </div>

          {/* First Day of Week (only visible when weekend is included) */}
          {template.includeWeekend && (
            <div className="p-2 hover:opacity-80 rounded-lg transition-colors flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-gray-400"><CalendarDays size={12} /> First Day of Week</span>
              <select
                value={template.firstDayOfWeek ?? 0}
                onChange={(e) => onUpdateTemplate({ ...template, firstDayOfWeek: parseInt(e.target.value) })}
                className="bg-transparent border rounded px-2 py-1 text-xs text-gray-400 focus:outline-none"
                style={{ borderColor: 'var(--border-default)' }}
              >
                {DAY_LABELS.map((day, i) => (
                  <option key={i} value={i} className="bg-gray-800 text-gray-200">{day.slice(0, 3)}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
