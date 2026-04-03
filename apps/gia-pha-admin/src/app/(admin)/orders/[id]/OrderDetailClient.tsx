"use client";

import { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { CreditCard, AlertCircle, Copy, Check, Save } from "lucide-react";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function OrderDetailClient({ id }: { id: string }) {
  const { data: order, error, isLoading, mutate } = useSWR(`/api/admin/orders/${id}`, fetcher);
  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState("");
  const [statusInput, setStatusInput] = useState("");
  const [refundAmount, setRefundAmount] = useState(0);

  if (isLoading) return <div className="text-secondary animate-pulse">Loading order details...</div>;
  if (error || !order) return <div className="text-red-400">Failed to load order. {order?.error}</div>;

  const handleCopy = () => {
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdate = async () => {
    setUpdating(true);
    const payload: any = {};
    if (statusInput) {
      payload.status = statusInput;
      if (statusInput === "REFUNDED") payload.refundAmount = refundAmount;
    }
    if (notes !== order.notes) {
      payload.notes = notes;
    }

    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        mutate();
        setStatusInput("");
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl text-secondary flex items-center gap-3">
            Order {order.orderNumber}
            <span className={cn(
              "px-3 py-1 text-sm rounded-full border",
              order.status === "COMPLETED" ? "bg-green-500/10 text-green-500 border-green-500/20" :
              order.status === "PENDING" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
              order.status === "REFUNDED" ? "bg-purple-500/10 text-purple-500 border-purple-500/20" :
              "bg-red-500/10 text-red-500 border-red-500/20"
            )}>
              {order.status}
            </span>
          </h1>
          <div className="text-sm text-blue-muted mt-2 flex items-center gap-2">
            ID: <code className="bg-primary/20 px-1 py-0.5 rounded">{order.id}</code>
            <button onClick={handleCopy} className="text-accent hover:text-accent/80 transition-colors">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-accent">{Number(order.amount).toLocaleString()} VND</div>
          <div className="text-sm text-blue-muted">{format(new Date(order.createdAt), "PPP p")}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-border/50 bg-primary/5 space-y-4">
          <h3 className="font-semibold text-secondary flex items-center gap-2 border-b border-border/30 pb-3">
            <CreditCard className="w-5 h-5 text-accent" /> Customer Details
          </h3>
          <div className="space-y-2 text-sm text-secondary">
            <div className="flex justify-between"><span className="text-blue-muted">Email:</span> <span>{order.user?.email}</span></div>
            <div className="flex justify-between"><span className="text-blue-muted">Full Name:</span> <span>{order.user?.profile?.displayName || "N/A"}</span></div>
            <div className="flex justify-between"><span className="text-blue-muted">Target Clan:</span> <span>{order.clan?.name}</span></div>
            <div className="flex justify-between"><span className="text-blue-muted">Subscription Tier:</span> <span>{order.tier?.nameVi}</span></div>
            <div className="flex justify-between"><span className="text-blue-muted">Billing Cycle:</span> <span>{order.billingCycle}</span></div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border/50 bg-primary/5 space-y-4">
          <h3 className="font-semibold text-secondary flex items-center gap-2 border-b border-border/30 pb-3">
            <AlertCircle className="w-5 h-5 text-accent" /> Payment & Status
          </h3>
          <div className="space-y-2 text-sm text-secondary">
            <div className="flex justify-between"><span className="text-blue-muted">Method:</span> <span>{order.paymentMethod || "N/A"}</span></div>
            <div className="flex justify-between"><span className="text-blue-muted">Reference:</span> <span className="font-mono">{order.paymentReference || "N/A"}</span></div>
            {order.paidAt && <div className="flex justify-between"><span className="text-blue-muted">Paid At:</span> <span>{format(new Date(order.paidAt), "PPP p")}</span></div>}
            {order.refundedAt && <div className="flex justify-between"><span className="text-blue-muted">Refunded At:</span> <span>{format(new Date(order.refundedAt), "PPP p")}</span></div>}
            {order.refundAmount && <div className="flex justify-between"><span className="text-red-400">Refund Amount:</span> <span className="text-red-400 font-medium">{Number(order.refundAmount).toLocaleString()} VND</span></div>}
          </div>
        </div>
      </div>

      <div className="p-6 rounded-xl border border-border/50 bg-primary/5 space-y-6">
        <h3 className="font-semibold text-secondary">Admin Actions</h3>
        
        <div className="space-y-4 max-w-xl">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-blue-muted">Update Status</label>
            <div className="flex gap-4">
              <select
                className="flex-1 px-4 py-2 bg-primary border border-border rounded-lg text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50"
                value={statusInput}
                onChange={(e) => {
                  setStatusInput(e.target.value);
                  if (e.target.value === "REFUNDED" && !refundAmount) setRefundAmount(Number(order.amount));
                }}
              >
                <option value="">-- No Change --</option>
                <option value="PENDING" disabled={order.status === "PENDING"}>Pending</option>
                <option value="COMPLETED" disabled={order.status === "COMPLETED"}>Completed (Mark Paid)</option>
                <option value="REFUNDED" disabled={order.status === "REFUNDED"}>Refunded</option>
                <option value="CANCELLED" disabled={order.status === "CANCELLED"}>Cancelled</option>
                <option value="FAILED" disabled={order.status === "FAILED"}>Failed</option>
              </select>
            </div>
          </div>
          
          {statusInput === "REFUNDED" && (
            <div className="flex flex-col gap-2">
              <label className="text-sm text-blue-muted">Refund Amount (VND)</label>
              <input
                type="number"
                className="w-full px-4 py-2 bg-primary border border-border rounded-lg text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50"
                value={refundAmount}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
                max={Number(order.amount)}
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm text-blue-muted">Internal Notes</label>
            <textarea
              className="w-full px-4 py-3 bg-primary border border-border rounded-lg text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50 min-h-[100px] resize-y"
              defaultValue={order.notes || ""}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Private notes (internal only)..."
            />
          </div>

          <button
            className="flex items-center gap-2 px-6 py-2 bg-accent text-white rounded-md hover:bg-accent/90 disabled:opacity-50 transition-colors"
            onClick={handleUpdate}
            disabled={updating || (!statusInput && notes === order.notes)}
          >
            {updating ? <span className="animate-spin text-xl">⍤</span> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
