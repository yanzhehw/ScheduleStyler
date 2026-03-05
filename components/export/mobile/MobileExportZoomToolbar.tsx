import React from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

interface MobileZoomToolbarProps {
  isZoomToolbarOpen: boolean;
  setIsZoomToolbarOpen: (open: boolean) => void;
  zoom: number;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleZoomReset: () => void;
}

const zoomBtnClass =
  "h-6 w-6 rounded border flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.12)] transition-all active:scale-95 toolbar-button-themed inline-btn focus:outline-none";

/** Blur on touch end to prevent persistent highlight on mobile */
const blurOnTouch = (e: React.TouchEvent<HTMLButtonElement>) => {
  e.currentTarget.blur();
};

export const MobileExportZoomToolbar: React.FC<MobileZoomToolbarProps> = ({
  isZoomToolbarOpen,
  setIsZoomToolbarOpen,
  zoom,
  handleZoomIn,
  handleZoomOut,
  handleZoomReset,
}) => {
  return (
    <>
      {isZoomToolbarOpen && (
        <div className="absolute top-2 right-2 z-50">
          <div
            className="flex items-center gap-1 rounded-lg border p-1 shadow-[0_8px_20px_rgba(2,6,23,0.35)] toolbar-themed"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <button onClick={handleZoomOut} onTouchEnd={blurOnTouch} className={zoomBtnClass} title="Zoom Out">
              <ZoomOut size={11} className="text-gray-200" />
            </button>
            <button
              onClick={handleZoomReset}
              onTouchEnd={blurOnTouch}
              className="h-6 min-w-[40px] rounded border px-1.5 flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.12)] transition-all active:scale-95 toolbar-button-themed inline-btn focus:outline-none"
              title="Fit to View"
            >
              <span className="text-[9px] font-mono text-gray-100 leading-none">
                {Math.round(zoom * 100)}%
              </span>
            </button>
            <button onClick={handleZoomIn} onTouchEnd={blurOnTouch} className={zoomBtnClass} title="Zoom In">
              <ZoomIn size={11} className="text-gray-200" />
            </button>
            <button
              onClick={() => setIsZoomToolbarOpen(false)}
              onTouchEnd={blurOnTouch}
              className={zoomBtnClass}
              title="Hide zoom controls"
            >
              <X size={11} className="text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {!isZoomToolbarOpen && (
        <button
          onClick={() => setIsZoomToolbarOpen(true)}
          onTouchEnd={blurOnTouch}
          className="absolute top-2 right-2 z-50 h-6 w-6 rounded-lg border shadow-lg transition-all active:scale-95 toolbar-themed inline-btn flex items-center justify-center focus:outline-none"
          title="Show zoom controls"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <ZoomIn size={11} className="text-gray-200" />
        </button>
      )}
    </>
  );
};
