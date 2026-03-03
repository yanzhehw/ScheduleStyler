import React from 'react';
import { Layout, ChevronDown, ChevronRight, Tag, Clock, MapPin, Type } from 'lucide-react';
import { ToggleSwitch } from '../../small_utility/ToggleSwitch';
import { ContentDisplaySectionProps } from './types';

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
        </div>
      )}
    </div>
  );
};
