"use client";

import { useState } from "react";
import useSWR from "swr";
import { Loader2, Search, Filter, Calendar as CalendarIcon, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AuditLogTable() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const limit = 20;

  const { data, isLoading, error } = useSWR(`/api/admin/audit-logs?page=${page}&limit=${limit}&action=${actionFilter}`, fetcher);

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('APPROVED')) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (action.includes('DELETE') || action.includes('REJECTED')) return 'text-red-400 bg-red-400/10 border-red-400/20';
    if (action.includes('UPDATE') || action.includes('MODIFY')) return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-secondary flex items-center gap-2">
            <FileText className="w-6 h-6 text-accent" />
            System Audit Trail
          </h2>
          <p className="text-blue-muted text-sm">Immutable ledger of administrative mutations.</p>
        </div>

        <div className="flex bg-primary border border-border/50 rounded-lg p-1">
          <select 
            className="bg-transparent text-secondary text-sm p-2 outline-none border-r border-border/50"
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Actions</option>
            <option value="UPDATE_ORDER">Order Updates</option>
            <option value="APPROVE_RENEWAL">Renewals</option>
            <option value="REJECT_CANCELLATION">Cancellations</option>
            <option value="CREATE_ADMIN">Admin Provisioning</option>
          </select>
          <div className="flex items-center px-3 text-blue-muted hover:text-secondary cursor-pointer">
            <Filter className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="border border-border/50 rounded-xl overflow-hidden bg-primary/5">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-primary/30 border-b border-border/50 text-blue-muted uppercase text-xs tracking-wider">
                <th className="px-6 py-4 font-medium">Timestamp</th>
                <th className="px-6 py-4 font-medium">Administrator</th>
                <th className="px-6 py-4 font-medium">Action Event</th>
                <th className="px-6 py-4 font-medium">Target Entity</th>
                <th className="px-6 py-4 font-medium w-1/3">Detailed Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-blue-muted">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-accent" />
                    Crunching audit ledgers...
                  </td>
                </tr>
              ) : error || data?.error ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-red-400">Error retrieving audit trail.</td></tr>
              ) : data?.logs?.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-blue-muted italic">No matching activities found in the ledger.</td></tr>
              ) : (
                data?.logs?.map((log: any) => (
                  <tr key={log.id} className="hover:bg-primary/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-blue-muted font-mono text-xs">
                        <CalendarIcon className="w-3 h-3" />
                        {new Date(log.createdAt).toLocaleString(undefined, { 
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-secondary">{log.adminUser?.name || "System"}</div>
                      <div className="text-xs text-blue-muted">{log.adminUser?.email || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded border text-xs font-semibold uppercase tracking-wider",
                        getActionColor(log.action)
                      )}>
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-secondary/80">
                      {log.entityType} <span className="text-blue-muted">#{log.entityId.slice(-6)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <details className="cursor-pointer">
                        <summary className="text-xs font-medium text-accent hover:text-accent/80 select-none">View Diff payload</summary>
                        <pre className="mt-2 p-3 bg-primary/40 rounded border border-border/50 text-[10px] text-blue-muted font-mono overflow-auto max-h-32 shadow-inner">
                          {log.details ? JSON.stringify(JSON.parse(log.details), null, 2) : "{}"}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Foot */}
        <div className="border-t border-border/50 p-4 flex items-center justify-between text-sm text-blue-muted bg-primary/10">
          <span>
            Showing <strong className="text-secondary">{data?.logs?.length || 0}</strong> events
            {data?.total && ` of ${data.total} total`}
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded hover:bg-primary/50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-mono px-2 text-secondary">Page {page} {data?.totalPages ? `/ ${data.totalPages}` : ''}</span>
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={!data || page >= (data?.totalPages || 1)}
              className="p-1 rounded hover:bg-primary/50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
