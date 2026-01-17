import React from 'react';

interface TimeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const TimeInput: React.FC<TimeInputProps> = ({ label, value, onChange }) => {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
      <input 
        type="time" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white text-sm outline-none focus:border-blue-500"
      />
    </div>
  );
};
