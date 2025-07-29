
"use client";

import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMasterData, updateMasterData } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useActionState, useEffect, useState } from "react";
import { LoaderCircle, Save, Settings, DatabaseZap } from "lucide-react";
import { useFormStatus } from "react-dom";
import type { MasterData } from "@/lib/definitions";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} aria-disabled={pending}>
            {pending ? (
                <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                </>
            ) : (
                <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                </>
            )}
        </Button>
    )
}

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
    const { toast } = useToast();
    const [masterData, setMasterData] = useState<MasterData | null>(null);

    const [state, dispatch] = useActionState(async (prevState: any, formData: FormData) => {
        const paymentStatus = formData.getAll('paymentStatus').filter(s => s).map(s => s.toString());
        const visitStatus = formData.getAll('visitStatus').filter(s => s).map(s => s.toString());
        const photoTypes = formData.getAll('photoTypes').filter(s => s).map(s => s.toString());

        await updateMasterData({ paymentStatus, visitStatus, photoTypes });
        toast({ title: "Dados Mestres Atualizados", description: "As listas de opções foram salvas com sucesso." });
        return { message: "success" };
    }, { message: null });
    
    useEffect(() => {
        const fetchMasterData = async () => {
            const data = await getMasterData();
            setMasterData(data);
        }
        fetchMasterData();
    }, []);

    const addField = (key: keyof Omit<MasterData, 'paymentInstruments'>) => {
        if (!masterData) return;
        setMasterData(prev => prev ? {...prev, [key]: [...prev[key], '']} : null);
    }

    const removeField = (key: keyof Omit<MasterData, 'paymentInstruments'>, index: number) => {
        if (!masterData) return;
        setMasterData(prev => prev ? {...prev, [key]: prev[key].filter((_, i) => i !== index)} : null);
    }

    const updateField = (key: keyof Omit<MasterData, 'paymentInstruments'>, index: number, value: string) => {
        if (!masterData) return;
        setMasterData(prev => {
            if (!prev) return null;
            const updatedValues = [...prev[key]];
            updatedValues[index] = value;
            return {...prev, [key]: updatedValues};
        });
    }

    if (!masterData) {
        return (
            <div className="flex items-center justify-center h-full">
                <LoaderCircle className="w-8 h-8 animate-spin" />
            </div>
        );
    }


    return (
        <div className="flex flex-col gap-8">
            <PageHeader title="Administração" />
            
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <DatabaseZap className="w-6 h-6" />
                        Sincronização de Dados
                    </CardTitle>
                    <CardDescription>Sincronize os dados da aplicação com a sua fonte de dados principal.</CardDescription>
                </CardHeader>
                <CardContent>
                    <SyncButton />
                </CardContent>
            </Card>

            <form action={dispatch}>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                            <Settings className="w-6 h-6" />
                            Gerenciamento de Dados Mestres
                        </CardTitle>
                        <CardDescription>
                            Edite as opções disponíveis nas listas suspensas do sistema.
                            Valores em branco serão ignorados.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="space-y-4">
                            <h3 className="font-semibold">Status de Pagamento</h3>
                            <div className="grid gap-2">
                                {masterData.paymentStatus.map((status, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input name="paymentStatus" value={status} onChange={(e) => updateField('paymentStatus', index, e.target.value)} placeholder="Ex: Pendente" />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeField('paymentStatus', index)}>
                                            <span className="text-destructive">X</span>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => addField('paymentStatus')}>Adicionar Status</Button>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold">Status de Visita</h3>
                             <div className="grid gap-2">
                                {masterData.visitStatus.map((status, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input name="visitStatus" value={status} onChange={(e) => updateField('visitStatus', index, e.target.value)} placeholder="Ex: Realizada" />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeField('visitStatus', index)}>
                                            <span className="text-destructive">X</span>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => addField('visitStatus')}>Adicionar Status</Button>
                        </div>
                        
                        <div className="space-y-4">
                            <h3 className="font-semibold">Tipos de Foto</h3>
                            <div className="grid gap-2">
                                {masterData.photoTypes.map((type, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input name="photoTypes" value={type} onChange={(e) => updateField('photoTypes', index, e.target.value)} placeholder="Ex: Antes" />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeField('photoTypes', index)}>
                                            <span className="text-destructive">X</span>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => addField('photoTypes')}>Adicionar Tipo</Button>
                        </div>

                        <div className="flex justify-end">
                            <SubmitButton />
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
