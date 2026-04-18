"use client";

import dynamic from "next/dynamic";
import { File, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

// Dynamically import PDF components to avoid SSR issues
const PDFViewerContent = dynamic(() => import("./pdf-viewer-content").then((mod) => mod.PDFViewerContent), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium text-slate-500">Đang tải trình xem PDF...</span>
      </div>
    </div>
  ),
});

interface PDFViewerProps {
  url: string;
  initialPage?: number;
  onPageChange?: (page: number, totalPages: number) => void;
}

export function PDFViewer({ url, initialPage = 1, onPageChange }: PDFViewerProps) {
  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 h-12 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center border border-rose-100">
            <File className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Tài liệu học tập</span>
        </div>

        <Button
          onClick={() => window.open(url, "_blank")}
          variant="ghost"
          size="sm"
          className="h-8 gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Mở tab mới
        </Button>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-hidden bg-slate-100/50">
        <PDFViewerContent url={url} initialPage={initialPage} onPageChange={onPageChange} />
      </div>
    </div>
  );
}
