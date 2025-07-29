
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { LoaderCircle } from "lucide-react";

export function GlobalLoadingIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const previousPath = useRef(pathname + searchParams.toString());

  useEffect(() => {
    const currentPath = pathname + searchParams.toString();
    if (currentPath !== previousPath.current) {
      // Path has changed, navigation has started.
      setIsNavigating(true);
      previousPath.current = currentPath;
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    // When isNavigating becomes true, this effect will run.
    // When the new page is rendered and this component re-evaluates,
    // this effect's cleanup or re-run will hide the indicator.
    // This second effect ensures the indicator is hidden after the new page is ready.
    if (isNavigating) {
      setIsNavigating(false);
    }
    // We only want this to run when the path changes and after the above effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
