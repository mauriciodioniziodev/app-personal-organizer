"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";

export function GlobalLoadingIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // This is a bit of a trick to detect navigation start.
    // It assumes that the path or search params will change on navigation.
    // We set navigating to true and a timeout to set it to false if the effect below doesn't run.
    const timer = setTimeout(() => setIsNavigating(false), 500); // Failsafe
    setIsNavigating(true);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  useEffect(() => {
    // When the component re-mounts or the dependencies change after a navigation,
    // this effect will run and set navigating to false.
    setIsNavigating(false);
  }, [pathname, searchParams]);

  if (!isNavigating) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-3 text-foreground">
        <LoaderCircle className="h-8 w-8 animate-spin" />
        <span className="text-lg font-medium">Carregando...</span>
      </div>
    </div>
  );
}
