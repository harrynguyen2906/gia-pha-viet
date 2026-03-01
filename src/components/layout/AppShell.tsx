"use client";

import { SessionProvider } from "next-auth/react";
import Navbar from "./Navbar";
import ToastContainer from "@/components/ui/ToastContainer";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Navbar />
      <main className="pt-16 min-h-screen">{children}</main>
      <ToastContainer />
    </SessionProvider>
  );
}
