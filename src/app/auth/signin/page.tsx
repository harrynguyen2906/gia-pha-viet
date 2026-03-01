"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/primitives";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg-dark">
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(ellipse_at_center,#8b0000_0%,transparent_70%)]" />

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl font-calligraphy text-antique-gold mb-2">𝕳</div>
          <h1 className="font-ornate text-2xl text-parchment tracking-widest">
            Heritage Cloud
          </h1>
          <p className="font-display text-parchment/50 text-sm mt-1">
            Gia phả dòng tộc Việt Nam
          </p>
        </div>

        {/* Form card */}
        <div className="frame-gold-leaf bg-panel-dark rounded-sm p-8 shadow-parchment">
          <h2 className="font-header text-lg text-antique-gold uppercase tracking-widest text-center mb-6">
            Đăng Nhập
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-primary/20 border border-primary/40 rounded-sm text-red-300 text-sm text-center font-display">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-header uppercase tracking-wider text-parchment/60 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-bg-dark border border-border-muted rounded-sm px-4 py-2.5 text-parchment text-sm focus:outline-none focus:border-antique-gold transition-colors placeholder-parchment/20"
                placeholder="email@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-header uppercase tracking-wider text-parchment/60 mb-1.5">
                Mật Khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-bg-dark border border-border-muted rounded-sm px-4 py-2.5 text-parchment text-sm focus:outline-none focus:border-antique-gold transition-colors placeholder-parchment/20"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              variant="lacquer"
              size="lg"
              loading={loading}
              className="w-full mt-6"
            >
              Đăng Nhập
            </Button>
          </form>

          <p className="text-center text-xs text-parchment/30 mt-6 font-display">
            Tổ tiên phù hộ — tâm thành ắt đến
          </p>
        </div>
      </div>
    </div>
  );
}
