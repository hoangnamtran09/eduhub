"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Viewer, Worker, type DocumentLoadEvent, type PageChangeEvent } from "@react-pdf-viewer/core";
import type { PageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PDFViewerContentProps {
  url: string;
  initialPage?: number;
  onPageChange?: (page: number, totalPages: number) => void;
  pageNavigationPluginInstance: PageNavigationPlugin;
}

export function PDFViewerContent({
  url,
  initialPage = 1,
  onPageChange,
  pageNavigationPluginInstance,
}: PDFViewerContentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [viewerKey, setViewerKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(Math.max(initialPage, 1));
  const totalPagesRef = useRef(0);
  const { jumpToNextPage, jumpToPreviousPage } = pageNavigationPluginInstance || {};

  const getFullUrl = useCallback(() => {
    if (url.startsWith("http")) return url;
    return window.location.origin + url;
  }, [url]);

  const fileUrl = useMemo(() => getFullUrl(), [getFullUrl]);

  useEffect(() => {
    setIsLoading(true);
    setViewerKey((current) => current + 1);
    setCurrentPage(Math.max(initialPage, 1));
    totalPagesRef.current = 0;
  }, [fileUrl, initialPage]);

  const handleDocumentLoad = useCallback(
    (event: DocumentLoadEvent) => {
      totalPagesRef.current = event.doc.numPages;
      const safeInitialPage = Math.min(Math.max(initialPage, 1), event.doc.numPages);
      setCurrentPage(safeInitialPage);
      setIsLoading(false);
      onPageChange?.(safeInitialPage, event.doc.numPages);
    },
    [initialPage, onPageChange],
  );

  const handlePageChange = useCallback(
    (event: PageChangeEvent) => {
      const nextPage = event.currentPage + 1;
      setCurrentPage(nextPage);
      onPageChange?.(nextPage, totalPagesRef.current);
    },
    [onPageChange],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Tài liệu học tập</p>
          <p className="text-sm font-semibold text-slate-700">
            {totalPagesRef.current > 0
              ? `Trang ${currentPage} / ${totalPagesRef.current}`
              : "Đang chuẩn bị tài liệu"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => jumpToPreviousPage?.()}
            className="h-9 rounded-xl border-slate-200 px-3"
          >
            <ChevronLeft className="h-4 w-4" />
            Trang trước
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={totalPagesRef.current === 0 || currentPage >= totalPagesRef.current}
            onClick={() => jumpToNextPage?.()}
            className="h-9 rounded-xl px-3"
          >
            Trang sau
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden bg-white">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="text-sm font-medium text-slate-500">Đang tải tài liệu...</span>
            </div>
          </div>
        )}

        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <div className="h-full overflow-auto p-2 md:p-3">
            <div className="mx-auto h-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <Viewer
                key={viewerKey}
                fileUrl={fileUrl}
                initialPage={Math.max(initialPage - 1, 0)}
                onDocumentLoad={handleDocumentLoad}
                onPageChange={handlePageChange}
                plugins={[pageNavigationPluginInstance]}
              />
            </div>
          </div>
        </Worker>
      </div>
    </div>
  );
}
