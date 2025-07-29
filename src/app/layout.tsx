
"use client";

import type { Metadata } from "next";
import { Alegreya, Belleza } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Sidebar from "@/components/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { GlobalLoadingIndicator } from "@/components/global-loading-indicator";
import { Suspense, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const belleza = Belleza({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-belleza",
});

const alegreya = Alegreya({
  subsets: ["latin"],
  variable: "--font-alegreya",
});

const metadata: Metadata = {
  title: "Amanda Martins",
  description: "Organização personalizada",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // This is a simplified approach to show a loading indicator on route change.
    // It triggers on any pathname change.
    setIsNavigating(true);
    const timer = setTimeout(() => setIsNavigating(false), 1); // A tiny delay to allow the state to update and render
    return () => clearTimeout(timer);
  }, [pathname]);


  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&family=Belleza&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-body antialiased",
          belleza.variable,
          alegreya.variable
        )}
      >
        <Suspense>
           <GlobalLoadingIndicator isNavigating={isNavigating} />
        </Suspense>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="w-full flex-1 flex-col p-4 sm:p-6 md:p-8">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
