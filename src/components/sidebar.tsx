
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { FolderKanban, LayoutDashboard, LucideIcon, Users, Settings, CalendarClock, Wallet, FilePieChart, LogOut, Shirt } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "./ui/button";
import type { UserProfile } from "@/lib/definitions";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, role: ['administrador', 'usuario'] },
  { href: "/clients", label: "Clientes", icon: Users, role: ['administrador', 'usuario'] },
  { href: "/visits", label: "Visitas", icon: CalendarClock, role: ['administrador', 'usuario'] },
  { href: "/projects", label: "Projetos", icon: FolderKanban, role: ['administrador', 'usuario'] },
  { href: "/financeiro", label: "Financeiro", icon: Wallet, role: ['administrador', 'usuario'] },
  { href: "/reports", label: "Relatórios", icon: FilePieChart, role: ['administrador', 'usuario'] },
  { href: "/admin", label: "Administração", icon: Settings, role: ['administrador'] },
];

export default function Sidebar({ className, onLinkClick }: { className?: string, onLinkClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
     const fetchProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data: userProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            setProfile(toCamelCase(userProfile));
        }
     }
     fetchProfile();
     
     const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if(session) {
            fetchProfile();
        } else {
            setProfile(null);
            router.push('/login');
        }
     });

     return () => {
       authListener?.subscription.unsubscribe();
     };
  }, [router]);
  
  const toCamelCase = (obj: any): any => {
    if (!obj) return null;
    return Object.keys(obj).reduce(
        (result, key) => {
            const camelKey = key.replace(/([-_][a-z])/g, g => g.toUpperCase().replace(/[-_]/, ''));
            result[camelKey] = obj[key];
            return result;
        },
        {} as any
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  }


  return (
    <aside className={cn("flex flex-col w-64 h-full bg-card border-r", className)}>
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3">
          <Shirt className="w-10 h-10 rounded-lg" />

          <div>
            <h1 className="text-xl font-headline text-foreground leading-none">Amanda Martins</h1>
            <p className="text-xs text-muted-foreground">Organização personalizada</p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 px-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            (profile && item.role.includes(profile.role)) && (
               <NavItem key={item.href} item={item} isActive={pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/')} onLinkClick={onLinkClick} />
            )
          ))}
        </ul>
      </nav>
        <div className="p-4 mt-auto">
            <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4"/>
                Sair
            </Button>
        </div>
    </aside>
  );
}

type NavItemProps = {
  item: {
    href: string;
    label: string;
    icon: LucideIcon;
  };
  isActive: boolean;
  onLinkClick?: () => void
};

function NavItem({ item, isActive, onLinkClick }: NavItemProps) {
  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-4 py-2 rounded-lg text-foreground/70 transition-colors duration-200 ease-in-out",
          "hover:bg-primary/20 hover:text-foreground",
          isActive && "bg-primary/80 text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
        )}
        onClick={onLinkClick}
      >
        <item.icon className="w-5 h-5" />
        <span className="font-medium">{item.label}</span>
      </Link>
    </li>
  );
}
