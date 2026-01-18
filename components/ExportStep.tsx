import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CalendarEvent, TemplateConfig, ThemeFamilyId } from '../types';
import { CalendarCanvas } from './CalendarCanvas';
import { ToggleSwitch } from './ToggleSwitch';
import { downloadComponentAsImage } from '../services/imageUtils';
import { Download, Layout, Type, Palette, MapPin, Grid, Clock, ChevronRight, ChevronDown, SlidersHorizontal, Monitor, Smartphone, Tag, Maximize2, Sun, Moon, ZoomIn, ZoomOut, X } from 'lucide-react';
import { THEME_FAMILY_LIST, getThemeColors } from '../themes';

interface ExportStepProps {
  events: CalendarEvent[];
  template: TemplateConfig;
  onUpdateTemplate: (t: TemplateConfig) => void;
  onUpdateEvents: (events: CalendarEvent[]) => void;
  onBack: () => void;
}

export const ExportStep: React.FC<ExportStepProps> = ({ events, template, onUpdateTemplate, onUpdateEvents, onBack }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);
  
  // Selected event for color picking
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [colorPickerPosition, setColorPickerPosition] = useState<{
    x: number;
    y: number;
    placement: 'top' | 'bottom' | 'left' | 'right';
    arrowOffset: number; // Offset from center for arrow positioning (in pixels)
  } | null>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const previewPanelRef = useRef<HTMLDivElement>(null);

  // Track previous theme family to detect changes
  const prevThemeFamilyRef = useRef<ThemeFamilyId>(template.themeFamily);

  // Cache for toggle states before compact mode
  const [cachedToggles, setCachedToggles] = useState<{
    showClassType: boolean;
    showTime: boolean;
    showLocation: boolean;
    showNotes: boolean;
  } | null>(null);

  // Get theme colors for the picker
  const themeColors = useMemo(() => getThemeColors(template.themeFamily), [template.themeFamily]);
  
  // Get the selected event
  const selectedEvent = useMemo(() => events.find(e => e.id === selectedEventId), [events, selectedEventId]);

  // Handle event click - show color picker with smart positioning
  const handleEventClick = (event: CalendarEvent) => {
    const clickedElement = document.querySelector(`[data-event-id="${event.id}"]`);
    const panel = previewPanelRef.current;

    if (clickedElement && panel) {
      const elementRect = clickedElement.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();

      // Picker dimensions
      const pickerHeight = 180;
      const pickerWidth = 260;
      const padding = 16;

      // Calculate available space in each direction
      const spaceAbove = elementRect.top - panelRect.top;
      const spaceBelow = panelRect.bottom - elementRect.bottom;
      const spaceRight = panelRect.right - elementRect.right;

      // Element center position relative to panel
      const elementCenterX = elementRect.left - panelRect.left + panel.scrollLeft + elementRect.width / 2;
      const elementCenterY = elementRect.top - panelRect.top + panel.scrollTop + elementRect.height / 2;

      // Determine best placement (prefer top, then bottom, then right, then left)
      let placement: 'top' | 'bottom' | 'left' | 'right' = 'top';
      let x: number, y: number;
      let arrowOffset = 0;

      if (spaceAbove >= pickerHeight + padding || spaceBelow >= pickerHeight + padding) {
        // Top or bottom placement
        placement = spaceAbove >= pickerHeight + padding ? 'top' : 'bottom';

        // Start with centered position
        x = elementCenterX;
        y = placement === 'top'
          ? elementRect.top - panelRect.top + panel.scrollTop - 8
          : elementRect.bottom - panelRect.top + panel.scrollTop + 8;

        // Check for horizontal overflow and adjust
        const pickerLeft = x - pickerWidth / 2;
        const pickerRight = x + pickerWidth / 2;
        const panelContentWidth = panel.scrollWidth;

        if (pickerLeft < padding) {
          // Would overflow left - shift picker right, offset arrow left
          const shift = padding - pickerLeft;
          x += shift;
          arrowOffset = -shift; // Arrow moves left relative to picker center
        } else if (pickerRight > panelContentWidth - padding) {
          // Would overflow right - shift picker left, offset arrow right
          const shift = pickerRight - (panelContentWidth - padding);
          x -= shift;
          arrowOffset = shift; // Arrow moves right relative to picker center
        }
      } else if (spaceRight >= pickerWidth + padding) {
        placement = 'right';
        x = elementRect.right - panelRect.left + panel.scrollLeft + 8;
        y = elementCenterY;
      } else {
        placement = 'left';
        x = elementRect.left - panelRect.left + panel.scrollLeft - 8;
        y = elementCenterY;
      }

      setColorPickerPosition({ x, y, placement, arrowOffset });
    }
    setSelectedEventId(event.id);
  };

  // Handle blank click - close color picker
  const handleBlankClick = () => {
    setSelectedEventId(null);
    setColorPickerPosition(null);
  };

  // Update color for all events in the same group (displayTitle)
  const handleColorSelect = (newColor: string) => {
    if (!selectedEvent) return;
    const updatedEvents = events.map(e => {
      if (e.displayTitle === selectedEvent.displayTitle) {
        return { ...e, color: newColor };
      }
      return e;
    });
    onUpdateEvents(updatedEvents);
  };

  // Helper to adjust color for differentiation (shift to different palette color)
  const adjustColor = (hex: string, degree: number) => {
    const idx = themeColors.indexOf(hex);
    if (idx === -1) return hex;
    return themeColors[(idx + 2) % themeColors.length]; 
  };

  // Trigger color differentiation for Labs/Tutorials
  const triggerColorUpdate = (diff: boolean) => {
    // Update template setting
    onUpdateTemplate({ ...template, differentiateTypes: diff });
    
    // Get unique display titles and their base colors
    const displayTitlesSet = new Set<string>();
    events.forEach(e => displayTitlesSet.add(e.displayTitle));
    const displayTitles = Array.from(displayTitlesSet);
    const baseColorMap = new Map<string, string>();
    displayTitles.forEach((title, index) => {
      // Use existing color if available, otherwise assign from theme
      const existingEvent = events.find(e => e.displayTitle === title);
      baseColorMap.set(title, existingEvent?.color || themeColors[index % themeColors.length]);
    });
    
    const updatedEvents = events.map(event => {
      const baseColor = baseColorMap.get(event.displayTitle) || themeColors[0];
      
      let newColor = baseColor;
      if (diff) {
        // Only differentiate Lab and Tutorial, keep Lecture at base color
        if (event.classType === 'Lab') {
          newColor = adjustColor(baseColor, 40);
        } else if (event.classType === 'Tutorial') {
          newColor = adjustColor(baseColor, 90);
        }
        // Lecture, Seminar, and other types stay at baseColor
      }
      // When diff is false, all types use baseColor
      return { ...event, color: newColor };
    });
    onUpdateEvents(updatedEvents);
  };

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        // Check if click is on an event block
        const target = e.target as HTMLElement;
        if (!target.closest('[data-component="EventBlock"]')) {
          setSelectedEventId(null);
          setColorPickerPosition(null);
        }
      }
    };
    
    if (selectedEventId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [selectedEventId]);

  // Apply theme colors when theme family changes (except for default)
  const applyThemeColors = (newThemeFamily: ThemeFamilyId) => {
    // Don't recolor for default theme - let users keep their own colors
    if (newThemeFamily === 'default') return;
    
    const themeColors = getThemeColors(newThemeFamily);
    
    // Get unique display titles and assign colors
    const displayTitlesSet = new Set<string>();
    events.forEach(e => displayTitlesSet.add(e.displayTitle));
    const displayTitles = Array.from(displayTitlesSet);
    const colorMap = new Map<string, string>();
    displayTitles.forEach((title, index) => {
      colorMap.set(title, themeColors[index % themeColors.length]);
    });
    
    // Update all events with new theme colors
    const updatedEvents = events.map(event => ({
      ...event,
      color: colorMap.get(event.displayTitle) || event.color
    }));
    
    onUpdateEvents(updatedEvents);
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleZoomReset = () => setZoom(1);

  const handleDownload = async () => {
    setIsExporting(true);
    // Allow React to render potentially higher res or clean state if needed, though here we just grab the ID
    await new Promise(r => setTimeout(r, 100)); 
    await downloadComponentAsImage('calendar-export-node', 'my-beautiful-calendar');
    setIsExporting(false);
  };

  return (
    <div data-component="ExportLayout" className="flex h-full gap-6 relative">
      
      {/* PREVIEW PANEL - The dark container that holds the calendar preview */}
      <div data-component="PreviewPanel" ref={previewPanelRef} className="flex-1 overflow-auto relative">
        
        {/* ZOOM TOOLBAR - Absolute positioned, overlays on calendar */}
        <div data-component="ZoomToolbar" className="absolute top-4 right-4 z-50 flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 bg-gray-800/90 hover:bg-gray-700 border border-gray-600 rounded-lg shadow-lg transition-all hover:scale-105 active:scale-95 backdrop-blur-sm group"
            title="Zoom Out"
          >
            <ZoomOut size={16} className="text-gray-200 group-hover:text-white" />
          </button>
          <button
            onClick={handleZoomReset}
            className="px-3 py-2 bg-gray-800/90 hover:bg-gray-700 border border-gray-600 rounded-lg shadow-lg transition-all hover:scale-105 active:scale-95 backdrop-blur-sm group min-w-[60px] text-center"
            title="Reset to 100%"
          >
            <span className="text-xs font-mono text-gray-200 group-hover:text-white">
              {Math.round(zoom * 100)}%
            </span>
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 bg-gray-800/90 hover:bg-gray-700 border border-gray-600 rounded-lg shadow-lg transition-all hover:scale-105 active:scale-95 backdrop-blur-sm group"
            title="Zoom In"
          >
            <ZoomIn size={16} className="text-gray-200 group-hover:text-white" />
          </button>
        </div>

        {/* PREVIEW VIEWPORT - Centers the calendar */}
        <div 
          data-component="PreviewViewport" 
          className="min-h-full p-6 flex items-start justify-center"
        >
          {/* ZOOM WRAPPER - Applies zoom transform */}
          <div 
            data-component="ZoomWrapper"
            className="transition-transform duration-200 origin-top" 
            style={{ 
              transform: `scale(${zoom})`,
            }}
          >
            {/* EXPORT NODE - This exact element is captured for image export */}
            <div data-component="ExportNode" id="calendar-export-node">
              <CalendarCanvas
                events={events}
                template={template}
                interactive={true}
                onEventClick={handleEventClick}
                onBlankClick={handleBlankClick}
              />
            </div>
          </div>
        </div>

        {/* FLOATING COLOR PICKER - Smart positioning based on available space */}
        {selectedEvent && colorPickerPosition && (
          <div
            ref={colorPickerRef}
            className="absolute z-[100] animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
            style={{
              left: colorPickerPosition.x,
              top: colorPickerPosition.y,
              transform: colorPickerPosition.placement === 'top' ? 'translate(-50%, -100%)' :
                         colorPickerPosition.placement === 'bottom' ? 'translate(-50%, 0%)' :
                         colorPickerPosition.placement === 'right' ? 'translate(0%, -50%)' :
                         'translate(-100%, -50%)'
            }}
          >
            <div className="bg-gray-900/95 backdrop-blur-xl rounded-xl border border-gray-700 shadow-2xl p-3 relative">
              {/* Arrow pointer - direction based on placement, with offset */}
              {colorPickerPosition.placement === 'top' && (
                <div
                  className="absolute -bottom-2 w-4 h-4 bg-gray-900/95 border-r border-b border-gray-700"
                  style={{ left: `calc(50% + ${colorPickerPosition.arrowOffset}px - 8px)`, transform: 'rotate(45deg)' }}
                />
              )}
              {colorPickerPosition.placement === 'bottom' && (
                <div
                  className="absolute -top-2 w-4 h-4 bg-gray-900/95 border-l border-t border-gray-700"
                  style={{ left: `calc(50% + ${colorPickerPosition.arrowOffset}px - 8px)`, transform: 'rotate(45deg)' }}
                />
              )}
              {colorPickerPosition.placement === 'right' && (
                <div
                  className="absolute -left-2 w-4 h-4 bg-gray-900/95 border-l border-b border-gray-700"
                  style={{ top: 'calc(50% - 8px)', transform: 'rotate(45deg)' }}
                />
              )}
              {colorPickerPosition.placement === 'left' && (
                <div
                  className="absolute -right-2 w-4 h-4 bg-gray-900/95 border-r border-t border-gray-700"
                  style={{ top: 'calc(50% - 8px)', transform: 'rotate(45deg)' }}
                />
              )}

              {/* Header */}
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-xs text-gray-400 font-medium italic">
                  Color (applies to all {selectedEvent.displayTitle})
                </span>
                <button
                  onClick={() => {
                    setSelectedEventId(null);
                    setColorPickerPosition(null);
                  }}
                  className="text-gray-500 hover:text-white transition-colors flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Color swatches - 2 rows grid */}
              <div className="grid grid-cols-6 gap-1.5 mb-2">
                {themeColors.map(color => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${
                      selectedEvent.color === color
                        ? 'border-white scale-110 ring-2 ring-blue-400 ring-offset-1 ring-offset-gray-900'
                        : 'border-transparent hover:border-gray-500'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>

              {/* Different Lab/Tutorial Colors Toggle */}
              <div className="pt-2 border-t border-gray-700/50">
                <div className="flex items-center justify-between gap-3 px-1 py-1.5 bg-gray-800/50 rounded-lg">
                  <span className="text-xs text-gray-300 font-medium whitespace-nowrap">Different Lab/Tutorial Colors</span>
                  <div
                    onClick={() => triggerColorUpdate(!template.differentiateTypes)}
                    className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer flex-shrink-0 ${template.differentiateTypes ? 'bg-blue-600' : 'bg-gray-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${template.differentiateTypes ? 'left-6' : 'left-1'}`} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SIDEBAR TOGGLE - Shows when sidebar is collapsed */}
        {!isSidebarOpen && (
          <button 
            data-component="SidebarToggle"
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 left-4 z-50 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg"
          >
            <SlidersHorizontal size={20} />
          </button>
        )}
      </div>

      {/* SETTINGS SIDEBAR - Right panel with all style controls */}
      <div 
        data-component="SettingsSidebar"
        className={`
         bg-gray-900 rounded-2xl border border-gray-800 flex flex-col shadow-xl transition-all duration-300
         ${isSidebarOpen ? 'w-80 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-10 overflow-hidden border-0 p-0'}
      `}>
        {/* SIDEBAR HEADER - Navigation and title */}
        <div data-component="SidebarHeader" className="p-4 border-b border-gray-800 flex justify-between items-center whitespace-nowrap">
          <button onClick={onBack} className="text-gray-400 hover:text-white text-sm">← Back</button>
          <div className="flex items-center gap-2">
             <h3 className="font-semibold text-white text-lg">Visual Style</h3>
             <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-white">
               <ChevronRight size={18} />
             </button>
          </div>
        </div>

        {/* SIDEBAR CONTENT - Scrollable settings area */}
        <div data-component="SidebarContent" className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar whitespace-nowrap">
          
          {/* Theme Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-300 font-medium">
              <Palette size={16} /> Theme
            </div>
            
            {/* Theme Family Dropdown & Light/Dark Toggle on Same Line */}
            <div className="flex gap-2">
              <select
                value={template.themeFamily}
                onChange={(e) => {
                  const newFamily = e.target.value as ThemeFamilyId;
                  onUpdateTemplate({ 
                    ...template, 
                    themeFamily: newFamily,
                    theme: `${newFamily}-${template.themeVariant}` as any
                  });
                  // Apply theme colors when switching themes (except default)
                  if (newFamily !== prevThemeFamilyRef.current) {
                    applyThemeColors(newFamily);
                    prevThemeFamilyRef.current = newFamily;
                  }
                }}
                className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all cursor-pointer hover:bg-gray-750"
              >
                {THEME_FAMILY_LIST.map((family) => (
                  <option key={family.id} value={family.id}>
                    {family.name}
                  </option>
                ))}
              </select>

              {/* Light/Dark Toggle Button */}
              <button
                onClick={() => {
                  const newVariant = template.themeVariant === 'light' ? 'dark' : 'light';
                  onUpdateTemplate({
                    ...template,
                    themeVariant: newVariant,
                    theme: `${template.themeFamily}-${newVariant}` as any
                  });
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 border border-gray-600 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg active:scale-[0.98] flex items-center gap-2 group"
              >
                {template.themeVariant === 'light' ? (
                  <>
                    <Sun size={16} className="text-yellow-400" />
                    <span className="text-gray-200">Light</span>
                  </>
                ) : (
                  <>
                    <Moon size={16} className="text-blue-400" />
                    <span className="text-gray-200">Dark</span>
                  </>
                )}
                <span className="text-lg group-hover:scale-110 transition-transform">⇄</span>
              </button>
            </div>
          </div>

          {/* Typography */}
          <div className="space-y-3">
             <div className="flex items-center gap-2 text-sm text-gray-300 font-medium">
              <Type size={16} /> Text Scale
            </div>
            <div className="flex items-center gap-3">
               <span className="text-xs text-gray-500">A</span>
               <input 
                  type="range" 
                  min="0.8" 
                  max="1.5" 
                  step="0.1" 
                  value={template.fontScale}
                  onChange={(e) => onUpdateTemplate({ ...template, fontScale: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
               <span className="text-sm text-gray-500">A</span>
            </div>
          </div>

          {/* Aspect Ratio Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300 font-medium flex items-center gap-2">
                <Maximize2 size={16} /> Aspect Ratio
              </span>
              <span className="text-xs text-gray-500">
                {template.aspectRatio <= 0.5 ? 'Landscape' : 'Portrait'}
              </span>
            </div>
            
            {/* Aspect Ratio Slider */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">16:9</span>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                value={template.aspectRatio}
                onChange={(e) => onUpdateTemplate({ ...template, aspectRatio: parseFloat(e.target.value) })}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-xs text-gray-500">9:16</span>
            </div>

            {/* Quick Presets */}
            <div className="flex bg-gray-700/50 rounded-lg p-0.5">
              <button
                onClick={() => onUpdateTemplate({ ...template, aspectRatio: 0 })}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs transition-colors ${template.aspectRatio <= 0.5 ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Monitor size={14} /> Desktop
              </button>
              <button
                onClick={() => onUpdateTemplate({ ...template, aspectRatio: 1 })}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs transition-colors ${template.aspectRatio > 0.5 ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Smartphone size={14} /> Mobile
              </button>
            </div>
          </div>

          {/* Layout Options - Collapsible */}
          <div className="space-y-3">
            <button
              onClick={() => setIsContentExpanded(!isContentExpanded)}
              className="flex items-center justify-between w-full text-sm text-gray-300 font-medium hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <Layout size={16} /> Content Selection
              </div>
              {isContentExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {isContentExpanded && (
              <div className="space-y-1">
                {/* Compact View at top - toggles off other options when enabled */}
                <div className="p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-gray-600 transition-colors">
                  <ToggleSwitch
                    enabled={template.compact}
                    onToggle={() => {
                      const newCompact = !template.compact;
                      if (newCompact) {
                        // Cache current toggle states before enabling compact
                        setCachedToggles({
                          showClassType: template.showClassType,
                          showTime: template.showTime,
                          showLocation: template.showLocation,
                          showNotes: template.showNotes
                        });
                        // Disable all content options
                        onUpdateTemplate({
                          ...template,
                          compact: true,
                          showClassType: false,
                          showTime: false,
                          showLocation: false,
                          showNotes: false
                        });
                      } else {
                        // Restore cached toggle states
                        if (cachedToggles) {
                          onUpdateTemplate({
                            ...template,
                            compact: false,
                            ...cachedToggles
                          });
                        } else {
                          onUpdateTemplate({ ...template, compact: false });
                        }
                      }
                    }}
                    label={<span className="text-sm text-gray-200 font-medium">Compact View</span>}
                  />
                </div>

                {/* Other content options - disabled when compact is on */}
                <div className={`space-y-1 ${template.compact ? 'opacity-40 pointer-events-none' : ''}`}>
                  <div className="p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-transparent hover:border-gray-700 transition-colors">
                    <ToggleSwitch
                      enabled={template.showClassType}
                      onToggle={() => onUpdateTemplate({ ...template, showClassType: !template.showClassType })}
                      label={<span className="flex items-center gap-3 text-sm text-gray-300"><Tag size={14} /> Show Class Type</span>}
                      disabled={template.compact}
                    />
                  </div>

                  <div className="p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-transparent hover:border-gray-700 transition-colors">
                    <ToggleSwitch
                      enabled={template.showTime}
                      onToggle={() => onUpdateTemplate({ ...template, showTime: !template.showTime })}
                      label={<span className="flex items-center gap-3 text-sm text-gray-300"><Clock size={14} /> Show Time</span>}
                      disabled={template.compact}
                    />
                  </div>

                  <div className="p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-transparent hover:border-gray-700 transition-colors">
                    <ToggleSwitch
                      enabled={template.showLocation}
                      onToggle={() => onUpdateTemplate({ ...template, showLocation: !template.showLocation })}
                      label={<span className="flex items-center gap-3 text-sm text-gray-300"><MapPin size={14} /> Show Location</span>}
                      disabled={template.compact}
                    />
                  </div>

                  <div className="p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-transparent hover:border-gray-700 transition-colors">
                    <ToggleSwitch
                      enabled={template.showNotes}
                      onToggle={() => onUpdateTemplate({ ...template, showNotes: !template.showNotes })}
                      label={<span className="flex items-center gap-3 text-sm text-gray-300"><Type size={14} /> Show Notes</span>}
                      disabled={template.compact}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Grid & Download */}
          <div className="space-y-3">
             <div className="flex items-center gap-2 text-sm text-gray-300 font-medium">
              <Grid size={16} /> Grid
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-transparent hover:border-gray-700 transition-colors">
                <ToggleSwitch
                  enabled={template.showGrid}
                  onToggle={() => onUpdateTemplate({ ...template, showGrid: !template.showGrid })}
                  label={<span className="text-sm text-gray-300">Show Grid Lines</span>}
                />
              </div>
              <button
                onClick={handleDownload}
                disabled={isExporting}
                className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {isExporting ? '...' : <><Download size={18} /></>}
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};