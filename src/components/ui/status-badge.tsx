import * as React from "react";
import { cn } from "@/lib/utils";

type StatusVariant = "active" | "remediated" | "submitted" | "reviewed" | "returned" | "overdue" | "assigned" | "pending" | "high" | "medium" | "low" | "info";

const statusConfig: Record<StatusVariant, { bg: string; label: string }> = {
  active: { bg: "border-rose-200 bg-rose-50 text-rose-700", label: "Đang yếu" },
  remediated: { bg: "border-emerald-200 bg-emerald-50 text-emerald-700", label: "Đã khắc phục" },
  submitted: { bg: "border-blue-200 bg-blue-50 text-blue-700", label: "Đã nộp" },
  reviewed: { bg: "border-violet-200 bg-violet-50 text-violet-700", label: "Đã chấm" },
  returned: { bg: "border-amber-200 bg-amber-50 text-amber-700", label: "Cần sửa" },
  overdue: { bg: "border-rose-200 bg-rose-50 text-rose-700", label: "Quá hạn" },
  assigned: { bg: "border-sky-200 bg-sky-50 text-sky-700", label: "Được giao" },
  pending: { bg: "border-slate-200 bg-slate-50 text-slate-600", label: "Chờ xử lý" },
  high: { bg: "border-rose-200 bg-rose-100 text-rose-700", label: "Cao" },
  medium: { bg: "border-amber-200 bg-amber-100 text-amber-700", label: "Trung bình" },
  low: { bg: "border-sky-200 bg-sky-100 text-sky-700", label: "Thấp" },
  info: { bg: "border-slate-200 bg-slate-100 text-slate-600", label: "Thông tin" },
};

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: StatusVariant;
  label?: string;
}

function StatusBadge({ variant, label, className, ...props }: StatusBadgeProps) {
  const config = statusConfig[variant] || statusConfig.info;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]",
        config.bg,
        className,
      )}
      role="status"
      {...props}
    >
      {label || config.label}
    </span>
  );
}

export { StatusBadge };
export type { StatusVariant };
