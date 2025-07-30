
"use client";

import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { LoaderCircle, DatabaseZap } from "lucide-react";


function SyncButton() {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSync = () => {
        setLoading(true);
        setTimeout(() => {
            toast({ title: "Sincronização Concluída", description: "Os dados foram sincronizados com o banco de dados." });
            setLoading(false);
        }, 1500);
    }

    return (
        <Button onClick={handleSync} disabled={loading} variant="outline">
            {loading ? (
                <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Sincronizando...
                </>
            ) : (
                <>
                    <DatabaseZap className="mr-2 h-4 w-4" />
                    Sincronizar com Banco de Dados
                </>
            )}
        </Button>
    )
}


export default function AdminPage() {
    return (
        <div className="flex flex-col gap-8">
            <PageHeader title="Administração" />
            
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <DatabaseZap className="w-6 h-6" />
                        Sincronização de Dados
                    </CardTitle>
                    <CardDescription>Sincronize os dados da aplicação com a sua fonte de dados principal. Esta é uma função de exemplo e pode ser expandida no futuro.</CardDescription>
                </CardHeader>
                <CardContent>
                    <SyncButton />
                </CardContent>
            </Card>

        </div>
    );
}
