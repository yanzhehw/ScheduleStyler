"use client";

import React, { useState } from "react";
import {
  Search,
  LayoutDashboard,
  CheckSquare,
  Folder,
  Calendar,
  Users,
  BarChart3,
  FileText,
  Settings,
  User,
  ChevronDown,
  ChevronRight,
  Plus,
  Filter,
  Clock,
  Loader,
  CheckCircle,
  Flag,
  Archive,
  Eye,
  FileBarChart,
  Star,
  FolderOpen,
  Share2,
  Upload,
  Shield,
  Bell,
  Plug,
  UserPlus,
} from "lucide-react";

/** ======================= Local SVG paths (inline) ======================= */
const svgPaths = {
  p36880f80:
    "M0.32 0C0.20799 0 0.151984 0 0.109202 0.0217987C0.0715695 0.0409734 0.0409734 0.0715695 0.0217987 0.109202C0 0.151984 0 0.20799 0 0.32V6.68C0 6.79201 0 6.84801 0.0217987 6.8908C0.0409734 6.92843 0.0715695 6.95902 0.109202 6.9782C0.151984 7 0.207989 7 0.32 7L3.68 7C3.79201 7 3.84802 7 3.8908 6.9782C3.92843 6.95903 3.95903 6.92843 3.9782 6.8908C4 6.84801 4 6.79201 4 6.68V4.32C4 4.20799 4 4.15198 4.0218 4.1092C4.04097 4.07157 4.07157 4.04097 4.1092 4.0218C4.15198 4 4.20799 4 4.32 4L19.68 4C19.792 4 19.848 4 19.8908 4.0218C19.9284 4.04097 19.959 4.07157 19.9782 4.1092C20 4.15198 20 4.20799 20 4.32V6.68C20 6.79201 20 6.84802 20.0218 6.8908C20.041 6.92843 20.0716 6.95903 20.1092 6.9782C20.152 7 20.208 7 20.32 7L23.68 7C23.792 7 23.848 7 23.8908 6.9782C23.9284 6.95903 23.959 6.92843 23.9782 6.8908C24 6.84802 24 6.79201 24 6.68V0.32C24 0.20799 24 0.151984 23.9782 0.109202C23.959 0.0715695 23.9284 0.0409734 23.8908 0.0217987C23.848 0 23.792 0 23.68 0H0.32Z",
  p355df480:
    "M0.32 16C0.20799 16 0.151984 16 0.109202 15.9782C0.0715695 15.959 0.0409734 15.9284 0.0217987 15.8908C0 15.848 0 15.792 0 15.68V9.32C0 9.20799 0 9.15198 0.0217987 9.1092C0.0409734 9.07157 0.0715695 9.04097 0.109202 9.0218C0.151984 9 0.207989 9 0.32 9H3.68C3.79201 9 3.84802 9 3.8908 9.0218C3.92843 9.04097 3.95903 9.07157 3.9782 9.1092C4 9.15198 4 9.20799 4 9.32V11.68C4 11.792 4 11.848 4.0218 11.8908C4.04097 11.9284 4.07157 11.959 4.1092 11.9782C4.15198 12 4.20799 12 4.32 12L19.68 12C19.792 12 19.848 12 19.8908 11.9782C19.9284 11.959 19.959 11.9284 19.9782 11.8908C20 11.848 20 11.792 20 11.68V9.32C20 9.20799 20 9.15199 20.0218 9.1092C20.041 9.07157 20.0716 9.04098 20.1092 9.0218C20.152 9 20.208 9 20.32 9H23.68C23.792 9 23.848 9 23.8908 9.0218C23.9284 9.04098 23.959 9.07157 23.9782 9.1092C24 9.15199 24 9.20799 24 9.32V15.68C24 15.792 24 15.848 23.9782 15.8908C23.959 15.9284 23.9284 15.959 23.8908 15.9782C23.848 16 23.792 16 23.68 16H0.32Z",
  pfa0d600:
    "M6.32 10C6.20799 10 6.15198 10 6.1092 9.9782C6.07157 9.95903 6.04097 9.92843 6.0218 9.8908C6 9.84802 6 9.79201 6 9.68V6.32C6 6.20799 6 6.15198 6.0218 6.1092C6.04097 6.07157 6.07157 6.04097 6.1092 6.0218C6.15198 6 6.20799 6 6.32 6L17.68 6C17.792 6 17.848 6 17.8908 6.0218C17.9284 6.04097 17.959 6.07157 17.9782 6.1092C18 6.15198 18 6.20799 18 6.32V9.68C18 9.79201 18 9.84802 17.9782 9.8908C17.959 9.92843 17.9284 9.95903 17.8908 9.9782C17.848 10 17.792 10 17.68 10H6.32Z",
};
/** ======================================================================= */

// Soft spring animation curve
const softSpringEasing = "cubic-bezier(0.25, 1.1, 0.4, 1)";

/* ----------------------------- Brand / Logos ----------------------------- */

function InterfacesLogoSquare() {
  return (
    <div className="aspect-[24/24] grow min-h-px min-w-px overflow-clip relative shrink-0">
      <div className="absolute aspect-[24/16] left-0 right-0 top-1/2 -translate-y-1/2">
        <svg className="block size-full" fill="none" viewBox="0 0 24 16">
          <g>
            <path d={svgPaths.p36880f80} fill="var(--text-primary)" />
            <path d={svgPaths.p355df480} fill="var(--text-primary)" />
            <path d={svgPaths.pfa0d600} fill="var(--text-primary)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function BrandBadge({ title = "Interfaces" }: { title?: string }) {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex items-center p-1 w-full">
        <div className="h-10 w-8 flex items-center justify-center pl-2">
          <InterfacesLogoSquare />
        </div>
        <div className="px-2 py-1">
          <div className="font-semibold text-[16px]" style={{ color: 'var(--text-primary)' }}>
            {title}
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Avatar -------------------------------- */

function AvatarCircle() {
  return (
    <div
      className="relative rounded-full shrink-0 size-8"
      style={{ backgroundColor: 'var(--surface-card)' }}
    >
      <div className="flex items-center justify-center size-8">
        <User size={16} style={{ color: 'var(--text-primary)' }} />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full border pointer-events-none"
        style={{ borderColor: 'var(--border-default)' }}
      />
    </div>
  );
}

/* ------------------------------ Search Input ----------------------------- */

function SearchContainer({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const [searchValue, setSearchValue] = useState("");

  return (
    <div
      className={`relative shrink-0 transition-all duration-500 ${
        isCollapsed ? "w-full flex justify-center" : "w-full"
      }`}
      style={{ transitionTimingFunction: softSpringEasing }}
    >
      <div
        className={`h-10 relative rounded-lg flex items-center transition-all duration-500 ${
          isCollapsed ? "w-10 min-w-10 justify-center" : "w-full"
        }`}
        style={{
          transitionTimingFunction: softSpringEasing,
          backgroundColor: 'var(--surface-card)',
        }}
      >
        <div
          className={`flex items-center justify-center shrink-0 transition-all duration-500 ${
            isCollapsed ? "p-1" : "px-1"
          }`}
          style={{ transitionTimingFunction: softSpringEasing }}
        >
          <div className="size-8 flex items-center justify-center">
            <Search size={16} style={{ color: 'var(--text-primary)' }} />
          </div>
        </div>

        <div
          className={`flex-1 relative transition-opacity duration-500 overflow-hidden ${
            isCollapsed ? "opacity-0 w-0" : "opacity-100"
          }`}
          style={{ transitionTimingFunction: softSpringEasing }}
        >
          <div className="flex flex-col justify-center size-full">
            <div className="flex flex-col gap-2 items-start justify-center pr-2 py-1 w-full">
              <input
                type="text"
                placeholder="Search..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-[14px] leading-[20px]"
                style={{
                  color: 'var(--text-primary)',
                }}
                tabIndex={isCollapsed ? -1 : 0}
              />
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-lg border pointer-events-none"
          style={{ borderColor: 'var(--border-default)' }}
        />
      </div>
    </div>
  );
}

/* --------------------------- Types / Content Map -------------------------- */

export interface MenuItemT {
  icon?: React.ReactNode;
  label: string;
  hasDropdown?: boolean;
  isActive?: boolean;
  children?: MenuItemT[];
  onClick?: () => void;
}

export interface MenuSectionT {
  title: string;
  items: MenuItemT[];
}

export interface SidebarContent {
  title: string;
  sections: MenuSectionT[];
}

export interface NavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
}

/* ---------------------------- Left Icon Nav Rail -------------------------- */

const IconNavButton: React.FC<{
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
}> = ({ children, isActive = false, onClick }) => {
  return (
    <button
      type="button"
      className="flex items-center justify-center rounded-lg size-10 min-w-10 transition-colors duration-500"
      style={{
        transitionTimingFunction: softSpringEasing,
        backgroundColor: isActive ? 'var(--surface-elevated)' : 'transparent',
        color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'var(--surface-elevated)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--text-muted)';
        }
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

interface IconNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  navItems: NavItem[];
  bottomItems?: NavItem[];
  showAvatar?: boolean;
}

function IconNavigation({
  activeSection,
  onSectionChange,
  navItems,
  bottomItems = [],
  showAvatar = true,
}: IconNavigationProps) {
  return (
    <aside
      className="flex flex-col gap-2 items-center p-4 w-16 border-r rounded-l-2xl"
      style={{
        backgroundColor: 'var(--panel-background)',
        borderColor: 'var(--border-default)',
      }}
    >
      {/* Logo */}
      <div className="mb-2 size-10 flex items-center justify-center">
        <div className="size-7">
          <InterfacesLogoSquare />
        </div>
      </div>

      {/* Navigation Icons */}
      <div className="flex flex-col gap-2 w-full items-center">
        {navItems.map((item) => (
          <IconNavButton
            key={item.id}
            isActive={activeSection === item.id}
            onClick={() => onSectionChange(item.id)}
          >
            {item.icon}
          </IconNavButton>
        ))}
      </div>

      <div className="flex-1" />

      {/* Bottom section */}
      <div className="flex flex-col gap-2 w-full items-center">
        {bottomItems.map((item) => (
          <IconNavButton
            key={item.id}
            isActive={activeSection === item.id}
            onClick={() => onSectionChange(item.id)}
          >
            {item.icon}
          </IconNavButton>
        ))}
        {showAvatar && (
          <div className="size-8">
            <AvatarCircle />
          </div>
        )}
      </div>
    </aside>
  );
}

/* ------------------------------ Right Sidebar ----------------------------- */

function SectionTitle({
  title,
  onToggleCollapse,
  isCollapsed,
}: {
  title: string;
  onToggleCollapse: () => void;
  isCollapsed: boolean;
}) {
  if (isCollapsed) {
    return (
      <div className="w-full flex justify-center transition-all duration-500" style={{ transitionTimingFunction: softSpringEasing }}>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex items-center justify-center rounded-lg size-10 min-w-10 transition-all duration-500"
          style={{
            transitionTimingFunction: softSpringEasing,
            color: 'var(--text-muted)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--surface-elevated)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
          aria-label="Expand sidebar"
        >
          <span className="inline-block rotate-180">
            <ChevronDown size={16} />
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden transition-all duration-500" style={{ transitionTimingFunction: softSpringEasing }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center h-10">
          <div className="px-2 py-1">
            <div className="font-semibold text-[18px] leading-[27px]" style={{ color: 'var(--text-primary)' }}>
              {title}
            </div>
          </div>
        </div>
        <div className="pr-1">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex items-center justify-center rounded-lg size-10 min-w-10 transition-all duration-500"
            style={{
              transitionTimingFunction: softSpringEasing,
              color: 'var(--text-muted)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-elevated)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
            aria-label="Collapse sidebar"
          >
            <ChevronDown size={16} className="-rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface DetailSidebarProps {
  content: SidebarContent;
  showSearch?: boolean;
  showBrandBadge?: boolean;
  brandTitle?: string;
  showFooter?: boolean;
  footerContent?: React.ReactNode;
  children?: React.ReactNode;
  height?: string;
}

function DetailSidebar({
  content,
  showSearch = true,
  showBrandBadge = true,
  brandTitle,
  showFooter = true,
  footerContent,
  children,
  height = "800px",
}: DetailSidebarProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleExpanded = (itemKey: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemKey)) next.delete(itemKey);
      else next.add(itemKey);
      return next;
    });
  };

  const toggleCollapse = () => setIsCollapsed((s) => !s);

  return (
    <aside
      className={`flex flex-col gap-4 items-start p-4 rounded-r-2xl transition-all duration-500 ${
        isCollapsed ? "w-16 min-w-16 !px-0 justify-center" : "w-80"
      }`}
      style={{
        transitionTimingFunction: softSpringEasing,
        backgroundColor: 'var(--panel-background)',
        height,
      }}
    >
      {!isCollapsed && showBrandBadge && <BrandBadge title={brandTitle} />}

      <SectionTitle title={content.title} onToggleCollapse={toggleCollapse} isCollapsed={isCollapsed} />

      {showSearch && <SearchContainer isCollapsed={isCollapsed} />}

      <div
        className={`flex flex-col w-full overflow-y-auto transition-all duration-500 custom-scrollbar ${
          isCollapsed ? "gap-2 items-center" : "gap-4 items-start"
        }`}
        style={{ transitionTimingFunction: softSpringEasing }}
      >
        {children ? (
          !isCollapsed && children
        ) : (
          content.sections.map((section, index) => (
            <MenuSection
              key={`${content.title}-${index}`}
              section={section}
              expandedItems={expandedItems}
              onToggleExpanded={toggleExpanded}
              isCollapsed={isCollapsed}
            />
          ))
        )}
      </div>

      {!isCollapsed && showFooter && (
        <div className="w-full mt-auto pt-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
          {footerContent || (
            <div className="flex items-center gap-2 px-2 py-2">
              <AvatarCircle />
              <div className="text-[14px]" style={{ color: 'var(--text-primary)' }}>User</div>
              <button
                type="button"
                className="ml-auto size-8 rounded-md flex items-center justify-center transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--surface-elevated)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label="More"
              >
                <svg className="size-4" viewBox="0 0 16 16" fill="none">
                  <circle cx="4" cy="8" r="1" fill="currentColor" />
                  <circle cx="8" cy="8" r="1" fill="currentColor" />
                  <circle cx="12" cy="8" r="1" fill="currentColor" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

/* ------------------------------ Menu Elements ---------------------------- */

function MenuItem({
  item,
  isExpanded,
  onToggle,
  onItemClick,
  isCollapsed,
}: {
  item: MenuItemT;
  isExpanded?: boolean;
  onToggle?: () => void;
  onItemClick?: () => void;
  isCollapsed?: boolean;
}) {
  const handleClick = () => {
    if (item.hasDropdown && onToggle) onToggle();
    else if (item.onClick) item.onClick();
    else onItemClick?.();
  };

  return (
    <div
      className={`relative shrink-0 transition-all duration-500 ${
        isCollapsed ? "w-full flex justify-center" : "w-full"
      }`}
      style={{ transitionTimingFunction: softSpringEasing }}
    >
      <div
        className={`rounded-lg cursor-pointer transition-all duration-500 flex items-center relative ${
          isCollapsed ? "w-10 min-w-10 h-10 justify-center p-4" : "w-full h-10 px-4 py-2"
        }`}
        style={{
          transitionTimingFunction: softSpringEasing,
          backgroundColor: item.isActive ? 'var(--surface-elevated)' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!item.isActive) {
            e.currentTarget.style.backgroundColor = 'var(--surface-elevated)';
          }
        }}
        onMouseLeave={(e) => {
          if (!item.isActive) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
        onClick={handleClick}
        title={isCollapsed ? item.label : undefined}
      >
        <div className="flex items-center justify-center shrink-0" style={{ color: 'var(--text-primary)' }}>
          {item.icon}
        </div>

        <div
          className={`flex-1 relative transition-opacity duration-500 overflow-hidden ${
            isCollapsed ? "opacity-0 w-0" : "opacity-100 ml-3"
          }`}
          style={{ transitionTimingFunction: softSpringEasing }}
        >
          <div className="text-[14px] leading-[20px] truncate" style={{ color: 'var(--text-primary)' }}>
            {item.label}
          </div>
        </div>

        {item.hasDropdown && (
          <div
            className={`flex items-center justify-center shrink-0 transition-opacity duration-500 ${
              isCollapsed ? "opacity-0 w-0" : "opacity-100 ml-2"
            }`}
            style={{ transitionTimingFunction: softSpringEasing }}
          >
            <ChevronDown
              size={16}
              className="transition-transform duration-500"
              style={{
                transitionTimingFunction: softSpringEasing,
                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                color: 'var(--text-primary)',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const SubMenuItem: React.FC<{ item: MenuItemT; onItemClick?: () => void }> = ({ item, onItemClick }) => {
  return (
    <div className="w-full pl-9 pr-1 py-[1px]">
      <div
        className="h-10 w-full rounded-lg cursor-pointer transition-colors flex items-center px-3 py-1"
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--surface-elevated)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        onClick={() => {
          if (item.onClick) item.onClick();
          else onItemClick?.();
        }}
      >
        <div className="flex-1 min-w-0">
          <div className="text-[14px] leading-[18px] truncate">
            {item.label}
          </div>
        </div>
      </div>
    </div>
  );
}

const MenuSection: React.FC<{
  section: MenuSectionT;
  expandedItems: Set<string>;
  onToggleExpanded: (itemKey: string) => void;
  isCollapsed?: boolean;
}> = ({ section, expandedItems, onToggleExpanded, isCollapsed }) => {
  return (
    <div className="flex flex-col w-full">
      <div
        className={`relative shrink-0 w-full transition-all duration-500 overflow-hidden ${
          isCollapsed ? "h-0 opacity-0" : "h-10 opacity-100"
        }`}
        style={{ transitionTimingFunction: softSpringEasing }}
      >
        <div className="flex items-center h-10 px-4">
          <div className="text-[14px]" style={{ color: 'var(--text-muted)' }}>
            {section.title}
          </div>
        </div>
      </div>

      {section.items.map((item, index) => {
        const itemKey = `${section.title}-${index}`;
        const isExpanded = expandedItems.has(itemKey);
        return (
          <div key={itemKey} className="w-full flex flex-col">
            <MenuItem
              item={item}
              isExpanded={isExpanded}
              onToggle={() => onToggleExpanded(itemKey)}
              onItemClick={() => console.log(`Clicked ${item.label}`)}
              isCollapsed={isCollapsed}
            />
            {isExpanded && item.children && !isCollapsed && (
              <div className="flex flex-col gap-1 mb-2">
                {item.children.map((child, childIndex) => (
                  <SubMenuItem
                    key={`${itemKey}-${childIndex}`}
                    item={child}
                    onItemClick={() => console.log(`Clicked ${child.label}`)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------------- Layout -------------------------------- */

interface TwoLevelSidebarProps {
  navItems: NavItem[];
  bottomNavItems?: NavItem[];
  getContent: (activeSection: string) => SidebarContent;
  defaultSection?: string;
  showSearch?: boolean;
  showBrandBadge?: boolean;
  brandTitle?: string;
  showFooter?: boolean;
  footerContent?: React.ReactNode;
  showAvatar?: boolean;
  height?: string;
  children?: React.ReactNode;
}

export function TwoLevelSidebar({
  navItems,
  bottomNavItems = [],
  getContent,
  defaultSection,
  showSearch = true,
  showBrandBadge = true,
  brandTitle,
  showFooter = true,
  footerContent,
  showAvatar = true,
  height = "800px",
  children,
}: TwoLevelSidebarProps) {
  const [activeSection, setActiveSection] = useState(defaultSection || navItems[0]?.id || "");

  return (
    <div className="flex flex-row">
      <IconNavigation
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        navItems={navItems}
        bottomItems={bottomNavItems}
        showAvatar={showAvatar}
      />
      <DetailSidebar
        content={getContent(activeSection)}
        showSearch={showSearch}
        showBrandBadge={showBrandBadge}
        brandTitle={brandTitle}
        showFooter={showFooter}
        footerContent={footerContent}
        height={height}
      >
        {children}
      </DetailSidebar>
    </div>
  );
}

/* ------------------------------- Simple Single-Panel Sidebar ------------------------------ */

interface SimpleSidebarProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  children: React.ReactNode;
  width?: string;
  showSearch?: boolean;
}

export function SimpleSidebar({
  title,
  isOpen,
  onClose,
  onBack,
  children,
  width = "w-80",
  showSearch = false,
}: SimpleSidebarProps) {
  return (
    <div
      className={`
        min-h-0 overflow-hidden rounded-2xl border flex flex-col shadow-xl transition-all duration-300
        ${isOpen ? `${width} opacity-100 translate-x-0` : 'w-0 opacity-0 translate-x-10 border-0 p-0'}
      `}
      style={{
        backgroundColor: 'var(--panel-background)',
        borderColor: 'var(--panel-border)',
      }}
    >
      {/* Header */}
      <div
        className="p-4 border-b flex justify-between items-center whitespace-nowrap"
        style={{ borderColor: 'var(--panel-border)' }}
      >
        {onBack && (
          <button
            onClick={onBack}
            className="text-sm transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            ← Back
          </button>
        )}
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>{title}</h3>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Search (optional) */}
      {showSearch && (
        <div className="p-4 border-b" style={{ borderColor: 'var(--panel-border)' }}>
          <SearchContainer isCollapsed={false} />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 h-0 overflow-y-auto custom-scrollbar">
        {children}
      </div>
    </div>
  );
}

/* ------------------------------- Exports ------------------------------ */

export {
  IconNavigation,
  DetailSidebar,
  MenuSection,
  MenuItem,
  SubMenuItem,
  SearchContainer,
  BrandBadge,
  AvatarCircle,
};

export type { IconNavigationProps, DetailSidebarProps };
