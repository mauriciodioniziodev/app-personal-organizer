

"use client";

import { useEffect, useState } from 'react';
import { getVisits, getProjects, getClients, getVisitStatusOptions } from '@/lib/data';
import type { Visit, Project, Client, MasterDataItem } from '@/lib/definitions';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CalendarPlus, Search, Phone, MapPin, LoaderCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, formatDateTime } from '@/lib/utils';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

const VISITS_PER_PAGE = 20;

export default function VisitsPage() {
    const [allVisits, setAllVisits] = useState<Visit[]>([]);
    const [filteredVisits, setFilteredVisits] = useState<Visit[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [masterVisitStatus, setMasterVisitStatus] = useState<MasterDataItem[]>([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [visitsData, clientsData, projectsData, statusOptions] = await Promise.all([
                    getVisits(),
                    getClients(),
                    getProjects(),
                    getVisitStatusOptions()
                ]);
                
                const sortedVisits = visitsData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                setAllVisits(sortedVisits);
                setFilteredVisits(sortedVisits);
                setClients(clientsData);
                setProjects(projectsData);
                setMasterVisitStatus(statusOptions);
            } catch (error) {
                console.error("Failed to fetch page data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (loading) return; 

        const getClientName = (clientId: string) => {
            return clients.find(c => c.id === clientId)?.name || '';
        }
        
        let results = [...allVisits];

        if (statusFilter !== 'all') {
            results = results.filter(visit => visit.status === statusFilter);
        }

        if (searchTerm) {
            results = results.filter(visit => 
                getClientName(visit.clientId).toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        setFilteredVisits(results);
        setCurrentPage(1); // Reset to first page on new filter
    }, [searchTerm, statusFilter, allVisits, clients, loading]);


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
    
    const totalPages = Math.ceil(filteredVisits.length / VISITS_PER_PAGE);
    const paginatedVisits = filteredVisits.slice(
        (currentPage - 1) * VISITS_PER_PAGE,
        currentPage * VISITS_PER_PAGE
    );

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
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
                                <SelectItem key={status.id} value={status.name} className="capitalize">{status.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {paginatedVisits.length > 0 ? (
                <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {paginatedVisits.map(visit => {
                        const projectName = getProjectName(visit.projectId);
                        const client = clients.find(c => c.id === visit.clientId);
                        const { date, time } = (() => {
                             const d = new Date(visit.date);
                             return {
                                 date: d.toLocaleDateString('pt-BR', { timeZone: 'UTC', dateStyle: 'long' }),
                                 time: d.toLocaleTimeString('pt-BR', { timeZone: 'UTC', timeStyle: 'short' }),
                             }
                        })();

                        return (
                        <Card key={visit.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="font-headline text-xl">
                                    {date}
                                </CardTitle>
                                <CardDescription>
                                    {time}
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
                 {totalPages > 1 && (
                    <Pagination>
                        <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} aria-disabled={currentPage === 1}/>
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <PaginationItem key={page}>
                                    <PaginationLink href="#" onClick={(e) => {e.preventDefault(); handlePageChange(page)}} isActive={currentPage === page}>
                                        {page}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                        <PaginationItem>
                            <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} aria-disabled={currentPage === totalPages}/>
                        </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                )}
                </>
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
