"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import { SponsorSlot } from "@/components/SponsorSlot";
import { cn } from "@/lib/cn";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Use a CDN-hosted worker to keep our bundle slim. pdf.js exports a worker
// but importing it as an asset URL is finicky with Next 15's Turbopack/Webpack
// dual config. The CDN approach is what the official react-pdf docs recommend.
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const APPLE_EASE = [0.32, 0.72, 0, 1] as const;

interface PDFViewerProps {
  pdfPath: string;
  title: string;
  open: boolean;
  onOpenChange(open: boolean): void;
}

export function PDFViewer({ pdfPath, title, open, onOpenChange }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageWidth, setPageWidth] = useState<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Reset to page 1 whenever the PDF file changes (without using effects on `open`).
  const [lastPath, setLastPath] = useState(pdfPath);
  if (pdfPath !== lastPath) {
    setLastPath(pdfPath);
    setPage(1);
  }

  // Measure the available viewport width for the PDF canvas.
  useEffect(() => {
    function update() {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      setPageWidth(Math.max(280, Math.min(w - 16, 900)));
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [open]);

  function onDocLoad({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  function prev() {
    setPage((p) => Math.max(1, p - 1));
  }
  function next() {
    setPage((p) => (numPages ? Math.min(numPages, p + 1) : p + 1));
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.24, ease: APPLE_EASE }}
                className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            <Dialog.Content
              aria-describedby={undefined}
              className="fixed inset-0 z-[101] outline-none"
            >
              {/* Mobile = full-screen overlay; md+ = centered modal. */}
              <motion.div
                initial={{ y: "100%", opacity: 0.6 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ duration: 0.32, ease: APPLE_EASE }}
                className={cn(
                  "absolute inset-0 flex flex-col bg-app-surface md:hidden",
                )}
              >
                <PDFTopbar title={title} pdfPath={pdfPath} onClose={() => onOpenChange(false)} />
                <PDFCanvas
                  containerRef={containerRef}
                  pdfPath={pdfPath}
                  page={page}
                  pageWidth={pageWidth}
                  onLoad={onDocLoad}
                />
                <PDFBottombar
                  page={page}
                  numPages={numPages}
                  onPrev={prev}
                  onNext={next}
                  seed={pdfPath}
                />
              </motion.div>

              <motion.div
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                transition={{ duration: 0.24, ease: APPLE_EASE }}
                className={cn(
                  "absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2",
                  "max-h-[92vh] w-[min(96vw,960px)] flex-col overflow-hidden",
                  "rounded-2xl bg-app-surface shadow-modal",
                  "md:flex",
                )}
              >
                <PDFTopbar title={title} pdfPath={pdfPath} onClose={() => onOpenChange(false)} />
                <PDFCanvas
                  containerRef={containerRef}
                  pdfPath={pdfPath}
                  page={page}
                  pageWidth={pageWidth}
                  onLoad={onDocLoad}
                />
                <PDFBottombar
                  page={page}
                  numPages={numPages}
                  onPrev={prev}
                  onNext={next}
                  seed={pdfPath}
                />
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function PDFTopbar({
  title,
  pdfPath,
  onClose,
}: {
  title: string;
  pdfPath: string;
  onClose(): void;
}) {
  return (
    <div className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-app-border bg-white px-3">
      <button
        type="button"
        aria-label="Close PDF"
        onClick={onClose}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-app-ink hover:bg-app-surface"
      >
        <X className="h-5 w-5" aria-hidden />
      </button>
      <Dialog.Title className="min-w-0 flex-1 truncate px-2 text-sm font-medium text-app-ink">
        {title}
      </Dialog.Title>
      <a
        href={pdfPath}
        download
        aria-label="Download PDF"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-app-ink hover:bg-app-surface"
      >
        <Download className="h-5 w-5" aria-hidden />
      </a>
    </div>
  );
}

function PDFCanvas({
  containerRef,
  pdfPath,
  page,
  pageWidth,
  onLoad,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  pdfPath: string;
  page: number;
  pageWidth: number | undefined;
  onLoad(meta: { numPages: number }): void;
}) {
  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-auto bg-app-surface px-2 py-4"
      tabIndex={0}
    >
      {/* Sun watermark behind the page */}
      <div
        aria-hidden
        className="pointer-events-none sticky top-0 z-0 mx-auto flex max-w-3xl items-center justify-center"
        style={{ height: 0 }}
      >
        <div
          className="absolute"
          style={{
            top: "20vh",
            opacity: 0.06,
            filter: "saturate(0) brightness(0.9)",
          }}
        >
          {/* Static (non-rotating in viewer to avoid distraction) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/illustrations/gsoc-sun.svg"
            alt=""
            width={520}
            height={520}
            className="select-none"
          />
        </div>
      </div>
      <div className="relative z-[1] mx-auto flex max-w-3xl flex-col items-center">
        <Document
          file={pdfPath}
          onLoadSuccess={onLoad}
          loading={<PdfFallback text="Loading PDF…" />}
          error={
            <PdfFallback text="Couldn't load this PDF in-browser. Try Download." />
          }
          className="flex flex-col items-center"
        >
          <Page
            pageNumber={page}
            width={pageWidth}
            renderAnnotationLayer={false}
            renderTextLayer={false}
            className="rounded-md shadow-card"
            loading={<PdfFallback text={`Loading page ${page}…`} />}
          />
        </Document>
      </div>
    </div>
  );
}

function PdfFallback({ text }: { text: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-sm text-app-muted">
      {text}
    </div>
  );
}

function PDFBottombar({
  page,
  numPages,
  onPrev,
  onNext,
  seed,
}: {
  page: number;
  numPages: number | null;
  onPrev(): void;
  onNext(): void;
  seed: string;
}) {
  return (
    <div className="shrink-0">
      <div className="flex items-center gap-3 border-t border-app-border bg-white px-4 py-3">
        <button
          type="button"
          aria-label="Previous page"
          onClick={onPrev}
          disabled={page <= 1}
          className="flex h-11 w-11 items-center justify-center rounded-full text-app-ink hover:bg-app-surface disabled:opacity-40"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <span className="flex-1 text-center font-mono text-xs uppercase tracking-wider text-app-muted">
          Page {page} {numPages ? `of ${numPages}` : ""}
        </span>
        <button
          type="button"
          aria-label="Next page"
          onClick={onNext}
          disabled={!!numPages && page >= numPages}
          className="flex h-11 w-11 items-center justify-center rounded-full text-app-ink hover:bg-app-surface disabled:opacity-40"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>
      <SponsorSlot variant="sticky" seed={seed} />
    </div>
  );
}
