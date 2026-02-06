import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption<T extends string> {
  id: string;
  label: string;
  value: T;
}

interface ThemedDropdownProps<T extends string> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Custom render for the trigger button content */
  renderButton?: (selectedOption: DropdownOption<T> | undefined) => React.ReactNode;
  /** Custom render for each option */
  renderOption?: (option: DropdownOption<T>, isSelected: boolean) => React.ReactNode;
  /** Custom style for each option */
  optionStyle?: (option: DropdownOption<T>) => React.CSSProperties;
}

export function ThemedDropdown<T extends string>({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  className = '',
  renderButton,
  renderOption,
  optionStyle,
}: ThemedDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: DropdownOption<T>) => {
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-3 py-2.5
          flex items-center justify-between gap-1
          border rounded-lg
          input-themed
          text-sm text-gray-200
          transition-all duration-200
          min-w-0
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}
          ${isOpen ? 'border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]' : ''}
        `}
      >
        {renderButton ? (
          renderButton(selectedOption)
        ) : (
          <span className={`truncate ${selectedOption ? 'text-gray-200' : 'text-gray-500'}`}>
            {selectedOption?.label || placeholder}
          </span>
        )}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <ChevronDown size={16} className="text-gray-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{
              duration: 0.15,
              ease: [0.4, 0, 0.2, 1]
            }}
            className="absolute z-50 mt-1 w-full overflow-hidden"
            style={{
              background: 'var(--modal-background)',
              border: '1px solid var(--modal-border)',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(var(--accent-primary-rgb), 0.15)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="py-1 max-h-60 overflow-y-auto scrollbar-custom">
              {options.map((option, index) => {
                const isSelected = option.value === value;
                return (
                  <motion.button
                    key={option.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleSelect(option)}
                    className={`
                      w-full px-4 py-2.5
                      flex items-center justify-between
                      text-sm text-left
                      transition-colors duration-150
                      ${isSelected
                        ? 'text-white'
                        : 'text-gray-300 hover:text-white'
                      }
                    `}
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(var(--accent-primary-rgb), 0.3), rgba(var(--accent-secondary-rgb), 0.2))'
                        : 'transparent',
                      ...(optionStyle ? optionStyle(option) : {}),
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(var(--accent-primary-rgb), 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {renderOption ? (
                      renderOption(option, isSelected)
                    ) : (
                      <>
                        <span>{option.label}</span>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          >
                            <Check size={14} style={{ color: 'var(--accent-primary)' }} />
                          </motion.div>
                        )}
                      </>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ThemedDropdown;
