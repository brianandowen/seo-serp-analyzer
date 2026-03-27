import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SEO SERP Analyzer",
  description: "SERP + E-E-A-T 分析工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}