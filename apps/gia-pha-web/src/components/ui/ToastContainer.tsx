"use client";

import { useEffect } from "react";
import { useUIStore, Toast } from "@/store/uiStore";

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useUIStore((s) => s.removeToast);

  useEffect(() => {
    const t = setTimeout(() => removeToast(toast.id), toast.duration ?? 4000);
    return () => clearTimeout(t);
  }, [toast.id, toast.duration, removeToast]);

  const colors = {
    success: "border-green-500 bg-green-900/80",
    error: "border-red-500 bg-red-900/80",
    info: "border-antique-gold bg-panel-dark/90",
    warning: "border-yellow-500 bg-yellow-900/80",
  };

  return (
    <div
      className={`relative border-l-4 px-4 py-3 rounded shadow-lacquer text-parchment backdrop-blur animate-slide-in-right ${colors[toast.type]}`}
      role="alert"
    >
      <p className="font-header text-sm font-semibold uppercase tracking-widest">
        {toast.title}
      </p>
      {toast.message && <p className="text-xs mt-1 opacity-80">{toast.message}</p>}
      <button
        onClick={() => removeToast(toast.id)}
        className="absolute top-2 right-3 text-parchment/50 hover:text-parchment text-lg leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);

  if (!toasts.length) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-80"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
