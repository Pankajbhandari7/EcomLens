import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "PackOptima - E-Commerce Seller Image Optimization Utility",
  description:
    "Optimize your product images for e-commerce marketplaces to get lower shipping rates using AI padding optimization.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-body antialiased selection:bg-primary/20",
        inter.variable,
        mono.variable
      )}>
        {children}
      </body>
    </html>
  );
}
