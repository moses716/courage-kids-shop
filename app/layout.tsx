import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "COURAGE KIDS SHOP - Kids Clothing POS",
  description: "Quality kids clothing for every season. Comfortable, durable, and stylish.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body 
        className={`
          ${geistSans.variable} 
          ${geistMono.variable} 
          antialiased 
          bg-gray-50 
          overflow-x-hidden 
          text-gray-900
        `}
      >
        <div className="min-h-screen w-full max-w-full">
          {children}
        </div>
      </body>
    </html>
  )
}