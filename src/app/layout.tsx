import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SiteSense",
  description:
    "AI-assisted site safety assessment prototype. Not a substitute for professional judgement.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
