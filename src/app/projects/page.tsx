
"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjects, getClients } from "@/lib/data";
import { PlusCircle, Search } from "lucide-react";
import PageHeader from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import type { Project, Client } from '@/lib/definitions';
import { Input } from '@/components/ui/input';

export default function ProjectsPage() {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const refetch = () => {
      const projectsData = getProjects();
      const clientsData = getClients();
      setAllProjects(projectsData);
      setClients(clientsData);

      // Re-aplica o filtro com os dados atualizados
      setFilteredProjects(
        projectsData.filter(project =>
            (clientsData.find(c => c.id === project.clientId)?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    };
    refetch(); // Initial fetch

    window.addEventListener('focus', refetch);
    return () => window.removeEventListener('focus', refetch);
  }, [searchTerm]); // Apenas o searchTerm deve ser dependencia aqui, para refetch manual

   useEffect(() => {
    const results = allProjects.filter(project =>
        getClientName(project.clientId).toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProjects(results);
  }, [searchTerm, allProjects, clients]);


  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || "Cliente não encontrado";
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
          {filteredProjects.map((project) => (
            <Card key={project.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="font-headline">{project.name}</CardTitle>
                <CardDescription>
                  Cliente: {getClientName(project.clientId)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">{project.description || "Nenhuma descrição."}</p>
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
          ))}
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
