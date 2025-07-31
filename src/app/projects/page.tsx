

"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjects, getClients } from "@/lib/data";
import { PlusCircle, Search, User, Phone, MapPin, Calendar, LoaderCircle } from "lucide-react";
import PageHeader from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import type { Project, Client } from '@/lib/definitions';
import { Input } from '@/components/ui/input';
import { cn, formatDate } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const projectStatusOptions = [
    "A iniciar",
    "Em andamento",
    "Pausado",
    "Atrasado",
    "Concluído",
    "Cancelado"
];
const paymentStatusOptions = [
    'pago', 
    'pendente', 
    'parcialmente pago'
];


export default function ProjectsPage() {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');


  useEffect(() => {
    const refetch = async () => {
      setLoading(true);
      const [projectsData, clientsData] = await Promise.all([getProjects(), getClients()]);
      
      const sortedProjects = projectsData.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      
      setAllProjects(sortedProjects);
      setClients(clientsData);
      setFilteredProjects(sortedProjects);
      setLoading(false);
    };
    refetch();

    window.addEventListener('focus', refetch);
    return () => window.removeEventListener('focus', refetch);
  }, []); 

   useEffect(() => {
    let results = allProjects.filter(project => {
        const clientMatch = (getClient(project.clientId)?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        let dateMatch = true;
        if (startDate && endDate) {
            const projectStart = new Date(project.startDate).getTime();
            const projectEnd = new Date(project.endDate).getTime();
            const filterStart = new Date(startDate).getTime();
            const filterEnd = new Date(endDate).getTime();
            // Check for overlap
            dateMatch = Math.max(projectStart, filterStart) <= Math.min(projectEnd, filterEnd);
        }

        const statusMatch = statusFilter === 'all' || project.status === statusFilter;
        const paymentStatusMatch = paymentStatusFilter === 'all' || project.paymentStatus === paymentStatusFilter;

        return clientMatch && dateMatch && statusMatch && paymentStatusMatch;
    });

    setFilteredProjects(results);
  }, [searchTerm, startDate, endDate, statusFilter, paymentStatusFilter, allProjects, clients]);


  const getClient = (clientId: string) => {
    return clients.find(c => c.id === clientId);
  }
  
  const paymentStatusColors: { [key: string]: string } = {
      pago: 'text-green-800 bg-green-100',
      pendente: 'text-yellow-800 bg-yellow-100',
      'parcialmente pago': 'text-blue-800 bg-blue-100',
  }

  const executionStatusColors: { [key: string]: string } = {
      'A iniciar': 'text-cyan-800 bg-cyan-100',
      'Em andamento': 'text-blue-800 bg-blue-100',
      'Pausado': 'text-orange-800 bg-orange-100',
      'Atrasado': 'text-red-800 bg-red-100',
      'Concluído': 'text-green-800 bg-green-100',
      'Cancelado': 'text-gray-800 bg-gray-100',
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
      <PageHeader title="Projetos">
        <Link href="/projects/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Projeto
          </Button>
        </Link>
      </PageHeader>
      
      <Card>
          <CardHeader>
              <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search-term">Cliente</Label>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-term"
                  type="text"
                  placeholder="Filtrar por nome do cliente..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="statusFilter">Status do Projeto</Label>
                 <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="statusFilter"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        {projectStatusOptions.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label htmlFor="paymentStatusFilter">Status Financeiro</Label>
                <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                    <SelectTrigger id="paymentStatusFilter"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        {paymentStatusOptions.map(status => (
                            <SelectItem key={status} value={status} className='capitalize'>{status}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="start-date">Período (Início)</Label>
                <Input id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="end-date">Período (Fim)</Label>
                <Input id="end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </CardContent>
      </Card>


      {filteredProjects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            const client = getClient(project.clientId);
            return (
                <Card key={project.id} className="flex flex-col">
                <CardHeader>
                    <CardTitle className="font-headline">{project.name}</CardTitle>
                    <CardDescription>
                        {client ? (
                             <div className='mt-2 space-y-1 text-sm text-muted-foreground'>
                                <div className='flex items-center gap-2 font-medium text-foreground'>
                                    <User className="w-3 h-3"/>
                                    <span>{client.name}</span>
                                </div>
                                <div className='flex items-center gap-2'>
                                    <Phone className="w-3 h-3"/>
                                    <span>{client.phone}</span>
                                </div>
                                <div className='flex items-center gap-2'>
                                    <MapPin className="w-3 h-3"/>
                                    <span className='truncate'>{client.address}</span>
                                </div>
                            </div>
                        ) : 'Cliente não encontrado'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.description || "Nenhuma descrição."}</p>
                    
                     <div className="flex items-start gap-3 text-sm rounded-lg border p-3">
                        <Calendar className="w-4 h-4 mt-1 text-muted-foreground" />
                        <div>
                            <p className="font-semibold">Período</p>
                            <p className="text-muted-foreground">
                                {formatDate(project.startDate)} - {formatDate(project.endDate)}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status do Projeto:</span>
                         <Badge variant={'outline'} className={cn("capitalize", executionStatusColors[project.status] ?? 'border-border')}>
                            {project.status}
                        </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status Financeiro:</span>
                         <Badge variant={'outline'} className={cn("capitalize", paymentStatusColors[project.paymentStatus] ?? 'border-border')}>
                            {project.paymentStatus}
                        </Badge>
                    </div>
                </CardContent>
                <CardFooter>
                    <Link href={`/projects/${project.id}`} className="w-full">
                    <Button variant="outline" className="w-full">
                        Gerenciar Projeto
                    </Button>
                    </Link>
                </CardFooter>
                </Card>
            )
          })}
        </div>
        ) : (
            <div className="text-center py-16 border-dashed border-2 rounded-lg">
                <h2 className="text-2xl font-headline">Nenhum projeto encontrado</h2>
                <p className="text-muted-foreground mt-2 mb-4">
                    {allProjects.length > 0 ? 'Tente um termo de busca ou filtro diferente.' : 'Crie seu primeiro projeto para começar a organizar.'}
                </p>
                 {allProjects.length === 0 && (
                     <Link href="/projects/new">
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Adicionar Projeto
                        </Button>
                    </Link>
                 )}
            </div>
      )}
    </div>
  );
}

