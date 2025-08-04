

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { FolderKanban, LayoutDashboard, LucideIcon, Users, Settings, CalendarClock, Wallet, FilePieChart, Shirt } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { UserProfile, CompanySettings } from "@/lib/definitions";
import { useEffect, useState } from "react";
import Image from "next/image";
import { getSettings } from "@/lib/data";


const mainNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, role: ['administrador', 'usuario'] },
  { href: "/clients", label: "Clientes", icon: Users, role: ['administrador', 'usuario'] },
  { href: "/visits", label: "Visitas", icon: CalendarClock, role: ['administrador', 'usuario'] },
  { href: "/projects", label: "Projetos", icon: FolderKanban, role: ['administrador', 'usuario'] },
  { href: "/financeiro", label: "Financeiro", icon: Wallet, role: ['administrador', 'usuario'] },
  { href: "/reports", label: "Relatórios", icon: FilePieChart, role: ['administrador', 'usuario'] },
];

const adminNavItems = [
  { href: "/settings", label: "Configurações", icon: Settings, role: ['administrador'] },
  { href: "/admin", label: "Administração", icon: Settings, role: ['administrador'] },
];


export default function Sidebar({ className, onLinkClick }: { className?: string, onLinkClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);

  useEffect(() => {
     const fetchProfileAndSettings = async () => {
        if(!supabase) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const [userProfile, companySettings] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', session.user.id).single(),
                getSettings()
            ]);

            setProfile(toCamelCase(userProfile.data));
            setSettings(companySettings);
        }
     }
     fetchProfileAndSettings();
     
     const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if(session) {
            fetchProfileAndSettings();
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
  
  const companyName = settings?.companyName || 'Amanda Martins';
  const logoUrl = settings?.logoUrl;

  return (
    <aside className={cn("hidden md:flex flex-col w-64 h-full bg-card border-r", className)}>
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3">
          {logoUrl ? (
            <Image src={logoUrl} alt={`Logo de ${companyName}`} width={40} height={40} className="rounded-lg object-contain"/>
          ) : (
             <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted">
                <Shirt className="w-6 h-6 text-muted-foreground" />
             </div>
          )}

          <div>
            <h1 className="text-xl font-headline text-foreground leading-none">{companyName}</h1>
            <p className="text-xs text-muted-foreground">Organização personalizada</p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 px-4 flex flex-col justify-between">
          <ul className="space-y-2">
            {mainNavItems.map((item) => (
              (profile && item.role.includes(profile.role)) && (
                 <NavItem key={item.href} item={item} isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))} onLinkClick={onLinkClick} />
              )
            ))}
          </ul>
          <ul className="space-y-2 pb-4">
             {adminNavItems.map((item) => (
              (profile && item.role.includes(profile.role)) && (
                 <NavItem key={item.href} item={item} isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))} onLinkClick={onLinkClick} />
              )
            ))}
          </ul>
      </nav>
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
