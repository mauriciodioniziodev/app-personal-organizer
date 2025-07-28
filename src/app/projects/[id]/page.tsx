"use client";

import { notFound, useRouter } from "next/navigation";
import { getProjectById, getClientById, getVisitById } from "@/lib/data";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, DollarSign, Edit, Link as LinkIcon, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { use, useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import type { Project, Client, Visit } from "@/lib/definitions";


export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [visit, setVisit] = useState<Visit | null>(null);

  useEffect(() => {
    const projectData = getProjectById(id);
    if (projectData) {
      setProject(projectData);
      setClient(getClientById(projectData.clientId) ?? null);
      if (projectData.visitId) {
          setVisit(getVisitById(projectData.visitId) ?? null);
      }
    } else {
      notFound();
    }
  }, [id]);


  if (!project || !client) {
    return <div>Carregando...</div>;
  }


  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={project.name}>
          <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Editar Projeto</Button>
      </PageHeader>
      
      <Card>
        <CardHeader>
            <CardTitle className="font-headline text-2xl">Detalhes do Projeto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <p className="text-muted-foreground">{project.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex items-center gap-3">
                    <User className="w-6 h-6 text-accent" />
                    <div>
                        <p className="text-sm font-semibold">Cliente</p>
                        <Link href={`/clients/${client.id}`} className="text-sm text-muted-foreground hover:underline">{client.name}</Link>
                    </div>
                </div>
                 {visit && (
                    <div className="flex items-center gap-3">
                        <LinkIcon className="w-6 h-6 text-accent" />
                        <div>
                            <p className="text-sm font-semibold">Visita Originadora</p>
                            <Link href={`/visits/${visit.id}`} className="text-sm text-muted-foreground hover:underline">
                                {formatDate(visit.date)}
                            </Link>
                        </div>
                    </div>
                 )}
                <div className="flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-accent" />
                    <div>
                        <p className="text-sm font-semibold">Início</p>
                        <p className="text-sm text-muted-foreground">{formatDate(project.startDate)}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-accent" />
                    <div>
                        <p className="text-sm font-semibold">Término</p>
                        <p className="text-sm text-muted-foreground">{formatDate(project.endDate)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <DollarSign className="w-6 h-6 text-accent" />
                    <div>
                        <p className="text-sm font-semibold">Valor</p>
                        <p className="text-sm text-muted-foreground">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(project.value)}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-accent" />
                    <div>
                        <p className="text-sm font-semibold">Pagamento</p>
                         <Badge variant={project.paymentStatus === 'pago' ? 'default' : 'secondary'} className={project.paymentStatus === 'pago' ? 'bg-accent text-accent-foreground capitalize' : 'capitalize'}>
                            {project.paymentStatus}
                        </Badge>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
