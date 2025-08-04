"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import Sidebar from "./sidebar";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild className="md:hidden">
        <Button variant="ghost" size="icon">
          <Menu />
          <span className="sr-only">Abrir Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64 flex flex-col">
        <VisuallyHidden asChild>
          <SheetTitle>Menu Principal</SheetTitle>
        </VisuallyHidden>
         <VisuallyHidden asChild>
          <SheetDescription>Navegue pelas seções do aplicativo</SheetDescription>
        </VisuallyHidden>
        {/* The Sidebar component is now rendered here, making the menu content appear */}
        <Sidebar className="flex" onLinkClick={() => setIsOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
