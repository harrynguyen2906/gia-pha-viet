import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import SettingsDashboardClient from "./SettingsDashboardClient"

export const metadata = { title: "Admin Settings - gia-pha" }

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/login")
  }
  
  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <SettingsDashboardClient />
        </div>
      </main>
    </div>
  )
}
