import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helperText?: string;
  variant?: "default" | "filled" | "underline";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, helperText, id, variant = "default", leftIcon, rightIcon, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    const baseInputStyles = "w-full bg-white font-sans text-ink-900 placeholder:text-ink-400 transition-all duration-200 ease-out focus:outline-none disabled:bg-ink-100 disabled:cursor-not-allowed";

    const variantStyles = {
      default: "border border-ink-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500",
      filled: "border border-transparent rounded-xl px-4 py-3 bg-paper-200 focus:bg-white focus:border-ink-200 focus:ring-2 focus:ring-brand-500/30",
      underline: "border-b border-ink-200 rounded-none px-0 py-2 bg-transparent focus:border-brand-500 focus:ring-0",
    };

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label 
            htmlFor={inputId} 
            className="block text-sm font-medium text-ink-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            id={inputId}
            className={cn(
              baseInputStyles,
              variantStyles[variant],
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-error-500 focus:ring-error-500/30 focus:border-error-500",
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-error-500">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-ink-500">{helperText}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

// Textarea variant
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  helperText?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, helperText, id, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label 
            htmlFor={textareaId} 
            className="block text-sm font-medium text-ink-700"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            "w-full px-4 py-3 bg-white border border-ink-200 rounded-xl",
            "font-sans text-ink-900 placeholder:text-ink-400",
            "transition-all duration-200 ease-out",
            "focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500",
            "disabled:bg-ink-100 disabled:cursor-not-allowed",
            "resize-none min-h-[120px]",
            error && "border-error-500 focus:ring-error-500/30 focus:border-error-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-error-500">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-ink-500">{helperText}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Input, Textarea };
