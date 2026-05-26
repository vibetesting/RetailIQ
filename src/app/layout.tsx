import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RetailIQ — Geo Intelligence Platform",
  description: "AI-powered retail geo-intelligence for FMCG brands",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
