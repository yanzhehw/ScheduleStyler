import React, { forwardRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlowButtonProps {
  label?: string;
  onClick?(): void;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ label = "Generate", onClick, className, disabled, children }, ref) => {
    const [isClicked, setIsClicked] = useState(false);

    const handleClick = () => {
      if (disabled) return;
      setIsClicked(true);
      setTimeout(() => setIsClicked(false), 200);
      onClick?.();
    };

    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        className={cn("glow-btn", className)}
        onClick={handleClick}
        disabled={disabled}
        data-state={isClicked ? "clicked" : undefined}
      >
        <span className="flex items-center justify-center gap-1.5">
          {children || (
            <>
              {label}
              <Sparkles size={16} className="ml-0.5" />
            </>
          )}
        </span>
      </button>
    );
  }
);

GlowButton.displayName = "GlowButton";
