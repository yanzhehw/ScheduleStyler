import React from 'react';
import { Minimize2, ZoomIn, ZoomOut } from 'lucide-react';

interface MobileExportZoomToolbarProps {
  isZoomToolbarOpen: boolean;
  setIsZoomToolbarOpen: (open: boolean) => void;
  zoom: number;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleZoomReset: () => void;
}

export const MobileExportZoomToolbar: React.FC<MobileExportZoomToolbarProps> = ({
  isZoomToolbarOpen,
  setIsZoomToolbarOpen,
  zoom,
  handleZoomIn,
  handleZoomOut,
  handleZoomReset,
}) => {
  return (
    <>
      {/* Zoom Toolbar */}
      {isZoomToolbarOpen && (
        <div className="absolute top-4 right-4 z-50">
          <div className="relative flex items-center gap-2 rounded-2xl border p-2 shadow-[0_12px_24px_rgba(2,6,23,0.35)] toolbar-themed">
            <button
              onClick={handleZoomOut}
              className="h-10 w-11 rounded-xl border shadow-[inset_0_1px_2px_rgba(255,255,255,0.12)] transition-all active:scale-95 toolbar-button-themed inline-btn"
              title="Zoom Out"
            >
              <ZoomOut size={16} className="mx-auto text-gray-200" />
            </button>
            <button
              onClick={handleZoomReset}
              className="h-10 min-w-[72px] rounded-xl border px-3 text-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.12)] transition-all active:scale-95 toolbar-button-themed inline-btn"
              title="Fit to View"
            >
              <span className="text-xs font-mono text-gray-100">
                {Math.round(zoom * 100)}%
              </span>
            </button>
            <button
              onClick={handleZoomIn}
              className="h-10 w-11 rounded-xl border shadow-[inset_0_1px_2px_rgba(255,255,255,0.12)] transition-all active:scale-95 toolbar-button-themed inline-btn"
              title="Zoom In"
            >
              <ZoomIn size={16} className="mx-auto text-gray-200" />
            </button>
            <button
              onClick={() => setIsZoomToolbarOpen(false)}
              className="absolute -top-2 -right-2 rounded-lg border p-1.5 shadow-lg transition-all active:scale-95 toolbar-button-themed inline-btn"
              title="Hide zoom controls"
            >
              <Minimize2 size={12} className="text-gray-200" />
            </button>
          </div>
        </div>
      )}

      {/* Collapsed zoom button */}
      {!isZoomToolbarOpen && (
        <button
          onClick={() => setIsZoomToolbarOpen(true)}
          className="absolute top-4 right-4 z-50 h-10 w-10 rounded-xl border shadow-lg transition-all active:scale-95 toolbar-themed inline-btn"
          title="Show zoom controls"
        >
          <ZoomIn size={16} className="mx-auto text-gray-200" />
        </button>
      )}
    </>
  );
};
