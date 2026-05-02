"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  AnimatePresence,
  motion,
  type PanInfo,
  useMotionValue,
} from "framer-motion";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import { SponsorSlot } from "@/components/SponsorSlot";
import { cn } from "@/lib/cn";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const APPLE_EASE = [0.32, 0.72, 0, 1] as const;
const SWIPE_VELOCITY_THRESHOLD = 350; // px/sec
const SWIPE_DISTANCE_THRESHOLD = 60; // px
const HORIZONTAL_PADDING_MOBILE = 8; // px each side
const HORIZONTAL_PADDING_DESKTOP = 16;

interface PDFViewerProps {
  pdfPath: string;
  title: string;
  open: boolean;
  onOpenChange(open: boolean): void;
}

// Use layout effect on the client only so SSR matches.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function PDFViewer({ pdfPath, title, open, onOpenChange }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageWidth, setPageWidth] = useState<number>(() => {
    if (typeof window === "undefined") return 360;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const pad = isMobile ? HORIZONTAL_PADDING_MOBILE : HORIZONTAL_PADDING_DESKTOP;
    return Math.max(280, Math.min(window.innerWidth - pad * 2, 900));
  });
  const [chromeVisible, setChromeVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastTapRef = useRef<number>(0);

  // Reset to page 1 + show chrome whenever the PDF file changes.
  const [lastPath, setLastPath] = useState(pdfPath);
  if (pdfPath !== lastPath) {
    setLastPath(pdfPath);
    setPage(1);
    setChromeVisible(true);
  }

  // Measure the available viewport width for the PDF canvas.
  // Use ResizeObserver so we react to orientation changes / address-bar collapse.
  useIsomorphicLayoutEffect(() => {
    if (!open) return;
    function measure() {
      const el = containerRef.current;
      if (!el) return;
      const w = el.clientWidth;
      // Cap at 900 for very wide desktops; never below 280.
      setPageWidth(Math.max(280, Math.min(w, 900)));
    }
    measure();
    let ro: ResizeObserver | undefined;
    if ("ResizeObserver" in window && containerRef.current) {
      ro = new ResizeObserver(measure);
      ro.observe(containerRef.current);
    }
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, [open]);

  function onDocLoad({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const goPrev = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
    setChromeVisible(true);
  }, []);
  const goNext = useCallback(() => {
    setPage((p) => (numPages ? Math.min(numPages, p + 1) : p + 1));
    setChromeVisible(true);
  }, [numPages]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, goPrev, goNext]);

  // Tap on the page area toggles the chrome (iOS-style auto-hide).
  // Distinguish single-tap from drag-end by ignoring the next touch
  // if a swipe just resolved.
  const swipeJustHappened = useRef(false);
  function handleCanvasTap() {
    if (swipeJustHappened.current) {
      swipeJustHappened.current = false;
      return;
    }
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      // Double tap — fall through to native zoom (browser handles).
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;
    setChromeVisible((v) => !v);
  }

  function onSwipeEnd(_e: unknown, info: PanInfo) {
    const { offset, velocity } = info;
    const dx = offset.x;
    const vx = velocity.x;
    const isLeft =
      dx < -SWIPE_DISTANCE_THRESHOLD || vx < -SWIPE_VELOCITY_THRESHOLD;
    const isRight =
      dx > SWIPE_DISTANCE_THRESHOLD || vx > SWIPE_VELOCITY_THRESHOLD;
    if (isLeft) {
      swipeJustHappened.current = true;
      goNext();
    } else if (isRight) {
      swipeJustHappened.current = true;
      goPrev();
    }
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
                className="absolute inset-0 flex flex-col bg-app-surface md:hidden"
              >
                <PDFTopbar
                  title={title}
                  pdfPath={pdfPath}
                  onClose={() => onOpenChange(false)}
                  visible={chromeVisible}
                />
                <PDFCanvas
                  containerRef={containerRef}
                  pdfPath={pdfPath}
                  page={page}
                  pageWidth={pageWidth}
                  onLoad={onDocLoad}
                  onTap={handleCanvasTap}
                  onSwipeEnd={onSwipeEnd}
                />
                <PDFBottombar
                  page={page}
                  numPages={numPages}
                  onPrev={goPrev}
                  onNext={goNext}
                  seed={pdfPath}
                  visible={chromeVisible}
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
                <PDFTopbar
                  title={title}
                  pdfPath={pdfPath}
                  onClose={() => onOpenChange(false)}
                  visible
                />
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
                  onPrev={goPrev}
                  onNext={goNext}
                  seed={pdfPath}
                  visible
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
  visible,
}: {
  title: string;
  pdfPath: string;
  onClose(): void;
  visible: boolean;
}) {
  return (
    <motion.div
      animate={{ y: visible ? 0 : -64, opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.22, ease: APPLE_EASE }}
      className={cn(
        "sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-app-border",
        "bg-white/85 px-3 backdrop-blur-xl",
      )}
    >
      <button
        type="button"
        aria-label="Close PDF"
        onClick={onClose}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-app-ink hover:bg-app-surface"
      >
        <X className="h-5 w-5" aria-hidden />
      </button>
      <Dialog.Title className="min-w-0 flex-1 truncate px-2 font-serif text-sm text-app-ink">
        {title}
      </Dialog.Title>
      <a
        href={pdfPath}
        download
        aria-label="Download PDF"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-app-ink hover:bg-app-surface"
      >
        <Download className="h-5 w-5" aria-hidden />
      </a>
    </motion.div>
  );
}

function PDFCanvas({
  containerRef,
  pdfPath,
  page,
  pageWidth,
  onLoad,
  onTap,
  onSwipeEnd,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  pdfPath: string;
  page: number;
  pageWidth: number;
  onLoad(meta: { numPages: number }): void;
  onTap?: () => void;
  onSwipeEnd?: (e: unknown, info: PanInfo) => void;
}) {
  const x = useMotionValue(0);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex-1 overflow-auto bg-app-surface",
        "px-2 py-3 md:px-4 md:py-4",
        // touch-action: pinch-zoom so the browser handles native pinch.
        "touch-pan-y",
      )}
      tabIndex={0}
      style={{ touchAction: "pan-y pinch-zoom" }}
    >
      {/* Subtle sun watermark behind the page (lightened for mobile). */}
      <div
        aria-hidden
        className="pointer-events-none sticky top-0 z-0 mx-auto flex max-w-3xl items-center justify-center"
        style={{ height: 0 }}
      >
        <div
          className="absolute"
          style={{
            top: "16vh",
            opacity: 0.04,
            filter: "saturate(0) brightness(0.9)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/illustrations/gsoc-sun.svg"
            alt=""
            width={420}
            height={420}
            className="select-none"
          />
        </div>
      </div>

      {/* Swipeable page area */}
      <motion.div
        className="relative z-[1] mx-auto flex max-w-3xl flex-col items-center"
        drag={onSwipeEnd ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        dragMomentum={false}
        onDragEnd={onSwipeEnd}
        onTap={onTap}
        style={{ x }}
        // Re-render with a key so we get a clean fade between pages.
      >
        <motion.div
          key={page}
          initial={{ opacity: 0.4, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.18, ease: APPLE_EASE }}
        >
          <Document
            file={pdfPath}
            onLoadSuccess={onLoad}
            loading={<PdfFallback text="Loading PDF…" />}
            error={<PdfFallback text="Couldn't load this PDF in-browser. Try Download." />}
            className="flex flex-col items-center"
          >
            <Page
              pageNumber={page}
              width={pageWidth}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              className="overflow-hidden rounded-md bg-white shadow-card"
              loading={<PdfFallback text={`Loading page ${page}…`} />}
            />
          </Document>
        </motion.div>
      </motion.div>
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
  visible,
}: {
  page: number;
  numPages: number | null;
  onPrev(): void;
  onNext(): void;
  seed: string;
  visible: boolean;
}) {
  return (
    <motion.div
      animate={{ y: visible ? 0 : 96, opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.22, ease: APPLE_EASE }}
      className="shrink-0"
    >
      <div className="flex items-center gap-3 border-t border-app-border bg-white/85 px-4 py-3 backdrop-blur-xl">
        <button
          type="button"
          aria-label="Previous page"
          onClick={onPrev}
          disabled={page <= 1}
          className="flex h-11 w-11 items-center justify-center rounded-full text-app-ink hover:bg-app-surface disabled:opacity-40"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <span className="flex-1 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-app-muted">
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
    </motion.div>
  );
}
