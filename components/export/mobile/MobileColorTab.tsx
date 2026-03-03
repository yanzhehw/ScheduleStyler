import React from 'react';
import { Palette, TypeIcon } from 'lucide-react';
import { COLOR_PALETTES, ColorPalette } from '../../../themes';
import { MobileColorTabProps } from './types';

interface MobileColorTabInternalProps extends MobileColorTabProps {
  applyColorToAll: boolean;
  setApplyColorToAll: (value: boolean) => void;
  themeColors: string[];
  currentPalette: ColorPalette;
  showPalettePicker: boolean;
  setShowPalettePicker: (value: boolean) => void;
  setActivePaletteId: (id: string) => void;
  events: any[];
  onUpdateEvents: (events: any[]) => void;
  shuffleColorsForEvents: (differentiateTypes: boolean) => void;
  triggerColorUpdate: (diff: boolean) => void;
  setShowFontSelector: (value: boolean) => void;
}

export const MobileColorTab: React.FC<MobileColorTabInternalProps> = ({
  template,
  onUpdateTemplate,
  selectedEvent,
  eventColors,
  defaultEventColors,
  handleColorChange,
  applyColorToAll,
  setApplyColorToAll,
  themeColors,
  currentPalette,
  showPalettePicker,
  setShowPalettePicker,
  setActivePaletteId,
  events,
  onUpdateEvents,
  shuffleColorsForEvents,
  triggerColorUpdate,
  setShowFontSelector,
}) => {
  if (!selectedEvent) {
    return (
      <div className="text-xs text-gray-400 italic text-center py-2">
        Tap an event to edit color
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Apply to All + Shuffle row */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 px-2 py-1.5 rounded-lg card-section-themed">
          <span className="text-xs text-gray-300">All Blocks</span>
          <div
            onClick={() => {
              const newValue = !applyColorToAll;
              setApplyColorToAll(newValue);
              if (newValue && selectedEvent) {
                const currentOpacity = selectedEvent.opacity ?? template.eventOpacity;
                const updatedEvents = events.map(e => ({
                  ...e,
                  color: selectedEvent.color,
                  opacity: currentOpacity,
                }));
                onUpdateEvents(updatedEvents);
                onUpdateTemplate({ ...template, eventOpacity: currentOpacity });
              } else if (!newValue) {
                shuffleColorsForEvents(template.differentiateTypes);
              }
            }}
            className={`w-9 h-4 rounded-full relative transition-all duration-300 cursor-pointer ${applyColorToAll ? 'toggle-accent-bg' : 'toggle-off-bg'}`}
          >
            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-200 ${applyColorToAll ? 'left-5' : 'left-0.5'}`} />
          </div>
        </div>
        {!applyColorToAll && (
          <button
            onClick={() => shuffleColorsForEvents(template.differentiateTypes)}
            className="px-2 py-1.5 text-xs font-medium text-gray-300 rounded-lg border border-[var(--border-default)] button-ghost-themed"
          >
            🎲 Shuffle
          </button>
        )}
      </div>

      {/* Color swatches - compact */}
      <div className="grid grid-cols-6 gap-1.5">
        {themeColors.map(color => (
          <button
            key={color}
            onClick={() => handleColorChange(color)}
            className={`w-8 h-8 rounded-full border-2 transition-all ${
              selectedEvent.color === color
                ? 'border-white ring-2 ring-blue-400 ring-offset-1 ring-offset-gray-900'
                : 'border-transparent'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Palette Picker - inline */}
      <button
        onClick={() => setShowPalettePicker(!showPalettePicker)}
        className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors cursor-pointer flex items-center gap-1 ml-auto"
      >
        <Palette size={10} />
        {showPalettePicker ? 'Hide' : `${currentPalette.name} · Change`}
      </button>

      {showPalettePicker && (
        <div className="p-2 rounded-lg border card-section-themed max-h-[120px] overflow-y-auto">
          {COLOR_PALETTES.map((palette: ColorPalette) => (
            <button
              key={palette.id}
              onClick={() => {
                setActivePaletteId(palette.id);
                const newColors = palette.colors;
                if (applyColorToAll) {
                  const randomColor = newColors[Math.floor(Math.random() * newColors.length)];
                  const updatedEvents = events.map(e => ({ ...e, color: randomColor }));
                  onUpdateEvents(updatedEvents);
                } else {
                  const courseColorMap = new Map<string, string>();
                  let colorIndex = 0;
                  const updatedEvents = events.map(e => {
                    const key = template.differentiateTypes
                      ? `${e.displayTitle}-${e.classType}`
                      : e.displayTitle;
                    if (!courseColorMap.has(key)) {
                      courseColorMap.set(key, newColors[colorIndex % newColors.length]);
                      colorIndex++;
                    }
                    return { ...e, color: courseColorMap.get(key)! };
                  });
                  onUpdateEvents(updatedEvents);
                }
                setShowPalettePicker(false);
              }}
              className={`w-full flex items-center gap-2 p-1 rounded transition-all ${
                currentPalette.id === palette.id ? 'bg-blue-600/30' : 'hover:opacity-80'
              }`}
            >
              <div className="flex gap-0.5">
                {palette.colors.slice(0, 5).map((color, idx) => (
                  <div key={idx} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                ))}
              </div>
              <span className="text-[10px] text-gray-300">{palette.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Compact toggles row */}
      <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-muted)]">
        {/* Opacity - only for certain themes */}
        {(template.themeFamily === 'acrylic' || template.themeFamily === 'solid-grain' || template.themeFamily === 'glass') && (
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[10px] text-gray-400">Opacity</span>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={applyColorToAll ? template.eventOpacity : (selectedEvent.opacity ?? template.eventOpacity)}
              onChange={(e) => {
                const newOpacity = parseFloat(e.target.value);
                if (applyColorToAll) {
                  onUpdateTemplate({ ...template, eventOpacity: newOpacity });
                  const updatedEvents = events.map(ev => ({ ...ev, opacity: undefined }));
                  onUpdateEvents(updatedEvents);
                } else {
                  const updatedEvents = events.map(ev =>
                    ev.displayTitle === selectedEvent?.displayTitle
                      ? { ...ev, opacity: newOpacity }
                      : ev
                  );
                  onUpdateEvents(updatedEvents);
                }
              }}
              className="w-16 h-1 rounded-lg appearance-none cursor-pointer slider-accent slider-track-themed"
            />
          </div>
        )}

        {/* No Borders - only for certain themes */}
        {(template.themeFamily === 'acrylic' || template.themeFamily === 'solid-grain' || template.themeFamily === 'glass') && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400">No Border</span>
            <div
              onClick={() => onUpdateTemplate({ ...template, eventBlockNoBorders: !template.eventBlockNoBorders })}
              className={`w-7 h-3.5 rounded-full relative transition-all cursor-pointer ${template.eventBlockNoBorders ? 'toggle-accent-bg' : 'toggle-off-bg'}`}
            >
              <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-all ${template.eventBlockNoBorders ? 'left-4' : 'left-0.5'}`} />
            </div>
          </div>
        )}

        {/* Diff Colors */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400">Diff Lab</span>
          <div
            onClick={() => triggerColorUpdate(!template.differentiateTypes)}
            className={`w-7 h-3.5 rounded-full relative transition-all cursor-pointer ${template.differentiateTypes ? 'toggle-accent-bg' : 'toggle-off-bg'}`}
          >
            <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-all ${template.differentiateTypes ? 'left-4' : 'left-0.5'}`} />
          </div>
        </div>
      </div>

      {/* Edit Fonts Button - compact */}
      <button
        onClick={() => setShowFontSelector(true)}
        className="w-full px-2 py-1.5 button-ghost-themed rounded-lg text-xs text-gray-200 font-medium transition-colors flex items-center justify-center gap-1.5 border-t border-[var(--border-muted)] mt-1"
      >
        <TypeIcon size={12} /> Edit Fonts
      </button>
    </div>
  );
};
