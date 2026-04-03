import { create } from "zustand";
import type { DutyCard } from "@/types";

interface DutyState {
  queue: DutyCard[];
  active: DutyCard[];
  completed: DutyCard[];
  selectedDutyId: string | null;
  filterCategory: string | null;
  setColumns: (queue: DutyCard[], active: DutyCard[], completed: DutyCard[]) => void;
  moveCard: (id: string, from: "QUEUE" | "ACTIVE" | "COMPLETED", to: "QUEUE" | "ACTIVE" | "COMPLETED") => void;
  setSelectedDuty: (id: string | null) => void;
  setFilterCategory: (category: string | null) => void;
  updateCard: (updated: DutyCard) => void;
}

function removeFromColumn(col: DutyCard[], id: string) {
  return col.filter((c) => c.id !== id);
}

export const useDutyStore = create<DutyState>((set) => ({
  queue: [],
  active: [],
  completed: [],
  selectedDutyId: null,
  filterCategory: null,
  setColumns: (queue, active, completed) => set({ queue, active, completed }),
  moveCard: (id, from, to) =>
    set((state) => {
      const allCards = [...state.queue, ...state.active, ...state.completed];
      const card = allCards.find((c) => c.id === id);
      if (!card) return state;
      const updated = { ...card, status: to } as DutyCard;
      const queue = removeFromColumn(state.queue, id);
      const active = removeFromColumn(state.active, id);
      const completed = removeFromColumn(state.completed, id);
      if (to === "QUEUE") queue.push(updated);
      if (to === "ACTIVE") active.push(updated);
      if (to === "COMPLETED") completed.push(updated);
      return { queue, active, completed };
    }),
  setSelectedDuty: (id) => set({ selectedDutyId: id }),
  setFilterCategory: (category) => set({ filterCategory: category }),
  updateCard: (updated) =>
    set((state) => {
      const update = (col: DutyCard[]) =>
        col.map((c) => (c.id === updated.id ? updated : c));
      return {
        queue: update(state.queue),
        active: update(state.active),
        completed: update(state.completed),
      };
    }),
}));
