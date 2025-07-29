
"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getClientById, getProjectsByClientId, getVisitsByClientId } from "@/lib/data";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, FolderKanban, CalendarPlus, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import PreferenceAnalyzer from "@/components/client-preference-analyzer";
import type { Client, Project, Visit } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { VisitForm } from "@/components/visit-form";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";


export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const router = useRouter();

  const [client, setClient] = useState<Client | undefined>(undefined);
  const [projects, setProjects] = useState<Project[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isVisitFormOpen, setIsVisitFormOpen] = useState(false);
  
  useEffect(() => {
      const clientData = getClientById(id);
      if (clientData) {
          setClient(clientData);
          setProjects(getProjectsByClientId(clientData.id));
          setVisits(getVisitsByClientId(clientData.id));
      } else {
         toast({
            variant: "destructive",
            title: "Cliente não encontrado",
            description: "O cliente que você está tentando acessar não existe.",
         });
         router.push('/clients');
      }
  }, [id, router, toast]);

  const handleVisitCreated = (newVisit: Visit) => {
    setVisits(prev => [newVisit, ...prev].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setIsVisitFormOpen(false);
    toast({
        title: "Visita Agendada!",
        description: "A nova visita foi salva com sucesso.",
    });
  }

  if (!client) {
    return (
        <div className="flex items-center justify-center h-full">
            <LoaderCircle className="w-8 h-8 animate-spin" />
        </div>
    );
  }
  
  const allClientNotes = `
    Preferências: ${client.preferences}
    ${visits.map(v => `
      Visita em ${new Date(v.date).toLocaleDateString('pt-BR')}:
      - Resumo: ${v.summary}
      - Fotos: ${v.photos.map(p => p.description).join(', ')}
    `).join('')}
     ${projects.map(p => `
      Projeto "${p.name}":
      - Descrição: ${p.description}
    `).join('')}
  `;
  
  const visitStatusColors: { [key: string]: string } = {
      pendente: 'text-yellow-800 bg-yellow-100',
      realizada: 'text-green-800 bg-green-100',
      cancelada: 'text-red-800 bg-red-100',
      orçamento: 'text-blue-800 bg-blue-100',
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={client.name}>
        <Dialog open={isVisitFormOpen} onOpenChange={setIsVisitFormOpen}>
            <DialogTrigger asChild>
                <Button>
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Agendar Visita
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Agendar Nova Visita</DialogTitle>
                </DialogHeader>
                <VisitForm clientId={client.id} onVisitCreated={handleVisitCreated} />
            </DialogContent>
        </Dialog>
      </PageHeader>
      
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Informações de Contato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <span>{client.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-muted-foreground" />
                        <span>{client.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground" />
                        <span>{client.address}</span>
                    </div>
                </CardContent>
            </Card>

            <PreferenceAnalyzer clientName={client.name} clientDetails={allClientNotes} />

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Histórico de Visitas</CardTitle>
                </CardHeader>
                <CardContent>
                    {visits.length > 0 ? (
                        <ul className="space-y-4">
                            {visits.map(visit => (
                                <li key={visit.id}>
                                    <Link href={`/visits/${visit.id}`} className="block p-4 rounded-lg border hover:bg-muted transition-colors">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-semibold">{new Date(visit.date).toLocaleDateString('pt-BR', { dateStyle: 'long'})}</h4>
                                             <Badge variant="outline" className={cn("capitalize", visitStatusColors[visit.status] ?? 'border-border')}>
                                                {visit.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{visit.summary}</p>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">Nenhuma visita agendada para este cliente.</p>
                    )}
                </CardContent>
            </Card>

        </div>
        
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <FolderKanban className="w-6 h-6"/>
                        Projetos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {projects.length > 0 ? (
                        <ul className="space-y-4">
                            {projects.map(project => (
                                <li key={project.id}>
                                    <Link href={`/projects/${project.id}`} className="block p-4 rounded-lg border hover:bg-muted transition-colors">
                                        <h4 className="font-semibold">{project.name}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Status: <span className="capitalize font-medium">{project.paymentStatus}</span>
                                        </p>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">Nenhum projeto para este cliente.</p>
                    )}
                     <Link href="/projects/new" className="w-full">
                        <Button variant="outline" className="w-full mt-4">
                            Novo Projeto
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
