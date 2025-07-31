

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, FormEvent } from "react";
import { LoaderCircle, Trash, Plus, Users, Check, X } from "lucide-react";
import PageHeader from "@/components/page-header";
import { 
    addPaymentInstrumentOption, addVisitStatusOption, deletePaymentInstrumentOption, 
    deleteVisitStatusOption, getPaymentInstrumentsOptions, getVisitStatusOptions, 
    getProjectStatusOptions, addProjectStatusOption, deleteProjectStatusOption,
    getProfiles, updateProfileStatus
} from "@/lib/data";
import type { MasterDataItem, UserProfile } from "@/lib/definitions";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
        if(!confirm(`Tem certeza que deseja remover "${item.name}"?`)) return;
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

function UserManagementCard() {
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const profilesData = await getProfiles();
            setProfiles(profilesData);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os usuários.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfiles();
    }, []);

    const handleStatusChange = async (userId: string, newStatus: 'authorized' | 'revoked') => {
        try {
            await updateProfileStatus(userId, newStatus);
            toast({ title: 'Sucesso!', description: 'Status do usuário atualizado.' });
            fetchProfiles(); // Refresh the list
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
        }
    };

    const statusBadge: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800',
        authorized: 'bg-green-100 text-green-800',
        revoked: 'bg-red-100 text-red-800',
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Users /> Gerenciamento de Usuários</CardTitle>
                    <CardDescription>Autorize ou revogue o acesso dos usuários ao sistema.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center items-center h-24">
                    <LoaderCircle className="w-6 h-6 animate-spin" />
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><Users /> Gerenciamento de Usuários</CardTitle>
                <CardDescription>Autorize ou revogue o acesso dos usuários ao sistema.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3">
                    {profiles.map(profile => (
                        <li key={profile.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-muted/50 rounded-md gap-4">
                            <div className="flex-grow">
                                <p className="font-semibold">{profile.fullName || 'Nome não definido'}</p>
                                <p className="text-sm text-muted-foreground">{profile.email}</p>
                                <Badge className={cn("capitalize mt-1", statusBadge[profile.status] || '')}>{profile.status}</Badge>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <Button size="sm" variant="outline" onClick={() => handleStatusChange(profile.id, 'authorized')} disabled={profile.status === 'authorized'}>
                                    <Check className="mr-2 h-4 w-4"/> Autorizar
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleStatusChange(profile.id, 'revoked')} disabled={profile.status === 'revoked'}>
                                    <X className="mr-2 h-4 w-4"/> Revogar
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}


export default function AdminPage() {
    const [visitStatusOptions, setVisitStatusOptions] = useState<MasterDataItem[]>([]);
    const [paymentInstrumentOptions, setPaymentInstrumentOptions] = useState<MasterDataItem[]>([]);
    const [projectStatusOptions, setProjectStatusOptions] = useState<MasterDataItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        const [visitStatus, paymentInstruments, projectStatus] = await Promise.all([
            getVisitStatusOptions(),
            getPaymentInstrumentsOptions(),
            getProjectStatusOptions()
        ]);
        setVisitStatusOptions(visitStatus);
        setPaymentInstrumentOptions(paymentInstruments);
        setProjectStatusOptions(projectStatus);
        setLoading(false);
    }

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdate = () => {
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

            <div className="space-y-8">
                 <UserManagementCard />

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                     <MasterDataCard
                        title="Status de Execução do Projeto"
                        description="Gerencie as opções para o status de execução de um projeto."
                        items={projectStatusOptions}
                        onAdd={(name) => addProjectStatusOption(name).then(handleUpdate)}
                        onDelete={(id) => deleteProjectStatusOption(id).then(handleUpdate)}
                    />
                </div>
            </div>
        </div>
    );
}
