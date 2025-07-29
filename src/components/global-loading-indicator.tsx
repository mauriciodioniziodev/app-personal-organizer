
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";

export function GlobalLoadingIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  
  useEffect(() => {
    // We store the current path in a variable.
    const currentPath = pathname + searchParams.toString();
    
    // This is a component-level variable to track the path *before* the navigation starts.
    // It's not a state variable because we don't want to re-render when it changes.
    let previousPath = currentPath;

    // When the effect for the new page is mounted, this will be called.
    const handleNavigationComplete = () => {
        setIsNavigating(false);
    }

    // If the path changes, it means a navigation has started.
    if (currentPath !== previousPath) {
        setIsNavigating(true);
    }
    
    // We listen for the component to be unmounted, which happens when navigation is complete.
    return () => {
        handleNavigationComplete();
        previousPath = currentPath;
    };

  }, [pathname, searchParams]);


  // A different effect to detect navigation start, as the above one detects the end.
   useEffect(() => {
    const handleRouteChangeStart = () => setIsNavigating(true);

    // This is a trick to tap into Next.js's navigation events.
    // We are essentially monkey-patching pushState and replaceState to detect when they are called.
    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      handleRouteChangeStart();
      originalPushState.apply(window.history, args);
    };
    
    const originalReplaceState = window.history.replaceState;
    window.history.replaceState = function(...args) {
        handleRouteChangeStart();
        originalReplaceState.apply(window.history, args)
    }

    // Also listen to popstate for browser back/forward buttons
    window.addEventListener('popstate', handleRouteChangeStart);
    
    return () => {
        // Restore original methods on cleanup
        window.history.pushState = originalPushState;
        window.history.replaceState = originalReplaceState;
        window.removeEventListener('popstate', handleRouteChangeStart);
    }

  }, []);


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
