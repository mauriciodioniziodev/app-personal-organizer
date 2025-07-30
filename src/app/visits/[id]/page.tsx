
"use client";

import { useEffect, useState, useRef, FormEvent, use, Suspense } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { getVisitById, getClientById, getProjectById, addPhotoToVisit, updateVisit, getMasterData, addBudgetToVisit } from '@/lib/data';
import type { Visit, Client, Project, Photo } from '@/lib/definitions';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar, User, FileText, CheckCircle, Clock, XCircle, ArrowRight, Camera, Upload, Image as ImageIcon, LoaderCircle, X, DollarSign, FileUp, Download, Edit } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Textarea } from '@/components/ui/textarea';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Image from 'next/image';
import { z } from 'zod';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';


const photoSchema = z.object({
    visitId: z.string(),
    url: z.string().min(1, "Por favor, capture ou envie uma imagem."),
    description: z.string().min(3, "Descrição é obrigatória."),
    type: z.string(),
});

function VisitDetailsPageContent({ id }: { id: string }) {
    const router = useRouter();
    const { toast } = useToast();

    const [visit, setVisit] = useState<Visit | null>(null);
    const [client, setClient] = useState<Client | null>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [isCaptureOpen, setCaptureOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    
    const photoFormRef = useRef<HTMLFormElement>(null);
    const [isSubmittingPhoto, setIsSubmittingPhoto] = useState(false);
    const [photoErrors, setPhotoErrors] = useState<Record<string, string[]>>({});

    const [isSubmittingBudget, setIsSubmittingBudget] = useState(false);
    const [budgetErrors, setBudgetErrors] = useState<string | null>(null);


    const { visitStatus: masterVisitStatus } = getMasterData();
    

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const visitData = await getVisitById(id);

            if (!visitData) {
                notFound();
                return;
            }
            
            setVisit(visitData);
            setClient(await getClientById(visitData.clientId) ?? null);
            if (visitData.projectId) {
                setProject(await getProjectById(visitData.projectId) ?? null);
            }
            
            setLoading(false);
        }
        fetchData();
    }, [id]);

    useEffect(() => {
        if (!isCaptureOpen) {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
            return;
        }

        const getCameraPermission = async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({video: true});
            setHasCameraPermission(true);

            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            toast({
              variant: 'destructive',
              title: 'Acesso à Câmera Negado',
              description: 'Por favor, habilite a permissão da câmera nas configurações do seu navegador.',
            });
          }
        };

        getCameraPermission();
      }, [isCaptureOpen, toast]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUrl = canvas.toDataURL('image/png');
            setCapturedImage(dataUrl);
            setUploadedImage(null);
        }
    }

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
                setCapturedImage(null);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handlePhotoSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmittingPhoto(true);
        setPhotoErrors({});
        
        const formData = new FormData(event.currentTarget);
        const imageUri = capturedImage || uploadedImage;
        
        const photoData = {
            visitId: formData.get("visitId") as string,
            url: imageUri ?? "",
            description: formData.get("description") as string,
            type: formData.get("type") as string
        }

        const validationResult = photoSchema.safeParse(photoData);

        if (!validationResult.success) {
            setPhotoErrors(validationResult.error.flatten().fieldErrors);
            setIsSubmittingPhoto(false);
            return;
        }

        try {
            await addPhotoToVisit(validationResult.data);
            toast({ title: "Sucesso!", description: "Foto adicionada com sucesso" });
            setVisit(await getVisitById(id) ?? null); // Refetch visit data to show new photo
            if(photoFormRef.current) {
                photoFormRef.current.reset();
            }
            setCapturedImage(null);
            setUploadedImage(null);
        } catch (error) {
             toast({ variant: 'destructive', title: "Erro ao Adicionar Foto", description: "Ocorreu um erro ao salvar a foto." });
        } finally {
            setIsSubmittingPhoto(false);
        }
    }

    const handleStatusChange = async (newStatus: string) => {
        if (!visit) return;
        try {
            const updatedVisit = await updateVisit({ ...visit, status: newStatus });
            setVisit(updatedVisit);
            toast({
                title: 'Status Atualizado!',
                description: `O status da visita foi alterado para "${newStatus}".`
            });
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Erro ao Atualizar',
                description: (error as Error).message
            });
        }
    };
    
    const handleBudgetSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!visit) return;
        setBudgetErrors(null);
        setIsSubmittingBudget(true);

        const formData = new FormData(event.currentTarget);
        const amount = formData.get('budgetAmount') as string;
        const file = formData.get('budgetPdf') as File;

        if (!amount || Number(amount) <= 0) {
            setBudgetErrors("O valor do orçamento é obrigatório.");
            setIsSubmittingBudget(false);
            return;
        }
        if (!file || file.size === 0) {
            setBudgetErrors("O arquivo PDF do orçamento é obrigatório.");
            setIsSubmittingBudget(false);
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const pdfDataUrl = reader.result as string;
            try {
                const updatedVisit = await addBudgetToVisit(visit.id, Number(amount), pdfDataUrl);
                setVisit(updatedVisit);
                toast({ title: 'Sucesso!', description: 'Orçamento adicionado com sucesso.'});
            } catch(e) {
                toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar o orçamento.'});
            } finally {
                setIsSubmittingBudget(false);
            }
        }
        reader.onerror = () => {
            setBudgetErrors("Erro ao ler o arquivo PDF.");
            setIsSubmittingBudget(false);
        }
    }


    if (loading || !visit || !client) {
        return <div className="flex items-center justify-center h-full"><LoaderCircle className="w-8 h-8 animate-spin" /></div>;
    }

    const visitStatusIcons: { [key: string]: React.ReactNode } = {
        pendente: <Clock className="w-4 h-4 text-yellow-500" />,
        realizada: <CheckCircle className="w-4 h-4 text-green-500" />,
        cancelada: <XCircle className="w-4 h-4 text-red-500" />,
        orçamento: <FileText className="w-4 h-4 text-blue-500" />,
    };

    return (
        <div className="flex flex-col gap-8">
            <PageHeader title={!client ? "Carregando Visita..." : `Visita: ${client.name}`}>
                 <Link href={`/visits/${visit.id}/edit`}>
                    <Button variant="outline">
                        <Edit className="mr-2 h-4 w-4" />
                        Editar Visita
                    </Button>
                </Link>
            </PageHeader>
            
            <div className="grid lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-3 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Detalhes da Visita</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <Label className="text-sm font-semibold">Status</Label>
                                    <Select value={visit.status} onValueChange={handleStatusChange}>
                                        <SelectTrigger className="w-full sm:w-[200px] mt-1 capitalize">
                                            <div className="flex items-center gap-2">
                                                {visitStatusIcons[visit.status]}
                                                <SelectValue />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {masterVisitStatus.map(status => (
                                                <SelectItem key={status} value={status} className="capitalize">
                                                    {status}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                     <Label className="text-sm font-semibold">Cliente</Label>
                                     <div className="flex items-center gap-2 mt-2">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                        <Link href={`/clients/${client.id}`} className="font-medium text-primary hover:underline">{client.name}</Link>
                                    </div>
                                </div>
                                 <div>
                                     <Label className="text-sm font-semibold">Data</Label>
                                     <div className="flex items-center gap-2 mt-2">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        <p>{new Date(visit.date).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}</p>
                                    </div>
                                 </div>
                            </div>
                           
                            <div>
                                <h4 className="font-semibold mb-2 mt-4">Resumo</h4>
                                <p className="text-muted-foreground whitespace-pre-wrap">{visit.summary}</p>
                            </div>
                           
                            {!project && visit.status !== 'cancelada' && (
                                <div className="pt-4">
                                     <Link href={`/projects/new?fromVisit=${visit.id}`}>
                                        <Button>
                                            <ArrowRight className="mr-2 h-4 w-4" />
                                            Criar Projeto a partir desta Visita
                                        </Button>
                                    </Link>
                                </div>
                            )}
                             {project && (
                                <div className="pt-4">
                                    <h4 className="font-semibold mb-2">Projeto Associado</h4>
                                    <Link href={`/projects/${project.id}`} className="font-medium text-primary hover:underline">
                                        {project.name}
                                    </Link>
                                </div>
                            )}

                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                <div className="md:col-span-2 space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Fotos da Visita</CardTitle>
                            <CardDescription>Imagens registradas durante a visita.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {visit.photos && visit.photos.length > 0 ? (
                                <Carousel className="w-full max-w-xl mx-auto">
                                    <CarouselContent>
                                        {visit.photos.map((photo) => (
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
                            ) : (
                                <p className="text-muted-foreground text-center py-8">Nenhuma foto adicionada a esta visita.</p>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Orçamento da Visita</CardTitle>
                            <CardDescription>Anexe o orçamento em PDF e o valor proposto.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {visit.budgetPdfUrl && visit.budgetAmount ? (
                                <div className='space-y-4'>
                                    <div className="flex items-center gap-3">
                                        <DollarSign className="w-6 h-6 text-accent" />
                                        <div>
                                            <p className="text-sm font-semibold">Valor</p>
                                            <p className="text-lg font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(visit.budgetAmount)}</p>
                                        </div>
                                    </div>
                                    <a href={visit.budgetPdfUrl} download={`orcamento-${client.name.replace(/\s/g, '_')}-${visit.id}.pdf`} target="_blank" rel="noopener noreferrer">
                                        <Button variant="outline">
                                            <Download className="mr-2" />
                                            Baixar Orçamento em PDF
                                        </Button>
                                    </a>
                                </div>
                            ) : (
                                <form onSubmit={handleBudgetSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="budgetAmount">Valor do Orçamento (R$)</Label>
                                        <Input id="budgetAmount" name="budgetAmount" type="number" step="0.01" placeholder="1200.00" />
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="budgetPdf">Arquivo do Orçamento (PDF)</Label>
                                        <Input id="budgetPdf" name="budgetPdf" type="file" accept="application/pdf" />
                                    </div>
                                    {budgetErrors && <p className="text-sm text-destructive">{budgetErrors}</p>}
                                    <Button type="submit" disabled={isSubmittingBudget}>
                                        {isSubmittingBudget ? <LoaderCircle className="mr-2 animate-spin" /> : <FileUp className="mr-2" />}
                                        Salvar Orçamento
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-1 space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Adicionar Foto</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <form ref={photoFormRef} onSubmit={handlePhotoSubmit} className="space-y-4">
                                <input type="hidden" name="visitId" value={visit.id} />
                                
                                <div className='grid grid-cols-2 gap-2'>
                                    <Dialog open={isCaptureOpen} onOpenChange={setCaptureOpen}>
                                        <DialogTrigger asChild>
                                            <Button type="button" variant="outline"><Camera className="mr-2"/> Tirar Foto</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader><DialogTitle>Capturar Imagem</DialogTitle></DialogHeader>
                                            <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted />
                                            <canvas ref={canvasRef} className="hidden" />
                                            {hasCameraPermission === false && (
                                                <Alert variant="destructive">
                                                    <AlertTitle>Câmera Indisponível</AlertTitle>
                                                    <AlertDescription>
                                                        Permita o acesso à câmera para usar este recurso.
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                            <div className='flex justify-end gap-2'>
                                                <Button type="button" variant="secondary" onClick={() => setCaptureOpen(false)}>Cancelar</Button>
                                                <Button type="button" onClick={() => { handleCapture(); setCaptureOpen(false); }} disabled={!hasCameraPermission}>Capturar</Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    <Button type="button" variant="outline" asChild>
                                        <label htmlFor="file-upload" className="cursor-pointer">
                                            <Upload className="mr-2"/> Enviar Arquivo
                                            <input id="file-upload" name="file" type="file" className="sr-only" accept="image/*" onChange={handleFileUpload} />
                                        </label>
                                    </Button>
                                </div>
                                <input type="hidden" name="type" value={capturedImage ? 'camera' : 'upload'} />

                                {(capturedImage || uploadedImage) && (
                                    <div className='relative border-2 border-dashed rounded-md p-2'>
                                        <Image src={capturedImage || uploadedImage || ''} alt="Pré-visualização" width={400} height={300} className='w-full h-auto rounded-md object-cover' />
                                        <Button type="button" size="icon" variant="destructive" className="absolute top-2 right-2 h-6 w-6" onClick={() => {setCapturedImage(null); setUploadedImage(null)}}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                                {photoErrors?.url && <p className="text-sm text-destructive">{photoErrors.url[0]}</p>}
                                <div>
                                    <Textarea id="description" name="description" placeholder="Descreva a foto" />
                                    {photoErrors?.description && <p className="text-sm text-destructive">{photoErrors.description[0]}</p>}
                                </div>
                                <Button type="submit" disabled={isSubmittingPhoto}>
                                    {isSubmittingPhoto ? (
                                        <>
                                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                            Salvando Foto...
                                        </>
                                    ) : (
                                        <>
                                            <ImageIcon className="mr-2 h-4 w-4" />
                                            Adicionar Foto
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>

        </div>
    );
}

export default function VisitDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><LoaderCircle className="w-8 h-8 animate-spin" /></div>}>
            <VisitDetailsPageContent id={id} />
        </Suspense>
    );
}
