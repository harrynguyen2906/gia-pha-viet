import type { Metadata } from "next";
import HeroSection from "@/components/marketing/HeroSection";
import FeaturesSection from "@/components/marketing/FeaturesSection";
import HowItWorksSection from "@/components/marketing/HowItWorksSection";
import SocialProofSection from "@/components/marketing/SocialProofSection";
import CTABannerSection from "@/components/marketing/CTABannerSection";

export const metadata: Metadata = {
  title: "Heritage Cloud — Lưu Giữ Di Sản Gia Phả Việt Nam",
  description:
    "Nền tảng gia phả số cho gia đình Việt Nam. Quản lý cây phả hệ, lịch giỗ chạp, bản đồ tổ tiên và bổn phận gia tộc.",
  keywords: ["gia phả", "family tree", "Vietnamese genealogy", "phả hệ", "lịch giỗ", "tổ tiên"],
  openGraph: {
    title: "Heritage Cloud — Vietnamese Family Lineage Platform",
    description:
      "Preserve your family heritage digitally. Interactive lineage trees, ritual calendars, and ancestral maps.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SocialProofSection />
      <CTABannerSection />
    </>
  );
}
