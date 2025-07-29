"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FolderKanban, LayoutDashboard, LucideIcon, Users, Settings, CalendarClock, Wallet } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/visits", label: "Visitas", icon: CalendarClock },
  { href: "/projects", label: "Projetos", icon: FolderKanban },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/admin", label: "Administração", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-card border-r">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3">
            <Image 
                data-ai-hint="logo"
                src="/logo.png"
                width={40}
                height={40}
                alt="Logo Amanda Martins"
                className="rounded-lg"
            />
          <div>
            <h1 className="text-xl font-headline text-foreground leading-none">Amanda Martins</h1>
            <p className="text-xs text-muted-foreground">Organização personalizada</p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 px-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <NavItem key={item.href} item={item} isActive={pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/')} />
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
