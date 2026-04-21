import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium rounded-2xl transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-100 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Primary - Terracotta warm tone
        default: "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 active:scale-[0.98] shadow-sm shadow-brand-500/10",
        
        // Secondary - Deep ink
        secondary: "bg-ink-900 text-white hover:bg-ink-800 active:bg-ink-700 active:scale-[0.98]",
        
        // Outline - Brand border
        outline: "border border-ink-200 bg-white text-ink-700 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 active:scale-[0.98]",
        
        // Ghost - Subtle hover
        ghost: "text-ink-600 hover:bg-white hover:text-ink-900 hover:shadow-soft active:bg-ink-100",
        
        // Link - Underline
        link: "text-brand-600 underline-offset-4 hover:underline",
        
        // Accent - Gold/warm
        accent: "bg-accent-500 text-ink-900 hover:bg-accent-400 active:bg-accent-600 active:scale-[0.98]",
        
        // Success - Green
        success: "bg-success-500 text-white hover:bg-success-600 active:bg-success-500/90",
        
        // Error - Red
        error: "bg-error-500 text-white hover:bg-error-600 active:bg-error-500/90",
      },
      size: {
        default: "h-12 px-6 py-3 text-sm",
        sm: "h-10 px-4 py-2 text-xs",
        lg: "h-14 px-8 py-4 text-base",
        icon: "h-11 w-11 rounded-[18px]",
        "icon-sm": "h-9 w-9 rounded-2xl",
        "icon-lg": "h-14 w-14 rounded-[22px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, leftIcon, rightIcon, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
