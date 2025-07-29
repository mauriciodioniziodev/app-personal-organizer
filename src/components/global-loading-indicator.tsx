
"use client";

import { LoaderCircle } from "lucide-react";

export function GlobalLoadingIndicator({ isNavigating }: { isNavigating: boolean }) {
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
