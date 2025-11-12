
"use client";

import { useEffect, useState } from 'react';
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, LoaderCircle, BarChart, FileText, ArrowRight } from "lucide-react";
import ServiceRecommender from '@/components/service-recommender';
import PreferenceAnalyzer from '@/components/client-preference-analyzer';
import { getClients, getProjects, getVisits } from '@/lib/data';
import type { Client, Project, Visit } from '@/lib/definitions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const InsightCard = ({ title, description, icon: Icon, children }: { title: string, description: string, icon: React.ElementType, children?: React.ReactNode }) => (
    <Card className="h-full flex flex-col">
        <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
                <Icon className="w-6 h-6 text-primary" />
                {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col">
            {children}
        </CardContent>
    </Card>
);


export default function InsightsPage() {
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
            <PageHeader title="Insights com IA" />
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                 <InsightCard
                    title="Recomendação de Serviços"
                    description="Selecione um cliente para receber sugestões de upsell e novos serviços com base no seu histórico e em padrões de outros clientes."
                    icon={Lightbulb}
                >
                    {loading ? <LoaderCircle className="animate-spin m-auto"/> : <ServiceRecommender allClients={clients} allProjects={projects} />}
                </InsightCard>
                
                 <InsightCard
                    title="Análise de Preferências"
                    description="Selecione um cliente para gerar um resumo inteligente de suas preferências, gostos e histórico de interações."
                    icon={FileText}
                >
                    {loading ? <LoaderCircle className="animate-spin m-auto"/> : (
                        <div className="flex flex-col gap-4 flex-grow">
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
                            {selectedClient && (
                                <div className="flex-grow">
                                <PreferenceAnalyzer clientName={selectedClient.name} clientDetails={getClientNotes(selectedClient)} />
                                </div>
                            )}
                        </div>
                    )}
                </InsightCard>
                
                 <InsightCard
                    title="Análise Financeira"
                    description="Receba uma análise do faturamento, pagamentos pendentes e desempenho financeiro geral. (Em breve)"
                    icon={BarChart}
                >
                    <div className="m-auto text-center text-muted-foreground">
                        <p>Funcionalidade em desenvolvimento.</p>
                         <a href="#" className="text-sm text-primary hover:underline flex items-center justify-center mt-2">
                           Sugerir Análise <ArrowRight className="w-4 h-4 ml-1" />
                        </a>
                    </div>
                </InsightCard>
            </div>
        </div>
    );
}
