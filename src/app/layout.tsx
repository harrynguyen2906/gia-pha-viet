import type { Metadata } from "next";
import {
  Noto_Serif,
  Noto_Sans,
  Playfair_Display,
  WindSong,
  Spectral_SC,
  EB_Garamond,
} from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

const notoSerif = Noto_Serif({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "700"],
  variable: "--font-display",
  display: "swap",
});
const notoSans = Noto_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
  display: "swap",
});
const spectralSC = Spectral_SC({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700"],
  variable: "--font-header",
  display: "swap",
});
const ebGaramond = EB_Garamond({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "700", "800"],
  variable: "--font-ornate",
  display: "swap",
});
const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "700"],
  variable: "--font-serif",
  display: "swap",
});
const windSong = WindSong({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500"],
  variable: "--font-calligraphy",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Heritage Cloud — Gia Phả Việt",
  description:
    "Hệ thống quản lý gia phả dòng tộc Việt Nam — lưu giữ và kết nối thế hệ.",
  keywords: ["gia phả", "dòng tộc", "tổ tiên", "heritage", "lineage", "vietnam"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`dark ${notoSerif.variable} ${notoSans.variable} ${spectralSC.variable} ${ebGaramond.variable} ${playfair.variable} ${windSong.variable}`}
    >
      <body className="bg-bg-dark text-parchment font-sans antialiased min-h-screen">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
