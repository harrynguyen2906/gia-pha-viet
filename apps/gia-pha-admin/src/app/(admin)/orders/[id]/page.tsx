import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import OrderDetailClient from "./OrderDetailClient";

export const metadata: Metadata = {
  title: "Order Detail | Admin",
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return (
    <div className="p-8 lg:p-12 space-y-10 max-w-5xl mx-auto">
      <Link href="/orders" className="inline-flex items-center text-blue-muted hover:text-accent transition-colors gap-2 text-sm">
        <ChevronLeft className="w-4 h-4" /> Back to Orders
      </Link>
      
      <OrderDetailClient id={resolvedParams.id} />
    </div>
  );
}
