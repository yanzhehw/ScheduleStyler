import React from 'react';

interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: () => void;
  label?: React.ReactNode;
  disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ 
  enabled, 
  onToggle, 
  label, 
  disabled = false 
}) => {
  return (
    <label className={`flex items-center justify-between ${disabled ? 'opacity-40 pointer-events-none' : 'cursor-pointer'}`}>
      {label && <span className="text-xs text-gray-400">{label}</span>}
      <div
        onClick={onToggle}
        className={`w-10 h-5 rounded-full relative transition-colors ${enabled ? 'bg-blue-600' : 'bg-gray-700'}`}
      >
        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${enabled ? 'left-6' : 'left-1'}`} />
      </div>
    </label>
  );
};
