import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getShopSettings } from "@/features/settings/settings.repo";
import { THEME_OPTIONS } from "@/features/settings/settings.repo";
import "./globals.css";

const googleSans = localFont({
  src: [
    { path: "../../public/font/GoogleSans-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/font/GoogleSans-Italic.ttf", weight: "400", style: "italic" },
    { path: "../../public/font/GoogleSans-Medium.ttf", weight: "500", style: "normal" },
    { path: "../../public/font/GoogleSans-MediumItalic.ttf", weight: "500", style: "italic" },
    { path: "../../public/font/GoogleSans-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../../public/font/GoogleSans-SemiBoldItalic.ttf", weight: "600", style: "italic" },
    { path: "../../public/font/GoogleSans-Bold.ttf", weight: "700", style: "normal" },
    { path: "../../public/font/GoogleSans-BoldItalic.ttf", weight: "700", style: "italic" },
  ],
  variable: "--font-sans",
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Zend POS",
    template: "%s | Zend POS",
  },
  description: "Point of Sale system for your business.",
  keywords: ["POS", "point of sale", "zend"],
  authors: [{ name: "Zend" }],
  creator: "Zend",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "th_TH",
    title: "Zend POS",
    description: "Point of Sale system for your business.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let theme = "default";
  try {
    const settings = await getShopSettings();
    theme = THEME_OPTIONS.includes(settings.theme as (typeof THEME_OPTIONS)[number])
      ? settings.theme
      : "default";
  } catch {
    theme = "default";
  }

  return (
    <html lang="th" className={googleSans.variable} data-theme={theme}>
      <body
        className={`${googleSans.className} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
