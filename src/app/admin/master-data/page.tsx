
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, FormEvent, useCallback } from "react";
import { LoaderCircle, Trash, Plus, Edit, Handshake, ArrowLeft } from "lucide-react";
import PageHeader from "@/components/page-header";
import { 
    addPaymentInstrumentOption, addVisitStatusOption, deletePaymentInstrumentOption, 
    deleteVisitStatusOption, getPaymentInstrumentsOptions, getVisitStatusOptions, 
    getProjectStatusOptions, addProjectStatusOption, deleteProjectStatusOption,
    getCurrentProfile,
    getOrganizerPartners,
    addOrganizerPartner,
    deleteOrganizerPartner
} from "@/lib/data";
import type { MasterDataItem, OrganizerPartner } from "@/lib/definitions";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";


function MasterDataCard<T extends MasterDataItem>({
    title,
    description,
    items,
    onAdd,
    onDelete,
    icon: Icon,
    disabled
}: {
    title: string;
    description: string;
    items: T[];
    onAdd: (name: string) => Promise<any>;
    onDelete: (id: string) => Promise<any>;
    icon: React.ElementType;
    disabled?: boolean;
}) {
    const { toast } = useToast();
    const [newItemName, setNewItemName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleAdd = async (e: FormEvent) => {
        e.preventDefault();
        if(!newItemName.trim() || disabled) return;
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
        if(disabled || !confirm(`Tem certeza que deseja remover "${item.name}"?`)) return;
        try {
            await onDelete(item.id);
            toast({ title: "Sucesso!", description: `"${item.name}" foi removido.`});
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro", description: (error as Error).message });
        }
    }


    return (
        <Card className={disabled ? 'bg-muted/50' : ''}>
            <CardHeader>
                 <CardTitle className="font-headline flex items-center gap-2">
                    {Icon && <Icon className="w-5 h-5"/>}
                    {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2 mb-4">
                    {items.map(item => (
                        <li key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                            <span>{item.name}</span>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item)} disabled={disabled}>
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
                        disabled={disabled}
                    />
                    <Button type="submit" disabled={loading || disabled}>
                        {loading ? <LoaderCircle className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4" />}
                        <span className="sr-only">Adicionar</span>
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

export default function MasterDataPage() {
    const [visitStatusOptions, setVisitStatusOptions] = useState<MasterDataItem[]>([]);
    const [paymentInstrumentOptions, setPaymentInstrumentOptions] = useState<MasterDataItem[]>([]);
    const [projectStatusOptions, setProjectStatusOptions] = useState<MasterDataItem[]>([]);
    const [organizerPartners, setOrganizerPartners] = useState<OrganizerPartner[]>([]);

    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const currentUser = await getCurrentProfile();
             if (currentUser?.role !== 'administrador') {
                toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você não tem permissão para acessar esta página.' });
                router.push('/admin');
                return;
            }
            setIsAdmin(true);
            setIsSuperAdmin(currentUser?.email === 'mauriciodionizio@gmail.com');

            const [
                partnersData,
                visitStatus, 
                paymentInstruments, 
                projectStatus
            ] = await Promise.all([
                getOrganizerPartners(),
                getVisitStatusOptions(),
                getPaymentInstrumentsOptions(),
                getProjectStatusOptions()
            ]);

            setOrganizerPartners(partnersData);
            if(visitStatus) setVisitStatusOptions(visitStatus);
            if(paymentInstruments) setPaymentInstrumentOptions(paymentInstruments);
            if(projectStatus) setProjectStatusOptions(projectStatus);
            
        } catch(e) {
            console.error("Failed to fetch admin data", e);
        } finally {
            setLoading(false);
        }
    }, [router, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDataChange = () => {
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
            <PageHeader title="Dados Mestres">
                <Link href="/admin">
                    <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
                </Link>
            </PageHeader>

            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
                <MasterDataCard
                    title="Empresas Parceiras"
                    description="Gerencie as empresas parceiras para comissões."
                    items={organizerPartners}
                    onAdd={(name) => addOrganizerPartner(name).then(handleDataChange)}
                    onDelete={(id) => deleteOrganizerPartner(id).then(handleDataChange)}
                    icon={Handshake}
                    disabled={!isAdmin}
                />
                <MasterDataCard
                    title="Status de Visita"
                    description="Gerencie as opções para o status de uma visita."
                    items={visitStatusOptions}
                    onAdd={(name) => addVisitStatusOption(name).then(handleDataChange)}
                    onDelete={(id) => deleteVisitStatusOption(id).then(handleDataChange)}
                    icon={Edit}
                    disabled={!isSuperAdmin}
                />
                <MasterDataCard
                    title="Meios de Pagamento"
                    description="Gerencie as opções para os meios de pagamento de um projeto."
                    items={paymentInstrumentOptions}
                    onAdd={(name) => addPaymentInstrumentOption(name).then(handleDataChange)}
                    onDelete={(id) => deletePaymentInstrumentOption(id).then(handleDataChange)}
                    icon={Edit}
                    disabled={!isSuperAdmin}
                />
                <MasterDataCard
                    title="Status de Execução do Projeto"
                    description="Gerencie as opções para o status de execução de um projeto."
                    items={projectStatusOptions}
                    onAdd={(name) => addProjectStatusOption(name).then(handleDataChange)}
                    onDelete={(id) => deleteProjectStatusOption(id).then(handleDataChange)}
                    icon={Edit}
                    disabled={!isSuperAdmin}
                />
            </div>
        </div>
    );
}

