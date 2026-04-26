import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  className?: string;
  fullHeight?: boolean;
}

function LoadingState({ message = "Đang tải dữ liệu...", className, fullHeight = true }: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3 text-slate-500",
        fullHeight && "min-h-[60vh]",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

export { LoadingState };
