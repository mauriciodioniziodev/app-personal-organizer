
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, FormEvent, useCallback, ChangeEvent } from "react";
import { LoaderCircle, Plus, Building, Edit } from "lucide-react";
import PageHeader from "@/components/page-header";
import { 
    getOrganizations, addOrganization, updateOrganization, getCurrentProfile
} from "@/lib/data";
import type { Company } from "@/lib/definitions";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OrganizationManagementPage() {
    const [orgs, setOrgs] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();
    const [newOrgName, setNewOrgName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    
    // Edit state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState<Company | null>(null);

    const fetchOrgs = useCallback(async () => {
        setLoading(true);
        try {
            const currentUser = await getCurrentProfile();
            if (currentUser?.email !== 'mauriciodionizio@gmail.com') {
                toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você não tem permissão para acessar esta página.' });
                router.push('/admin');
                return;
            }
            const orgsData = await getOrganizations();
            setOrgs(orgsData);
        } catch(e) {
            toast({ variant: 'destructive', title: 'Erro', description: (e as Error).message });
        } finally {
            setLoading(false);
        }
    }, [toast, router]);

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
            await fetchOrgs();
        } catch(e) {
             toast({ variant: 'destructive', title: 'Erro', description: (e as Error).message });
        } finally {
            setIsAdding(false);
        }
    }
    
    const handleToggleActive = async (org: Company) => {
        try {
            await updateOrganization(org.id, { isActive: !org.isActive });
            toast({ title: 'Sucesso!', description: `Status de "${org.tradeName}" alterado.` });
            await fetchOrgs();
        } catch (e) {
             toast({ variant: 'destructive', title: 'Erro', description: (e as Error).message });
        }
    }

    const handleEditClick = (org: Company) => {
        setSelectedOrg(org);
        setIsEditModalOpen(true);
    }

    const handleEditFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!selectedOrg) return;
        setSelectedOrg({
            ...selectedOrg,
            [e.target.name]: e.target.value
        });
    }

    const handleSaveChanges = async (e: FormEvent) => {
        e.preventDefault();
        if(!selectedOrg) return;
        setIsSavingEdit(true);
        try {
            await updateOrganization(selectedOrg.id, selectedOrg);
            toast({ title: 'Sucesso!', description: 'Empresa atualizada.' });
            await fetchOrgs();
            setIsEditModalOpen(false);
        } catch (e) {
             toast({ variant: 'destructive', title: 'Erro', description: (e as Error).message });
        } finally {
            setIsSavingEdit(false);
        }
    }

    if(loading) {
        return <div className="flex items-center justify-center h-full"><LoaderCircle className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-8">
            <PageHeader title="Gerenciamento de Empresas">
                 <Link href="/admin">
                    <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
                </Link>
            </PageHeader>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Building /> Empresas</CardTitle>
                    <CardDescription>Adicione novas empresas e gerencie o acesso e os detalhes delas no sistema.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden mb-4">
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome Fantasia</TableHead>
                                <TableHead>CNPJ</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orgs.map(org => (
                                <TableRow key={org.id}>
                                    <TableCell className={cn(!org.isActive && 'text-muted-foreground line-through')}>{org.tradeName}</TableCell>
                                    <TableCell>{org.cnpj || '-'}</TableCell>
                                    <TableCell>
                                        <Badge className={cn(org.isActive ? 'text-green-800 bg-green-100' : 'text-red-800 bg-red-100')}>
                                            {org.isActive ? 'Ativa' : 'Inativa'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Switch
                                                checked={org.isActive}
                                                onCheckedChange={() => handleToggleActive(org)}
                                                aria-label="Ativar/Desativar Empresa"
                                            />
                                            <Button type="button" variant="ghost" size="icon" onClick={() => handleEditClick(org)}>
                                                <Edit className="w-4 h-4"/>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                     {orgs.length === 0 && <p className="text-sm text-muted-foreground text-center p-4">Nenhuma empresa cadastrada.</p>}
                    </div>
                    <form onSubmit={handleAddOrg} className="flex gap-2">
                        <Input 
                            placeholder="Nome Fantasia da nova empresa..." 
                            value={newOrgName}
                            onChange={(e) => setNewOrgName(e.target.value)}
                        />
                        <Button type="submit" disabled={isAdding}>
                            {isAdding ? <LoaderCircle className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4" />}
                            <span className="sr-only">Adicionar Empresa</span>
                        </Button>
                    </form>
                </CardContent>

                 <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Editar Empresa: {selectedOrg?.tradeName}</DialogTitle>
                            <DialogDescription>
                                Altere os detalhes cadastrais da empresa.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedOrg && (
                            <form onSubmit={handleSaveChanges}>
                            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="tradeName" className="text-right">Nome Fantasia</Label>
                                    <Input id="tradeName" name="tradeName" value={selectedOrg.tradeName} onChange={handleEditFormChange} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="legalName" className="text-right">Razão Social</Label>
                                    <Input id="legalName" name="legalName" value={selectedOrg.legalName || ''} onChange={handleEditFormChange} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="cnpj" className="text-right">CNPJ</Label>
                                    <Input id="cnpj" name="cnpj" value={selectedOrg.cnpj || ''} onChange={handleEditFormChange} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="phone" className="text-right">Telefone</Label>
                                    <Input id="phone" name="phone" value={selectedOrg.phone || ''} onChange={handleEditFormChange} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="address" className="text-right">Endereço</Label>
                                    <Input id="address" name="address" value={selectedOrg.address || ''} onChange={handleEditFormChange} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="contactPerson" className="text-right">Pessoa de Contato</Label>
                                    <Input id="contactPerson" name="contactPerson" value={selectedOrg.contactPerson || ''} onChange={handleEditFormChange} className="col-span-3" />
                                </div>
                                 <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="notes" className="text-right">Observações</Label>
                                    <Textarea id="notes" name="notes" value={selectedOrg.notes || ''} onChange={handleEditFormChange} className="col-span-3" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={isSavingEdit}>
                                    {isSavingEdit ? <LoaderCircle className="animate-spin" /> : 'Salvar Alterações'}
                                </Button>
                            </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            </Card>
        </div>
    )
}
