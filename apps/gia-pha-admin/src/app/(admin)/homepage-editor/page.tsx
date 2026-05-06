import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import HomepageEditorClient from "@/components/homepage/HomepageEditorClient";

export const metadata = { title: "Homepage Editor - gia-pha-admin" };

export default async function HomepageEditorPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  return <HomepageEditorClient />;
}
