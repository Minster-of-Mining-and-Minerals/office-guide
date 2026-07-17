import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Ethiopic } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import AuthProvider from "@/providers/AuthProvider";
import ReduxProvider from "@/providers/ReduxProvider";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import type { Locale } from "@/i18n/dictionary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Ethiopic script font — mounted as a CSS variable so we can compose it into
// the global `font-sans` stack (see globals.css). Latin text still renders in
// Geist because Noto Sans Ethiopic has no Latin glyphs; the browser falls
// through the stack.
const notoSansEthiopic = Noto_Sans_Ethiopic({
  variable: "--font-noto-ethiopic",
  subsets: ["ethiopic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MoM Office Guide",
  description:
    "Ministry of Mining — Office Guide for finding offices, services and contact persons across the building.",
  icons: {
    icon: "/favicon_io/favicon.ico",
    shortcut: "/favicon_io/favicon-32x32.png",
    apple: "/favicon_io/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read the locale cookie server-side so SSR matches the client's initial
  // paint and we don't get a hydration mismatch when the user is on Amharic.
  const stored = (await cookies()).get("locale")?.value;
  const initialLocale: Locale = stored === "am" ? "am" : "en";

  return (
    <html lang={initialLocale === "am" ? "am-ET" : "en"}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansEthiopic.variable} antialiased text-primary`}
      >
        <AuthProvider>
          <ReduxProvider>
            <LocaleProvider initialLocale={initialLocale}>
              <ThemeProvider>{children}</ThemeProvider>
            </LocaleProvider>
          </ReduxProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
