import React from 'react';
import { Palette } from 'lucide-react';
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
  setShowFontSelector?: (value: boolean) => void;
}

const MiniToggle: React.FC<{ label: string; enabled: boolean; onToggle: () => void }> = ({ label, enabled, onToggle }) => (
  <div className="flex items-center justify-between w-full gap-2 cursor-pointer" onClick={onToggle}>
    <span className="text-[10px] text-gray-400">{label}</span>
    <div className={`w-7 h-3.5 rounded-full relative transition-all ${enabled ? 'toggle-accent-bg' : 'toggle-off-bg'}`}>
      <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-all ${enabled ? 'left-4' : 'left-0.5'}`} />
    </div>
  </div>
);

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

  const showThemeToggles = template.themeFamily === 'acrylic' || template.themeFamily === 'solid-grain' || template.themeFamily === 'glass';

  return (
    <div className="space-y-2">
      {/* Two-column module: toggles left, swatches right */}
      <div className="rounded-md border card-section-themed p-2">
        <div className="flex gap-2">
          {/* Left column: toggles + opacity */}
          <div className="flex-1 space-y-1.5">
            {showThemeToggles && (
              <MiniToggle
                label="No Border"
                enabled={!!template.eventBlockNoBorders}
                onToggle={() => onUpdateTemplate({ ...template, eventBlockNoBorders: !template.eventBlockNoBorders })}
              />
            )}
            <MiniToggle
              label="Diff color by course type"
              enabled={!!template.differentiateTypes}
              onToggle={() => triggerColorUpdate(!template.differentiateTypes)}
            />
            {showThemeToggles && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 shrink-0">Opacity</span>
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
                  className="flex-1 h-1 rounded-lg appearance-none cursor-pointer slider-accent slider-track-themed"
                />
              </div>
            )}
          </div>

          {/* Right column: swatches */}
          <div className="flex-1 pl-2 border-l border-[var(--border-default)] space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div
                className="flex items-center gap-1 cursor-pointer"
                onClick={() => {
                  const newValue = !applyColorToAll;
                  setApplyColorToAll(newValue);
                  if (newValue && selectedEvent) {
                    const currentOpacity = selectedEvent.opacity ?? template.eventOpacity;
                    const updatedEvents = events.map(e => ({ ...e, color: selectedEvent.color, opacity: currentOpacity }));
                    onUpdateEvents(updatedEvents);
                    onUpdateTemplate({ ...template, eventOpacity: currentOpacity });
                  } else if (!newValue) {
                    shuffleColorsForEvents(template.differentiateTypes);
                  }
                }}
              >
                <span className="text-[10px] text-gray-400">Apply to all blocks</span>
                <div className={`w-7 h-3.5 rounded-full relative transition-all ${applyColorToAll ? 'toggle-accent-bg' : 'toggle-off-bg'}`}>
                  <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-all ${applyColorToAll ? 'left-4' : 'left-0.5'}`} />
                </div>
              </div>
              <button
                onClick={() => !applyColorToAll && shuffleColorsForEvents(template.differentiateTypes)}
                className={`inline-btn px-2 py-0.5 text-[9px] font-medium rounded-full border border-[var(--border-default)] button-ghost-themed ${applyColorToAll ? 'text-gray-500 opacity-60 cursor-not-allowed' : 'text-gray-300'}`}
                disabled={applyColorToAll}
              >
                🎲 Shuffle
              </button>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {themeColors.map(color => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className={`inline-btn w-5 h-5 rounded-full border transition-all ${
                    selectedEvent.color === color
                      ? 'border-white ring-1 ring-blue-400'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <button
              onClick={() => setShowPalettePicker(!showPalettePicker)}
              className="inline-btn text-[9px] text-blue-400 hover:text-blue-300 transition-colors cursor-pointer flex items-center gap-1 ml-auto"
            >
              <Palette size={8} />
              {showPalettePicker ? 'Hide' : `${currentPalette.name} · Change`}
            </button>
          </div>
        </div>
      </div>

      {showPalettePicker && (
        <div className="p-1 rounded-md border card-section-themed max-h-[80px] overflow-y-auto">
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
                  <div key={idx} className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                ))}
              </div>
              <span className="text-[9px] text-gray-300">{palette.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
