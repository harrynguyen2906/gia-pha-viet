"use client"
import { useActionState } from "react"
import { loginAction } from "./actions"

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, { error: "" })

  return (
<form action={formAction} className="p-8 md:p-12 space-y-8">
  {state?.error && (
    <div className="bg-red-500/10 text-red-500 border border-red-500/20 p-4 rounded text-sm text-center">
      {state.error}
    </div>
  )}
  <div className="space-y-2 group">
    <label className="block text-sm font-label text-secondary tracking-wider uppercase opacity-70" htmlFor="email">Email Thành Viên</label>
    <div className="relative">
      <input className="w-full bg-transparent border-0 border-b border-outline focus:border-secondary focus:ring-0 transition-all duration-300 py-3 text-on-surface placeholder:text-outline-variant/50" id="email" name="email" placeholder="admin@heritagecloud.vn" type="email" required />
      <span className="absolute right-0 bottom-3 material-symbols-outlined text-outline group-focus-within:text-secondary transition-colors">mail</span>
    </div>
  </div>

  <div className="space-y-2 group">
    <label className="block text-sm font-label text-secondary tracking-wider uppercase opacity-70" htmlFor="password">Mật Mã</label>
    <div className="relative">
      <input className="w-full bg-transparent border-0 border-b border-outline focus:border-secondary focus:ring-0 transition-all duration-300 py-3 text-on-surface placeholder:text-outline-variant/50" id="password" name="password" placeholder="••••••••" type="password" required />
      <span className="absolute right-0 bottom-3 material-symbols-outlined text-outline group-focus-within:text-secondary transition-colors">lock</span>
    </div>
  </div>

  <div className="pt-4 space-y-6">
    <button disabled={isPending} className="w-full bg-primary-container text-secondary font-headline py-4 px-6 shadow-lg hover:bg-on-primary-fixed-variant transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50" type="submit">
      <span className="tracking-[0.2em] font-bold">{isPending ? "ĐANG TẢI..." : "ĐĂNG NHẬP"}</span>
      <span className="material-symbols-outlined text-xl">login</span>
    </button>
  </div>
</form>
  )
}
