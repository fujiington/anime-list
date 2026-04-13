import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AnimeList — Discover Anime",
  description: "Search and discover anime using the Jikan API.",
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AnimeList",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon-96x96.png",
  },
  openGraph: {
    title: "AnimeList — Discover Anime",
    description: "Search and discover anime powered by MyAnimeList.",
    images: [{ url: "/web-app-manifest-512x512.png", width: 512, height: 512, alt: "AnimeList" }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "AnimeList",
    description: "Search and discover anime powered by MyAnimeList.",
    images: ["/web-app-manifest-512x512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body suppressHydrationWarning className={`${inter.className} bg-black text-white min-h-full flex flex-col antialiased`}>
        <Header />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 pb-20 sm:pb-6">
          {children}
        </main>
        <BottomNav />
        <footer className="hidden sm:block border-t border-zinc-900 text-center text-zinc-700 text-xs py-4">
          Powered by{" "}
          <a href="https://jikan.moe" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 transition-colors">
            Jikan API
          </a>
        </footer>
      </body>
    </html>
  );
}
