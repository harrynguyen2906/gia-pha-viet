"use client";

import { ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

type ModalSize = "xs" | "md" | "lg" | "xl";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: ModalSize;
  children: ReactNode;
  closeOnOverlayClick?: boolean;
}

const SIZE_CLASS: Record<ModalSize, string> = {
  xs: "max-w-sm",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
};

export default function Modal({
  isOpen,
  onClose,
  title,
  size = "md",
  children,
  closeOnOverlayClick = true,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "Modal"}
    >
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />

      <div
        className={cn(
          "relative z-[101] w-full border border-antique-gold/30 bg-lacquer-dark/95 shadow-2xl",
          "max-h-[90vh] overflow-hidden rounded-sm",
          SIZE_CLASS[size]
        )}
      >
        <div className="flex items-center justify-between border-b border-antique-gold/20 px-5 py-3">
          <h2 className="font-header text-gold-leaf text-sm tracking-widest uppercase">
            {title ?? "Chi tiết"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-parchment/60 hover:text-parchment transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="max-h-[calc(90vh-56px)] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
