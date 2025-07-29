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
                src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARAAAAEACAYAAABccqhmAAAgAElEQVR4nOy9eZxc13Xvf+e8V+9902l6p9Pp9Gk6nU4n00lMpGkkkUBCgnIQoigUKbIoA/IAY5gPAw/DMw/7eM/DPsAD3sPe4gEvIgeGvEACKEEIJKQkkgQSCUkn0/emS3fmvfc+9/y/s6urqquqV+9I0pP0eW/v0q1btWvXfvda9a57rWv9WfQ+f1Tj8A9x+Ie4r/w3/v3P8v4/9R+x/p/2L8D/pD/2vwv+Tf89/I/4S/5L/l34S/51/g/wL/h3wN/j38N/p3/Ofyn/M/wH/Cfwn/Mv+F/F/+B/7P8z/Af8p/C/8p/C/81/w78p/zL8D/yX8L/yX8J/yH/Gvwn/LfwP/Mfw3/G/wj/Of/5/Cf8z/D/8R/Df8b/D/4T/jP8B/wH/Af8B/yH/Ef8h/yH/CfyH/Gf+X+H/6/8H/6/8//3/4//v/w//f/+/+P/7/8P/3/+f/Gf8n+Jf8n+Bf8n+Ff8n+Ff+n+Bf+n+Ff+X+Ff+X+Ff+X+Bf+X+Bf+n+Ff+n+Bf+n+Ff+3+Ff+3+Ff+X+Ff+f+Ff+f+Bf+f+Bf+v+Ff+v+Bf+v+Bf+v+Bf+f+Ff+f+Bf+n+Bf+X+Ff+f+Bf+X+Ff+X+Bf+n+Bf+n+Ff+v+Ff+X+Bf+n+Ff+X+Bf+X+Bf+f+Bf+n+Ff+X+Bf+X+Bf+f+Bf+n+Bf+X+Ff+f+Bf+X+Bf+n+Bf+v+Ff+X+Bf+X+Bf+f+Ff+f+Bf+v+Ff+n+Bf+f+Bf+f+Bf+v+Ff+f+Bf+X+Bf+n+Bf+n+Bf+n+Ff+X+Bf+v+Ff+v+Ff+X+Bf+v+Ff+v+Bf+v+Bf+X+Bf+v+Ff+v+Ff+v+Bf+v+Ff+v+Ff+v+Bf+v+Ff+n+Bf+f+Bf+n+Ff+v+Ff+f+Ff+f+Bf+v+Bf+v+Ff+f+Bf+v+Ff+v+Bf+v+Ff+n+Bf+n+Ff+v+Bf+n+Bf+n+Bf+n+Ff+f+Bf+f+Ff+X+Bf+n+Ff+v+Ff+v+Bf+X+Bf+v+Ff+X+Bf+f+Bf+f+Bf+n+Bf+n+Bf+v+Ff+f+Bf+v+Ff+f+Bf+f+Ff+n+Bf+v+Bf+v+Bf+n+Ff+v+Bf+X+Ff+v+Bf+X+Bf+v+Ff+f+Ff+f+Bf+v+Ff+f+Bf+v+Ff+v+Ff+f+Ff+v+Ff+v+Ff+f+Ff+f+Bf+v+Ff+v+Bf+v+Ff+v+Bf+v+Ff+v+Ff+v+Ff+v+Bf+n+Bf+f+Ff+v+Bf+f+Bf+f+Bf+v+Ff+v+Bf+n+Ff+f+Ff+f+Ff+f+Ff+f+Ff+f+Bf+n+Ff+n+Ff+v+Ff+f+Bf+f+Ff+f+Bf+f+Bf+n+Ff+n+Ff+f+Ff+f+Ff+f+Bf+n+Ff+f+Ff+n+Ff+v+Ff+f+Ff+f+Ff+f+Bf+n+Ff+f+Ff+n+Bf+f+Bf+n+Ff+n+Ff+f+Ff+n+Bf+n+Ff+n+Bf+f+Bf+f+Bf+n+Bf+n+Bf+v+Bf+f+Bf+n+Bf+n+Bf+v+Bf+v+Bf+v+Ff+f+Ff+v+Bf+v+Ff+f+Bf+v+Bf+v+Ff+v+Ff+v+Bf+v+Bf+v+Ff+v+Ff+n+Ff+f+Bf+f+Ff+f+Ff+f+Bf+v+Ff+f+Ff+v+Ff+f+Ff+f+Ff+f+Bf+v+Ff+f+Ff+v+Ff+v+Ff+f+Ff+f+Bf+f+Ff+f+Ff+f+Bf+f+Ff+f+Bf+v+Ff+f+Ff+f+Ff+f+Ff+f+Bf+f+Ff+f+Ff+f+Bf+f+Ff+v+Ff+v+Ff+f+Ff+v+Ff+f+Ff+v+Ff+f+Bf+v+Ff+v+Ff+v+Ff+v+Ff+v+Ff+f+Ff+v+Ff+v+Ff+f+Ff+v+Ff+v+Ff+f+Ff+v+Ff+f+Ff+f+Ff+v+Ff+v+Ff+f+Ff+v+Ff+v+Ff+f+Ff+f+Ff+f+Ff+v+Ff+f+Ff+f+Ff+f+Ff+f+Bf+f+Ff+f+Ff+f+Ff+v+Ff+f+Ff+v+Ff+f+Ff+f+Bf+f+Ff+v+Ff+v+Ff+f+Ff+f+Ff+f+Ff+v+Ff+f+Ff+f+Ff+f+Bf+v+Ff+v+Ff+f+Ff+v+Ff+f+Bf+v+Ff+v+Ff+f+Ff+v+Ff+f+Bf+f+Ff+f+Bf+f+Bf+f+Ff+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Ff+f+Ff+f+Bf+f+Bf+f+Ff+f+Bf+v+Ff+v+Ff+f+Bf+f+Ff+v+Ff+f+Ff+v+Ff+v+Ff+f+Ff+f+Ff+v+Ff+f+Ff+f+Bf+v+Ff+f+Bf+f+Ff+f+Ff+f+Ff+f+Ff+v+Ff+f+Ff+f+Ff+v+Ff+f+Bf+v+Ff+f+Bf+v+Ff+v+Bf+v+Ff+f+Ff+f+Ff+v+Bf+f+Ff+f+Ff+f+Bf+v+Bf+f+Ff+f+Bf+f+Bf+f+Ff+f+Bf+v+Ff+f+Bf+f+Ff+f+Bf+f+Ff+f+Bf+f+Ff+f+Bf+v+Ff+v+Bf+v+Bf+v+Ff+v+Bf+f+Ff+f+Bf+f+Ff+v+Bf+f+Bf+f+Ff+f+Bf+v+Ff+f+Bf+f+Bf+f+Ff+v+Ff+f+Bf+v+Ff+f+Bf+f+Bf+f+Ff+v+Bf+f+Ff+f+Bf+f+Bf+f+Ff+f+Ff+v+Bf+f+Bf+f+Ff+f+Bf+f+Ff+f+Bf+f+Bf+f+Bf+f+Ff+v+Bf+f+Bf+f+Bf+f+Ff+f+Ff+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Ff+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Ff+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+v+Bf+f+Bf+f+Bf+f+Bf+f+Bf+f+Bf+v+Bf+f+Bf+v+Bf+v+Bf+f+Bf+f+Bf+f+Bf+v+Bf+f+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+v+Bf+-Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+B-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+B-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+Bf-v+B.png"
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
