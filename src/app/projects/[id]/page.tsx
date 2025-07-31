

"use client";

import { notFound, useParams } from "next/navigation";
import { getProjectById, getClientById, getVisitById } from "@/lib/data";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, DollarSign, Edit, Link as LinkIcon, User, LoaderCircle, Camera, Image as ImageIcon, Wallet, Hourglass, Percent, CreditCard, ArrowLeft, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { cn, formatDate } from "@/lib/utils";
import Link from "next/link";
import type { Project, Client, Visit } from "@/lib/definitions";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Image from "next/image";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";


export default function ProjectDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!id) return;
    
    const fetchProjectData = async () => {
        setLoading(true);
        const projectData = await getProjectById(id);
        if (projectData) {
          setProject(projectData);
          setClient(await getClientById(projectData.clientId));
          if (projectData.visitId) {
              setVisit(await getVisitById(projectData.visitId));
          }
        } else {
          notFound();
        }
        setLoading(false);
    };
    
    fetchProjectData();
  }, [id]);

  if (loading || !project || !client) {
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
              <Dialog>
                <DialogTrigger asChild>
                  <div className="p-1 cursor-pointer">
                    <Card>
                      <CardContent className="flex aspect-video items-center justify-center p-0 overflow-hidden rounded-lg">
                        <Image data-ai-hint="organized room" src={photo.url} alt={photo.description} width={600} height={400} className="w-full h-full object-cover"/>
                      </CardContent>
                      <CardDescription className="p-4 truncate">{photo.description}</CardDescription>
                    </Card>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Visualização da Imagem</DialogTitle>
                     <DialogDescription>{photo.description}</DialogDescription>
                  </DialogHeader>
                  <div className="mt-4">
                     <Image data-ai-hint="organized room" src={photo.url} alt={photo.description} width={1200} height={800} className="w-full h-auto object-contain rounded-md"/>
                  </div>
                </DialogContent>
              </Dialog>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    );
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

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={project.name}>
          <Link href="/projects">
            <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
          </Link>
          <Link href={`/projects/${project.id}/edit`}>
            <Button><Edit className="mr-2 h-4 w-4" /> Editar Projeto</Button>
          </Link>
      </PageHeader>
      
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Detalhes do Projeto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-muted-foreground">{project.description || "Nenhuma descrição para este projeto."}</p>
                    <Separator/>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="flex items-center gap-3">
                            <Activity className="w-6 h-6 text-accent" />
                            <div>
                                <p className="text-sm font-semibold">Status do Projeto</p>
                                <Badge variant={'outline'} className={cn("capitalize mt-1", executionStatusColors[project.status] ?? 'border-border')}>
                                    {project.status}
                                </Badge>
                            </div>
                        </div>
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
                    </div>
                </CardContent>
              </Card>
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
          <div className="lg:col-span-1 space-y-8">
              <Card>
                  <CardHeader>
                      <CardTitle className="font-headline">Financeiro</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-md border">
                          <div>
                              <p className="text-sm text-muted-foreground">Status do Pagamento</p>
                              <Badge variant={'outline'} className={cn("capitalize mt-1", paymentStatusColors[project.paymentStatus] ?? 'border-border')}>
                                  {project.paymentStatus}
                              </Badge>
                          </div>
                           <div className="text-right">
                              <p className="text-sm text-muted-foreground">Valor Final</p>
                              <p className="font-bold text-lg">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(project.finalValue)}</p>
                          </div>
                      </div>
                       <div className="text-sm space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Valor Bruto</span>
                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(project.value)}</span>
                            </div>
                             <div className="flex justify-between text-destructive">
                                <span className="flex items-center gap-1"><Percent className="w-3 h-3"/> Desconto ({project.discountPercentage}%)</span>
                                <span>- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(project.discountAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground flex items-center gap-1"><CreditCard className="w-3 h-3"/> Meio de Pagamento</span>
                                <span className="font-medium">{project.paymentInstrument}</span>
                            </div>
                       </div>
                      <Separator/>
                      <div>
                          <h4 className="font-semibold mb-2">Parcelas</h4>
                          <div className="space-y-2">
                              {project.payments && project.payments.map(payment => (
                                  <div key={payment.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                                      <div className="flex items-center gap-2">
                                          {payment.status === 'pago' ? <CheckCircle className="w-4 h-4 text-green-500"/> : <Hourglass className="w-4 h-4 text-yellow-500"/>}
                                          <span>{payment.description}</span>
                                      </div>
                                       <span className="font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount)}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </CardContent>
              </Card>
          </div>
      </div>
    </div>
  );
}

    