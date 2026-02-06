import React from 'react';
import styled from 'styled-components';

export interface GlassRadioOption<T extends string | number> {
  id: string;
  label: React.ReactNode;
  value: T;
}

interface GlassRadioGroupProps<T extends string | number> {
  name: string;
  options: GlassRadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}

export function GlassRadioGroup<T extends string | number>({
  name,
  options,
  value,
  onChange,
  disabled = false,
  className,
}: GlassRadioGroupProps<T>) {
  const selectedIndex = options.findIndex(opt => opt.value === value);
  const gliderWidth = 100 / options.length;

  return (
    <StyledWrapper className={className} $optionCount={options.length} $disabled={disabled}>
      <div className="glass-radio-group">
        {options.map((option, index) => (
          <React.Fragment key={option.id}>
            <input
              type="radio"
              name={name}
              id={`glass-${name}-${option.id}`}
              checked={option.value === value}
              onChange={() => !disabled && onChange(option.value)}
              disabled={disabled}
            />
            <label htmlFor={`glass-${name}-${option.id}`}>{option.label}</label>
          </React.Fragment>
        ))}
        <div
          className="glass-glider"
          style={{
            width: `${gliderWidth}%`,
            transform: `translateX(${selectedIndex * 100}%)`,
          }}
        />
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div<{ $optionCount: number; $disabled: boolean }>`
  .glass-radio-group {
    --bg: rgba(255, 255, 255, 0.06);
    --text: #e5e5e5;

    display: flex;
    position: relative;
    background: var(--bg);
    border-radius: 0.5rem;
    backdrop-filter: blur(12px);
    box-shadow:
      inset 1px 1px 4px rgba(255, 255, 255, 0.2),
      inset -1px -1px 6px rgba(0, 0, 0, 0.3),
      0 4px 12px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    width: 100%;
    opacity: ${props => props.$disabled ? 0.5 : 1};
    pointer-events: ${props => props.$disabled ? 'none' : 'auto'};
  }

  .glass-radio-group input {
    display: none;
  }

  .glass-radio-group label {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    font-size: 12px;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    font-weight: 600;
    letter-spacing: 0.3px;
    color: var(--text);
    position: relative;
    z-index: 2;
    transition: color 0.3s ease-in-out;
    white-space: nowrap;
  }

  .glass-radio-group label:hover {
    color: white;
  }

  .glass-radio-group input:checked + label {
    color: #fff;
  }

  .glass-glider {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    border-radius: 0.5rem;
    z-index: 1;
    /* Uses CSS variables from index.css for theming */
    background: linear-gradient(135deg, rgba(var(--accent-primary-rgb, 59, 130, 246), 0.33), var(--accent-secondary, #60a5fa));
    box-shadow:
      0 0 18px rgba(var(--accent-primary-rgb, 59, 130, 246), 0.5),
      0 0 10px rgba(var(--accent-secondary-rgb, 96, 165, 250), 0.4) inset;
    transition:
      transform 0.5s cubic-bezier(0.37, 1.95, 0.66, 0.56),
      background 0.4s ease-in-out,
      box-shadow 0.4s ease-in-out;
  }
`;

export default GlassRadioGroup;
