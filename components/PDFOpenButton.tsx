"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { FileText } from "lucide-react";

import { cn } from "@/lib/cn";

interface PDFOpenButtonProps {
  pdfPath: string;
  title: string;
  className?: string;
}

// Dynamically import the heavy viewer chunk only when the user clicks "Open PDF".
const PDFViewer = dynamic(
  () => import("@/components/PDFViewer").then((m) => m.PDFViewer),
  { ssr: false },
);

export function PDFOpenButton({ pdfPath, title, className }: PDFOpenButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg bg-app-accent px-5 py-3 text-sm font-medium text-white",
          "shadow-sm transition-colors hover:bg-app-accent-hover",
          "min-h-[44px]",
          className,
        )}
      >
        <FileText className="h-4 w-4" aria-hidden />
        Open PDF
      </button>
      {open && <PDFViewer pdfPath={pdfPath} title={title} open={open} onOpenChange={setOpen} />}
    </>
  );
}
