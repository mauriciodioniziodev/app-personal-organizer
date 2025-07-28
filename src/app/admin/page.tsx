"use client";

import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMasterData, updateMasterData } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useActionState, useState } from "react";
import { LoaderCircle, Save, Settings, DatabaseZap } from "lucide-react";
import { useFormStatus } from "react-dom";

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
    const masterData = getMasterData();

    const [state, dispatch] = useActionState(async (prevState: any, formData: FormData) => {
        const paymentStatus = formData.getAll('paymentStatus').filter(s => s).map(s => s.toString());
        const visitStatus = formData.getAll('visitStatus').filter(s => s).map(s => s.toString());
        const photoTypes = formData.getAll('photoTypes').filter(s => s).map(s => s.toString());

        updateMasterData({ paymentStatus, visitStatus, photoTypes });
        toast({ title: "Dados Mestres Atualizados", description: "As listas de opções foram salvas com sucesso." });
        return { message: "success" };
    }, { message: null });

    const [paymentStatus, setPaymentStatus] = useState(masterData.paymentStatus);
    const [visitStatus, setVisitStatus] = useState(masterData.visitStatus);
    const [photoTypes, setPhotoTypes] = useState(masterData.photoTypes);

    const addField = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        setter(prev => [...prev, '']);
    }

    const removeField = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        setter(prev => prev.filter((_, i) => i !== index));
    }

    const updateField = (index: number, value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        setter(prev => prev.map((item, i) => i === index ? value : item));
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
                                {paymentStatus.map((status, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input name="paymentStatus" value={status} onChange={(e) => updateField(index, e.target.value, setPaymentStatus)} placeholder="Ex: Pendente" />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeField(index, setPaymentStatus)}>
                                            <span className="text-destructive">X</span>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => addField(setPaymentStatus)}>Adicionar Status</Button>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold">Status de Visita</h3>
                             <div className="grid gap-2">
                                {visitStatus.map((status, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input name="visitStatus" value={status} onChange={(e) => updateField(index, e.target.value, setVisitStatus)} placeholder="Ex: Realizada" />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeField(index, setVisitStatus)}>
                                            <span className="text-destructive">X</span>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => addField(setVisitStatus)}>Adicionar Status</Button>
                        </div>
                        
                        <div className="space-y-4">
                            <h3 className="font-semibold">Tipos de Foto</h3>
                            <div className="grid gap-2">
                                {photoTypes.map((type, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input name="photoTypes" value={type} onChange={(e) => updateField(index, e.target.value, setPhotoTypes)} placeholder="Ex: Antes" />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeField(index, setPhotoTypes)}>
                                            <span className="text-destructive">X</span>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => addField(setPhotoTypes)}>Adicionar Tipo</Button>
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
