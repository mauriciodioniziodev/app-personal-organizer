
"use client";

import { useEffect, useState } from 'react';
import { getVisits, getProjects, getClients, getMasterData } from '@/lib/data';
import type { Visit, Project, Client } from '@/lib/definitions';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CalendarPlus, Search, Phone, MapPin, LoaderCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function VisitsPage() {
    const [allVisits, setAllVisits] = useState<Visit[]>([]);
    const [filteredVisits, setFilteredVisits] = useState<Visit[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    const { visitStatus: masterVisitStatus } = getMasterData();
    
    useEffect(() => {
        const refetch = async () => {
            setLoading(true);
            const [visitsData, clientsData, projectsData] = await Promise.all([
                getVisits(),
                getClients(),
                getProjects()
            ]);
            
            const sortedVisits = visitsData.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            setAllVisits(sortedVisits);
            setClients(clientsData);
            setProjects(projectsData);
            setLoading(false);
        };
        refetch();

        const handleFocus = () => refetch();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    useEffect(() => {
        // Ensure clients data is loaded before filtering
        if (clients.length === 0 && allVisits.length > 0) {
            setFilteredVisits(allVisits); // Show all visits initially if clients aren't loaded yet
            return;
        }

        const getClient = (clientId: string) => clients.find(c => c.id === clientId);
        
        const results = allVisits.filter(visit => {
            const clientNameMatch = (getClient(visit.clientId)?.name || 'Desconhecido').toLowerCase().includes(searchTerm.toLowerCase());
            const statusMatch = statusFilter === 'all' ? true : visit.status === statusFilter;
            return clientNameMatch && statusMatch;
        });

        setFilteredVisits(results);
    }, [searchTerm, statusFilter, allVisits, clients]);


    const getProjectName = (projectId?: string) => {
        if (!projectId) return undefined;
        return projects.find(p => p.id === projectId)?.name;
    }
    
    const visitStatusColors: { [key: string]: string } = {
      pendente: 'text-yellow-800 bg-yellow-100',
      realizada: 'text-green-800 bg-green-100',
      cancelada: 'text-red-800 bg-red-100',
      orçamento: 'text-blue-800 bg-blue-100',
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
            <PageHeader title="Agenda de Visitas">
                 <Link href="/visits/new">
                    <Button>
                        <CalendarPlus className="mr-2 h-4 w-4" />
                        Adicionar Visita
                    </Button>
                </Link>
            </PageHeader>

            <div className="flex flex-col sm:flex-row gap-4">
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
                 <div className="w-full sm:w-[200px]">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filtrar por status..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Status</SelectItem>
                            {masterVisitStatus.map(status => (
                                <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {filteredVisits.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredVisits.map(visit => {
                        const projectName = getProjectName(visit.projectId);
                        const client = clients.find(c => c.id === visit.clientId);
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
                                    {client ? (
                                        <div className="space-y-1 mt-1">
                                            <p className="font-medium">{client.name}</p>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Phone className="w-3 h-3" />
                                                <span>{client.phone}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <MapPin className="w-3 h-3" />
                                                <span className="truncate">{client.address}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p>Desconhecido</p>
                                    )}
                                </div>
                                 <div>
                                    <p className="text-sm font-semibold text-muted-foreground">Status</p>
                                    <Badge variant="outline" className={cn("capitalize", visitStatusColors[visit.status] ?? 'border-border')}>
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
                        {allVisits.length > 0 ? 'Tente um termo de busca ou filtro diferente.' : 'Agende a primeira visita na página de um cliente.'}
                    </p>
                </div>
            )}
        </div>
    );
}
