
"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjects, getClients } from "@/lib/data";
import { PlusCircle, Search, User, Phone, MapPin, Calendar } from "lucide-react";
import PageHeader from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import type { Project, Client } from '@/lib/definitions';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';

export default function ProjectsPage() {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const refetch = () => {
      const projectsData = getProjects().sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      const clientsData = getClients();
      setAllProjects(projectsData);
      setClients(clientsData);

      setFilteredProjects(
        projectsData.filter(project =>
            (clientsData.find(c => c.id === project.clientId)?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    };
    refetch();

    window.addEventListener('focus', refetch);
    return () => window.removeEventListener('focus', refetch);
  }, [searchTerm]); 

   useEffect(() => {
    const results = allProjects.filter(project =>
        (getClient(project.clientId)?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProjects(results);
  }, [searchTerm, allProjects, clients]);


  const getClient = (clientId: string) => {
    return clients.find(c => c.id === clientId);
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
                        <span className="text-muted-foreground">Valor:</span>
                        <span className="font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(project.value)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={project.paymentStatus === 'pago' ? 'default' : 'secondary'} className={project.paymentStatus === 'pago' ? 'bg-accent text-accent-foreground capitalize' : 'capitalize'}>
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
                    {allProjects.length > 0 ? 'Tente um termo de busca diferente.' : 'Crie seu primeiro projeto para começar a organizar.'}
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
