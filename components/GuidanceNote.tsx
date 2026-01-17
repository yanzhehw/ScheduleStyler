import React from 'react';
import { X } from 'lucide-react';

interface GuidanceNoteProps {
  message: string;
  onClose: () => void;
  type?: 'info' | 'warning' | 'success';
}

export const GuidanceNote: React.FC<GuidanceNoteProps> = ({ 
  message, 
  onClose,
  type = 'info' 
}) => {
  const typeStyles = {
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    success: 'bg-green-500/10 border-green-500/30 text-green-300'
  };

  return (
    <div className={`group relative p-3 border rounded-lg text-xs ${typeStyles[type]}`}>
      <p>{message}</p>
      <button
        onClick={onClose}
        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded-full bg-gray-800 border border-gray-600"
        aria-label="Close guidance"
      >
        <X size={14} />
      </button>
    </div>
  );
};
