
"use client";

import { notFound, useRouter } from "next/navigation";
import { getProjectById, getMasterData, updateProject, addPhotoToProject } from "@/lib/data";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoaderCircle, Save, Camera, Upload, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, FormEvent, useRef, use } from "react";
import Link from "next/link";
import type { Project, Photo } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Image from 'next/image';
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const projectSchema = z.object({
    id: z.string(),
    clientId: z.string(),
    visitId: z.string().optional(),
    name: z.string().min(3, "O nome do projeto deve ter pelo menos 3 caracteres."),
    description: z.string().optional(),
    startDate: z.string().min(1, "Data de início é obrigatória."),
    endDate: z.string().min(1, "Data de conclusão é obrigatória."),
    value: z.coerce.number().min(0, "O valor deve ser positivo."),
    paymentStatus: z.string()
});

const photoSchema = z.object({
    url: z.string().min(1, "Por favor, capture ou envie uma imagem."),
    description: z.string().min(3, "Descrição é obrigatória."),
    type: z.string(),
});


export default function ProjectEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const { id } = use(params);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const { paymentStatus } = getMasterData();
  
  useEffect(() => {
    const projectData = getProjectById(id);
    if (projectData) {
      setProject(projectData);
    } else {
      notFound();
    }
  }, [id]);

  const handleProjectSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!project) return;
    setLoading(true);
    setErrors({});

    const formData = new FormData(event.currentTarget);
    const projectData = {
      ...project,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      startDate: formData.get("startDate") as string,
      endDate: formData.get("endDate") as string,
      value: formData.get("value") as string,
      paymentStatus: formData.get("paymentStatus") as string,
    };

    const validationResult = projectSchema.safeParse(projectData);

    if (!validationResult.success) {
      setErrors(validationResult.error.flatten().fieldErrors);
      setLoading(false);
      return;
    }

    try {
      const updated = updateProject(validationResult.data as Project);
      setProject(updated);
      toast({ title: "Projeto Atualizado!", description: "As alterações no projeto foram salvas." });
      router.push(`/projects/${id}`);
    } catch (error) {
      toast({ variant: 'destructive', title: "Erro", description: "Falha ao atualizar o projeto."});
    } finally {
      setLoading(false);
    }
  };

  const PhotoUploader = ({ photoType }: { photoType: 'before' | 'after' }) => {
    const [isCaptureOpen, setCaptureOpen] = useState(false);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const photoFormRef = useRef<HTMLFormElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [photoErrors, setPhotoErrors] = useState<Record<string, string[]>>({});

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
          }
        };

        getCameraPermission();
      }, [isCaptureOpen]);

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

    const handlePhotoSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSubmitting(true);
      setPhotoErrors({});
      
      const formData = new FormData(event.currentTarget);
      const imageUri = capturedImage || uploadedImage;
      
      const photoData = {
          url: imageUri ?? "",
          description: formData.get("description") as string,
          type: (capturedImage ? 'camera' : 'upload') as 'camera' | 'upload'
      }

      const validationResult = photoSchema.safeParse(photoData);

      if (!validationResult.success) {
          setPhotoErrors(validationResult.error.flatten().fieldErrors);
          setIsSubmitting(false);
          return;
      }

      try {
          const updatedProject = addPhotoToProject(id, photoType, validationResult.data);
          setProject(updatedProject);
          toast({ title: "Sucesso!", description: "Foto adicionada com sucesso" });
          if(photoFormRef.current) photoFormRef.current.reset();
          setCapturedImage(null);
          setUploadedImage(null);
      } catch (error) {
           toast({ variant: 'destructive', title: "Erro ao Adicionar Foto" });
      } finally {
          setIsSubmitting(false);
      }
    }
  
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline capitalize">Fotos: {photoType === 'before' ? 'Antes' : 'Depois'}</CardTitle>
          <CardDescription>Adicione imagens de {photoType === 'before' ? 'antes' : 'depois'} da organização.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <form ref={photoFormRef} onSubmit={handlePhotoSubmit} className="space-y-4">
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
                                  <AlertDescription>Permita o acesso à câmera para usar este recurso.</AlertDescription>
                              </Alert>
                          )}
                          <div className='flex justify-end gap-2'>
                              <Button type="button" variant="secondary" onClick={() => setCaptureOpen(false)}>Cancelar</Button>
                              <Button type="button" onClick={() => { handleCapture(); setCaptureOpen(false); }} disabled={!hasCameraPermission}>Capturar</Button>
                          </div>
                      </DialogContent>
                  </Dialog>

                  <Button type="button" variant="outline" asChild>
                      <label htmlFor={`file-upload-${photoType}`} className="cursor-pointer">
                          <Upload className="mr-2"/> Enviar Arquivo
                          <input id={`file-upload-${photoType}`} name="file" type="file" className="sr-only" accept="image/*" onChange={handleFileUpload} />
                      </label>
                  </Button>
              </div>

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
              <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                  Adicionar Foto
              </Button>
          </form>
        </CardContent>
      </Card>
    );
  }


  if (!project) {
    return <div className="flex items-center justify-center h-full"><LoaderCircle className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={`Editar: ${project.name}`} />
      
      <form onSubmit={handleProjectSubmit} className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Detalhes do Projeto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nome do Projeto</Label>
                    <Input id="name" name="name" defaultValue={project.name} required />
                    {errors?.name && <p className="text-sm text-destructive">{errors.name[0]}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea id="description" name="description" defaultValue={project.description} />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="startDate">Data de Início</Label>
                        <Input id="startDate" name="startDate" type="date" defaultValue={project.startDate} required />
                        {errors?.startDate && <p className="text-sm text-destructive">{errors.startDate[0]}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="endDate">Data de Conclusão</Label>
                        <Input id="endDate" name="endDate" type="date" defaultValue={project.endDate} required />
                        {errors?.endDate && <p className="text-sm text-destructive">{errors.endDate[0]}</p>}
                    </div>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="value">Valor do Projeto (R$)</Label>
                        <Input id="value" name="value" type="number" step="0.01" defaultValue={project.value} required />
                        {errors?.value && <p className="text-sm text-destructive">{errors.value[0]}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Status do Pagamento</Label>
                        <RadioGroup name="paymentStatus" defaultValue={project.paymentStatus} className="flex items-center pt-2 gap-4">
                            {paymentStatus.map(status => (
                                <div key={status} className="flex items-center space-x-2">
                                    <RadioGroupItem value={status} id={`edit-${status}`} />
                                    <Label htmlFor={`edit-${status}`} className="capitalize">{status}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                </div>
            </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PhotoUploader photoType="before" />
            <PhotoUploader photoType="after" />
        </div>

        <div className="flex justify-end gap-2 pt-4">
            <Link href={`/projects/${id}`}>
                <Button type="button" variant="outline">Cancelar</Button>
            </Link>
            <Button type="submit" disabled={loading}>
                 {loading ? (
                    <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
                ) : (
                    <><Save className="mr-2 h-4 w-4"/> Salvar Alterações</>
                )}
            </Button>
        </div>
      </form>
    </div>
  );
}

    