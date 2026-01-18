import React, { useState } from 'react';
import { CalendarEvent, TemplateConfig } from '../types';
import { CalendarCanvas } from './CalendarCanvas';
import { ToggleSwitch } from './ToggleSwitch';
import { downloadComponentAsImage } from '../services/imageUtils';
import { Download, Layout, Type, Palette, MapPin, Grid, Clock, ChevronRight, ChevronDown, SlidersHorizontal, Monitor, Smartphone, Tag, Maximize2, Sun, Moon, ZoomIn, ZoomOut } from 'lucide-react';
import { THEME_FAMILY_LIST } from '../themes';

interface ExportStepProps {
  events: CalendarEvent[];
  template: TemplateConfig;
  onUpdateTemplate: (t: TemplateConfig) => void;
  onBack: () => void;
}

export const ExportStep: React.FC<ExportStepProps> = ({ events, template, onUpdateTemplate, onBack }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Cache for toggle states before compact mode
  const [cachedToggles, setCachedToggles] = useState<{
    showClassType: boolean;
    showTime: boolean;
    showLocation: boolean;
    showNotes: boolean;
  } | null>(null);

  // Zoom controls - simple percentage
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
      <div data-component="PreviewPanel" className="flex-1 overflow-auto relative">
        
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
              />
            </div>
          </div>
        </div>

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
                onChange={(e) => onUpdateTemplate({ 
                  ...template, 
                  themeFamily: e.target.value as any,
                  theme: `${e.target.value}-${template.themeVariant}` as any
                })}
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