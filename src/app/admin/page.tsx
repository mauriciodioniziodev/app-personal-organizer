
"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/data";
import { Users, Building, Handshake, Edit, LoaderCircle, ArrowRight } from "lucide-react";
import PageHeader from "@/components/page-header";
import Link from "next/link";
import type { UserProfile } from '@/lib/definitions';
import { cn } from '@/lib/utils';

const AdminCard = ({ href, title, description, icon: Icon, disabled }: { href: string; title: string; description: string; icon: React.ElementType, disabled?: boolean }) => (
    <Link href={href} className={cn("block", disabled && "pointer-events-none")}>
        <Card className={cn("hover:bg-muted/50 transition-colors h-full", disabled && "bg-muted/50 opacity-50")}>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Icon className="w-6 h-6 text-primary" />
                    {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-end text-sm font-medium text-primary">
                    Gerenciar <ArrowRight className="w-4 h-4 ml-2" />
                </div>
            </CardContent>
        </Card>
    </Link>
);

export default function AdminPage() {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const currentUser = await getCurrentProfile();
            setIsAdmin(currentUser?.role === 'administrador');
            setIsSuperAdmin(currentUser?.email === 'mauriciodionizio@gmail.com');
        } catch (e) {
            console.error("Failed to fetch admin data", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AdminCard
                    href="/admin/organizations"
                    title="Empresas"
                    description="Gerencie as empresas cadastradas e seus detalhes."
                    icon={Building}
                    disabled={!isSuperAdmin}
                />
                <AdminCard
                    href="/admin/users"
                    title="Usuários"
                    description="Autorize ou revogue o acesso dos usuários ao sistema."
                    icon={Users}
                    disabled={!isAdmin}
                />
                <AdminCard
                    href="/admin/master-data"
                    title="Dados Mestres"
                    description="Gerencie opções de status, pagamentos, parceiros e mais."
                    icon={Edit}
                    disabled={!isAdmin}
                />
            </div>
        </div>
    );
}
