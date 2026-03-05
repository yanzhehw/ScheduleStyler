import React from 'react';
import { X } from 'lucide-react';
import { TemplateConfig } from '../../../types';
import { BackgroundImage } from './types';

interface MobileBackgroundGalleryModalProps {
  template: TemplateConfig;
  onUpdateTemplate: (template: TemplateConfig) => void;
  landscapes: BackgroundImage[];
  portraits: BackgroundImage[];
  onClose: () => void;
}

export const MobileBackgroundGalleryModal: React.FC<MobileBackgroundGalleryModalProps> = ({
  template,
  onUpdateTemplate,
  landscapes,
  portraits,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative border rounded-2xl popup-themed shadow-2xl w-[95vw] max-w-lg max-h-[80vh] flex flex-col mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-muted)]">
          <h2 className="text-lg font-semibold text-white">Backgrounds</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex gap-3">
            {/* Landscape column */}
            <div className="w-[48%] shrink-0 space-y-1.5">
              <span className="text-[9px] uppercase tracking-wide text-gray-500">Landscape</span>
              <div className="space-y-1.5">
                {landscapes.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => {
                      onUpdateTemplate({ ...template, backgroundImage: bg.id, customBackgroundImage: undefined });
                      onClose();
                    }}
                    className={`relative w-full aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                      template.backgroundImage === bg.id
                        ? 'border-blue-500 ring-2 ring-blue-400/50'
                        : 'border-[var(--border-default)]'
                    }`}
                  >
                    <img src={bg.thumbnailUrl} alt={bg.name} className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
            {/* Portrait columns */}
            <div className="w-[48%] shrink-0 space-y-1.5">
              <span className="text-[9px] uppercase tracking-wide text-gray-500">Portrait</span>
              <div className="grid grid-cols-2 gap-1.5">
                {portraits.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => {
                      onUpdateTemplate({ ...template, backgroundImage: bg.id, customBackgroundImage: undefined });
                      onClose();
                    }}
                    className={`relative w-full aspect-[9/16] rounded-lg overflow-hidden border-2 transition-all ${
                      template.backgroundImage === bg.id
                        ? 'border-blue-500 ring-2 ring-blue-400/50'
                        : 'border-[var(--border-default)]'
                    }`}
                  >
                    <img src={bg.thumbnailUrl} alt={bg.name} className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
