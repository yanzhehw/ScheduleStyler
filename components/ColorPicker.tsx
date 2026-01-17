import React from 'react';

interface ColorPickerProps {
  availableColors: string[];
  selectedColor: string;
  onColorSelect: (color: string) => void;
  label?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ 
  availableColors, 
  selectedColor, 
  onColorSelect,
  label 
}) => {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-gray-400 mb-2">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {availableColors.map(color => (
          <button
            key={color}
            onClick={() => onColorSelect(color)}
            className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${
              selectedColor === color 
                ? 'border-white scale-110 ring-2 ring-blue-400 ring-offset-1 ring-offset-gray-900' 
                : 'border-transparent'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
};
