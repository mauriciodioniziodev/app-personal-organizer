"use client";

import { useEffect, useState } from 'react';
import { getVisits, getProjects, getClients } from '@/lib/data';
import type { Visit, Project, Client } from '@/lib/definitions';
import PageHeader from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function VisitsPage() {
    const [visits, setVisits] = useState<Visit[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [clients, setClients] = useState<Client[]>([]);

    useEffect(() => {
        setVisits(getVisits().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setProjects(getProjects());
        setClients(getClients());
    }, []);

    const getProjectName = (projectId: string) => projects.find(p => p.id === projectId)?.name;
    const getClientName = (clientId: string) => clients.find(c => c.id === clientId)?.name || 'Desconhecido';
    
    return (
        <div className="flex flex-col gap-8">
            <PageHeader title="Agenda de Visitas" />

            {visits.length > 0 ? (
                <Card>
                    <CardContent className="p-4">
                        <ul className="space-y-4">
                            {visits.map(visit => {
                                const projectName = getProjectName(visit.projectId);
                                return (
                                <li key={visit.id} className="p-4 border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <Link href={`/visits/${visit.id}`} className='w-full'>
                                        <div>
                                            <p className="font-semibold text-lg">{new Date(visit.date).toLocaleDateString('pt-BR', { dateStyle: 'full', timeZone: 'UTC' })}</p>
                                            <p className="text-muted-foreground">{new Date(visit.date).toLocaleTimeString('pt-BR', { timeStyle: 'short', timeZone: 'UTC' })}</p>
                                            <div className='mt-2'>
                                                <p className="text-sm text-muted-foreground">
                                                    Cliente: {getClientName(visit.clientId)}
                                                </p>
                                                {projectName && (
                                                     <p className="text-sm font-medium hover:underline">
                                                        Projeto: {projectName}
                                                    </p>
                                                )}
                                            </div>
                                            <p className="text-sm mt-2">{visit.summary}</p>
                                        </div>
                                    </Link>
                                    <Badge variant={visit.status === 'realizada' ? 'default' : 'secondary'} className={`capitalize ${visit.status === 'realizada' ? 'bg-accent text-accent-foreground' : ''}`}>
                                        {visit.status}
                                    </Badge>
                                </li>
                            )})}
                        </ul>
                    </CardContent>
                </Card>
            ) : (
                 <div className="text-center py-16 border-dashed border-2 rounded-lg">
                    <h2 className="text-2xl font-headline">Nenhuma visita agendada</h2>
                    <p className="text-muted-foreground mt-2 mb-4">Agende a primeira visita na página de um cliente.</p>
                </div>
            )}
        </div>
    );
}
