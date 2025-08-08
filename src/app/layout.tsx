

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
import Header from "@/components/header";
import type { Session, User } from "@supabase/supabase-js";
import { getSettings, getCurrentProfile } from "@/lib/data";
import type { CompanySettings, UserProfile } from "@/lib/definitions";

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const publicAuthPages = ['/login', '/signup', '/forgot-password', '/reset-password'];
    const isAuthPage = publicAuthPages.some(page => pathname.startsWith(page));

    async function checkAuth() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      setSession(currentSession);

      if (sessionError) {
        console.error("Session error:", sessionError);
        setLoading(false);
        return;
      }

      if (currentSession) {
        const userProfile = await getCurrentProfile();
        setProfile(userProfile);

        if (userProfile?.companyId) {
            const companySettings = await getSettings(userProfile.companyId);
            setSettings(companySettings);
        } else {
            setSettings(null);
        }

        if (isAuthPage) {
            router.push('/');
        }
      } else {
        setProfile(null);
        setSettings(null);
        if (!isAuthPage) {
            router.push('/login');
        }
      }

      setLoading(false);
    }
    
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
          // This listener handles real-time changes (login/logout)
          // without being the primary source of truth on initial load.
          if (session?.access_token !== getSession()?.access_token) {
              checkAuth();
          }
      }
    );
     
    return () => {
        authListener?.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); // Rerun when path changes to handle navigation between public/private routes


  if (loading) {
     return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <title>OrganizerFlow</title>
                <meta name="description" content="Sistema de gerenciamento para Personal Organizer." />
            </head>
            <body className="flex items-center justify-center h-screen bg-background">
                <LoaderCircle className="w-8 h-8 animate-spin" />
            </body>
        </html>
    );
  }
  
  const publicAuthPages = ['/login', '/signup', '/forgot-password', '/reset-password'];
  const isAuthPage = publicAuthPages.some(page => pathname.startsWith(page));
  
  const theme = settings?.theme || 'default';

  if (!session && isAuthPage) {
    return (
        <html lang="en" suppressHydrationWarning className={theme === 'default' ? '' : theme}>
            <head>
                <title>OrganizerFlow</title>
                <meta name="description" content="Sistema de gerenciamento para Personal Organizer." />
            </head>
            <body className={cn(
              "bg-background font-body antialiased",
              belleza.variable,
              alegreya.variable
            )}>
                {children}
                <Toaster />
            </body>
        </html>
    )
  }

  if (session && profile && !isAuthPage) {
    return (
      <html lang="en" suppressHydrationWarning className={theme}>
        <head>
          <title>OrganizerFlow</title>
          <meta name="description" content="Sistema de gerenciamento para Personal Organizer." />
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
                  <Sidebar className="hidden md:flex" profile={profile} settings={settings} />
                  <div className="flex flex-col flex-1">
                    <Header profile={profile} settings={settings} />
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

   return (
      <html lang="en" suppressHydrationWarning>
          <head>
              <title>OrganizerFlow</title>
              <meta name="description" content="Sistema de gerenciamento para Personal Organizer." />
          </head>
          <body className="flex items-center justify-center h-screen bg-background">
               <LoaderCircle className="w-8 h-8 animate-spin" />
          </body>
      </html>
    )
}
