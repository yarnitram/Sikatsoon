import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased bg-neutral-950 text-neutral-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
