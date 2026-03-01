"use client";

import { useCallback, useEffect, useState } from "react";

interface UseModalOptions {
  initialOpen?: boolean;
  closeOnEsc?: boolean;
}

export function useModal(options: UseModalOptions = {}) {
  const { initialOpen = false, closeOnEsc = true } = options;
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeOnEsc]);

  return { isOpen, open, close, toggle, setIsOpen };
}
