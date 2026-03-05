import React from 'react';
import { Clock, Grid, MapPin, StickyNote, Sun, Moon, Tag } from 'lucide-react';
import { ToggleSwitch } from '../../small_utility/ToggleSwitch';
import { GlassRadioGroup } from '../../ui/glass-radio-group';
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
  // Grid: 'none' when showGrid is false, otherwise gridLineStyle
  const gridValue = template.showGrid ? (template.gridLineStyle || 'bright') : 'none';

  return (
    <div className="space-y-2">
      {/* Row 1: Compact + Grid (3-option radio) */}
      <div className="grid grid-cols-2 gap-1.5">
        <div className="p-2 rounded-lg border card-section-themed" style={{ borderColor: 'var(--border-default)' }}>
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
            label={<span className="text-[11px] text-gray-200 font-medium">Compact</span>}
          />
        </div>
        <div className="p-1.5 rounded-lg card-section-themed flex items-center justify-between gap-1.5" style={{ borderColor: 'var(--border-default)' }}>
          <span className="flex items-center gap-1 text-[11px] text-gray-300 shrink-0"><Grid size={10} /> Grid</span>
          <GlassRadioGroup
            name="mobile-grid-style"
            options={[
              { id: 'none', label: 'Off', value: 'none' as const },
              { id: 'bright', label: <><Sun size={9} /></>, value: 'bright' as const },
              { id: 'dark', label: <><Moon size={9} /></>, value: 'dark' as const },
            ]}
            value={gridValue}
            onChange={(val) => {
              if (val === 'none') {
                onUpdateTemplate({ ...template, showGrid: false });
              } else {
                onUpdateTemplate({ ...template, showGrid: true, gridLineStyle: val });
              }
            }}
            compact
          />
        </div>
      </div>

      {/* Row 2-3: 2x2 grid of content toggles */}
      <div className={`grid grid-cols-2 gap-1.5 ${template.compact ? 'opacity-40 pointer-events-none' : ''}`}>
        <div className="p-2 rounded-lg card-section-themed">
          <ToggleSwitch
            enabled={template.showClassType}
            onToggle={() => onUpdateTemplate({ ...template, showClassType: !template.showClassType })}
            label={<span className="flex items-center gap-1 text-[11px] text-gray-300"><Tag size={10} /> Type</span>}
            disabled={template.compact}
          />
        </div>
        <div className="p-2 rounded-lg card-section-themed">
          <ToggleSwitch
            enabled={template.showTime}
            onToggle={() => onUpdateTemplate({ ...template, showTime: !template.showTime })}
            label={<span className="flex items-center gap-1 text-[11px] text-gray-300"><Clock size={10} /> Time</span>}
            disabled={template.compact}
          />
        </div>
        <div className="p-2 rounded-lg card-section-themed">
          <ToggleSwitch
            enabled={template.showLocation}
            onToggle={() => onUpdateTemplate({ ...template, showLocation: !template.showLocation })}
            label={<span className="flex items-center gap-1 text-[11px] text-gray-300"><MapPin size={10} /> Location</span>}
            disabled={template.compact}
          />
        </div>
        <div className="p-2 rounded-lg card-section-themed">
          <ToggleSwitch
            enabled={template.showNotes}
            onToggle={() => onUpdateTemplate({ ...template, showNotes: !template.showNotes })}
            label={<span className="flex items-center gap-1 text-[11px] text-gray-300"><StickyNote size={10} /> Notes</span>}
            disabled={template.compact}
          />
        </div>
      </div>
    </div>
  );
};
