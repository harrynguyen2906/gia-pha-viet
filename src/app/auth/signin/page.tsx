"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Email hoặc mật khẩu không đúng.");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div
      className="flex min-h-screen h-screen overflow-hidden"
      style={{ backgroundColor: "#120808" }}
    >
      {/* Left panel — ancestral hall background */}
      <div className="hidden lg:block w-7/12 relative h-full">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuCJRkzWNQYTWHu1-VFZDGP9Yr3nEMXlp1kZ4TTGL6wrUVJLQjM_2MlMPXRvFeZ2ecSPY4OoIODhq0WFL9LWPZp_Ai1PNwucfl235jIvACbLHNEJKn8D5pMTKq3lpKojeoN1PLGfQ3E0kt0NCeIcq_Q7zRHW3v5hCAr5G6SiAHuf5bHujL2p-tNAeiOpmVLszPrRDJN5KNcaiFifPXAam_4G_lRTRUOvmZDGZFajyYGdENBg88OE4i1Xt9l6WjvbvL-HHdfe8VEgjVuR')",
          }}
        />
        <div className="absolute bottom-20 left-20 w-32 h-32 bg-orange-500/20 blur-[80px] rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-yellow-600/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-12 left-12 flex items-center gap-4">
          <div className="flex items-center justify-center size-12 rounded-lg bg-primary border border-accent-gold/50 shadow-lg">
            <span className="text-white text-xl">⛩</span>
          </div>
          <div>
            <h2 className="font-header text-xl tracking-[0.3em] text-white">HERITAGE CLOUD</h2>
            <p className="font-serif italic text-accent-gold/70 text-sm">Eternal Legacy Preserved</p>
          </div>
        </div>
      </div>

      {/* Right panel — imperial scroll form */}
      <div
        className="w-full lg:w-5/12 relative flex flex-col items-center justify-center px-8 lg:px-16 border-l border-accent-gold/10"
        style={{ backgroundColor: "#1a0808" }}
      >
        {/* Decorative pillars */}
        <div
          className="hidden xl:block absolute left-4 top-10 bottom-10 w-4 rounded-full border border-accent-gold/20"
          style={{ background: "linear-gradient(to right, #2d0a0a, #6b0f0f, #2d0a0a)" }}
        />
        <div
          className="hidden xl:block absolute right-4 top-10 bottom-10 w-4 rounded-full border border-accent-gold/20"
          style={{ background: "linear-gradient(to right, #2d0a0a, #6b0f0f, #2d0a0a)" }}
        />

        {/* Crest */}
        <div className="absolute top-10 flex flex-col items-center">
          <div
            className="w-20 h-20 border-2 border-accent-gold rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#1a0808", boxShadow: "0 0 20px rgba(197,160,89,0.2)" }}
          >
            <span className="text-accent-gold text-4xl">🛡</span>
          </div>
          <div className="h-8 w-px bg-gradient-to-b from-accent-gold to-transparent mt-2" />
        </div>

        {/* Scroll */}
        <div className="relative w-full max-w-md mt-12">
          {/* Top roller */}
          <div
            className="h-4 w-[104%] -ml-[2%] rounded-full relative z-20"
            style={{
              background: "linear-gradient(to right, #4a2511, #8b4513, #4a2511)",
              border: "1px solid rgba(212,175,55,0.4)",
            }}
          />

          {/* Scroll body */}
          <div
            className="px-8 md:px-12 py-10 border-x border-accent-gold/30 relative"
            style={{
              background: "linear-gradient(to right, #e2d1b3 0%, #f5e6d3 10%, #f5e6d3 90%, #e2d1b3 100%)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.8), inset 0 0 60px rgba(139,69,19,0.15)",
            }}
          >
            <div className="text-center mb-8">
              <h1
                className="font-header text-2xl font-bold tracking-widest mb-2"
                style={{ color: "#1a0808" }}
              >
                IMPERIAL DECREE
              </h1>
              <div className="flex justify-center items-center gap-3">
                <div className="h-px w-8" style={{ backgroundColor: "rgba(26,8,8,0.2)" }} />
                <span className="text-primary text-sm">✦</span>
                <div className="h-px w-8" style={{ backgroundColor: "rgba(26,8,8,0.2)" }} />
              </div>
              <p className="font-serif italic text-sm mt-3" style={{ color: "rgba(26,8,8,0.55)" }}>
                Xác Thực Danh Tính
              </p>
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 bg-primary/10 border border-primary/30 text-red-700 text-xs font-sans text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  className="block font-sans text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: "rgba(26,8,8,0.75)" }}
                  htmlFor="signin-email"
                >
                  Email / ID Tổ Tông
                </label>
                <input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ten@heritage.cloud"
                  required
                  autoComplete="email"
                  className="w-full bg-transparent px-0 py-2 outline-none transition-colors font-sans font-medium text-sm"
                  style={{ borderBottom: "2px solid rgba(26,8,8,0.2)", color: "#1a0808" }}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#8a0000")}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = "rgba(26,8,8,0.2)")}
                />
              </div>

              <div>
                <label
                  className="block font-sans text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: "rgba(26,8,8,0.75)" }}
                  htmlFor="signin-password"
                >
                  Mật Khẩu Bí Mật
                </label>
                <input
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-transparent px-0 py-2 outline-none transition-colors font-sans font-medium text-sm"
                  style={{ borderBottom: "2px solid rgba(26,8,8,0.2)", color: "#1a0808" }}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#8a0000")}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = "rgba(26,8,8,0.2)")}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="rounded h-4 w-4 accent-primary"
                  />
                  <span className="text-xs font-sans" style={{ color: "rgba(26,8,8,0.65)" }}>
                    Ghi Nhớ Đăng Nhập
                  </span>
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-sans font-semibold tracking-tighter hover:underline"
                  style={{ color: "#8a0000" }}
                >
                  Quên Mật Khẩu?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full group relative mt-6 overflow-hidden bg-primary text-white font-header tracking-[0.2em] py-4 border border-accent-gold/50 shadow-lg transition-all active:scale-[0.98] disabled:opacity-60"
              >
                <span className="relative z-10 text-sm">
                  {loading ? "ĐANG XỬ LÝ..." : "TRUY CẬP HỆ THỐNG"}
                </span>
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
              </button>
            </form>

            <div className="absolute bottom-4 left-4 opacity-15 pointer-events-none" aria-hidden="true">
              <span className="text-4xl" style={{ color: "#1a0808" }}>✿</span>
            </div>
            <div className="absolute bottom-4 right-4 opacity-15 pointer-events-none" aria-hidden="true">
              <span className="text-4xl" style={{ color: "#1a0808" }}>✿</span>
            </div>
          </div>

          {/* Bottom roller */}
          <div
            className="h-4 w-[104%] -ml-[2%] rounded-full relative z-20"
            style={{
              background: "linear-gradient(to right, #4a2511, #8b4513, #4a2511)",
              border: "1px solid rgba(212,175,55,0.4)",
            }}
          />
        </div>

        {/* Footer links */}
        <div className="absolute bottom-10 w-full px-12 flex justify-between items-center text-[10px] tracking-[0.2em] font-header text-accent-gold/40">
          <Link href="/auth/register" className="hover:text-accent-gold transition-colors uppercase">
            Đăng Ký Dòng Tộc
          </Link>
          <div className="h-px w-12 bg-accent-gold/20" />
          <Link href="/" className="hover:text-accent-gold transition-colors uppercase">
            Trang Chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
