"use client";

import { useState, useCallback } from "react";
import { Loader2 } from "lucide-react";

interface PDFViewerContentProps {
  url: string;
  initialPage?: number;
  onPageChange?: (page: number, totalPages: number) => void;
}

export function PDFViewerContent({ url, initialPage = 1, onPageChange }: PDFViewerContentProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Build full URL for PDF
  const getFullUrl = useCallback(() => {
    if (url.startsWith("http")) return url;
    return window.location.origin + url;
  }, [url]);

  return (
    <div className="flex flex-col h-full">
      {/* PDF Content - Using iframe */}
      <div 
        className="flex-1 overflow-auto bg-slate-100 relative"
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="text-sm font-medium text-slate-500">Đang tải tài liệu...</span>
            </div>
          </div>
        )}
        
        <iframe
          src={getFullUrl()}
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          title="PDF Viewer"
        />
      </div>
    </div>
  );
}