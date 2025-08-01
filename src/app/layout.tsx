
"use client";

import type { Metadata } from "next";
import { Alegreya, Belleza } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Sidebar from "@/components/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { LoaderCircle } from "lucide-react";
import LoginPage from "./login/page";
import Header from "@/components/header";
import type { Session } from "@supabase/supabase-js";

const belleza = Belleza({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-belleza",
});

const alegreya = Alegreya({
  subsets: ["latin"],
  variable: "--font-alegreya",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    // Also check session on initial load
     const checkInitialSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setLoading(false);
     }
     checkInitialSession();


    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === '/login' || pathname === '/signup';

    if (!session && !isAuthPage) {
      router.push('/login');
    } else if (session && isAuthPage) {
      router.push('/');
    }
  }, [session, pathname, loading, router]);


  if (loading) {
     return (
        <html lang="en" suppressHydrationWarning>
            <body className="flex items-center justify-center h-screen bg-background">
                <LoaderCircle className="w-8 h-8 animate-spin" />
            </body>
        </html>
    );
  }
  
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (!session && !isAuthPage) {
      // Show loading or a blank page while redirecting
      return (
        <html lang="en" suppressHydrationWarning>
            <body className="flex items-center justify-center h-screen bg-background">
                <LoaderCircle className="w-8 h-8 animate-spin" />
            </body>
        </html>
     )
  }
  
  if (!session && isAuthPage) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="bg-background">
                {children}
                <Toaster />
            </body>
        </html>
    )
  }


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
        <Suspense fallback={<div className="flex items-center justify-center h-screen bg-background"><LoaderCircle className="w-8 h-8 animate-spin" /></div>}>
            <div className="flex min-h-screen">
                <Sidebar />
                <div className="flex flex-col flex-1">
                  <Header />
                  <main className="w-full flex-1 flex-col p-4 sm:p-6 md:p-8">
                      {children}
                  </main>
                </div>
            </div>
        </Suspense>
        <Toaster />
      </body>
    </html>
  );
}
