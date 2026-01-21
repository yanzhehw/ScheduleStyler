import React from 'react';
import { ThemeFamilyId } from '../types';
import acrylicTextureUrl from '../assets/Texture_Acrylic.png';

interface ColorPickerProps {
  availableColors: string[];
  selectedColor: string;
  onColorSelect: (color: string) => void;
  label?: string;
  themeFamily?: ThemeFamilyId;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  availableColors,
  selectedColor,
  onColorSelect,
  label,
  themeFamily = 'default'
}) => {
  const isAcrylic = themeFamily === 'acrylic';

  return (
    <div>
      {label && <label className="block text-xs font-medium text-gray-400 mb-2">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {availableColors.map(color => (
          <button
            key={color}
            onClick={() => onColorSelect(color)}
            className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 relative overflow-hidden ${
              selectedColor === color
                ? 'border-white scale-110 ring-2 ring-blue-400 ring-offset-1 ring-offset-gray-900'
                : 'border-transparent'
            }`}
            style={{
              // For acrylic: neutral gray base + color at 68% opacity (more visible in picker)
              backgroundColor: isAcrylic ? '#6b7280' : color,
            }}
          >
            {/* Color layer for acrylic theme - higher opacity for picker visibility */}
            {isAcrylic && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: `${color}ad`, // ad hex = ~68% opacity
                  borderRadius: 'inherit',
                }}
              />
            )}
            {/* Grain texture overlay for acrylic theme */}
            {isAcrylic && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url('${acrylicTextureUrl}')`,
                  backgroundRepeat: 'repeat',
                  backgroundSize: '64px 64px',
                  opacity: 0.1,
                  pointerEvents: 'none',
                  borderRadius: 'inherit',
                }}
              />
            )}
            {/* White overlay for acrylic theme */}
            {isAcrylic && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 'inherit',
                  pointerEvents: 'none',
                }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
