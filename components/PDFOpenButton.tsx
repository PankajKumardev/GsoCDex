"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

import { cn } from "@/lib/cn";

interface PDFOpenButtonProps {
  pdfPath: string;
  title: string;
  className?: string;
}

const PDFViewer = dynamic(
  () => import("@/components/PDFViewer").then((m) => m.PDFViewer),
  { ssr: false },
);

export function PDFOpenButton({ pdfPath, title, className }: PDFOpenButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        whileHover={{
          scale: 0.985,
          boxShadow:
            "0 0 0 1px rgba(180,83,9,0.32), 0 14px 32px -12px rgba(180,83,9,0.42)",
        }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className={cn(
          "inline-flex items-center gap-2.5 rounded-full bg-app-accent px-7 py-3.5",
          "font-mono text-[11px] uppercase tracking-[0.22em] text-white",
          "shadow-card",
          "min-h-[44px]",
          className,
        )}
      >
        <FileText className="h-4 w-4" aria-hidden />
        Open PDF preview
      </motion.button>
      {open && <PDFViewer pdfPath={pdfPath} title={title} open={open} onOpenChange={setOpen} />}
    </>
  );
}
