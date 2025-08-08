
"use client";

import { UserNav } from './user-nav';
import { MobileSidebar } from './mobile-sidebar';
import type { UserProfile, CompanySettings } from '@/lib/definitions';

type HeaderProps = {
  profile: UserProfile | null;
  settings: CompanySettings | null;
}

export default function Header({ profile, settings }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="flex h-16 items-center px-4 sm:px-6 md:px-8">
        <MobileSidebar profile={profile} settings={settings}/>
        <div className="ml-auto flex items-center space-x-4">
          <UserNav />
        </div>
      </div>
    </header>
  );
}
