import React from 'react';
import { MapPin, AlignLeft, Plus, MousePointerClick } from 'lucide-react';
import { CalendarEvent, TemplateConfig, OnboardingComponent } from '../../types';
import acrylicTextureUrl from '../../assets/Texture_Acrylic.png';

export interface EventBlockTheme {
  eventBlock: {
    backgroundOpacity?: number;
    gradient?: string;
    shadow?: string;
    border?: string;
    acrylicBackground?: boolean;
  };
}

export interface EventBlockProps {
  /** All events for this day column */
  events: CalendarEvent[];
  actualDayIndex: number;
  template: TemplateConfig;
  currentTheme: EventBlockTheme;
  textColorPreset: {
    titleColor: string;
    subtitleColor: string;
    detailsColor: string;
  };
  showFullTitle: boolean;
  interactive: boolean;
  selectedEventId?: string | null;
  draggingEventId: string | null;
  overlappingSet: Set<string>;
  hideUnselectedBorders: boolean;
  hideTextContent: boolean;
  blurScale: number;
  exportMode: boolean;
  selectedBorderColor: string;
  startHour: number;
  hourRange: number;
  cardDimensions: { gridHeight: number };
  isOnboardingActive: (component: OnboardingComponent) => boolean;
  onboardingEventId?: string | null;
  eventBlockOnboardingMessage?: React.ReactNode;
  /** Hovered empty slot (null if none or belongs to another day) */
  hoveredSlotForDay: { dayIndex: number; startHour: number } | null;
  slotTopPercent: number;
  slotHeightPercent: number;
  addSlotStyle: React.CSSProperties;
  addSlotTextColor: string;
  onEmptyBlockClick?: (slot: { dayIndex: number; startTime: string; endTime: string }) => void;
  clearHoveredSlot?: () => void;
  onEventClick?: (event: CalendarEvent) => void;
  handleEventMouseDown: (event: CalendarEvent, e: React.MouseEvent<HTMLDivElement>) => void;
  handleEventTouchStart: (event: CalendarEvent, e: React.TouchEvent<HTMLDivElement>) => void;
  justHandledDragRef: React.RefObject<boolean>;
  dragInfoRef: React.RefObject<unknown>;
  formatTimeFromHours: (t: number) => string;
  roundToNearestHalfHour: (t: number) => number;
}

export const EventBlock: React.FC<EventBlockProps> = ({
  events,
  actualDayIndex,
  template,
  currentTheme,
  textColorPreset,
  showFullTitle,
  interactive,
  selectedEventId,
  draggingEventId,
  overlappingSet,
  hideUnselectedBorders,
  hideTextContent,
  blurScale,
  exportMode,
  selectedBorderColor,
  startHour,
  hourRange,
  cardDimensions,
  isOnboardingActive,
  onboardingEventId,
  eventBlockOnboardingMessage,
  hoveredSlotForDay,
  slotTopPercent,
  slotHeightPercent,
  addSlotStyle,
  addSlotTextColor,
  onEmptyBlockClick,
  clearHoveredSlot,
  onEventClick,
  handleEventMouseDown,
  handleEventTouchStart,
  justHandledDragRef,
  dragInfoRef,
  formatTimeFromHours,
  roundToNearestHalfHour,
}) => {
  return (
    <>
      {hoveredSlotForDay && onEmptyBlockClick && (
        <div
          data-component="EmptySlot"
          className="absolute left-1 right-1 rounded-md border flex items-center justify-center text-sm font-semibold tracking-wide transition-all duration-150"
          style={{
            top: `${slotTopPercent}%`,
            height: `${slotHeightPercent}%`,
            zIndex: 5,
            color: addSlotTextColor,
            ...addSlotStyle,
          }}
          onClick={(e) => {
            e.stopPropagation();
            clearHoveredSlot?.();
            const startTime = formatTimeFromHours(hoveredSlotForDay.startHour);
            const endTime = formatTimeFromHours(hoveredSlotForDay.startHour + 1);
            onEmptyBlockClick({
              dayIndex: actualDayIndex,
              startTime,
              endTime,
            });
          }}
          onPointerLeave={() => clearHoveredSlot?.()}
        >
          <Plus size={18} strokeWidth={2.5} />
        </div>
      )}
      {events.filter(e => e.dayIndex === actualDayIndex).map(event => {
        const isSelected = selectedEventId === event.id;
        const isDragging = draggingEventId === event.id;
        const canDrag = interactive && !!template; // onEventTimeChange presence is indicated by draggingEventId being settable
        const isOverlapping = overlappingSet.has(event.id);
        const shouldHideBorder = hideUnselectedBorders && !isSelected && !isOverlapping;

        // Original time values
        const startVal = parseInt(event.startTime.split(':')[0]) + parseInt(event.startTime.split(':')[1]) / 60;
        const endVal = parseInt(event.endTime.split(':')[0]) + parseInt(event.endTime.split(':')[1]) / 60;

        // Round to nearest half hour for grid alignment
        const alignedStart = roundToNearestHalfHour(startVal);
        const alignedEnd = roundToNearestHalfHour(endVal);

        // Ensure minimum height of 0.5 hours even after rounding
        const alignedDuration = Math.max(0.5, alignedEnd - alignedStart);

        const topPercent = ((alignedStart - startHour) / hourRange) * 100;
        const heightPercent = (alignedDuration / hourRange) * 100;
        const showEventOnboarding = isOnboardingActive('eventBlock') && event.id === onboardingEventId;
        const calloutTopPx = (topPercent / 100) * cardDimensions.gridHeight + (heightPercent / 100) * cardDimensions.gridHeight / 2;

        return (
          <React.Fragment key={event.id}>
            {/* EVENT BLOCK - Individual class/event card */}
            <div
              data-component="EventBlock"
              data-event-id={event.id}
              onClick={() => {
                if (justHandledDragRef.current) return;
                interactive && onEventClick && onEventClick(event);
              }}
              onMouseDown={(e) => handleEventMouseDown(event, e)}
              onTouchStart={(e) => handleEventTouchStart(event, e)}
              onTouchEnd={(e: React.TouchEvent) => {
                // If drag tracking is active, suppress — handleUp handles the outcome
                if (dragInfoRef.current) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
                // Fallback for when onEventTimeChange is not provided
                if (interactive && onEventClick && selectedEventId !== event.id) {
                  e.preventDefault();
                  e.stopPropagation();
                  onEventClick(event);
                }
              }}
              className={`absolute left-1 right-1 rounded-md p-1.5 shadow-sm border flex flex-col
                ${template.textAlignVertical === 'center' ? 'justify-center' : template.textAlignVertical === 'bottom' ? 'justify-end' : 'justify-start'}
                ${interactive ? 'cursor-pointer hover:brightness-110 hover:shadow-md hover:z-[200] transition-all' : ''}
                ${canDrag ? 'cursor-grab' : ''}
                ${isDragging ? 'cursor-grabbing' : ''}
                ${event.isConfidenceLow && interactive ? 'ring-2 ring-red-500 ring-offset-1' : ''}
              `}
              style={{
                top: `${topPercent}%`,
                height: `${heightPercent}%`,
                // Apply acrylic effect for acrylic theme
                // Use per-event opacity if set, otherwise fall back to template.eventOpacity
                ...((() => {
                  const eventOpacity = event.opacity ?? template.eventOpacity;
                  // Solid-grain: uses backgroundOpacity + optional gradient, NO acrylicBackground
                  if (template.themeFamily === 'solid-grain') {
                    const bgOpacity = currentTheme.eventBlock.backgroundOpacity ?? 0.7;
                    return {
                      background: currentTheme.eventBlock.gradient
                        ? `${currentTheme.eventBlock.gradient}, ${event.color}${Math.round(eventOpacity * bgOpacity * 255).toString(16).padStart(2, '0')}`
                        : `${event.color}${Math.round(eventOpacity * bgOpacity * 255).toString(16).padStart(2, '0')}`,
                      boxShadow: currentTheme.eventBlock.shadow,
                      border: template.eventBlockNoBorders ? 'none' : currentTheme.eventBlock.border,
                      overflow: 'hidden',
                    };
                  }
                  // Acrylic: uses acrylicBackground overlay approach
                  if (template.themeFamily === 'acrylic' && currentTheme.eventBlock.acrylicBackground) {
                    return {
                      // Use event color with opacity based on eventOpacity setting
                      background: `${event.color}${Math.round(eventOpacity * 0.35 * 255).toString(16).padStart(2, '0')}`,
                      boxShadow: currentTheme.eventBlock.shadow,
                      border: template.eventBlockNoBorders ? 'none' : currentTheme.eventBlock.border,
                      overflow: 'hidden',
                    };
                  } else if (template.themeFamily === 'glass') {
                    return {
                      backgroundColor: `${event.color}${Math.round(eventOpacity * 255).toString(16).padStart(2, '0')}`,
                      borderColor: template.eventBlockNoBorders ? 'transparent' : 'rgba(255,255,255,0.2)',
                      overflow: 'hidden',
                    };
                  } else {
                    return {
                      backgroundColor: event.color + Math.round(eventOpacity * 255).toString(16).padStart(2, '0'),
                      borderColor: 'rgba(0,0,0,0.1)',
                    };
                  }
                })()),
                ...(isOverlapping
                  ? {
                      borderColor: 'rgba(239, 68, 68, 0.95)',
                      borderWidth: '3px',
                      boxShadow: '0 12px 26px rgba(239, 68, 68, 0.35)',
                    }
                  : isSelected
                  ? {
                      borderColor: selectedBorderColor,
                      borderWidth: '3px',
                      boxShadow: '0 10px 24px rgba(37, 99, 235, 0.25)',
                    }
                  : {}),
                ...(shouldHideBorder ? { borderColor: 'transparent' } : {}),
                ...(showEventOnboarding ? {
                  borderColor: 'rgba(6, 182, 212, 0.6)',
                  borderStyle: 'dotted',
                  borderWidth: '3px',
                  boxShadow: '0 0 0 1px rgba(6, 182, 212, 0.25)',
                } : {}),
                color: '#fff',
                zIndex: isDragging ? 30 : showEventOnboarding ? 25 : isSelected ? 20 : 10,
                userSelect: isDragging ? 'none' : 'auto',
              }}
            >
              {/* Backdrop blur layer for acrylic/solid-grain/glass themes */}
              {(template.themeFamily === 'acrylic' || template.themeFamily === 'solid-grain' || template.themeFamily === 'glass') && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    // In export mode, use semi-transparent background instead of backdrop blur
                    ...(exportMode ? {
                      // Export fallback: gradient overlay to simulate frosted glass
                      background: template.themeVariant === 'light'
                        ? 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.3) 100%)'
                        : 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.2) 100%)',
                    } : {
                      // Solid-grain uses lighter blur (8px) since canvas provides presence
                      // Acrylic uses heavier blur (30px) for frosted effect
                      backdropFilter: template.themeFamily === 'solid-grain'
                        ? `blur(${8 * blurScale}px)`
                        : `blur(${12 * blurScale}px)`,
                      WebkitBackdropFilter: template.themeFamily === 'solid-grain'
                        ? `blur(${8 * blurScale}px)`
                        : `blur(${12 * blurScale}px)`,
                    }),
                    pointerEvents: 'none',
                    borderRadius: 'inherit',
                    zIndex: -1,
                  }}
                />
              )}
              {/* Grain texture overlay for acrylic and solid-grain themes (grain on blocks only) */}
              {(template.themeFamily === 'acrylic' || template.themeFamily === 'solid-grain') && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url('${acrylicTextureUrl}')`,
                    backgroundRepeat: 'repeat',
                    backgroundSize: '128px 128px',
                    opacity: 0.1,
                    pointerEvents: 'none',
                    borderRadius: 'inherit',
                  }}
                />
              )}
              {!hideTextContent && (
                <div
                  className="flex flex-col min-w-0 overflow-hidden gap-0 relative z-10"
                  style={{
                    textAlign: template.textAlignHorizontal,
                    // Add padding for italic text overhang, especially when right-aligned
                    paddingRight: (template.titleItalic || template.subtitleItalic) && template.textAlignHorizontal === 'right' ? '0.15em' : undefined,
                  }}
                >
                  <div
                    className="leading-none uppercase tracking-wide"
                    style={{
                      wordBreak: 'keep-all',
                      overflowWrap: 'normal',
                      fontSize: `${template.titleFontSize}px`,
                      fontFamily: template.titleFont,
                      fontWeight: template.titleBold ? 700 : 400,
                      fontStyle: template.titleItalic ? 'italic' : 'normal',
                      color: template.titleTextColor || textColorPreset.titleColor
                    }}
                    title={showFullTitle ? event.title : event.displayTitle}
                  >
                    {showFullTitle ? event.title : event.displayTitle}
                  </div>

                  {/* Class Type Label */}
                  {template.showClassType && (
                    <div
                      className="opacity-90"
                      style={{
                        fontSize: `${template.subtitleFontSize}px`,
                        fontFamily: template.subtitleFont,
                        fontWeight: template.subtitleBold ? 600 : 400,
                        fontStyle: template.subtitleItalic ? 'italic' : 'normal',
                        color: template.subtitleTextColor || textColorPreset.subtitleColor,
                        marginTop: '2px'
                      }}
                    >
                      {event.classType === 'Custom' ? event.customClassType : event.classType}
                    </div>
                  )}
                </div>
              )}

              {!hideTextContent && !template.compact && (
                <div
                  className="opacity-90 flex flex-col gap-0 min-w-0 overflow-hidden"
                  style={{
                    fontSize: `${template.detailsFontSize}px`,
                    fontFamily: template.detailsFont,
                    fontWeight: template.detailsBold ? 600 : 400,
                    fontStyle: template.detailsItalic ? 'italic' : 'normal',
                    color: template.detailsTextColor || textColorPreset.detailsColor,
                    marginTop: '2px',
                    textAlign: template.textAlignHorizontal,
                    // Add padding for italic text overhang, especially when right-aligned
                    paddingRight: template.detailsItalic && template.textAlignHorizontal === 'right' ? '0.15em' : undefined,
                  }}
                >
                  {template.showTime && (
                    <div className={`flex items-center gap-1 font-mono opacity-80 w-full ${template.textAlignHorizontal === 'center' ? 'justify-center' : template.textAlignHorizontal === 'right' ? 'justify-end' : ''}`}>
                       <span>{event.startTime} - {event.endTime}</span>
                    </div>
                  )}

                  {template.showLocation && event.location && (
                    template.textAlignHorizontal === 'left' ? (
                      <div className="flex items-start gap-1 opacity-75 w-full">
                        <MapPin size={10} className="mt-0.5 shrink-0" />
                        <span className="break-words leading-tight">{event.location}</span>
                      </div>
                    ) : (
                      <div className={`opacity-75 w-full ${template.textAlignHorizontal === 'center' ? 'text-center' : 'text-right'}`}>
                        <MapPin size={10} className="inline-block align-middle mr-1" />
                        <span className="break-words leading-tight">{event.location}</span>
                      </div>
                    )
                  )}

                  {(event.includeNotes ?? template.showNotes) && event.notes && (
                     <div className={`flex items-start gap-1 opacity-75 border-t border-black/10 w-full ${template.textAlignHorizontal === 'center' ? 'justify-center' : template.textAlignHorizontal === 'right' ? 'justify-end' : ''}`} style={{ marginTop: '2px', paddingTop: '2px' }}>
                       <AlignLeft size={10} className="mt-0.5 shrink-0" />
                       <span className="line-clamp-4 leading-tight break-words">{event.notes}</span>
                     </div>
                  )}
                </div>
              )}

            </div>
            {/* Callout rendered OUTSIDE event block to avoid overflow:hidden clipping */}
            {showEventOnboarding && (
              <div
                data-component="OnboardingCallout-eventBlock"
                className="absolute z-[200]"
                style={{
                  left: 'calc(100% + 8px)',
                  top: `${calloutTopPx}px`,
                  transform: 'translateY(-50%)',
                  pointerEvents: 'auto',
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-0">
                  {/* Arrow pointing left towards the event block */}
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderTop: '6px solid transparent',
                      borderBottom: '6px solid transparent',
                      borderRight: '8px solid rgba(6, 182, 212, 0.4)',
                    }}
                  />
                  <div className="relative group bg-cyan-500/20 border border-cyan-500/35 rounded-lg p-2.5 text-xs text-cyan-200/90 backdrop-blur-md max-w-[350px]">
                    {eventBlockOnboardingMessage ? (
                      <p className="whitespace-nowrap">
                        <MousePointerClick size={13} className="inline-block mr-1.5 -mt-0.5 text-cyan-400" />
                        {eventBlockOnboardingMessage}
                      </p>
                    ) : (
                      <p className="break-words">
                        <MousePointerClick size={13} className="inline-block mr-1.5 -mt-0.5 text-cyan-400" />
                        Click on block to edit color/font/layout.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};
