import React, { useState, useMemo } from 'react';
import { CalendarEvent, TemplateConfig, Category, ClassType } from '../types';
import { CalendarCanvas } from './CalendarCanvas';
import { ToggleSwitch } from './ToggleSwitch';
import { GuidanceNote } from './GuidanceNote';
import { TimeInput } from './TimeInput';
import { AlertBox } from './AlertBox';
import { Trash2, ListPlus, Upload, Clock, MapPin, Type, Layout, Monitor, Smartphone, Tag, ChevronDown, ChevronRight, Maximize2 } from 'lucide-react';
import { getThemeColors } from '../themes';

interface EditStepProps {
  events: CalendarEvent[];
  categories: Category[];
  template: TemplateConfig;
  onUpdateEvents: (events: CalendarEvent[]) => void;
  onUpdateTemplate: (template: TemplateConfig) => void;
  onNext: () => void;
  onReupload: () => void;
}

const CLASS_TYPES: ClassType[] = ['Lecture', 'Tutorial', 'Lab', 'Seminar', 'Unknown', 'Custom'];

export const EditStep: React.FC<EditStepProps> = ({
  events,
  categories,
  template,
  onUpdateEvents,
  onUpdateTemplate,
  onNext,
  onReupload
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showFullTitle, setShowFullTitle] = useState(false);
  const [isContentDisplayExpanded, setIsContentDisplayExpanded] = useState(true);
  const [showGuidanceNote, setShowGuidanceNote] = useState(true);

  // Cache for toggle states before compact mode
  const [cachedToggles, setCachedToggles] = useState<{
    showClassType: boolean;
    showTime: boolean;
    showLocation: boolean;
    showNotes: boolean;
  } | null>(null);

  const selectedEvent = events.find(e => e.id === selectedEventId);

  // Check if any events have valid course sections (not NaN)
  const hasValidCourseSections = useMemo(() => {
    return events.some(e => !isNaN(e.classSection) && e.classSection !== null && e.classSection !== undefined);
  }, [events]);

  // Get theme-specific colors based on current theme family and variant
  const themeColors = useMemo(() => {
    return getThemeColors(template.themeFamily, template.themeVariant);
  }, [template.themeFamily, template.themeVariant]);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEventId(event.id);
  };

  const handleBlankClick = () => {
    setSelectedEventId(null);
  };

  const handleUpdateEvent = (key: keyof CalendarEvent, value: any) => {
    if (!selectedEventId) return;

    const updated = events.map(e => {
      if (e.id === selectedEventId) {
        const newEvent = { ...e, [key]: value };

        // If Title changed, also update displayTitle and color
        if (key === 'title') {
           // Extract displayTitle from the new title (remove section number if present)
           // Assuming format like "CS 101 - 001" -> "CS 101" or just use the title as-is
           const titleParts = value.split(' - ');
           newEvent.displayTitle = titleParts[0].trim();

           const existingCatIndex = categories.findIndex(c => c.name === value);
           if (existingCatIndex >= 0) {
             newEvent.color = themeColors[existingCatIndex % themeColors.length];
           }
        }

        return newEvent;
      }
      return e;
    });
    onUpdateEvents(updated);
  };

  const handleDeleteEvent = () => {
    if (!selectedEventId) return;
    onUpdateEvents(events.filter(e => e.id !== selectedEventId));
    setSelectedEventId(null);
  };

  return (
    <div className="flex h-full gap-6">
      {/* Left: Interactive Canvas - centers the schedule when aspect ratio changes */}
      <div className="flex-1 bg-gray-800/30 rounded-2xl p-4 overflow-auto custom-scrollbar border border-gray-700/50 flex items-start justify-center">
        <CalendarCanvas
          events={events}
          template={template}
          interactive={true}
          onEventClick={handleEventClick}
          onBlankClick={handleBlankClick}
          showFullTitle={showFullTitle}
        />
      </div>

      {/* Right: Inspector Panel */}
      <div className="w-96 bg-gray-900 rounded-2xl border border-gray-800 flex flex-col shadow-xl flex-shrink-0">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900 z-10 rounded-t-2xl">
          <h3 className="font-semibold text-white">{selectedEvent ? 'Editing Class' : 'Class Inspector'}</h3>
          <div className="flex gap-2">
            {!selectedEvent && (
              <button onClick={onReupload} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5">
                <Upload size={14} />
                Re-upload
              </button>
            )}
            {selectedEvent ? (
              <button
                onClick={() => setSelectedEventId(null)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Done
              </button>
            ) : (
              <button
                onClick={onNext}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          
          {/* Global Toggles & Class Mapping */}
          {!selectedEvent && (
            <>
              {/* User guidance note */}
              {showGuidanceNote && (
                <GuidanceNote
                  message="Click on any event block in the calendar to edit its details and fine-tune the extracted data."
                  onClose={() => setShowGuidanceNote(false)}
                  type="info"
                />
              )}

              {/* Content Display Options - Collapsible */}
              <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <button
                  onClick={() => setIsContentDisplayExpanded(!isContentDisplayExpanded)}
                  className="flex items-center justify-between w-full text-sm text-gray-300 font-medium hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Layout size={14} /> Content Display
                  </div>
                  {isContentDisplayExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                {isContentDisplayExpanded && (
                  <div className="space-y-2 mt-4">
                    {/* Include Course Section toggle */}
                    {hasValidCourseSections && (
                      <div className="p-2 hover:bg-gray-700/30 rounded-lg transition-colors">
                        <ToggleSwitch
                          enabled={showFullTitle}
                          onToggle={() => setShowFullTitle(!showFullTitle)}
                          label={<span className="flex items-center gap-2"><Tag size={12} /> Include Course Section</span>}
                        />
                      </div>
                    )}

                    {/* Compact View at top - toggles off other options when enabled */}
                    <div className="p-2 hover:bg-gray-700/30 rounded-lg transition-colors border border-gray-700">
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
                        label="Compact View"
                      />
                    </div>

                    {/* Other content options - disabled when compact is on */}
                    <div className={`space-y-2 ${template.compact ? 'opacity-40 pointer-events-none' : ''}`}>
                      <div className="p-2 hover:bg-gray-700/30 rounded-lg transition-colors">
                        <ToggleSwitch
                          enabled={template.showClassType}
                          onToggle={() => onUpdateTemplate({ ...template, showClassType: !template.showClassType })}
                          label={<span className="flex items-center gap-2"><Tag size={12} /> Show Class Type</span>}
                          disabled={template.compact}
                        />
                      </div>

                      <div className="p-2 hover:bg-gray-700/30 rounded-lg transition-colors">
                        <ToggleSwitch
                          enabled={template.showTime}
                          onToggle={() => onUpdateTemplate({ ...template, showTime: !template.showTime })}
                          label={<span className="flex items-center gap-2"><Clock size={12} /> Show Time</span>}
                          disabled={template.compact}
                        />
                      </div>

                      <div className="p-2 hover:bg-gray-700/30 rounded-lg transition-colors">
                        <ToggleSwitch
                          enabled={template.showLocation}
                          onToggle={() => onUpdateTemplate({ ...template, showLocation: !template.showLocation })}
                          label={<span className="flex items-center gap-2"><MapPin size={12} /> Show Location</span>}
                          disabled={template.compact}
                        />
                      </div>

                      <div className="p-2 hover:bg-gray-700/30 rounded-lg transition-colors">
                        <ToggleSwitch
                          enabled={template.showNotes}
                          onToggle={() => {
                            // Reset all individual event includeNotes when global changes
                            const updatedEvents = events.map(e => ({ ...e, includeNotes: undefined }));
                            onUpdateEvents(updatedEvents);
                            onUpdateTemplate({ ...template, showNotes: !template.showNotes });
                          }}
                          label={<span className="flex items-center gap-2"><Type size={12} /> Show Notes</span>}
                          disabled={template.compact}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Aspect Ratio Section */}
              <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300 font-medium flex items-center gap-2">
                    <Maximize2 size={14} /> Aspect Ratio
                  </span>
                  <span className="text-xs text-gray-500">
                    {template.aspectRatio <= 0.5 ? 'Landscape' : 'Portrait'}
                  </span>
                </div>
                
                {/* Aspect Ratio Slider */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-500">16:9</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05" 
                    value={template.aspectRatio}
                    onChange={(e) => onUpdateTemplate({ ...template, aspectRatio: parseFloat(e.target.value) })}
                    className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <span className="text-[10px] text-gray-500">9:16</span>
                </div>

                {/* Quick Presets */}
                <div className="flex bg-gray-700/50 rounded-lg p-0.5">
                  <button
                    onClick={() => onUpdateTemplate({ ...template, aspectRatio: 0 })}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${template.aspectRatio <= 0.5 ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Monitor size={12} /> Desktop
                  </button>
                  <button
                    onClick={() => onUpdateTemplate({ ...template, aspectRatio: 1 })}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${template.aspectRatio > 0.5 ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Smartphone size={12} /> Mobile
                  </button>
                </div>
              </div>
            </>
          )}

          {selectedEvent ? (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
              
              {selectedEvent.isConfidenceLow && (
                <AlertBox
                  message="Check details (low confidence)."
                  type="warning"
                />
              )}

              {/* Course Info - Course Code with Class Type dropdown */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Course Code</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={selectedEvent.title}
                    onChange={(e) => handleUpdateEvent('title', e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                    placeholder="e.g. CS 101"
                  />
                  <select
                    value={selectedEvent.classType}
                    onChange={(e) => handleUpdateEvent('classType', e.target.value as ClassType)}
                    className="text-sm font-bold text-white bg-gray-900 border border-gray-700 px-4 py-2.5 rounded-lg whitespace-nowrap shadow-md uppercase tracking-wide cursor-pointer hover:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                  >
                    {CLASS_TYPES.map((type) => (
                      <option key={type} value={type} className="bg-gray-900 text-white">
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom Class Type Input */}
              {selectedEvent.classType === 'Custom' && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Custom Class Type</label>
                  <input
                    type="text"
                    value={selectedEvent.customClassType || ''}
                    onChange={(e) => handleUpdateEvent('customClassType', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="e.g. Workshop, Office Hours"
                  />
                </div>
              )}

              {/* Timing */}
              <div className="grid grid-cols-2 gap-3">
                <TimeInput
                  label="Start"
                  value={selectedEvent.startTime}
                  onChange={(value) => handleUpdateEvent('startTime', value)}
                />
                <TimeInput
                  label="End"
                  value={selectedEvent.endTime}
                  onChange={(value) => handleUpdateEvent('endTime', value)}
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Location</label>
                <input
                  type="text"
                  value={selectedEvent.location}
                  onChange={(e) => handleUpdateEvent('location', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white text-sm outline-none"
                  placeholder="Building/Room"
                />
              </div>

              {/* Notes - Checkboxes with include/exclude toggle (per-event) */}
              <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-400 flex items-center gap-1">
                    <ListPlus size={12} /> Notes
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500">{(selectedEvent.includeNotes ?? template.showNotes) ? 'Included' : 'Excluded'}</span>
                    <ToggleSwitch
                      enabled={selectedEvent.includeNotes ?? template.showNotes}
                      onToggle={() => handleUpdateEvent('includeNotes', !(selectedEvent.includeNotes ?? template.showNotes))}
                    />
                  </div>
                </div>

                {(selectedEvent.includeNotes ?? template.showNotes) && (
                  <>
                    {/* Metadata options as checkboxes */}
                    {selectedEvent.metadata && selectedEvent.metadata.length > 0 && (
                      <div className="space-y-2">
                        {selectedEvent.metadata.map((meta, idx) => {
                          const currentNotes = selectedEvent.notes || '';
                          const isChecked = currentNotes.includes(meta);
                          return (
                            <label key={idx} className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer hover:bg-gray-700/50 p-1.5 rounded">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  let newNotes = currentNotes;
                                  if (e.target.checked) {
                                    newNotes = currentNotes ? `${currentNotes}\n${meta}` : meta;
                                  } else {
                                    newNotes = currentNotes
                                      .split('\n')
                                      .filter(n => n !== meta)
                                      .join('\n');
                                  }
                                  handleUpdateEvent('notes', newNotes);
                                }}
                                className="w-3.5 h-3.5 text-blue-500 focus:ring-0 bg-gray-700 border-gray-600 rounded"
                              />
                              <span className="opacity-90">{meta}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* Additional content textarea */}
                    <div className="border-t border-gray-700 pt-2">
                      <label className="text-[10px] text-gray-500 mb-1 block">Additional notes</label>
                      <textarea
                        value={selectedEvent.notes || ''}
                        onChange={(e) => handleUpdateEvent('notes', e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white text-sm outline-none h-16 resize-none custom-scrollbar"
                        placeholder="Custom notes..."
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="pt-4 border-t border-gray-800">
                <button 
                  onClick={handleDeleteEvent}
                  className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 rounded-md transition-colors text-sm"
                >
                  <Trash2 size={14} /> Delete Event
                </button>
              </div>

            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};