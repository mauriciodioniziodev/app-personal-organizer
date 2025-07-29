
"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjects, getClients } from "@/lib/data";
import { PlusCircle } from "lucide-react";
import PageHeader from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import type { Project, Client } from '@/lib/definitions';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    const refetch = () => {
      setProjects(getProjects());
      setClients(getClients());
    };
    refetch(); // Initial fetch

    window.addEventListener('focus', refetch);
    return () => window.removeEventListener('focus', refetch);
  }, []);

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
      
      {projects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
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
                <h2 className="text-2xl font-headline">Nenhum projeto cadastrado</h2>
                <p className="text-muted-foreground mt-2 mb-4">Crie seu primeiro projeto para começar a organizar.</p>
                <Link href="/projects/new">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Projeto
                    </Button>
                </Link>
            </div>
      )}
    </div>
  );
}
