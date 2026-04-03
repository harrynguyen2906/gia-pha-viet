"use client";

import { useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { X, ChevronRight } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface BrainInspectorProps {
  memberId: string | null;
  onSelectNode: (nodeId: string) => void;
  onClose: () => void;
  canEdit?: boolean;
}

// Lotus flower icon for deceased
function LotusIcon() {
  return <span aria-label="Đã mất" title="Đã mất" className="text-antique-gold/70">🪷</span>;
}

function formatYear(dateStr?: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).getFullYear().toString();
}

function roleName(role?: string | null): string {
  const LABELS: Record<string, string> = {
    HEAD_OF_HOUSE: "Trưởng Tộc",
    ELDER: "Cao Niên",
    HEIR: "Người Kế Thừa",
    MEMBER: "Thành Viên",
    YOUTH: "Thế Hệ Trẻ",
  };
  return role ? (LABELS[role] ?? role) : "—";
}

function genderName(g?: string | null): string {
  if (g === "MALE") return "Nam";
  if (g === "FEMALE") return "Nữ";
  return "—";
}

interface RelativeLinkProps {
  person: { id: string; fullName: string; isDeceased?: boolean };
  label: string;
  onClick: (id: string) => void;
}

function RelativeLink({ person, label, onClick }: RelativeLinkProps) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-parchment/40 text-xs w-10 shrink-0">{label}</span>
      <button
        onClick={() => onClick(person.id)}
        className="flex items-center gap-1 text-xs text-antique-gold/80 hover:text-gold-leaf transition-colors text-left"
      >
        <ChevronRight className="w-3 h-3 shrink-0 opacity-60" strokeWidth={1.5} />
        <span>{person.fullName}</span>
        {person.isDeceased && <span className="text-parchment/30">†</span>}
      </button>
    </div>
  );
}

export default function BrainInspector({
  memberId,
  onSelectNode,
  onClose,
  canEdit = false,
}: BrainInspectorProps) {
  const { data: res } = useSWR(
    memberId
      ? `/api/v1/members/${memberId}?include=parents,children,spouses`
      : null,
    fetcher,
  );

  const member = res?.data ?? null;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const isVisible = !!memberId;

  const birthYear = formatYear(member?.birthDateSolar);
  const deathYear = member?.isDeceased ? formatYear(member?.deathDateSolar) : null;
  const lifeDates = member?.isDeceased
    ? `${birthYear} — ${deathYear ?? "?"}`
    : `${birthYear} — Hiện tại`;

  return (
    <aside
      className={`
        absolute top-0 right-0 h-full z-30 w-80
        bg-lacquer-dark/97 border-l border-antique-gold/20
        flex flex-col overflow-hidden
        transition-transform duration-300 ease-out
        ${isVisible ? "translate-x-0" : "translate-x-full"}
      `}
      style={{ backdropFilter: "blur(8px)" }}
      aria-label="Chi tiết thành viên"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-antique-gold/10 shrink-0">
        <span className="text-xs font-header tracking-widest uppercase text-antique-gold/50">
          Chi Tiết
        </span>
        <button
          onClick={onClose}
          className="text-parchment/40 hover:text-parchment transition-colors"
          aria-label="Đóng panel"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!member ? (
          <div className="flex items-center justify-center h-40">
            <span className="text-parchment/30 text-xs font-header tracking-widest animate-pulse">
              Đang tải…
            </span>
          </div>
        ) : (
          <div className="px-5 py-5 space-y-5">
            {/* Avatar + Identity */}
            <div className="flex flex-col items-center gap-3">
              <div
                className={`
                  w-24 h-24 rounded-full border-2 bg-cover bg-center shrink-0 flex items-center justify-center
                  ${member.isDeceased
                    ? "border-antique-gold/40 grayscale"
                    : "border-antique-gold/60"
                  }
                `}
                style={{
                  backgroundImage: member.avatarUrl
                    ? `url('${member.avatarUrl}')`
                    : undefined,
                  backgroundColor: "#2d1b1b",
                }}
              >
                {!member.avatarUrl && (
                  <span className="font-ornate text-3xl text-antique-gold/50">
                    {member.fullName?.[0]}
                  </span>
                )}
              </div>

              <div className="text-center space-y-1">
                <p className="font-serif text-parchment font-bold text-base tracking-wide leading-snug flex items-center justify-center gap-1.5 flex-wrap">
                  {member.isDeceased && <LotusIcon />}
                  {member.fullName}
                </p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {member.generation && (
                    <span className="text-xs font-header tracking-widest text-antique-gold/60">
                      Đời thứ {member.generation}
                    </span>
                  )}
                  {member.lineageRole && (
                    <>
                      <span className="text-antique-gold/30">·</span>
                      <span className="text-xs font-header tracking-widest text-imperial-crimson/80">
                        {roleName(member.lineageRole)}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs text-parchment/40 font-sans">{lifeDates}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-antique-gold/10" />

            {/* Personal Info */}
            <section>
              <p className="text-xs font-header tracking-widest uppercase text-antique-gold/50 mb-2">
                📋 Thông Tin Cá Nhân
              </p>
              <div className="space-y-1.5 text-xs">
                {[
                  { label: "Giới tính", value: genderName(member.gender) },
                  {
                    label: "Ngày sinh",
                    value: member.birthDateSolar
                      ? new Date(member.birthDateSolar).toLocaleDateString("vi-VN")
                      : "—",
                  },
                  ...(member.isDeceased
                    ? [
                        {
                          label: "Ngày mất",
                          value: member.deathDateSolar
                            ? new Date(member.deathDateSolar).toLocaleDateString("vi-VN")
                            : "—",
                        },
                      ]
                    : []),
                  { label: "Vai trò", value: roleName(member.lineageRole) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-2">
                    <span className="text-parchment/40 shrink-0">{label}</span>
                    <span className="text-parchment/80 text-right">{value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Family Connections */}
            {(member.parents?.length > 0 ||
              member.spouses?.length > 0 ||
              member.children?.length > 0) && (
              <section>
                <p className="text-xs font-header tracking-widest uppercase text-antique-gold/50 mb-2">
                  🔗 Kết Nối Gia Tộc
                </p>
                <div className="space-y-0.5">
                  {member.parents?.map((p: any) => (
                    <RelativeLink
                      key={p.id}
                      person={p}
                      label="Cha/Mẹ"
                      onClick={onSelectNode}
                    />
                  ))}
                  {member.spouses?.map((s: any) => (
                    <RelativeLink
                      key={s.id}
                      person={s}
                      label="Vợ/Chồng"
                      onClick={onSelectNode}
                    />
                  ))}
                  {member.children?.map((c: any) => (
                    <RelativeLink
                      key={c.id}
                      person={c}
                      label="Con"
                      onClick={onSelectNode}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Biography */}
            {member.biography && (
              <section>
                <p className="text-xs font-header tracking-widest uppercase text-antique-gold/50 mb-2">
                  📝 Tiểu Sử
                </p>
                <p className="text-xs text-parchment/60 font-sans leading-relaxed line-clamp-4">
                  {member.biography}
                </p>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {member && (
        <div className="px-5 pb-5 pt-3 border-t border-antique-gold/10 shrink-0 space-y-2">
          <Link
            href={`/lineage/${member.id}`}
            className="block w-full text-center py-2.5 btn-gold-shimmer text-xs font-header tracking-widest uppercase"
          >
            Xem Hồ Sơ Đầy Đủ
          </Link>
          {canEdit && (
            <Link
              href={`/lineage/${member.id}/edit`}
              className="block w-full text-center py-2.5 border border-antique-gold/25 text-antique-gold/70 hover:text-parchment hover:border-antique-gold/50 text-xs font-header tracking-widest uppercase transition-colors"
            >
              ✏️ Chỉnh Sửa
            </Link>
          )}
        </div>
      )}
    </aside>
  );
}
