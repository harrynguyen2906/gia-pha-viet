import Link from "next/link";

export function AdminSidebar() {
  return (
    <nav className="flex-shrink-0 flex flex-col bg-[#210e0e] text-[#e3beb8] font-['Noto_Serif'] antialiased h-screen w-64 border-r border-[#5a403c]/15 shadow-[0_20px_50px_rgba(27,9,9,0.8)] z-50">
      <div className="p-6 flex flex-col gap-1">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary-container flex items-center justify-center rounded-sm">
            <span
              className="material-symbols-outlined text-secondary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              castle
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#e9c176]">Gia Phả Việt</h1>
            <p className="text-[10px] uppercase tracking-widest text-[#aa8984]">
              Hệ Thống Quản Trị
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 text-[#aa8984] hover:bg-[#472e2e] hover:text-[#ffdea5] transition-all duration-300"
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-sm font-medium">Đại Sảnh Admin</span>
          </Link>
          <Link
            href="/clans"
            className="flex items-center gap-3 px-4 py-3 text-[#aa8984] hover:bg-[#472e2e] hover:text-[#ffdea5] transition-all duration-300"
          >
            <span className="material-symbols-outlined">groups</span>
            <span className="text-sm font-medium">Quản Lý Gia Tộc</span>
          </Link>
          <Link
            href="/tiers"
            className="flex items-center gap-3 px-4 py-3 text-[#aa8984] hover:bg-[#472e2e] hover:text-[#ffdea5] transition-all duration-300"
          >
            <span className="material-symbols-outlined">payments</span>
            <span className="text-sm font-medium">Gói Dịch Vụ</span>
          </Link>
          <Link
            href="/orders"
            className="flex items-center gap-3 px-4 py-3 text-[#aa8984] hover:bg-[#472e2e] hover:text-[#ffdea5] transition-all duration-300"
          >
            <span className="material-symbols-outlined">receipt_long</span>
            <span className="text-sm font-medium">Đơn Hàng</span>
          </Link>
          <Link
            href="/renewals"
            className="flex items-center gap-3 px-4 py-3 text-[#aa8984] hover:bg-[#472e2e] hover:text-[#ffdea5] transition-all duration-300"
          >
            <span className="material-symbols-outlined">autorenew</span>
            <span className="text-sm font-medium">Gia Hạn & Hủy</span>
          </Link>
          <Link
            href="/homepage-editor"
            className="flex items-center gap-3 px-4 py-3 text-[#aa8984] hover:bg-[#472e2e] hover:text-[#ffdea5] transition-all duration-300"
          >
            <span className="material-symbols-outlined">home</span>
            <span className="text-sm font-medium">Trang Chủ</span>
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 px-4 py-3 text-[#aa8984] hover:bg-[#472e2e] hover:text-[#ffdea5] transition-all duration-300"
          >
            <span className="material-symbols-outlined">settings_applications</span>
            <span className="text-sm font-medium">Cài Đặt</span>
          </Link>
        </div>
      </div>
      <div className="mt-auto p-6 space-y-4">
        <button className="w-full bg-primary-container text-secondary py-3 px-4 flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-sm">history_edu</span>
          <span className="text-sm font-imperial font-bold tracking-widest">Sắc Chỉ Mới</span>
        </button>
        <Link
          href="#"
          className="flex items-center gap-3 px-4 py-2 text-[#aa8984] hover:text-[#ffdea5] transition-colors"
        >
          <span className="material-symbols-outlined">help</span>
          <span className="text-sm">Trợ Giúp</span>
        </Link>
      </div>
    </nav>
  );
}
