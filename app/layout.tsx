import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { OpsProvider } from "@/lib/ops-store";
import { ToastContainer } from "@/components/staff/toast-container";
import { DemoControlBar } from "@/components/staff/demo-control-bar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Grand Azure Ops | Hotel Operations SaaS Platform",
  description:
    "Enterprise-grade zero-lag hotel operations platform with KDS, front desk billing, housekeeping matrix, manager SLA radar, and multi-tenant control plane.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col transition-colors duration-200 selection:bg-emerald-500/30 selection:text-emerald-200">
        <OpsProvider>
          {children}
          <ToastContainer />
          <DemoControlBar />
        </OpsProvider>
      </body>
    </html>
  );
}
