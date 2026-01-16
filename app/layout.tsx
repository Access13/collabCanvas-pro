import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CollabCanvas Pro",
  description: "Real-time collaborative whiteboard for instant teamwork.",
  metadataBase: new URL("https://collabcanvas-pro.vercel.app"),
  openGraph: {
    title: "CollabCanvas Pro",
    description: "Real-time collaborative whiteboard for instant teamwork.",
    images: ["/demo.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "CollabCanvas Pro",
    description: "Real-time collaborative whiteboard for instant teamwork.",
    images: ["/demo.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
