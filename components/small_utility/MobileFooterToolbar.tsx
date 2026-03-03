import React, { useState } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';

export interface MobileTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface MobileFooterToolbarProps {
  tabs: MobileTab[];
  activeTabId: string | null;
  onTabChange: (tabId: string | null) => void;
  /** Optional callback when panel is closed or collapsed */
  onPanelClose?: () => void;
  /** Optional primary action button (e.g., "Next" or "Download") */
  primaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
  };
  /** Optional secondary action button (e.g., "Back") */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export const MobileFooterToolbar: React.FC<MobileFooterToolbarProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  onPanelClose,
  primaryAction,
  secondaryAction,
}) => {
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const activeTab = tabs.find(t => t.id === activeTabId);

  const handleTabClick = (tabId: string) => {
    if (activeTabId === tabId) {
      // Toggle panel expansion if clicking same tab
      setIsPanelExpanded(!isPanelExpanded);
      // Notify parent when collapsing
      if (isPanelExpanded && onPanelClose) {
        onPanelClose();
      }
    } else {
      onTabChange(tabId);
      setIsPanelExpanded(true);
    }
  };

  const handleClosePanel = () => {
    onTabChange(null);
    setIsPanelExpanded(true);
    onPanelClose?.();
  };

  const handleCollapseToggle = () => {
    const wasExpanded = isPanelExpanded;
    setIsPanelExpanded(!isPanelExpanded);
    // Notify parent when collapsing (not expanding)
    if (wasExpanded && onPanelClose) {
      onPanelClose();
    }
  };

  return (
    <>
      {/* Slide-up content panel */}
      {activeTab && (
        <div
          className={`fixed left-0 right-0 z-40 transition-all duration-300 ease-out ${
            isPanelExpanded ? 'opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}
          style={{
            bottom: (primaryAction || secondaryAction) ? '120px' : '72px',
            maxHeight: isPanelExpanded ? 'calc(100vh - 200px)' : '0',
            backgroundColor: 'var(--panel-background)',
            borderTop: '1px solid var(--panel-border)',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Panel header */}
          <div
            className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0"
            style={{ borderColor: 'var(--panel-border)' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-gray-400">{activeTab.icon}</span>
              <span className="font-medium text-white text-sm">{activeTab.label}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCollapseToggle}
                className="p-1.5 rounded-lg transition-colors inline-btn"
                style={{ backgroundColor: 'var(--button-ghost)' }}
              >
                {isPanelExpanded ? (
                  <ChevronDown size={18} className="text-gray-400" />
                ) : (
                  <ChevronUp size={18} className="text-gray-400" />
                )}
              </button>
              <button
                onClick={handleClosePanel}
                className="p-1.5 rounded-lg transition-colors inline-btn"
                style={{ backgroundColor: 'var(--button-ghost)' }}
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Panel content - scrollable */}
          <div
            className="overflow-y-auto custom-scrollbar"
            style={{ maxHeight: 'calc(100vh - 280px)', touchAction: 'pan-y' }}
          >
            <div className="p-4 pb-6">
              {activeTab.content}
            </div>
          </div>
        </div>
      )}

      {/* Footer toolbar */}
      <div
        className="fixed left-0 right-0 bottom-0 z-50 safe-area-pb"
        style={{
          backgroundColor: 'var(--panel-background)',
          borderTop: '1px solid var(--panel-border)',
        }}
      >
        {/* Action buttons row - if any actions provided */}
        {(primaryAction || secondaryAction) && (
          <div
            className="flex items-center gap-2 px-4 py-2 border-b"
            style={{ borderColor: 'var(--panel-border)' }}
          >
            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                className="px-4 py-2 text-sm font-medium text-gray-300 rounded-lg transition-colors button-ghost-themed"
              >
                {secondaryAction.label}
              </button>
            )}
            {primaryAction && (
              <button
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled || primaryAction.loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl btn-accent disabled:opacity-50"
              >
                {primaryAction.icon}
                {primaryAction.loading ? 'Processing...' : primaryAction.label}
              </button>
            )}
          </div>
        )}

        {/* Tab icons */}
        <div className="flex items-center justify-around py-2 px-2">
          {tabs.map((tab) => {
            const isActive = activeTabId === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                  isActive ? 'mobile-tab-active' : ''
                }`}
                style={{
                  backgroundColor: isActive ? 'rgba(var(--accent-primary-rgb), 0.15)' : 'transparent',
                }}
              >
                <span
                  className={`transition-colors ${
                    isActive ? 'text-accent-active' : 'text-gray-500'
                  }`}
                  style={{ color: isActive ? 'var(--accent-primary)' : undefined }}
                >
                  {tab.icon}
                </span>
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isActive ? 'text-accent-active' : 'text-gray-500'
                  }`}
                  style={{ color: isActive ? 'var(--accent-primary)' : undefined }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
