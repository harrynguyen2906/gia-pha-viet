"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always show success to prevent email enumeration
      setSubmitted(true);
    } catch {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: "#120808" }}
    >
      <div className="relative w-full max-w-md">
        {/* Crest */}
        <div className="flex flex-col items-center mb-2">
          <div
            className="w-20 h-20 border-2 border-accent-gold rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#1a0808", boxShadow: "0 0 20px rgba(197,160,89,0.2)" }}
          >
            <span className="text-accent-gold text-4xl">🔑</span>
          </div>
          <div className="h-8 w-px bg-gradient-to-b from-accent-gold to-transparent mt-2" />
        </div>

        {/* Scroll */}
        <div className="relative w-full">
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
              background:
                "linear-gradient(to right, #e2d1b3 0%, #f5e6d3 10%, #f5e6d3 90%, #e2d1b3 100%)",
              boxShadow:
                "0 20px 50px rgba(0,0,0,0.8), inset 0 0 60px rgba(139,69,19,0.15)",
            }}
          >
            <div className="text-center mb-8">
              <h1
                className="font-header text-2xl font-bold tracking-widest mb-2"
                style={{ color: "#1a0808" }}
              >
                KHÔI PHỤC CHIẾU
              </h1>
              <div className="flex justify-center items-center gap-3">
                <div className="h-px w-8" style={{ backgroundColor: "rgba(26,8,8,0.2)" }} />
                <span className="text-primary text-sm">✦</span>
                <div className="h-px w-8" style={{ backgroundColor: "rgba(26,8,8,0.2)" }} />
              </div>
              <p className="font-serif italic text-sm mt-3" style={{ color: "rgba(26,8,8,0.55)" }}>
                {submitted
                  ? "Chiếu thư đã được gửi đi"
                  : "Yêu Cầu Đặt Lại Mật Khẩu"}
              </p>
            </div>

            {submitted ? (
              <div className="text-center space-y-4">
                <p
                  className="font-sans text-sm leading-relaxed"
                  style={{ color: "rgba(26,8,8,0.75)" }}
                >
                  Nếu địa chỉ email{" "}
                  <strong>{email}</strong>{" "}
                  tồn tại trong hệ thống, bạn sẽ nhận được liên kết đặt lại mật khẩu trong vòng vài phút.
                </p>
                <p
                  className="font-serif italic text-xs mt-4"
                  style={{ color: "rgba(26,8,8,0.45)" }}
                >
                  Vui lòng kiểm tra hộp thư và thư mục spam.
                </p>
                <Link
                  href="/auth/signin"
                  className="block mt-6 font-header text-sm tracking-widest text-white bg-primary py-3 text-center border border-accent-gold/50 hover:opacity-90 transition-opacity"
                >
                  QUAY LẠI ĐĂNG NHẬP
                </Link>
              </div>
            ) : (
              <>
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
                      htmlFor="forgot-email"
                    >
                      Địa Chỉ Email
                    </label>
                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ten@heritage.cloud"
                      required
                      autoComplete="email"
                      className="w-full bg-transparent px-0 py-2 outline-none transition-colors font-sans font-medium text-sm"
                      style={{ borderBottom: "2px solid rgba(26,8,8,0.2)", color: "#1a0808" }}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderBottomColor = "#8a0000")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderBottomColor = "rgba(26,8,8,0.2)")
                      }
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full group relative mt-2 overflow-hidden bg-primary text-white font-header tracking-[0.2em] py-4 border border-accent-gold/50 shadow-lg transition-all active:scale-[0.98] disabled:opacity-60"
                  >
                    <span className="relative z-10 text-sm">
                      {loading ? "ĐANG GỬI..." : "GỬI CHIẾU THƯ"}
                    </span>
                    <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
                  </button>
                </form>
              </>
            )}

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

        <div className="mt-8 flex justify-center gap-6 text-[10px] tracking-[0.2em] font-header text-accent-gold/40">
          <Link href="/auth/signin" className="hover:text-accent-gold transition-colors uppercase">
            Đăng Nhập
          </Link>
          <div className="h-px w-8 self-center bg-accent-gold/20" />
          <Link href="/auth/register" className="hover:text-accent-gold transition-colors uppercase">
            Đăng Ký
          </Link>
        </div>
      </div>
    </div>
  );
}
