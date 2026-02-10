import React from 'react';
import { Grid, Sun, Moon } from 'lucide-react';
import { GlassRadioGroup } from '../../ui/glass-radio-group';
import { GridSectionProps } from './types';

export const GridSection: React.FC<GridSectionProps> = ({
  template,
  onUpdateTemplate,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          <Grid size={16} /> Grid Lines
        </div>
        <div
          onClick={() => onUpdateTemplate({ ...template, showGrid: !template.showGrid })}
          className={`w-10 h-5 rounded-full relative transition-all duration-300 cursor-pointer shrink-0 ${template.showGrid ? 'toggle-accent-bg' : 'toggle-off-bg'}`}
        >
          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${template.showGrid ? 'left-6' : 'left-1'}`} />
        </div>
      </div>
      {/* Grid Line Style Toggle - only shown when grid is visible */}
      <div className={`overflow-hidden transition-all duration-300 ease-out ${template.showGrid ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
        <GlassRadioGroup
          name="grid-line-style"
          options={[
            { id: 'bright', label: <><Sun size={12} /> Bright</>, value: 'bright' as const },
            { id: 'dark', label: <><Moon size={12} /> Dark</>, value: 'dark' as const },
          ]}
          value={template.gridLineStyle}
          onChange={(val) => onUpdateTemplate({ ...template, gridLineStyle: val })}
        />
      </div>
    </div>
  );
};
