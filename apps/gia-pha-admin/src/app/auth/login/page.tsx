import { LoginForm } from "./LoginForm"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative font-body bg-surface text-on-surface">
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <span className="material-symbols-outlined text-[40rem] text-secondary">account_balance</span>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-block p-4 mb-4 relative">
            <div className="absolute inset-0 border border-secondary opacity-40 rotate-45"></div>
            <span className="material-symbols-outlined text-5xl text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>castle</span>
          </div>
          <h1 className="font-headline text-4xl text-secondary tracking-widest uppercase mb-2">Heritage Cloud</h1>
          <h2 className="font-body text-lg text-on-surface-variant italic opacity-80">Gia Phả Việt - Đăng Nhập Admin</h2>
        </div>

        <div className="bg-surface-container-high shadow-[0_20px_50px_rgba(27,9,9,0.8)] border border-outline-variant/20 relative overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-secondary to-transparent"></div>
          <LoginForm />
          <div className="absolute bottom-0 left-0 w-full h-24 lacquer-sheen pointer-events-none opacity-20"></div>
        </div>

        <div className="mt-12 text-center text-[10px] text-outline uppercase tracking-[0.3em]">
          <p>Hoàng Thành Huế - Di Sản Số</p>
        </div>
      </div>
    </div>
  )
}
