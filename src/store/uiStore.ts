import { create } from "zustand";

interface UIState {
  toasts: Toast[];
  isNavOpen: boolean;
  activeModal: string | null;
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  setNavOpen: (open: boolean) => void;
  openModal: (name: string) => void;
  closeModal: () => void;
}

export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  duration?: number;
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  isNavOpen: false,
  activeModal: null,
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { ...toast, id: Math.random().toString(36).slice(2) },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  setNavOpen: (open) => set({ isNavOpen: open }),
  openModal: (name) => set({ activeModal: name }),
  closeModal: () => set({ activeModal: null }),
}));
