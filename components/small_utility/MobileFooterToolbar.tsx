import React from 'react';
import { ChevronDown } from 'lucide-react';

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
  const activeTab = tabs.find(t => t.id === activeTabId);

  const handleTabClick = (tabId: string) => {
    if (activeTabId === tabId) {
      // Toggle off — fully close panel so re-clicks trigger a state change
      onTabChange(null);
      onPanelClose?.();
    } else {
      onTabChange(tabId);
    }
  };

  const handleCollapseToggle = () => {
    onTabChange(null);
    onPanelClose?.();
  };

  return (
    <div className="fixed left-0 right-0 bottom-0 z-[310] safe-area-pb flex flex-col">
      {/* Slide-up content panel */}
      {activeTab && (
        <div
          style={{
            maxHeight: 'calc(100vh - 200px)',
            backgroundColor: 'var(--panel-background)',
            borderTop: '1px solid var(--panel-border)',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Panel header */}
          <div
            className="flex items-center justify-between px-4 py-1.5 border-b flex-shrink-0"
            style={{ borderColor: 'var(--panel-border)' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-gray-400">{activeTab.icon}</span>
              <span className="font-medium text-white text-sm">{activeTab.label}</span>
            </div>
            <button
              onClick={handleCollapseToggle}
              className="p-1 rounded-lg transition-colors inline-btn"
              style={{ backgroundColor: 'var(--button-ghost)' }}
            >
              <ChevronDown size={16} className="text-gray-400" />
            </button>
          </div>

          {/* Panel content - scrollable */}
          <div
            className="overflow-y-auto custom-scrollbar"
            style={{ maxHeight: 'calc(100vh - 280px)', touchAction: 'pan-y' }}
          >
            <div className="p-3 pb-5">
              {activeTab.content}
            </div>
          </div>
        </div>
      )}

      {/* Footer toolbar */}
      <div
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

        {/* Tab icons — evenly divided */}
        <div className="flex items-center py-1 px-1">
          {tabs.map((tab) => {
            const isActive = activeTabId === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className="flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-all"
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
                  className={`text-[9px] font-medium transition-colors ${
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
    </div>
  );
};
