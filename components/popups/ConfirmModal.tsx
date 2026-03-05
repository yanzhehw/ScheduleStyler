import React from 'react';
import { X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'primary';
  showCloseButton?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  showCloseButton = false,
}) => {
  if (!isOpen) return null;

  const confirmButtonClass = confirmVariant === 'danger'
    ? 'bg-red-600 hover:bg-red-500'
    : 'btn-accent';

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center popup-overlay-themed backdrop-blur-sm">
      <div className="w-full max-w-[18rem] sm:max-w-md rounded-lg sm:rounded-2xl border shadow-2xl p-3 sm:p-5 mx-4 popup-themed">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-white text-xs sm:text-base font-semibold">{title}</h4>
            <p className="text-[11px] sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {message}
            </p>
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="transition-colors"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 pt-3 sm:pt-5">
          <button
            onClick={onClose}
            className="inline-btn px-2.5 py-1 text-[11px] sm:px-3 sm:py-2 sm:text-sm transition-colors hover:text-white"
            style={{ color: 'var(--text-secondary)' }}
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`inline-btn px-2.5 py-1 text-[11px] sm:px-4 sm:py-2 sm:text-sm font-medium text-white rounded-lg transition-colors ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
