
// src/app/visits/[id]/page.tsx
"use client";

import { use, useEffect, useState, useRef } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { getVisitById, getClientById, getProjectById } from '@/lib/data';
import type { Visit, Client, Project, Photo } from '@/lib/definitions';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar, User, FileText, CheckCircle, Clock, XCircle, ArrowRight, Camera, Upload, Image as ImageIcon, LoaderCircle, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Textarea } from '@/components/ui/textarea';
import { useFormState, useFormStatus } from 'react-dom';
import { addPhotoAction } from '@/lib/actions';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Image from 'next/image';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? (
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
    )
}


export default function VisitDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { toast } = useToast();

    const [visit, setVisit] = useState<Visit | null>(null);
    const [client, setClient] = useState<Client | null>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [isCaptureOpen, setCaptureOpen] = useState(false);

    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    
    const photoFormRef = useRef<HTMLFormElement>(null);

    const [photoFormState, dispatchPhoto] = useFormState(async (prevState: any, formData: FormData) => {
        const imageUri = capturedImage || uploadedImage;
        if (!imageUri) {
            return { errors: { url: ["Por favor, capture ou envie uma imagem."] }};
        }
        formData.set('url', imageUri);
        
        const result = await addPhotoAction(prevState, formData);

        if (result?.message?.includes('sucesso')) {
            toast({ title: result.message });
            setVisit(getVisitById(id) ?? null); // Refresh visit data
            photoFormRef.current?.reset();
            setCapturedImage(null);
            setUploadedImage(null);
        } else {
            toast({ variant: 'destructive', title: "Erro", description: result?.message || "Falha ao adicionar foto" });
        }
        return result;

    }, { message: null, errors: {} });
    

    useEffect(() => {
        const visitData = getVisitById(id);
        if (visitData) {
            setVisit(visitData);
            setClient(getClientById(visitData.clientId) ?? null);
            if (visitData.projectId) {
                setProject(getProjectById(visitData.projectId) ?? null);
            }
        } else {
            notFound();
        }
    }, [id]);

    useEffect(() => {
        if (!isCaptureOpen) {
            // Stop camera stream when dialog is closed
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


    if (!visit || !client) {
        return <div>Carregando...</div>;
    }

    const visitStatusIcons: { [key: string]: React.ReactNode } = {
        pendente: <Clock className="w-4 h-4 text-yellow-500" />,
        realizada: <CheckCircle className="w-4 h-4 text-green-500" />,
        cancelada: <XCircle className="w-4 h-4 text-red-500" />,
        orçamento: <FileText className="w-4 h-4 text-blue-500" />,
    };

    return (
        <div className="flex flex-col gap-8">
            <PageHeader title={`Visita de ${formatDate(visit.date)}`} />
            
            <div className="grid lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Detalhes da Visita</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2">
                                {visitStatusIcons[visit.status]}
                                <p className="font-semibold capitalize">{visit.status}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <p>Cliente: <Link href={`/clients/${client.id}`} className="font-medium text-primary hover:underline">{client.name}</Link></p>
                            </div>
                             <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <p>Data: {new Date(visit.date).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Resumo</h4>
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

                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Fotos da Visita</CardTitle>
                            <CardDescription>Imagens registradas durante a visita.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {visit.photos.length > 0 ? (
                                <Carousel className="w-full max-w-xl mx-auto">
                                    <CarouselContent>
                                        {visit.photos.map((photo) => (
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
                            ) : (
                                <p className="text-muted-foreground text-center py-8">Nenhuma foto adicionada a esta visita.</p>
                            )}
                        </CardContent>
                    </Card>

                </div>

                <div className="lg:col-span-1 space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Adicionar Foto</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                             <form ref={photoFormRef} action={dispatchPhoto} className="space-y-4">
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
                                 {photoFormState?.errors?.url && <p className="text-sm text-destructive">{photoFormState.errors.url}</p>}
                                 <div>
                                    <Textarea id="description" name="description" placeholder="Descreva a foto" required />
                                     {photoFormState?.errors?.description && <p className="text-sm text-destructive">{photoFormState.errors.description}</p>}
                                </div>
                                <SubmitButton />
                            </form>
                        </CardContent>
                     </Card>
                </div>
            </div>

        </div>
    );
}
