
"use client";

import { UserNav } from './user-nav';
import { MobileSidebar } from './mobile-sidebar';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="flex h-16 items-center px-4 sm:px-6 md:px-8">
        <MobileSidebar />
        <div className="ml-auto flex items-center space-x-4">
          <UserNav />
        </div>
      </div>
    </header>
  );
}
