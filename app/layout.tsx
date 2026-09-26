import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { OpsProvider } from "@/lib/ops-store";
import { ToastContainer } from "@/components/staff/toast-container";
import { DemoControlBar } from "@/components/staff/demo-control-bar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "ResortBrain | Luxury Hospitality Operations & Guest Commerce", template: "%s · ResortBrain" },
  description:
    "Enterprise hotel operations platform with KDS, front desk billing, housekeeping matrix, manager SLA radar, and mobile guest concierge.",
};

export const viewport: Viewport = {
  themeColor: "#070B14",
  colorScheme: "dark light",
  viewportFit: "cover",
};

const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem('rb-theme');if(!t){var m=document.cookie.match(/(?:^|; )rb-theme=([^;]*)/);if(m)t=decodeURIComponent(m[1])}if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);document.documentElement.classList.toggle('dark',t==='dark')}}catch(e){}})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`dark ${inter.variable} ${playfair.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }}
        />
      </head>
      <body className="min-h-full flex flex-col transition-colors duration-200 selection:bg-amber-500/30 selection:text-amber-200">
        <OpsProvider>
          {children}
          <ToastContainer />
          <DemoControlBar />
        </OpsProvider>
      </body>
    </html>
  );
}
