
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

const belleza = Belleza({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-belleza",
});

const alegreya = Alegreya({
  subsets: ["latin"],
  variable: "--font-alegreya",
});

async function checkAuthorization(user: User | null, router: ReturnType<typeof useRouter>) {
    if (!user) return true; // Let the regular logic handle unauthenticated users

    const { data: profile, error: profileError } = await supabase!
      .from('profiles')
      .select('status, company_id, organizations ( is_active )')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile for auth check:", profileError);
      await supabase!.auth.signOut();
      router.push(`/login?error=${encodeURIComponent("Erro ao verificar suas permissões. Tente novamente.")}`);
      return false;
    }
    
    const company = Array.isArray(profile.organizations) ? profile.organizations[0] : profile.organizations;

    if (!company?.is_active) {
       await supabase!.auth.signOut();
       router.push(`/login?error=${encodeURIComponent("O acesso da sua empresa ao sistema foi suspenso.")}`);
       return false;
    }

    if (profile.status === 'revoked') {
       await supabase!.auth.signOut();
       router.push(`/login?error=${encodeURIComponent("Seu acesso foi revogado pelo administrador.")}`);
       return false;
    }

     if (profile.status === 'pending') {
       await supabase!.auth.signOut();
       router.push(`/login?error=${encodeURIComponent("Sua conta aguarda aprovação do administrador.")}`);
       return false;
    }
    
    return true; // Authorized
}


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
    if (!supabase) {
        setLoading(false);
        return;
    }
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setLoading(true);
        if (session?.user) {
            const isAuthorized = await checkAuthorization(session.user, router);
            if (isAuthorized) {
                setSession(session);
            } else {
                setSession(null);
            }
        } else {
            setSession(null);
        }
        setLoading(false);
      }
    );

    // Also check session on initial load
     const checkInitialSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const isAuthorized = await checkAuthorization(session.user, router);
             if (isAuthorized) {
                setSession(session);
            } else {
                setSession(null);
            }
        } else {
            setSession(null);
        }
        setLoading(false);
     }
     checkInitialSession();


    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (loading) return;

    const publicAuthPages = ['/login', '/signup', '/forgot-password', '/reset-password'];
    const isAuthPage = publicAuthPages.includes(pathname);


    if (!session && !isAuthPage) {
      router.push('/login');
    } else if (session && isAuthPage) {
      router.push('/');
    }
  }, [session, pathname, loading, router]);


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

  if (!session && !isAuthPage) {
      // Show loading or a blank page while redirecting
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
  
  if (!session && isAuthPage) {
    return (
        <html lang="en" suppressHydrationWarning>
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

  // This handles the case where the user is logged in, but their access might have been revoked.
  // The session check above handles redirecting them away, so we can just show a loader here.
  if (!session) {
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


  return (
    <html lang="en" suppressHydrationWarning>
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
                <Sidebar className="hidden md:flex" />
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
