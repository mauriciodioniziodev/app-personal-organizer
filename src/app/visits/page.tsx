
"use client";

import { useEffect, useState } from 'react';
import { getVisits, getProjects, getClients } from '@/lib/data';
import type { Visit, Project, Client } from '@/lib/definitions';
import PageHeader from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
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

    useEffect(() => {
        const visitsData = getVisits().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setAllVisits(visitsData);
        setFilteredVisits(visitsData);
        setProjects(getProjects());
        setClients(getClients());
    }, []);

    const getProjectName = (projectId: string) => projects.find(p => p.id === projectId)?.name;
    const getClientName = (clientId: string) => clients.find(c => c.id === clientId)?.name || 'Desconhecido';

    useEffect(() => {
        const results = allVisits.filter(visit =>
            getClientName(visit.clientId).toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredVisits(results);
    }, [searchTerm, allVisits, clients]);
    
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
                <Card>
                    <CardContent className="p-4">
                        <ul className="space-y-4">
                            {filteredVisits.map(visit => {
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
                                            <p className="text-sm mt-2 line-clamp-2">{visit.summary}</p>
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
                    <h2 className="text-2xl font-headline">Nenhuma visita encontrada</h2>
                    <p className="text-muted-foreground mt-2 mb-4">
                        {allVisits.length > 0 ? 'Tente um termo de busca diferente.' : 'Agende a primeira visita na página de um cliente.'}
                    </p>
                </div>
            )}
        </div>
    );
}
