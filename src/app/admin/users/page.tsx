
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useCallback } from "react";
import { LoaderCircle, Users, Check, X, Building, ArrowLeft } from "lucide-react";
import PageHeader from "@/components/page-header";
import { 
    updateProfile, getMyCompanyUsers, getOrganizations, getCurrentProfile, signOutUserById
} from "@/lib/data";
import type { UserProfile, Company } from "@/lib/definitions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UserManagementPage() {
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [organizations, setOrganizations] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchProfiles = useCallback(async () => {
        setLoading(true);
        try {
            const currentUserData = await getCurrentProfile();
             if (currentUserData?.role !== 'administrador') {
                toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você não tem permissão para acessar esta página.' });
                router.push('/admin');
                return;
            }
            setCurrentUser(currentUserData);
            setIsSuperAdmin(currentUserData?.email === 'mauriciodionizio@gmail.com');
            
            const [profilesData, orgsData] = await Promise.all([
                getMyCompanyUsers(),
                getOrganizations()
            ]);
            setProfiles(profilesData);
            setOrganizations(orgsData);
            
        } catch (error) {
            console.error("Error on client fetching profiles:", error);
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os usuários.' });
        } finally {
            setLoading(false);
        }
    }, [toast, router]);

    useEffect(() => {
        fetchProfiles();
    }, [fetchProfiles, refreshTrigger]);
    
    const handleDataChange = () => {
        setRefreshTrigger(prev => prev + 1);
    }

    const handleStatusChange = async (userId: string, newStatus: 'authorized' | 'revoked') => {
        try {
            await updateProfile(userId, { status: newStatus });
             if (newStatus === 'revoked') {
                await signOutUserById(userId);
            }
            toast({ title: 'Sucesso!', description: 'Status do usuário atualizado.' });
            handleDataChange(); // Refresh the list
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
        }
    };
    
    const handleRoleChange = async (userId: string, newRole: 'administrador' | 'usuario') => {
         try {
            await updateProfile(userId, { role: newRole });
            toast({ title: 'Sucesso!', description: 'Perfil do usuário atualizado.' });
            handleDataChange();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
        }
    };

    const handleCompanyChange = async (userId: string, newCompanyId: string) => {
         try {
            await updateProfile(userId, { company_id: newCompanyId });
            toast({ title: 'Sucesso!', description: 'Empresa do usuário atualizada.' });
            handleDataChange();
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
            <div className="flex items-center justify-center h-full">
                <LoaderCircle className="w-8 h-8 animate-spin" />
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <PageHeader title="Gerenciamento de Usuários">
                <Link href="/admin">
                    <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
                </Link>
            </PageHeader>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Users /> Usuários</CardTitle>
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
                                                        <SelectItem key={org.id} value={org.id}>{org.tradeName}</SelectItem>
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
        </div>
    );
}
