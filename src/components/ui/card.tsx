import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  variant?: "default" | "elevated" | "outline" | "gradient";
  padding?: "none" | "sm" | "default" | "lg";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover, variant = "default", padding = "default", ...props }, ref) => {
    const baseStyles = "bg-white rounded-[28px] transition-all duration-300";
    
    const variantStyles = {
      default: "border border-ink-200/50 shadow-soft",
      elevated: "border border-ink-200/30 shadow-hover",
      outline: "border-2 border-ink-200",
      gradient: "border border-ink-200/30 shadow-soft bg-gradient-to-br from-white to-paper-200",
    };

    const paddingStyles = {
      none: "",
      sm: "p-4",
      default: "p-6",
      lg: "p-8",
    };

    const hoverStyles = hover && "hover:shadow-lift hover:-translate-y-1 cursor-pointer";

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          hoverStyles,
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn("flex flex-col space-y-1.5 pb-4", className)} 
      {...props} 
    />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 
      ref={ref} 
      className={cn("font-serif text-2xl font-semibold text-ink-900 tracking-tight", className)} 
      {...props} 
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p 
      ref={ref} 
      className={cn("text-sm text-ink-500 leading-relaxed", className)} 
      {...props} 
    />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn("pt-0", className)} 
      {...props} 
    />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn("flex items-center pt-4", className)} 
      {...props} 
    />
  )
);
CardFooter.displayName = "CardFooter";

export { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
};
