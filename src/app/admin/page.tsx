

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, FormEvent, useCallback } from "react";
import { LoaderCircle, Trash, Plus, Users, Check, X, Building, ToggleRight, ToggleLeft, Edit } from "lucide-react";
import PageHeader from "@/components/page-header";
import { 
    addPaymentInstrumentOption, addVisitStatusOption, deletePaymentInstrumentOption, 
    deleteVisitStatusOption, getPaymentInstrumentsOptions, getVisitStatusOptions, 
    getProjectStatusOptions, addProjectStatusOption, deleteProjectStatusOption,
    getProfiles, updateProfile, getCompanies, updateCompany, getCurrentProfile, addCompany
} from "@/lib/data";
import type { MasterDataItem, UserProfile, Company } from "@/lib/definitions";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

function UserManagementCard({isSuperAdmin}: {isSuperAdmin: boolean}) {
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const fetchProfiles = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);
            const profilesData = await getProfiles();
            setProfiles(profilesData);
        } catch (error) {
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
                    {isSuperAdmin ? "Visualize e gerencie todos os usuários do sistema." : "Autorize ou revogue o acesso e defina os perfis dos usuários ao sistema."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3">
                    {profiles.map(profile => {
                        const isCurrentUser = profile.id === currentUserId;
                        return (
                        <li key={profile.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-muted/50 rounded-md gap-4">
                            <div className="flex-grow">
                                <p className="font-semibold">{profile.fullName || 'Nome não definido'}</p>
                                <p className="text-sm text-muted-foreground">{profile.email}</p>
                                {isSuperAdmin && <p className="text-xs font-bold text-primary mt-1">{profile.companyName}</p>}
                                <div className="flex gap-2 mt-2">
                                    <Badge className={cn("capitalize", statusBadge[profile.status] || '')}>{profile.status}</Badge>
                                    <Badge className={cn("capitalize", roleBadge[profile.role] || '')}>{profile.role}</Badge>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
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
                     {profiles.length === 0 && (
                        <p className="text-muted-foreground text-center py-4">Nenhum usuário pendente ou cadastrado.</p>
                    )}
                </ul>
            </CardContent>
        </Card>
    );
}

function SuperAdminCompanyManagement() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    
    // State for dialogs
    const [isCreateOpen, setCreateOpen] = useState(false);
    const [isEditOpen, setEditOpen] = useState(false);
    const [newCompanyName, setNewCompanyName] = useState("");
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);


    const fetchCompanies = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getCompanies();
            setCompanies(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar as empresas.' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    const handleStatusToggle = async (companyId: string, currentStatus: boolean) => {
        try {
            await updateCompany(companyId, { isActive: !currentStatus });
            toast({ title: 'Sucesso!', description: 'Status da empresa atualizado.' });
            fetchCompanies();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
        }
    };
    
    const handleCreateCompany = async (e: FormEvent) => {
        e.preventDefault();
        if (!newCompanyName.trim()) return;
        setIsSubmitting(true);
        try {
            await addCompany(newCompanyName);
            toast({ title: "Sucesso!", description: "Nova empresa criada."});
            setNewCompanyName("");
            setCreateOpen(false);
            fetchCompanies();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const handleEditCompany = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingCompany || !newCompanyName.trim()) return;
         setIsSubmitting(true);
        try {
            await updateCompany(editingCompany.id, { name: newCompanyName });
            toast({ title: "Sucesso!", description: "Nome da empresa atualizado."});
            setEditingCompany(null);
            setNewCompanyName("");
            setEditOpen(false);
            fetchCompanies();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
        } finally {
            setIsSubmitting(false);
        }
    }

    const openEditDialog = (company: Company) => {
        setEditingCompany(company);
        setNewCompanyName(company.name);
        setEditOpen(true);
    }
    
    if (loading) {
         return <Card><CardHeader><CardTitle>Gerenciamento de Empresas</CardTitle></CardHeader><CardContent className="flex justify-center items-center h-24"><LoaderCircle className="w-6 h-6 animate-spin" /></CardContent></Card>
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="font-headline flex items-center gap-2"><Building /> Gerenciamento de Empresas</CardTitle>
                    <CardDescription>Ative, desative ou edite as empresas do sistema.</CardDescription>
                </div>
                 <Dialog open={isCreateOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2"/> Adicionar Empresa</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Criar Nova Empresa</DialogTitle>
                            <DialogDescription>
                                Uma nova empresa e suas configurações padrão serão criadas. Nenhum usuário será criado.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateCompany}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="new-company-name" className="text-right">Nome</Label>
                                    <Input id="new-company-name" value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} className="col-span-3" required />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? <LoaderCircle className="animate-spin"/> : "Criar Empresa"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3">
                    {companies.map(company => (
                        <li key={company.id} className="flex flex-wrap items-center justify-between p-3 bg-muted/50 rounded-md gap-4">
                            <div>
                                <p className="font-semibold">{company.name}</p>
                                <p className="text-sm text-muted-foreground">ID: {company.id}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={() => openEditDialog(company)}>
                                    <Edit className="mr-2 h-4 w-4"/> Editar
                                </Button>
                                <Button size="sm" variant={company.isActive ? 'destructive' : 'success'} onClick={() => handleStatusToggle(company.id, company.isActive)}>
                                    {company.isActive ? (
                                        <><ToggleRight className="mr-2 h-4 w-4" /> Desativar</>
                                    ) : (
                                        <><ToggleLeft className="mr-2 h-4 w-4" /> Ativar</>
                                    )}
                                </Button>
                            </div>
                        </li>
                    ))}
                    {companies.length === 0 && (
                        <p className="text-muted-foreground text-center py-4">Nenhuma empresa cadastrada.</p>
                    )}
                </ul>
            </CardContent>

             <Dialog open={isEditOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Empresa</DialogTitle>
                        <DialogDescription>
                            Altere o nome da empresa selecionada.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditCompany}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-company-name" className="text-right">Nome</Label>
                                <Input id="edit-company-name" value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} className="col-span-3" required />
                            </div>
                        </div>
                        <DialogFooter>
                             <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <LoaderCircle className="animate-spin"/> : "Salvar Alterações"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Card>
    );
}


export default function AdminPage() {
    const [visitStatusOptions, setVisitStatusOptions] = useState<MasterDataItem[]>([]);
    const [paymentInstrumentOptions, setPaymentInstrumentOptions] = useState<MasterDataItem[]>([]);
    const [projectStatusOptions, setProjectStatusOptions] = useState<MasterDataItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<UserProfile | null>(null);


    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const currentProfile = await getCurrentProfile();
             setProfile(currentProfile);

            if (currentProfile && currentProfile.email !== 'mauriciodionizio@gmail.com') {
                const [visitStatus, paymentInstruments, projectStatus] = await Promise.all([
                    getVisitStatusOptions(),
                    getPaymentInstrumentsOptions(),
                    getProjectStatusOptions(),
                ]);
                 setVisitStatusOptions(visitStatus);
                setPaymentInstrumentOptions(paymentInstruments);
                setProjectStatusOptions(projectStatus);
            }

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
    
    const isSuperAdmin = profile?.email === 'mauriciodionizio@gmail.com';

    return (
        <div className="flex flex-col gap-8">
            <PageHeader title="Administração" />

            <div className="space-y-8">
                {isSuperAdmin && <SuperAdminCompanyManagement />}
                
                <UserManagementCard isSuperAdmin={isSuperAdmin} />

                {!isSuperAdmin && (
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
                )}
            </div>
        </div>
    );
}

