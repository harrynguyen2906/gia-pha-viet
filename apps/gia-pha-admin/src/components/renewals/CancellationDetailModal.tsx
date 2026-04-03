"use client";

import { useState } from "react";
import { format } from "date-fns";
import { X, Loader2, Save } from "lucide-react";
import { useSWRConfig } from "swr";

export default function CancellationDetailModal({ request, onClose, onProcessed }: { request: any, onClose: () => void, onProcessed: () => void }) {
  const [updating, setUpdating] = useState(false);
  const [feedbackInput, setFeedback] = useState("");
  const { mutate } = useSWRConfig();

  const handleProcess = async (action: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/cancellations/${request.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, feedback: feedbackInput }),
      });
      if (res.ok) {
        mutate("/api/admin/renewals/summary");
        onProcessed();
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/80 backdrop-blur-sm">
      <div className="bg-primary border border-border/50 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto imperial-scroll">
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-primary/95 backdrop-blur border-b border-border/50">
          <h2 className="text-2xl font-bold text-secondary">Review Cancellation Request</h2>
          <button onClick={onClose} className="p-2 text-blue-muted hover:text-accent rounded-full hover:bg-accent/10 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-8 text-secondary">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-primary/5 rounded-lg border border-border/50 text-sm space-y-2">
              <h3 className="font-semibold mb-2">User Details</h3>
              <div className="flex justify-between"><span className="text-blue-muted">Email:</span> <span>{request.subscription?.user?.email}</span></div>
              <div className="flex justify-between"><span className="text-blue-muted">Name:</span> <span className="font-medium">{request.subscription?.user?.profile?.displayName || "N/A"}</span></div>
              <div className="flex justify-between"><span className="text-blue-muted">Clan:</span> <span>{request.subscription?.clan?.name}</span></div>
            </div>
            
            <div className="p-4 bg-primary/5 rounded-lg border border-border/50 text-sm space-y-2">
              <h3 className="font-semibold mb-2">Subscription Details</h3>
              <div className="flex justify-between"><span className="text-blue-muted">Tier:</span> <span className="text-accent font-medium">{request.subscription?.tier?.nameVi}</span></div>
              <div className="flex justify-between"><span className="text-blue-muted">Expires:</span> <span>{format(new Date(request.subscription?.expiresAt), "PPP")}</span></div>
              <div className="flex justify-between"><span className="text-blue-muted">Status:</span> <span>{request.subscription?.status}</span></div>
            </div>
          </div>

          <div className="p-4 bg-red-500/5 rounded-lg border border-red-500/20 text-sm space-y-4">
            <div className="flex justify-between">
              <h3 className="font-semibold text-red-400">Cancellation Info</h3>
              <span className="px-2 py-1 text-xs font-medium rounded bg-red-500/20 text-red-500">{request.cancellationType}</span>
            </div>
            <div>
              <span className="block text-blue-muted mb-1">Reason Selected:</span>
              <span className="px-3 py-1 font-medium rounded-full bg-primary/20 border border-border/50">{request.cancellationReason}</span>
            </div>
            {request.cancellationFeedback && (
              <div>
                <span className="block text-blue-muted mb-1">Feedback Provided:</span>
                <div className="p-3 bg-primary/20 border border-border/50 rounded text-secondary/80 italic text-sm">
                  "{request.cancellationFeedback}"
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b border-border/30 pb-2">Admin Processing Actions</h3>
            
            <div className="space-y-2">
              <label className="text-sm text-blue-muted font-medium">Add Optional Feedback / Note for Retention:</label>
              <textarea 
                className="w-full p-3 bg-primary/5 border border-border/50 rounded-lg text-secondary focus:ring-2 focus:ring-accent/50 outline-none"
                placeholder="Details of offered discount, or notes on cancellation..."
                value={feedbackInput}
                onChange={e => setFeedback(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
              <button
                disabled={updating}
                onClick={() => handleProcess("APPROVE_END")}
                className="px-4 py-3 bg-yellow-500/10 text-yellow-500 border border-yellow-500/50 rounded-lg hover:bg-yellow-500/20 transition-colors flex flex-col items-center justify-center text-sm font-medium disabled:opacity-50"
              >
                Approve @ End of Period
                <span className="text-xs font-normal opacity-80 mt-1 pb-1">Turns off Auto-Renew. Ends {format(new Date(request.subscription?.expiresAt), "MMM d")}</span>
              </button>
              
              <button
                disabled={updating}
                onClick={() => handleProcess("APPROVE_IMMEDIATE")}
                className="px-4 py-3 bg-red-500/10 text-red-500 border border-red-500/50 rounded-lg hover:bg-red-500/20 transition-colors flex flex-col items-center justify-center text-sm font-medium disabled:opacity-50"
              >
                Approve Immediately
                <span className="text-xs font-normal opacity-80 mt-1 pb-1">Cancels plan right now. Needs manual refund via Orders.</span>
              </button>

              <button
                disabled={updating}
                onClick={() => handleProcess("OFFER_RETENTION")}
                className="px-4 py-3 bg-accent/10 border border-accent/50 text-accent rounded-lg hover:bg-accent/20 transition-colors flex flex-col items-center justify-center text-sm font-medium disabled:opacity-50"
              >
                Offer Retention
                <span className="text-xs font-normal opacity-80 mt-1 pb-1">Leave queue open, mark offered. Requires leaving a note.</span>
              </button>
            </div>
            {updating && <div className="text-center text-blue-muted flex items-center justify-center gap-2 mt-4"><Loader2 className="w-4 h-4 animate-spin"/> Processing...</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
