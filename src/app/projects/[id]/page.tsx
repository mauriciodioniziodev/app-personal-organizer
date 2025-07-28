"use client";

import { notFound } from "next/navigation";
import { getProjectById, getClientById, getVisitsByProjectId, getPhotosByProjectId } from "@/lib/data";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, Clock, DollarSign, Edit, Image as ImageIcon, LoaderCircle, Plus, Send, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import { createVisit, createPhoto } from "@/lib/actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : children}</Button>;
}

export default function ProjectDetailsPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const project = getProjectById(id);
  const { toast } = useToast();

  const visitFormRef = useRef<HTMLFormElement>(null);
  const photoFormRef = useRef<HTMLFormElement>(null);

  const [visitFormState, dispatchVisit] = useActionState(createVisit, { message: null });
  const [photoFormState, dispatchPhoto] = useActionState(createPhoto, { message: null });

   useEffect(() => {
    if (visitFormState?.message) {
      toast({ title: visitFormState.message });
      if(visitFormState.message.includes('sucesso')) visitFormRef.current?.reset();
    }
  }, [visitFormState, toast]);

   useEffect(() => {
    if (photoFormState?.message) {
      toast({ title: photoFormState.message });
      if(photoFormState.message.includes('sucesso')) photoFormRef.current?.reset();
    }
  }, [photoFormState, toast]);

  if (!project) {
    notFound();
  }

  const client = getClientById(project.clientId);
  const visits = getVisitsByProjectId(project.id);
  const photos = getPhotosByProjectId(project.id);
  const beforePhotos = photos.filter(p => p.type === 'antes');
  const afterPhotos = photos.filter(p => p.type === 'depois');

  const visitStatusIcons = {
    pendente: <Clock className="w-4 h-4 text-yellow-500" />,
    realizada: <CheckCircle className="w-4 h-4 text-green-500" />,
    cancelada: <XCircle className="w-4 h-4 text-red-500" />,
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={project.name}>
          <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Editar Projeto</Button>
      </PageHeader>
      
      <Card>
        <CardHeader>
            <CardTitle className="font-headline text-2xl">Detalhes do Projeto</CardTitle>
            <CardDescription>Cliente: {client?.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <p className="text-muted-foreground">{project.description}</p>
            <div className="flex flex-wrap gap-x-8 gap-y-4">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-accent" />
                    <div>
                        <p className="text-sm font-semibold">Início</p>
                        <p className="text-sm text-muted-foreground">{new Date(project.startDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-accent" />
                    <div>
                        <p className="text-sm font-semibold">Término</p>
                        <p className="text-sm text-muted-foreground">{new Date(project.endDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-accent" />
                    <div>
                        <p className="text-sm font-semibold">Valor</p>
                        <p className="text-sm text-muted-foreground">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(project.value)}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-accent" />
                    <div>
                        <p className="text-sm font-semibold">Pagamento</p>
                         <Badge variant={project.paymentStatus === 'pago' ? 'default' : 'secondary'} className={project.paymentStatus === 'pago' ? 'bg-accent text-accent-foreground' : ''}>
                            {project.paymentStatus}
                        </Badge>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="visits">
        <TabsList>
            <TabsTrigger value="visits">Visitas</TabsTrigger>
            <TabsTrigger value="photos">Fotos (Antes/Depois)</TabsTrigger>
        </TabsList>
        <TabsContent value="visits" className="mt-6">
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <h3 className="text-xl font-headline mb-4">Histórico de Visitas</h3>
                    <div className="space-y-4">
                        {visits.length > 0 ? visits.map(visit => (
                            <Card key={visit.id}>
                                <CardContent className="p-4 flex items-start gap-4">
                                    <div className="p-2 bg-muted rounded-full mt-1">
                                        {visitStatusIcons[visit.status]}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{new Date(visit.date).toLocaleDateString('pt-BR', { dateStyle: 'full' })} às {new Date(visit.date).toLocaleTimeString('pt-BR', { timeStyle: 'short' })}</p>
                                        <p className="text-sm text-muted-foreground">{visit.summary}</p>
                                        <Badge variant="outline" className="mt-2 capitalize">{visit.status}</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        )) : <p className="text-muted-foreground text-center py-8">Nenhuma visita registrada.</p>}
                    </div>
                </div>
                <div>
                     <h3 className="text-xl font-headline mb-4">Agendar Nova Visita</h3>
                     <Card>
                        <CardContent className="p-4">
                            <form ref={visitFormRef} action={dispatchVisit} className="space-y-4">
                                <input type="hidden" name="projectId" value={project.id} />
                                <div>
                                    <Label htmlFor="date">Data e Hora</Label>
                                    <Input id="date" name="date" type="datetime-local" />
                                    {visitFormState?.errors?.date && <p className="text-sm text-destructive">{visitFormState.errors.date}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="summary">Resumo</Label>
                                    <Textarea id="summary" name="summary" placeholder="O que foi feito ou discutido?"/>
                                    {visitFormState?.errors?.summary && <p className="text-sm text-destructive">{visitFormState.errors.summary}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="status">Status</Label>
                                    <Select name="status" defaultValue="pendente">
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pendente">Pendente</SelectItem>
                                            <SelectItem value="realizada">Realizada</SelectItem>
                                            <SelectItem value="cancelada">Cancelada</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <SubmitButton><Plus className="mr-2 h-4 w-4"/> Adicionar Visita</SubmitButton>
                            </form>
                        </CardContent>
                     </Card>
                </div>
            </div>
        </TabsContent>
        <TabsContent value="photos" className="mt-6">
             <div className="grid md:grid-cols-3 gap-8">
                 <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-xl font-headline mb-4">Antes</h3>
                        <div className="space-y-4">
                            {beforePhotos.length > 0 ? beforePhotos.map(photo => (
                                <Card key={photo.id} className="overflow-hidden">
                                    <Image data-ai-hint="cluttered room" src={photo.url} alt={photo.description} width={400} height={300} className="w-full h-auto object-cover"/>
                                    <p className="p-4 text-sm text-muted-foreground">{photo.description}</p>
                                </Card>
                            )) : <p className="text-muted-foreground text-center py-8">Nenhuma foto de "antes".</p>}
                        </div>
                    </div>
                     <div>
                        <h3 className="text-xl font-headline mb-4">Depois</h3>
                        <div className="space-y-4">
                            {afterPhotos.length > 0 ? afterPhotos.map(photo => (
                                <Card key={photo.id} className="overflow-hidden">
                                     <Image data-ai-hint="organized room" src={photo.url} alt={photo.description} width={400} height={300} className="w-full h-auto object-cover"/>
                                     <p className="p-4 text-sm text-muted-foreground">{photo.description}</p>
                                </Card>
                            )) : <p className="text-muted-foreground text-center py-8">Nenhuma foto de "depois".</p>}
                        </div>
                    </div>
                 </div>
                 <div>
                     <h3 className="text-xl font-headline mb-4">Adicionar Foto</h3>
                     <Card>
                        <CardContent className="p-4">
                             <form ref={photoFormRef} action={dispatchPhoto} className="space-y-4">
                                <input type="hidden" name="projectId" value={project.id} />
                                <div>
                                    <Label htmlFor="url">URL da Imagem</Label>
                                    <Input id="url" name="url" placeholder="https://..."/>
                                    {photoFormState?.errors?.url && <p className="text-sm text-destructive">{photoFormState.errors.url}</p>}
                                </div>
                                 <div>
                                    <Label htmlFor="description">Descrição</Label>
                                    <Textarea id="description" name="description" placeholder="Descreva a foto"/>
                                     {photoFormState?.errors?.description && <p className="text-sm text-destructive">{photoFormState.errors.description}</p>}
                                </div>
                                <div>
                                    <Label>Tipo</Label>
                                     <Select name="type" defaultValue="antes">
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="antes">Antes</SelectItem>
                                            <SelectItem value="depois">Depois</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <SubmitButton><ImageIcon className="mr-2 h-4 w-4"/>Adicionar Foto</SubmitButton>
                            </form>
                        </CardContent>
                     </Card>
                 </div>
             </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
