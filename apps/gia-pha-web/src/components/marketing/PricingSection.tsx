"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PricingSection() {
  const [tiers, setTiers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/public/pricing")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setTiers(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Không thể tải bảng giá");
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <section className="py-24 bg-primary/10">
        <div className="container mx-auto px-4 flex justify-center items-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </section>
    );
  }

  if (error) {
    return null; // Or a fallback error message
  }

  return (
    <section id="pricing" className="py-24 bg-primary/10 border-y border-border/50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-secondary mb-4">
            Gắn Kết Dòng Họ
          </h2>
          <p className="text-blue-muted font-medium max-w-2xl mx-auto">
            Chọn gói phù hợp với quy mô gia tộc của bạn. Bắt đầu miễn phí và nâng cấp khi dòng họ phát triển.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-4">
          {tiers.map((tier) => {
            const isPopular = tier.isPopular;
            const features = Array.isArray(tier.features) ? tier.features : [];
            const limits = typeof tier.limits === 'object' && tier.limits !== null ? tier.limits : {};

            return (
              <div
                key={tier.id}
                className={cn(
                  "relative flex flex-col p-8 rounded-2xl bg-primary border transition-all duration-300",
                  isPopular
                    ? "border-accent/50 shadow-[0_0_40px_-15px_rgba(200,165,100,0.3)] md:-translate-y-4"
                    : "border-border/50 hover:border-accent/30"
                )}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-accent to-accent/80 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
                    Khuyên Dùng
                  </div>
                )}
                
                <div className="mb-6 border-b border-border/50 pb-6">
                  <h3 className="text-xl font-bold text-secondary mb-2">{tier.nameVi}</h3>
                  <div className="text-sm text-blue-muted min-h-[40px] italic">
                    {tier.descriptionVi || tier.nameEn}
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold font-serif text-secondary">
                      {tier.priceMonthly == 0 ? "Miễn Phí" : `${new Intl.NumberFormat('vi-VN').format(tier.priceMonthly)}đ`}
                    </span>
                    {tier.priceMonthly > 0 && <span className="text-blue-muted">/tháng</span>}
                  </div>
                </div>

                <div className="flex-1">
                  <ul className="space-y-4 text-sm text-secondary/80">
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-accent shrink-0" />
                      <span>{limits.max_members ? `Tối đa ${limits.max_members} thành viên` : "Không giới hạn thành viên"}</span>
                    </li>
                    {features.map((feature: any, idx: number) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-accent shrink-0" />
                        <span>{typeof feature === 'string' ? feature : feature.titleVi || feature.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={tier.priceMonthly == 0 ? "/auth/register" : `/auth/register?tier=${tier.slug}`}
                  className={cn(
                    "mt-8 w-full py-3 px-6 rounded-lg font-bold text-center transition-all",
                    isPopular
                      ? "bg-accent hover:bg-accent/90 text-white shadow-md shadow-accent/20"
                      : "bg-primary/50 hover:bg-primary border border-border/80 text-secondary"
                  )}
                >
                  {tier.priceMonthly == 0 ? "Bắt Đầu" : "Chọn Gói Này"}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
