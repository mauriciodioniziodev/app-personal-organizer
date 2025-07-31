
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
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
         setLoading(false);
         if (pathname !== '/signup') {
            router.push('/login');
         }
         return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', session.user.id)
        .single();
      
      if (profile?.status === 'authorized') {
        setSession(session);
      } else {
         await supabase.auth.signOut();
         if (pathname !== '/signup') {
            router.push('/login');
         }
      }
      setLoading(false);
    }
    
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
            getSession();
        } else {
          setSession(null);
          if (pathname !== '/login' && pathname !== '/signup') {
            router.push('/login');
          }
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [pathname, router]);

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
     // This case should be handled by the useEffect redirect, but as a fallback
     return (
        <html lang="en" suppressHydrationWarning>
            <body className="bg-background">
                <LoginPage />
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
        <Suspense fallback={<div>Loading...</div>}>
            <div className="flex min-h-screen">
                {!isAuthPage && <Sidebar />}
                <div className="flex flex-col flex-1">
                  {!isAuthPage && <Header />}
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
