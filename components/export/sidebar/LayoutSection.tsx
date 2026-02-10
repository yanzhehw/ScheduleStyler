import React from 'react';
import { Layout, Tag, Clock, MapPin, Type } from 'lucide-react';
import { ToggleSwitch } from '../../ToggleSwitch';
import { LayoutSectionProps } from './types';

interface CachedToggles {
  showClassType: boolean;
  showTime: boolean;
  showLocation: boolean;
  showNotes: boolean;
}

interface LayoutSectionExtendedProps extends LayoutSectionProps {
  cachedToggles: CachedToggles | null;
  setCachedToggles: (toggles: CachedToggles) => void;
}

export const LayoutSection: React.FC<LayoutSectionExtendedProps> = ({
  template,
  onUpdateTemplate,
  cachedToggles,
  setCachedToggles,
}) => {
  const handleCompactToggle = () => {
    const newCompact = !template.compact;
    if (newCompact) {
      // Cache current toggle states before enabling compact
      setCachedToggles({
        showClassType: template.showClassType,
        showTime: template.showTime,
        showLocation: template.showLocation,
        showNotes: template.showNotes
      });
      // Disable all content options
      onUpdateTemplate({
        ...template,
        compact: true,
        showClassType: false,
        showTime: false,
        showLocation: false,
        showNotes: false
      });
    } else {
      // Restore cached toggle states
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
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
        <Layout size={16} /> Content
      </div>
      <div className="space-y-1">
        {/* Compact View at top - toggles off other options when enabled */}
        <div className="p-2.5 rounded-lg border transition-colors card-section-themed hover:opacity-90">
          <ToggleSwitch
            enabled={template.compact}
            onToggle={handleCompactToggle}
            label={<span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>Compact View</span>}
          />
        </div>

        {/* Other content options - disabled when compact is on */}
        <div className={`space-y-1 ${template.compact ? 'opacity-40 pointer-events-none' : ''}`}>
          <ToggleItem
            enabled={template.showClassType}
            onToggle={() => onUpdateTemplate({ ...template, showClassType: !template.showClassType })}
            icon={<Tag size={12} />}
            label="Class Type"
            disabled={template.compact}
          />
          <ToggleItem
            enabled={template.showTime}
            onToggle={() => onUpdateTemplate({ ...template, showTime: !template.showTime })}
            icon={<Clock size={12} />}
            label="Time"
            disabled={template.compact}
          />
          <ToggleItem
            enabled={template.showLocation}
            onToggle={() => onUpdateTemplate({ ...template, showLocation: !template.showLocation })}
            icon={<MapPin size={12} />}
            label="Location"
            disabled={template.compact}
          />
          <ToggleItem
            enabled={template.showNotes}
            onToggle={() => onUpdateTemplate({ ...template, showNotes: !template.showNotes })}
            icon={<Type size={12} />}
            label="Notes"
            disabled={template.compact}
          />
        </div>
      </div>
    </div>
  );
};

interface ToggleItemProps {
  enabled: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}

const ToggleItem: React.FC<ToggleItemProps> = ({ enabled, onToggle, icon, label, disabled }) => (
  <div className="p-2.5 rounded-lg border border-transparent hover:border-[var(--border-muted)] transition-colors card-section-themed hover:opacity-90">
    <ToggleSwitch
      enabled={enabled}
      onToggle={onToggle}
      label={
        <span className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          {icon} {label}
        </span>
      }
      disabled={disabled}
    />
  </div>
);
