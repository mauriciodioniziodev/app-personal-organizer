
"use client";

import { useEffect, useState } from 'react';
import { getVisits, getProjects, getClients } from '@/lib/data';
import type { Visit, Project, Client } from '@/lib/definitions';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CalendarPlus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function VisitsPage() {
    const [allVisits, setAllVisits] = useState<Visit[]>([]);
    const [filteredVisits, setFilteredVisits] = useState<Visit[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const getClientName = (clientId: string) => clients.find(c => c.id === clientId)?.name || 'Desconhecido';
    
    useEffect(() => {
        const refetch = () => {
            const visitsData = getVisits().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const clientsData = getClients();
            setAllVisits(visitsData);
            setProjects(getProjects());
            setClients(clientsData);
            setFilteredVisits(
                visitsData.filter(visit =>
                    (clientsData.find(c => c.id === visit.clientId)?.name || 'Desconhecido').toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        };
        refetch();

        window.addEventListener('focus', refetch);
        return () => window.removeEventListener('focus', refetch);
    }, [searchTerm]);

    const getProjectName = (projectId: string) => projects.find(p => p.id === projectId)?.name;
    
    return (
        <div className="flex flex-col gap-8">
            <PageHeader title="Agenda de Visitas">
                 <Link href="/visits/new">
                    <Button>
                        <CalendarPlus className="mr-2 h-4 w-4" />
                        Adicionar Visita
                    </Button>
                </Link>
            </PageHeader>

            <div className="flex justify-start">
                <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Filtrar por nome do cliente..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
                </div>
            </div>

            {filteredVisits.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredVisits.map(visit => {
                        const projectName = getProjectName(visit.projectId);
                        return (
                        <Card key={visit.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="font-headline text-xl">
                                    {new Date(visit.date).toLocaleDateString('pt-BR', { dateStyle: 'long' })}
                                </CardTitle>
                                <CardDescription>
                                    {new Date(visit.date).toLocaleTimeString('pt-BR', { timeStyle: 'short' })}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-4">
                                <div>
                                    <p className="text-sm font-semibold text-muted-foreground">Cliente</p>
                                    <p>{getClientName(visit.clientId)}</p>
                                </div>
                                 <div>
                                    <p className="text-sm font-semibold text-muted-foreground">Status</p>
                                     <Badge variant={visit.status === 'realizada' ? 'default' : 'secondary'} className={`capitalize ${visit.status === 'realizada' ? 'bg-accent text-accent-foreground' : ''}`}>
                                        {visit.status}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-muted-foreground">Resumo</p>
                                    <p className="text-sm mt-1 line-clamp-3">{visit.summary}</p>
                                </div>
                                {projectName && (
                                     <div>
                                        <p className="text-sm font-semibold text-muted-foreground">Projeto</p>
                                        <p className="text-sm mt-1">{projectName}</p>
                                    </div>
                                )}
                            </CardContent>
                            <CardContent>
                                 <Link href={`/visits/${visit.id}`} className="w-full">
                                    <Button variant="outline" className="w-full">
                                        Ver Detalhes
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )})}
                </div>
            ) : (
                 <div className="text-center py-16 border-dashed border-2 rounded-lg">
                    <h2 className="text-2xl font-headline">Nenhuma visita encontrada</h2>
                    <p className="text-muted-foreground mt-2 mb-4">
                        {allVisits.length > 0 ? 'Tente um termo de busca diferente.' : 'Agende a primeira visita na página de um cliente.'}
                    </p>
                </div>
            )}
        </div>
    );
}
