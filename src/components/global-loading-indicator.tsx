
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";

export function GlobalLoadingIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Quando a rota muda, consideramos que a navegação começou.
    // O indicador será desativado pelo useEffect de limpeza quando o componente desmontar
    // na conclusão da navegação.
    setIsNavigating(true);
    
    // A função de limpeza do useEffect será chamada quando a navegação
    // para a próxima página for concluída e este componente for desmontado.
    return () => {
      setIsNavigating(false);
    };
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
