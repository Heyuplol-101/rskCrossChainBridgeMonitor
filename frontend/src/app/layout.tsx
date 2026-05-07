import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rootstock Bridge Monitor",
  description:
    "Real-time monitoring of Rootstock cross-chain bridges for transparency and security",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#05020a] text-zinc-50`}
      >
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-purple-600 text-white p-2 z-50">
          Skip to main content
        </a>
        <main id="main">
          <QueryProvider>{children}</QueryProvider>
        </main>
      </body>
    </html>
  );
}

