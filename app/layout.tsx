import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Courage Kids POS",
  description: "Point of Sale System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} overflow-x-hidden text-gray-900 bg-gray-50 antialiased`}>
        <div className="min-h-screen w-full max-w-screen overflow-x-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}