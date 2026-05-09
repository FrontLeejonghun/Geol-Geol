import type { Viewport } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


// =============================================================================
// Viewport Configuration
// =============================================================================

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

// =============================================================================
// Root Layout
// =============================================================================

/**
 * Root layout wrapper.
 *
 * Locale-specific metadata and NextIntlClientProvider are handled
 * in the [locale]/layout.tsx file to support i18n properly.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <head>
        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />

        {/* Preload critical fonts - Inter for Latin, Pretendard for Korean */}
        <link
          rel="preload"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
          as="style"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />

        {/* DNS prefetch for API endpoints */}
        <link rel="dns-prefetch" href="https://query1.finance.yahoo.com" />
        <link rel="dns-prefetch" href="https://query2.finance.yahoo.com" />
      </head>
      <body className="min-h-screen bg-white text-gray-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
