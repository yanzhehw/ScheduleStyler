import React, { useRef, useState, useEffect, useCallback } from 'react';

interface VerticalSliderProps {
  initialValue?: number; // 0-1, default 0
  value?: number; // controlled value 0-1
  onChange?: (value: number) => void;
  height?: number; // track height in pixels, default 384
}

export const VerticalSlider: React.FC<VerticalSliderProps> = ({
  initialValue = 0,
  value: controlledValue,
  onChange,
  height = 384,
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [internalValue, setInternalValue] = useState(initialValue);

  // Use controlled value if provided, otherwise use internal state
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const thumbHeight = 64;
  const trackWidth = 15;

  // Calculate thumb position from bottom (value 0 = bottom, value 1 = top)
  const thumbBottom = value * ((height - thumbHeight) / height) * 100;

  const updateValue = useCallback((clientY: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    // Value is inverted: top of track = 1, bottom = 0
    const rawValue = 1 - (clientY - rect.top) / rect.height;
    const clampedValue = Math.max(0, Math.min(1, rawValue));

    if (controlledValue === undefined) {
      setInternalValue(clampedValue);
    }
    onChange?.(clampedValue);
  }, [onChange, controlledValue]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateValue(e.clientY);
  }, [updateValue]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    if (e.touches[0]) {
      updateValue(e.touches[0].clientY);
    }
  }, [updateValue]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateValue(e.clientY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Prevent scroll interference
      if (e.touches[0]) {
        updateValue(e.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, updateValue]);

  return (
    <div
      ref={sliderRef}
      className="relative cursor-pointer select-none"
      style={{
        width: `${trackWidth}px`,
        height: `${height}px`,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      role="slider"
      aria-valuenow={Math.round(value * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-orientation="vertical"
      tabIndex={0}
    >
      {/* Track */}
      <div
        className="absolute inset-0 bg-gray-500 rounded-full"
        style={{
          width: `${trackWidth}px`,
          height: `${height}px`,
        }}
      />
      {/* Thumb */}
      <div
        className="absolute left-0 bg-gray-800 rounded-full transition-colors hover:bg-gray-700"
        style={{
          width: `${trackWidth}px`,
          height: `${thumbHeight}px`,
          bottom: `${thumbBottom}%`,
        }}
      />
    </div>
  );
};
