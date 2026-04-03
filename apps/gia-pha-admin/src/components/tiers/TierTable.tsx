"use client";

import { useState, useEffect } from "react";
import { useTiers } from "@/hooks/useTiers";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import type { SubscriptionTier } from "@/generated/prisma";
import { useRouter } from "next/navigation";

function SortableRow({ tier }: { tier: SubscriptionTier }) {
  const router = useRouter();
  const { mutate } = useTiers();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tier.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const toggleActive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/admin/tiers/${tier.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !tier.isActive }),
      });
      if (res.ok) {
        mutate();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-[#5a403c]/20 hover:bg-surface-variant/50 transition-colors group ${
        isDragging ? "bg-surface-variant shadow-lg" : ""
      }`}
      onClick={() => router.push(`/tiers/${tier.id}/edit`)}
    >
      <td className="p-4" onClick={(e) => e.stopPropagation()}>
        <span
          {...attributes}
          {...listeners}
          className="material-symbols-outlined text-outline cursor-grab hover:text-primary active:cursor-grabbing"
        >
          drag_indicator
        </span>
      </td>
      <td className="p-4 font-medium text-on-surface">{tier.nameVi}</td>
      <td className="p-4 text-on-surface-variant font-mono">{tier.slug}</td>
      <td className="p-4">
        <span className="text-secondary font-semibold">
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(tier.priceMonthly))}
        </span>
      </td>
      <td className="p-4 text-center">
        <button
          onClick={toggleActive}
          className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
            tier.isActive
              ? "bg-primary/20 text-primary border border-primary/30"
              : "bg-outline/20 text-outline border border-outline/30"
          }`}
        >
          {tier.isActive ? "Active" : "Inactive"}
        </button>
      </td>
      <td className="p-4 text-right">
        <Link
          href={`/tiers/${tier.id}/edit`}
          className="p-2 text-on-surface-variant hover:text-primary transition-colors inline-block"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="material-symbols-outlined">edit</span>
        </Link>
      </td>
    </tr>
  );
}

export function TierTable({ initialTiers }: { initialTiers: SubscriptionTier[] }) {
  const { tiers, isLoading, mutate } = useTiers();
  
  // Use local state for immediate drag/drop feedback
  const [items, setItems] = useState<SubscriptionTier[]>(initialTiers);
  
  // Sync when SWR fetches new data (if not actively dragging)
  useEffect(() => {
    if (tiers) setItems(tiers);
  }, [tiers]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // minimum drag distance before taking action
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((prevItems) => {
        const oldIndex = prevItems.findIndex((i) => i.id === active.id);
        const newIndex = prevItems.findIndex((i) => i.id === over.id);
        
        const newItems = arrayMove(prevItems, oldIndex, newIndex);
        
        // Update display order sequentially
        const updatedList = newItems.map((item, index) => ({
          ...item,
          displayOrder: index,
        }));
        
        // Immediately save state
        saveReorder(updatedList);
        return updatedList;
      });
    }
  };

  const saveReorder = async (updatedItems: SubscriptionTier[]) => {
    const payload = updatedItems.map((tier) => ({
      id: tier.id,
      displayOrder: tier.displayOrder,
    }));
    
    try {
      const res = await fetch("/api/admin/tiers/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        mutate(updatedItems, false);
      }
    } catch (err) {
      console.error("Failed to save order", err);
    }
  };

  if (isLoading && !items.length) {
    return <div className="text-center py-10 text-on-surface-variant">Loading bốc bát họ... (Tiers loading)</div>;
  }

  return (
    <div className="bg-surface border border-[#5a403c]/20 rounded-2xl shadow-sm overflow-hidden mt-8">
      <table className="w-full text-left border-collapse">
        <thead className="bg-surface-variant/40 border-b border-[#5a403c]/30">
          <tr>
            <th className="p-4 w-12 font-medium text-on-surface-variant"></th>
            <th className="p-4 font-medium text-on-surface tracking-wide">Tên Gói</th>
            <th className="p-4 font-medium text-on-surface tracking-wide">Slug</th>
            <th className="p-4 font-medium text-on-surface tracking-wide">Giá / Tháng (VND)</th>
            <th className="p-4 font-medium text-on-surface tracking-wide text-center">Trạng Thái</th>
            <th className="p-4 font-medium text-on-surface tracking-wide text-right">Tác Vụ</th>
          </tr>
        </thead>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <tbody className="">
            <SortableContext
              items={items.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {items.map((tier) => (
                <SortableRow key={tier.id} tier={tier} />
              ))}
            </SortableContext>
          </tbody>
        </DndContext>
      </table>
      {items.length === 0 && !isLoading && (
        <div className="text-center py-12 text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl opacity-50 mb-2">inbox</span>
          <p>Chưa có gói đăng ký nào.</p>
        </div>
      )}
    </div>
  );
}
