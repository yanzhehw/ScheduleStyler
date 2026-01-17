import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface AlertBoxProps {
  message: string;
  type?: 'warning' | 'success' | 'info';
}

export const AlertBox: React.FC<AlertBoxProps> = ({ message, type = 'info' }) => {
  const config = {
    warning: {
      icon: AlertTriangle,
      styles: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
    },
    success: {
      icon: CheckCircle,
      styles: 'bg-green-500/10 border-green-500/30 text-green-400'
    },
    info: {
      icon: Info,
      styles: 'bg-blue-500/10 border-blue-500/30 text-blue-400'
    }
  };

  const { icon: Icon, styles } = config[type];

  return (
    <div className={`p-3 border rounded-lg flex items-start gap-3 text-sm ${styles}`}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <p>{message}</p>
    </div>
  );
};
