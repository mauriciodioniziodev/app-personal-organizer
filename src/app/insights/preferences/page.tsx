

"use client";

import { useEffect, useState } from 'react';
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoaderCircle, FileText, ArrowLeft } from "lucide-react";
import PreferenceAnalyzer from '@/components/client-preference-analyzer';
import { getClients, getProjects, getVisits } from '@/lib/data';
import type { Client, Project, Visit } from '@/lib/definitions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PreferencesPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [visits, setVisits] = useState<Visit[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const [clientsData, projectsData, visitsData] = await Promise.all([
                getClients(),
                getProjects(),
                getVisits(),
            ]);
            setClients(clientsData);
            setProjects(projectsData);
            setVisits(visitsData);
            setLoading(false);
        }
        loadData();
    }, []);
    
    const getClientNotes = (client: Client | null) => {
        if (!client) return "";
        const clientVisits = visits.filter(v => v.clientId === client.id);
        const clientProjects = projects.filter(p => p.clientId === client.id);

        return `
            Preferências: ${client.preferences || 'Nenhuma'}
            ${clientVisits.map(v => `
            Visita em ${new Date(v.date).toLocaleDateString('pt-BR')}:
            - Resumo: ${v.summary}
            - Fotos: ${v.photos.map(p => p.description).join(', ')}
            `).join('')}
            ${clientProjects.map(p => `
            Projeto "${p.name}":
            - Descrição: ${p.description}
            `).join('')}
        `;
    };
    
    return (
        <div className="flex flex-col gap-8">
            <PageHeader title="Análise de Preferências">
                <Link href="/insights">
                    <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
                </Link>
            </PageHeader>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <FileText className="w-6 h-6 text-primary" />
                        Analisador de Perfil
                    </CardTitle>
                    <CardDescription>
                        Selecione um cliente para gerar um resumo inteligente de suas preferências, gostos e histórico de interações, usando todos os dados disponíveis no sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? <div className="flex justify-center items-center h-40"><LoaderCircle className="animate-spin"/></div> : (
                        <div className="flex flex-col gap-4">
                             <div className="max-w-sm">
                                <Select onValueChange={(clientId) => setSelectedClient(clients.find(c => c.id === clientId) || null)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um cliente" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map(client => (
                                            <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {selectedClient ? (
                                <PreferenceAnalyzer 
                                    clientName={selectedClient.name} 
                                    clientDetails={getClientNotes(selectedClient)} 
                                />
                            ) : (
                                <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                                    <p>Por favor, selecione um cliente para começar a análise.</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
