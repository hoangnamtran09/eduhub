import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon?: LucideIcon;
  value: string | number;
  label: string;
  sublabel?: string;
  variant?: "default" | "brand" | "rose" | "emerald" | "violet" | "amber";
  className?: string;
}

const variants: Record<string, { card: string; icon: string; value: string; label: string }> = {
  default: {
    card: "border-slate-200/80 bg-white/90",
    icon: "bg-brand-50 text-brand-600",
    value: "text-slate-900",
    label: "text-slate-500",
  },
  brand: {
    card: "border-brand-200/80 bg-brand-50/50",
    icon: "bg-brand-100 text-brand-600",
    value: "text-brand-900",
    label: "text-brand-600",
  },
  rose: {
    card: "border-rose-200/80 bg-rose-50/50",
    icon: "bg-rose-100 text-rose-600",
    value: "text-rose-900",
    label: "text-rose-600",
  },
  emerald: {
    card: "border-emerald-200/80 bg-emerald-50/50",
    icon: "bg-emerald-100 text-emerald-600",
    value: "text-emerald-900",
    label: "text-emerald-600",
  },
  violet: {
    card: "border-violet-200/80 bg-violet-50/50",
    icon: "bg-violet-100 text-violet-600",
    value: "text-violet-900",
    label: "text-violet-600",
  },
  amber: {
    card: "border-amber-200/80 bg-amber-50/50",
    icon: "bg-amber-100 text-amber-600",
    value: "text-amber-900",
    label: "text-amber-600",
  },
};

function StatCard({ icon: Icon, value, label, sublabel, variant = "default", className }: StatCardProps) {
  const v = variants[variant] || variants.default;

  return (
    <div className={cn("rounded-3xl border p-5 shadow-sm", v.card, className)} role="group" aria-label={label}>
      <div className="flex items-center gap-4">
        {Icon && (
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl", v.icon)}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0">
          <p className={cn("text-sm", v.label)}>{label}</p>
          <p className={cn("mt-1 text-2xl font-bold", v.value)}>{value}</p>
          {sublabel && <p className="text-xs text-slate-400">{sublabel}</p>}
        </div>
      </div>
    </div>
  );
}

export { StatCard };
