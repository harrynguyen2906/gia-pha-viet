import { auth, signOut } from "@/lib/auth"
import Link from "next/link"

export async function AdminHeader() {
  const session = await auth()

  return (
    <header className="bg-background border-b border-[#5a403c]/15 px-8 py-4 flex items-center justify-between shadow-[0_4px_30px_rgba(33,14,14,0.3)] sticky top-0 z-40 relative before:content-[''] before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')] before:opacity-10 before:pointer-events-none">
      <div className="flex-1 max-w-2xl relative group">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">search</span>
        <input 
          type="text" 
          placeholder="Tìm Gia Phả, Tên Tộc, hoặc Mã Giao Dịch..." 
          className="w-full bg-surface-variant text-on-surface-variant placeholder:text-on-surface-variant/40 rounded-full pl-12 pr-6 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface border border-outline/30 focus:border-primary transition-all shadow-inner"
        />
      </div>
      <div className="flex items-center gap-6 ml-8">
        <button className="relative w-10 h-10 flex items-center justify-center rounded-full bg-surface-variant text-on-surface hover:text-[#ffdea5] hover:bg-[#472e2e] transition-colors shadow-sm cursor-pointer">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full ring-2 ring-background animate-pulse"></span>
        </button>
        <div className="flex items-center gap-3 p-1.5 rounded-full hover:bg-surface-variant transition-colors border border-outline/10">
          <img src={`https://ui-avatars.com/api/?name=${session?.user?.name || 'Admin'}&background=d8a454&color=210e0e`} alt="Admin" className="w-9 h-9 rounded-full ring-2 ring-primary/20 shadow-[0_0_10px_rgba(233,193,118,0.2)]" />
          <div className="hidden md:block pr-2">
            <p className="text-sm font-semibold text-on-surface font-['Noto_Serif']">{session?.user?.name || 'Admin'}</p>
            <p className="text-[11px] text-primary/70 uppercase tracking-wider font-medium">{session?.user?.adminRole || 'Admin'}</p>
          </div>
          <form action={async () => {
            "use server"
            await signOut({ redirectTo: "/auth/login" })
          }}>
            <button type="submit" className="p-2 ml-2 hover:bg-error/10 text-error rounded-full flex items-center justify-center" title="Đăng xuất">
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
