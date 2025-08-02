"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { FolderKanban, LayoutDashboard, LucideIcon, Users, Settings, CalendarClock, Wallet, FilePieChart, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "./ui/button";
import type { UserProfile } from "@/lib/definitions";
import { useEffect, useState } from "react";
import { Separator } from "./ui/separator";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, role: ['administrador', 'usuario'] },
  { href: "/clients", label: "Clientes", icon: Users, role: ['administrador', 'usuario'] },
  { href: "/visits", label: "Visitas", icon: CalendarClock, role: ['administrador', 'usuario'] },
  { href: "/projects", label: "Projetos", icon: FolderKanban, role: ['administrador', 'usuario'] },
  { href: "/financeiro", label: "Financeiro", icon: Wallet, role: ['administrador', 'usuario'] },
  { href: "/reports", label: "Relatórios", icon: FilePieChart, role: ['administrador', 'usuario'] },
  { href: "/admin", label: "Administração", icon: Settings, role: ['administrador'] },
];

export default function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
     const fetchProfile = async () => {
        if (!supabase) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data: userProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            setProfile(toCamelCase(userProfile));
        }
     };
     fetchProfile();
     
     if(supabase) {
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if(session) {
                fetchProfile();
            } else {
                setProfile(null);
            }
        });

        return () => {
            authListener?.subscription.unsubscribe();
        };
     }
  }, []);
  
  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/login');
  };

  const toCamelCase = (obj: any): any => {
    if (!obj) return null;
    if (Array.isArray(obj)) {
        return obj.map(v => toCamelCase(v));
    }
    if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce(
            (result, key) => {
                const camelKey = key.replace(/([-_][a-z])/g, g => g.toUpperCase().replace(/[-_]/, ''));
                result[camelKey] = toCamelCase(obj[key]);
                return result;
            },
            {} as any
        );
    }
    return obj;
  };


  return (
    <aside className={cn("hidden md:flex flex-col w-64 bg-card border-r", className)}>
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-headline text-foreground leading-none">Amanda Martins</h1>
            <p className="text-xs text-muted-foreground">Organização personalizada</p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 px-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const userRole = profile?.role ?? 'usuario';
            if (!item.role.includes(userRole)) {
                return null;
            }
            return <NavItem key={item.href} item={item} isActive={pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/')} />
          })}
        </ul>
      </nav>
      <div className="mt-auto flex flex-col gap-2 p-4">
          <Separator/>
          <Button variant="ghost" className="w-full justify-start text-foreground/70 hover:text-foreground hover:bg-primary/20" onClick={handleLogout}>
              <LogOut className="mr-3 w-5 h-5"/>
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
    role: string[];
  };
  isActive: boolean;
};

function NavItem({ item, isActive }: NavItemProps) {
  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-4 py-2 rounded-lg text-foreground/70 transition-colors duration-200 ease-in-out",
          "hover:bg-primary/20 hover:text-foreground",
          isActive && "bg-primary/80 text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
        )}
      >
        <item.icon className="w-5 h-5" />
        <span className="font-medium">{item.label}</span>
      </Link>
    </li>
  );
}
