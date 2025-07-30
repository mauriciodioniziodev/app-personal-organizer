

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, FormEvent } from "react";
import { LoaderCircle, DatabaseZap, Trash, Plus } from "lucide-react";
import PageHeader from "@/components/page-header";
import { addPaymentInstrumentOption, addVisitStatusOption, deletePaymentInstrumentOption, deleteVisitStatusOption, getPaymentInstrumentsOptions, getVisitStatusOptions } from "@/lib/data";
import type { MasterDataItem } from "@/lib/definitions";
import { Input } from "@/components/ui/input";

function MasterDataCard<T extends MasterDataItem>({
    title,
    description,
    items,
    onAdd,
    onDelete
}: {
    title: string;
    description: string;
    items: T[];
    onAdd: (name: string) => Promise<any>;
    onDelete: (id: string) => Promise<any>;
}) {
    const { toast } = useToast();
    const [newItemName, setNewItemName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleAdd = async (e: FormEvent) => {
        e.preventDefault();
        if(!newItemName.trim()) return;
        setLoading(true);
        try {
            await onAdd(newItemName);
            setNewItemName("");
            toast({ title: "Sucesso!", description: `"${newItemName}" foi adicionado.`});
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro", description: (error as Error).message });
        } finally {
            setLoading(false);
        }
    }

    const handleDelete = async (item: T) => {
        try {
            await onDelete(item.id);
            toast({ title: "Sucesso!", description: `"${item.name}" foi removido.`});
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro", description: (error as Error).message });
        }
    }


    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2 mb-4">
                    {items.map(item => (
                        <li key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                            <span>{item.name}</span>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item)}>
                                <Trash className="w-4 h-4 text-destructive" />
                            </Button>
                        </li>
                    ))}
                     {items.length === 0 && <p className="text-sm text-muted-foreground text-center">Nenhum item cadastrado.</p>}
                </ul>
                <form onSubmit={handleAdd} className="flex gap-2">
                    <Input 
                        placeholder="Novo item..." 
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                    />
                    <Button type="submit" disabled={loading}>
                        {loading ? <LoaderCircle className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4" />}
                        <span className="sr-only">Adicionar</span>
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}


export default function AdminPage() {
    const [visitStatusOptions, setVisitStatusOptions] = useState<MasterDataItem[]>([]);
    const [paymentInstrumentOptions, setPaymentInstrumentOptions] = useState<MasterDataItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        const [visitStatus, paymentInstruments] = await Promise.all([
            getVisitStatusOptions(),
            getPaymentInstrumentsOptions()
        ]);
        setVisitStatusOptions(visitStatus);
        setPaymentInstrumentOptions(paymentInstruments);
        setLoading(false);
    }

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdate = () => {
        // This will now refetch everything
        fetchData();
    }
    
    if (loading) {
         return (
            <div className="flex items-center justify-center h-full">
                <LoaderCircle className="w-8 h-8 animate-spin" />
            </div>
        );
    }


    return (
        <div className="flex flex-col gap-8">
            <PageHeader title="Administração" />

            <div className="grid md:grid-cols-2 gap-8">
                <MasterDataCard
                    title="Status de Visita"
                    description="Gerencie as opções para o status de uma visita."
                    items={visitStatusOptions}
                    onAdd={(name) => addVisitStatusOption(name).then(handleUpdate)}
                    onDelete={(id) => deleteVisitStatusOption(id).then(handleUpdate)}
                />
                 <MasterDataCard
                    title="Meios de Pagamento"
                    description="Gerencie as opções para os meios de pagamento de um projeto."
                    items={paymentInstrumentOptions}
                    onAdd={(name) => addPaymentInstrumentOption(name).then(handleUpdate)}
                    onDelete={(id) => deletePaymentInstrumentOption(id).then(handleUpdate)}
                />
            </div>
        </div>
    );
}
