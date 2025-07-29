
"use client";

import { notFound, useRouter } from "next/navigation";
import { getProjectById, getClientById, getVisitById } from "@/lib/data";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, DollarSign, Edit, Link as LinkIcon, User, LoaderCircle, Camera, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useState, use } from "react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import type { Project, Client, Visit } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Image from "next/image";


export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
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
    return <div className="flex items-center justify-center h-full"><LoaderCircle className="w-8 h-8 animate-spin" /></div>;
  }

  const renderPhotoCarousel = (photos: Project['photosBefore'] | Project['photosAfter'], title: string, emptyMessage: string) => {
    if (!photos || photos.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8 border-dashed border-2 rounded-lg">
          <ImageIcon className="mx-auto w-8 h-8 mb-2" />
          <p>{emptyMessage}</p>
        </div>
      );
    }
    return (
      <Carousel className="w-full max-w-xl mx-auto">
        <CarouselContent>
          {photos.map((photo) => (
            <CarouselItem key={photo.id}>
              <div className="p-1">
                <Card>
                  <CardContent className="flex aspect-video items-center justify-center p-0 overflow-hidden rounded-lg">
                    <Image data-ai-hint="organized room" src={photo.url} alt={photo.description} width={600} height={400} className="w-full h-full object-cover"/>
                  </CardContent>
                  <CardDescription className="p-4">{photo.description}</CardDescription>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={project.name}>
          <Link href={`/projects/${project.id}/edit`}>
            <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Editar Projeto</Button>
          </Link>
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
                                {new Date(visit.date).toLocaleDateString('pt-BR')}
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Fotos: Antes</CardTitle>
            </CardHeader>
            <CardContent>
                {renderPhotoCarousel(project.photosBefore, "Fotos de Antes", "Nenhuma foto de 'antes' foi adicionada.")}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Fotos: Depois</CardTitle>
            </CardHeader>
            <CardContent>
                {renderPhotoCarousel(project.photosAfter, "Fotos de Depois", "Nenhuma foto de 'depois' foi adicionada.")}
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
