import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getShopSettings, THEME_OPTIONS } from "@/features/settings/settings.repo";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { findActiveMembershipByCustomerId } from "@/features/membership/membership.repo";
import { getCartCountByCustomerId } from "@/features/cart/cart.repo";
import { LayoutShell } from "@/components/layout/LayoutShell";
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
  const [shop, customer] = await Promise.all([
    (async () => {
      try {
        return await getShopSettings();
      } catch {
        return null;
      }
    })(),
    (async () => {
      try {
        return await getCustomerSession();
      } catch {
        return null;
      }
    })(),
  ]);

  const [hasMembership, cartCount] = await Promise.all([
    customer != null
      ? findActiveMembershipByCustomerId(customer.id).then((m) => !!m)
      : false,
    customer != null ? getCartCountByCustomerId(customer.id) : 0,
  ]);

  try {
    if (shop && THEME_OPTIONS.includes(shop.theme as (typeof THEME_OPTIONS)[number])) {
      theme = shop.theme;
    } else {
      theme = "default";
    }
  } catch {
    theme = "default";
  }

  return (
    <html lang="th" className={googleSans.variable} data-theme={theme}>
      <body
        className={`${googleSans.className} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TooltipProvider>
          <LayoutShell shop={shop} customer={customer} hasMembership={hasMembership} cartCount={cartCount}>
            {children}
          </LayoutShell>
        </TooltipProvider>
      </body>
    </html>
  );
}
