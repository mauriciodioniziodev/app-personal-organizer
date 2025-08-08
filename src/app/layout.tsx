

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
import { getSettings } from "@/lib/data";
import type { CompanySettings } from "@/lib/definitions";

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
      .select('status, organizations ( is_active )')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error("Error fetching profile for auth check:", profileError);
       await supabase!.auth.signOut();
       router.push(`/login?error=${encodeURIComponent("Seu perfil não foi encontrado. Se você acabou de se cadastrar, aguarde a aprovação do administrador.")}`);
      return false;
    }
    
    // Supabase returns an array if the relationship is one-to-many, or an object if one-to-one.
    // This handles both cases to be safe.
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
  const [theme, setTheme] = useState<CompanySettings['theme']>('default');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!supabase) {
        setLoading(false);
        return;
    }
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setLoading(true); // Start loading on any auth change
        if (session?.user) {
            const isAuthorized = await checkAuthorization(session.user, router);
            if (isAuthorized) {
                setSession(session);
                // Fetch company theme settings after confirming authorization
                const { data: profileData } = await supabase.from('profiles').select('company_id').eq('id', session.user.id).single();
                if(profileData?.company_id) {
                    const settings = await getSettings(profileData.company_id);
                    setTheme(settings?.theme || 'default');
                }
            } else {
                setSession(null); // Ensure session is cleared if auth fails
            }
        } else {
            setSession(null);
        }
        setLoading(false); // Stop loading after checks are complete
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (loading) return;

    const publicAuthPages = ['/login', '/signup', '/forgot-password', '/reset-password'];
    const isAuthPage = publicAuthPages.some(page => pathname.startsWith(page));

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

  // If there's no session and the current page is not a public auth page, show a loader while redirecting.
  // This prevents a brief flash of content before the redirect logic in useEffect kicks in.
  if (!session && !isAuthPage) {
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
  
  // If there's no session and we're on an auth page, render the auth page.
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

  // If there is a session, render the full app layout.
  // The checkAuthorization handles kicking out users whose access has been revoked mid-session.
  if (session) {
    return (
      <html lang="en" suppressHydrationWarning className={theme === 'default' ? '' : theme}>
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

  // Fallback case, typically shown briefly during redirects.
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

    