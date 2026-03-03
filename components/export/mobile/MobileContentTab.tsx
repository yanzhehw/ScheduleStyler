import React from 'react';
import { Clock, Grid, MapPin, Tag } from 'lucide-react';
import { ToggleSwitch } from '../../small_utility/ToggleSwitch';
import { MobileContentTabProps } from './types';

interface MobileContentTabInternalProps extends MobileContentTabProps {
  cachedToggles: {
    showClassType: boolean;
    showTime: boolean;
    showLocation: boolean;
    showNotes: boolean;
  } | null;
  setCachedToggles: (toggles: {
    showClassType: boolean;
    showTime: boolean;
    showLocation: boolean;
    showNotes: boolean;
  } | null) => void;
}

export const MobileContentTab: React.FC<MobileContentTabInternalProps> = ({
  template,
  onUpdateTemplate,
  cachedToggles,
  setCachedToggles,
}) => {
  return (
    <div className="space-y-2">
      {/* Compact View */}
      <div className="p-3 rounded-lg border card-section-themed">
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
          label={<span className="text-sm text-gray-200 font-medium">Compact View</span>}
        />
      </div>

      {/* Other toggles */}
      <div className={`space-y-1 ${template.compact ? 'opacity-40 pointer-events-none' : ''}`}>
        <div className="p-3 rounded-lg card-section-themed">
          <ToggleSwitch
            enabled={template.showClassType}
            onToggle={() => onUpdateTemplate({ ...template, showClassType: !template.showClassType })}
            label={<span className="flex items-center gap-3 text-sm text-gray-300"><Tag size={14} /> Class Type</span>}
            disabled={template.compact}
          />
        </div>
        <div className="p-3 rounded-lg card-section-themed">
          <ToggleSwitch
            enabled={template.showTime}
            onToggle={() => onUpdateTemplate({ ...template, showTime: !template.showTime })}
            label={<span className="flex items-center gap-3 text-sm text-gray-300"><Clock size={14} /> Time</span>}
            disabled={template.compact}
          />
        </div>
        <div className="p-3 rounded-lg card-section-themed">
          <ToggleSwitch
            enabled={template.showLocation}
            onToggle={() => onUpdateTemplate({ ...template, showLocation: !template.showLocation })}
            label={<span className="flex items-center gap-3 text-sm text-gray-300"><MapPin size={14} /> Location</span>}
            disabled={template.compact}
          />
        </div>
      </div>

      {/* Grid Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg card-section-themed mt-4">
        <span className="flex items-center gap-2 text-sm text-gray-300"><Grid size={14} /> Show Grid</span>
        <div
          onClick={() => onUpdateTemplate({ ...template, showGrid: !template.showGrid })}
          className={`w-10 h-5 rounded-full relative transition-all duration-300 cursor-pointer ${template.showGrid ? 'toggle-accent-bg' : 'toggle-off-bg'}`}
        >
          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${template.showGrid ? 'left-6' : 'left-1'}`} />
        </div>
      </div>
    </div>
  );
};
