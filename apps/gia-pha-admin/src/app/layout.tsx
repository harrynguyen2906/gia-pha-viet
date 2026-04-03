import type { Metadata } from "next";
import { EB_Garamond, Noto_Serif, Spectral_SC } from "next/font/google";
import "./globals.css";

const ebGaramond = EB_Garamond({
  subsets: ["vietnamese"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-headline",
  display: "swap",
});

const notoSerif = Noto_Serif({
  subsets: ["vietnamese"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-body",
  display: "swap",
});

const spectralSC = Spectral_SC({
  subsets: ["vietnamese"],
  weight: ["500", "700"],
  variable: "--font-imperial",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gia Phả Việt - Admin Dashboard",
  description: "Trang quản trị hệ thống Gia Phả Việt",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`dark h-full ${notoSerif.variable} ${ebGaramond.variable} ${spectralSC.variable}`}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col font-body bg-surface text-on-surface">
        {children}
      </body>
    </html>
  );
}
