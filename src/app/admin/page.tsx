
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, FormEvent, useCallback } from "react";
import { LoaderCircle, Trash, Plus, Users, Check, X, Building, Save, Power, PowerOff } from "lucide-react";
import PageHeader from "@/components/page-header";
import { 
    addPaymentInstrumentOption, addVisitStatusOption, deletePaymentInstrumentOption, 
    deleteVisitStatusOption, getPaymentInstrumentsOptions, getVisitStatusOptions, 
    getProjectStatusOptions, addProjectStatusOption, deleteProjectStatusOption,
    updateProfile, getMyCompanyUsers, getOrganizations, addOrganization, updateOrganization
} from "@/lib/data";
import { getCurrentProfile } from "@/lib/data";
import type { MasterDataItem, UserProfile, Company } from "@/lib/definitions";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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

function OrganizationManagementCard() {
    const [orgs, setOrgs] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [newOrgName, setNewOrgName] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const fetchOrgs = useCallback(async () => {
        setLoading(true);
        try {
            const orgsData = await getOrganizations();
            setOrgs(orgsData);
        } catch(e) {
            toast({ variant: 'destructive', title: 'Erro', description: (e as Error).message });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchOrgs();
    }, [fetchOrgs]);
    
    const handleAddOrg = async (e: FormEvent) => {
        e.preventDefault();
        if(!newOrgName.trim()) return;
        setIsAdding(true);
        try {
            await addOrganization(newOrgName);
            toast({ title: 'Sucesso!', description: `Empresa "${newOrgName}" criada.` });
            setNewOrgName('');
            fetchOrgs();
        } catch(e) {
             toast({ variant: 'destructive', title: 'Erro', description: (e as Error).message });
        } finally {
            setIsAdding(false);
        }
    }
    
    const handleToggleActive = async (org: Company) => {
        try {
            await updateOrganization(org.id, { is_active: !org.isActive });
            toast({ title: 'Sucesso!', description: `Status de "${org.name}" alterado.` });
            fetchOrgs();
        } catch (e) {
             toast({ variant: 'destructive', title: 'Erro', description: (e as Error).message });
        }
    }

    if(loading) {
        return <Card><CardHeader><CardTitle>Gerenciamento de Empresas</CardTitle></CardHeader><CardContent><LoaderCircle className="animate-spin"/></CardContent></Card>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><Building /> Gerenciamento de Empresas</CardTitle>
                <CardDescription>Adicione novas empresas e gerencie o acesso delas ao sistema.</CardDescription>
            </CardHeader>
            <CardContent>
                 <ul className="space-y-2 mb-4">
                    {orgs.map(org => (
                        <li key={org.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                            <span className={cn(!org.isActive && 'text-muted-foreground line-through')}>{org.name}</span>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={org.isActive}
                                    onCheckedChange={() => handleToggleActive(org)}
                                    aria-label="Ativar/Desativar Empresa"
                                />
                                <Badge variant={org.isActive ? 'default': 'outline'}>{org.isActive ? 'Ativa' : 'Inativa'}</Badge>
                            </div>
                        </li>
                    ))}
                     {orgs.length === 0 && <p className="text-sm text-muted-foreground text-center">Nenhuma empresa cadastrada.</p>}
                </ul>
                <form onSubmit={handleAddOrg} className="flex gap-2">
                    <Input 
                        placeholder="Nome da nova empresa..." 
                        value={newOrgName}
                        onChange={(e) => setNewOrgName(e.target.value)}
                    />
                    <Button type="submit" disabled={isAdding}>
                        {isAdding ? <LoaderCircle className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4" />}
                        <span className="sr-only">Adicionar Empresa</span>
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}


function UserManagementCard() {
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [organizations, setOrganizations] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    const fetchProfiles = useCallback(async () => {
        setLoading(true);
        try {
            const [profilesData, currentUserData, orgsData] = await Promise.all([
                getMyCompanyUsers(),
                getCurrentProfile(),
                getOrganizations()
            ]);
            setProfiles(profilesData);
            setCurrentUser(currentUserData);
            setOrganizations(orgsData);
            setIsSuperAdmin(currentUserData?.email === 'mauriciodionizio@gmail.com');
        } catch (error) {
            console.error("Error on client fetching profiles:", error);
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os usuários.' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchProfiles();
    }, [fetchProfiles]);

    const handleStatusChange = async (userId: string, newStatus: 'authorized' | 'revoked') => {
        try {
            await updateProfile(userId, { status: newStatus });
            toast({ title: 'Sucesso!', description: 'Status do usuário atualizado.' });
            fetchProfiles(); // Refresh the list
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
        }
    };
    
    const handleRoleChange = async (userId: string, newRole: 'administrador' | 'usuario') => {
         try {
            await updateProfile(userId, { role: newRole });
            toast({ title: 'Sucesso!', description: 'Perfil do usuário atualizado.' });
            fetchProfiles(); // Refresh the list
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
        }
    };

    const handleCompanyChange = async (userId: string, newCompanyId: string) => {
         try {
            await updateProfile(userId, { company_id: newCompanyId });
            toast({ title: 'Sucesso!', description: 'Empresa do usuário atualizada.' });
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
    
    const roleBadge: Record<string, string> = {
        administrador: 'bg-purple-100 text-purple-800',
        usuario: 'bg-blue-100 text-blue-800',
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Users /> Gerenciamento de Usuários</CardTitle>
                    <CardDescription>Autorize ou revogue o acesso e defina os perfis dos usuários ao sistema.</CardDescription>
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
                <CardDescription>
                    Autorize ou revogue o acesso e defina os perfis dos usuários ao sistema.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {profiles.length > 0 ? (
                    <ul className="space-y-3">
                        {profiles.map(profile => {
                            const isCurrentUser = profile.id === currentUser?.id;

                            return (
                            <li key={profile.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-muted/50 rounded-md gap-4">
                                <div className="flex-grow">
                                    <p className="font-semibold">{profile.fullName || 'Nome não definido'}</p>
                                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                                     {isSuperAdmin && profile.companyName && (
                                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                            <Building className="w-3 h-3"/>
                                            <span>{profile.companyName}</span>
                                        </div>
                                     )}
                                    <div className="flex gap-2 mt-2">
                                        <Badge className={cn("capitalize", statusBadge[profile.status] || '')}>{profile.status}</Badge>
                                        <Badge className={cn("capitalize", roleBadge[profile.role] || '')}>{profile.role}</Badge>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                                    {isSuperAdmin && (
                                         <Select 
                                            value={profile.companyId} 
                                            onValueChange={(v) => handleCompanyChange(profile.id, v as any)}
                                            disabled={isCurrentUser}
                                        >
                                            <SelectTrigger className="w-full sm:w-[180px]">
                                                <SelectValue placeholder="Alterar Empresa" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {organizations.map(org => (
                                                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    <Select 
                                        value={profile.role} 
                                        onValueChange={(v) => handleRoleChange(profile.id, v as any)}
                                        disabled={isCurrentUser}
                                    >
                                        <SelectTrigger className="w-full sm:w-[150px]">
                                            <SelectValue placeholder="Alterar Perfil" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="administrador">Administrador</SelectItem>
                                            <SelectItem value="usuario">Usuário</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="success" onClick={() => handleStatusChange(profile.id, 'authorized')} disabled={profile.status === 'authorized' || isCurrentUser}>
                                            <Check className="mr-2 h-4 w-4"/> Autorizar
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleStatusChange(profile.id, 'revoked')} disabled={profile.status === 'revoked' || isCurrentUser}>
                                            <X className="mr-2 h-4 w-4"/> Revogar
                                        </Button>
                                    </div>
                                </div>
                            </li>
                        )})}
                    </ul>
                ) : (
                    <p className="text-muted-foreground text-center py-4">Nenhum usuário pendente ou cadastrado.</p>
                )}
            </CardContent>
        </Card>
    );
}

export default function AdminPage() {
    const [visitStatusOptions, setVisitStatusOptions] = useState<MasterDataItem[]>([]);
    const [paymentInstrumentOptions, setPaymentInstrumentOptions] = useState<MasterDataItem[]>([]);
    const [projectStatusOptions, setProjectStatusOptions] = useState<MasterDataItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [visitStatus, paymentInstruments, projectStatus, currentUser] = await Promise.all([
                getVisitStatusOptions(),
                getPaymentInstrumentsOptions(),
                getProjectStatusOptions(),
                getCurrentProfile(),
            ]);
            setVisitStatusOptions(visitStatus);
            setPaymentInstrumentOptions(paymentInstruments);
            setProjectStatusOptions(projectStatus);
            setIsSuperAdmin(currentUser?.email === 'mauriciodionizio@gmail.com');
        } catch(e) {
            console.error("Failed to fetch admin data", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
                {isSuperAdmin && <OrganizationManagementCard />}
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
