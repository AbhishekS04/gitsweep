import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <div
        onClick={() => onCheckedChange(!checked)}
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onCheckedChange(!checked);
          }
        }}
        className={cn(
          "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 cursor-pointer transition-all duration-200 outline-none select-none",
          checked
            ? "border-indigo-500 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
            : "border-white/25 bg-transparent hover:border-indigo-500/50",
          className
        )}
      >
        <input
          type="checkbox"
          ref={ref}
          className="hidden"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          {...props}
        />
        {checked && (
          <Check size={11} strokeWidth={3} className="text-white" />
        )}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

