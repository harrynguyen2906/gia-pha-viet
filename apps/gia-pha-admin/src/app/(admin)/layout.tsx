import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminHeader } from "@/components/layout/AdminHeader";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen bg-[#210e0e] text-[#e3beb8] font-['Noto_Serif'] antialiased selection:bg-[#5a403c] selection:text-[#ffdea5]">
      {/* Texture Overlay for the entire admin panel */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay z-0" style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/rice-paper-2.png')"}}></div>
      
      <AdminSidebar />
      
      <main className="flex-1 flex flex-col min-w-0 bg-[#2b1818] overflow-hidden relative z-10 shadow-[inset_10px_0_30px_rgba(27,9,9,0.9)]">
        <AdminHeader />
        <div className="flex-1 overflow-auto p-8 relative">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#472e2e]/20 to-transparent pointer-events-none"></div>
          {children}
        </div>
      </main>
    </div>
  );
}
