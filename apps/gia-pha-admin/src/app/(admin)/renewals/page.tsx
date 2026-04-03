import { Metadata } from "next";
import RenewalsDashboardClient from "./RenewalsDashboardClient";

export const metadata: Metadata = {
  title: "Renewals & Cancellations | Admin",
};

export default function RenewalsPage() {
  return (
    <div className="p-8 lg:p-12 space-y-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <RenewalsDashboardClient />
      </div>
    </div>
  );
}
