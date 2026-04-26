import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "brand" | "rose" | "cyan" | "violet" | "emerald" | "amber";
}

const labelVariants: Record<string, string> = {
  brand: "border-brand-200 bg-brand-50 text-brand-700",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
};

function SectionLabel({ variant = "brand", className, children, ...props }: SectionLabelProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
        labelVariants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface PageHeaderProps {
  label?: string;
  labelVariant?: SectionLabelProps["variant"];
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

function PageHeader({ label, labelVariant = "brand", title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {label && <SectionLabel variant={labelVariant}>{label}</SectionLabel>}
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">{title}</h1>
      {description && (
        <p className="max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      )}
      {actions && <div className="mt-6 flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

export { PageHeader, SectionLabel };
