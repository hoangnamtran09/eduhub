"use client";

import dynamic from "next/dynamic";

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
      <div className="flex-1 overflow-hidden bg-slate-100/50">
        <PDFViewerContent
          url={url}
          initialPage={initialPage}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}
