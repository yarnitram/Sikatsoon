import type { Metadata } from "next";
import "./globals.css";
import { AppHeader } from "@/components/app-header";

export const metadata: Metadata = {
  title: "Sikatsoon - Viral Curator & Repurposing Lab",
  description: "Discover, evaluate, and repurpose viral TikTok clips into YouTube Shorts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Space+Grotesk:wght@300..700&family=JetBrains+Mono:wght@300..700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-surface-container-lowest text-on-surface font-body min-h-screen selection:bg-primary-container selection:text-on-primary">
        <AppHeader />
        <div className="pt-14 h-screen w-screen overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
