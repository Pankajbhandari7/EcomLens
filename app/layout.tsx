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

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "PackOptima - Meesho Product Image Editor & E-Commerce Background Remover",
  description:
    "Optimize your product images for Meesho & Flipkart. Reduce Meesho shipping charges with our volumetric weight & dimension optimization tool. Free 1080x1080 product image resizer, white background generator, and catalog QC pass image maker.",
  keywords: [
    "Meesho Product Image Editor",
    "E-commerce Background Remover",
    "Flipkart Catalog Image Generator",
    "Meesho low shipping image generator",
    "How to reduce Meesho shipping charges",
    "Meesho shipping weight slab optimizer",
    "Meesho smart shipping image tool",
    "Meesho me shipping charge kaise kam kare",
    "Meesho low shipping price image hack",
    "Product photo ka background white kaise kare",
    "Meesho catalog QC pass image size",
    "Meesho product listing image tool",
    "Meesho volumetric weight reduction tool",
    "Meesho dimension optimization for low shipping",
    "Meesho product image resizer 1080x1080",
    "E-commerce background remover online",
    "Product image 1:1 aspect ratio converter",
    "Meesho white background product generator",
    "E-commerce image compression without losing quality",
    "Product photography aspect ratio tool"
  ],
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
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
