import { Metadata } from "next";
import { OrderTable } from "@/components/orders/OrderTable";

export const metadata: Metadata = {
  title: "Orders Management | Admin",
};

export default function OrdersPage() {
  return (
    <div className="p-8 lg:p-12 space-y-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <OrderTable />
      </div>
    </div>
  );
}
