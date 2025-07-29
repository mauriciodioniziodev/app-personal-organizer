
"use client";

import { useRouter } from "next/navigation";
import { getProjectById, updateProject, addPhotoToProject, checkForProjectConflict } from "@/lib/data";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoaderCircle, Save, Camera, Upload, Image as ImageIcon, X, DollarSign, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, FormEvent, useRef, use } from "react";
import Link from "next/link";
import type { Project, Payment } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { z } from "zod";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn, formatDate } from "@/lib/utils";
import { v4 as uuidv4 } from 'uuid';

const paymentSchema = z.object({
  id: z.string(),
  amount: z.coerce.number().min(0, "O valor da parcela deve ser positivo."),
  status: z.enum(['pendente', 'pago']),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória."),
  description: z.string(),
});


const projectSchema = z.object({
    id: z.string(),
    clientId: z.string(),
    visitId: z.string().optional(),
    name: z.string().min(3, "O nome do projeto deve ter pelo menos 3 caracteres."),
    description: z.string().optional(),
    startDate: z.string().min(1, "Data de início é obrigatória."),
    endDate: z.string().min(1, "Data de conclusão é obrigatória."),
    value: z.coerce.number().min(0, "O valor deve ser positivo."),
    paymentMethod: z.enum(['vista', 'parcelado']),
    payments: z.array(paymentSchema),
}).refine(data => new Date(data.endDate) >= new Date(data.startDate), {
    message: "A data de conclusão não pode ser anterior à data de início.",
    path: ["endDate"],
}).refine(data => {
    const totalPayments = data.payments.reduce((sum, p) => sum + p.amount, 0);
    // Allow for small floating point discrepancies
    return Math.abs(totalPayments - data.value) < 0.01;
}, {
    message: "A soma das parcelas deve ser igual ao valor total do projeto.",
    path: ["value"],
});


function PhotoUploader({ project, photoType, onPhotoAdded }: { project: Project, photoType: 'before' | 'after', onPhotoAdded: (project: Project) => void }) {
    const [isCaptureOpen, setCaptureOpen] = useState(false);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [photoError, setPhotoError] = useState<string | null>(null);
    const { toast } = useToast();

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
            setPhotoError(null);
        }
    }

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
                setCapturedImage(null);
                setPhotoError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePhotoSubmit = (event: FormEvent) => {
      event.preventDefault();
      setIsSubmitting(true);
      setPhotoError(null);
      
      const imageUri = capturedImage || uploadedImage;
      
      if (!imageUri) {
          setPhotoError("Por favor, capture ou envie uma imagem.");
          setIsSubmitting(false);
          return;
      }
       if (!description || description.trim().length < 3) {
          setPhotoError("A descrição é obrigatória e deve ter pelo menos 3 caracteres.");
          setIsSubmitting(false);
          return;
      }

      const photoData = {
          url: imageUri,
          description: description,
          type: (capturedImage ? 'camera' : 'upload') as 'camera' | 'upload'
      }

      try {
          const updatedProject = addPhotoToProject(project.id, photoType, photoData);
          onPhotoAdded(updatedProject);
          toast({ title: "Sucesso!", description: "Foto adicionada com sucesso" });
          setCapturedImage(null);
          setUploadedImage(null);
          setDescription('');
      } catch (error) {
           toast({ variant: 'destructive', title: "Erro ao Adicionar Foto", description: (error as Error).message });
           console.error(error);
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
          <form onSubmit={handlePhotoSubmit} className="space-y-4">
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
              
              <div>
                  <Textarea 
                    id="description" 
                    name="description" 
                    placeholder="Descreva a foto" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
              </div>
               {photoError && <p className="text-sm text-destructive">{photoError}</p>}
              <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                  Adicionar Foto
              </Button>
          </form>
        </CardContent>
      </Card>
    );
}


export default function ProjectEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const { id } = use(params);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, any>>({});
  
  const [isPastDateAlertOpen, setIsPastDateAlertOpen] = useState(false);
  const [isConflictAlertOpen, setIsConflictAlertOpen] = useState(false);
  const [conflictMessage, setConflictMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  
  useEffect(() => {
    const projectData = getProjectById(id);
    if (projectData) {
      setProject(projectData);
    } else {
      router.push("/projects"); // Or a not-found page
    }
  }, [id, router]);
  
  const handlePaymentStatusChange = (paymentId: string, status: 'pago' | 'pendente') => {
    if (!project) return;
    const updatedPayments = project.payments.map(p => p.id === paymentId ? {...p, status} : p);
    const updatedProjectData = {...project, payments: updatedPayments};
    
    try {
        const updated = updateProject(updatedProjectData);
        setProject(updated);
        toast({ title: "Status do Pagamento Atualizado!"});
    } catch(e) {
        toast({variant: 'destructive', title: "Erro", description: "Não foi possível atualizar o pagamento."})
    }
  }


  const proceedToSubmit = () => {
    if (!project || !formRef.current) return;
    setLoading(true);
    setErrors({});

    const formData = new FormData(formRef.current);
    const paymentMethod = formData.get("paymentMethod") as 'vista' | 'parcelado';
    const value = parseFloat(formData.get("value") as string || "0");
    let newPayments: Payment[] = [];

    if (paymentMethod === 'vista') {
        newPayments.push({
            id: project.payments[0]?.id || uuidv4(),
            amount: value,
            status: project.payments[0]?.status || 'pendente',
            dueDate: formData.get("endDate") as string,
            description: "Pagamento Único"
        });
    } else {
        const installment1Value = parseFloat(formData.get('installment-1-value') as string);
        const installment2Value = value - installment1Value;
        newPayments.push({
            id: project.payments[0]?.id || uuidv4(),
            amount: installment1Value,
            status: project.payments[0]?.status || 'pendente',
            dueDate: formData.get("startDate") as string,
            description: '1ª Parcela (Entrada)'
        });
         newPayments.push({
            id: project.payments[1]?.id || uuidv4(),
            amount: installment2Value,
            status: project.payments[1]?.status || 'pendente',
            dueDate: formData.get("endDate") as string,
            description: '2ª Parcela (Conclusão)'
        });
    }


    const projectData = {
      ...project,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      startDate: formData.get("startDate") as string,
      endDate: formData.get("endDate") as string,
      value: value,
      paymentMethod,
      payments: newPayments,
    };

    const validationResult = projectSchema.safeParse(projectData);

    if (!validationResult.success) {
      setErrors(validationResult.error.flatten().fieldErrors);
      setLoading(false);
      return;
    }

    try {
      const updated = updateProject(validationResult.data as Project);
      setProject(updated); // Update the state with the new data
      toast({ title: "Projeto Atualizado!", description: "As alterações no projeto foram salvas." });
    } catch (error) {
      toast({ variant: 'destructive', title: "Erro", description: "Falha ao atualizar o projeto."});
    } finally {
      setLoading(false);
    }
  };

  const handleValidation = () => {
    if (!formRef.current || !project) return;
    const formData = new FormData(formRef.current);
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;

    const conflict = checkForProjectConflict({ clientId: project.clientId, startDate, endDate, projectId: project.id });
    if (conflict) {
        setConflictMessage(`Este cliente já tem o projeto "${conflict.name}" agendado no período de ${formatDate(conflict.startDate)} a ${formatDate(conflict.endDate)}.`);
        setIsConflictAlertOpen(true);
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(`${startDate}T00:00:00`);

    if (selectedDate < today) {
        setIsPastDateAlertOpen(true);
    } else {
        proceedToSubmit();
    }
  };

  const handleProjectSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleValidation();
  };
  
  if (!project) {
    return <div className="flex items-center justify-center h-full"><LoaderCircle className="w-8 h-8 animate-spin" /></div>;
  }

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTotal = parseFloat(e.target.value) || 0;
      if (!project) return;
      const updatedProject = {...project, value: newTotal};
      if (updatedProject.paymentMethod === 'parcelado' && updatedProject.payments.length === 2) {
          const firstPaymentRatio = updatedProject.payments[0].amount / (updatedProject.payments[0].amount + updatedProject.payments[1].amount) || 0.5;
          updatedProject.payments[0].amount = newTotal * firstPaymentRatio;
          updatedProject.payments[1].amount = newTotal * (1 - firstPaymentRatio);
      }
      setProject(updatedProject);
  }

  const handleInstallmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
       if (!project) return;
       const firstInstallmentValue = parseFloat(e.target.value) || 0;
       const updatedProject = {...project};
       updatedProject.payments[0].amount = firstInstallmentValue;
       updatedProject.payments[1].amount = updatedProject.value - firstInstallmentValue;
       setProject(updatedProject);
  }
  
  const handlePaymentMethodChange = (value: 'vista' | 'parcelado') => {
      if(!project) return;
      const updatedProject = {...project, paymentMethod: value};
      if(value === 'parcelado' && updatedProject.payments.length !== 2) {
          updatedProject.payments = [
              { id: uuidv4(), amount: updatedProject.value / 2, status: 'pendente', dueDate: project.startDate, description: '1ª Parcela (Entrada)' },
              { id: uuidv4(), amount: updatedProject.value / 2, status: 'pendente', dueDate: project.endDate, description: '2ª Parcela (Conclusão)' }
          ]
      }
       if(value === 'vista' && updatedProject.payments.length > 1) {
          updatedProject.payments = [
              { id: uuidv4(), amount: updatedProject.value, status: 'pendente', dueDate: project.endDate, description: 'Pagamento Único' }
          ]
       }
      setProject(updatedProject);
  }


  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={`Editar: ${project.name}`} />
      
       <form ref={formRef} onSubmit={handleProjectSubmit}>
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
                
                 <div className="space-y-2">
                    <Label htmlFor="value">Valor Total do Projeto (R$)</Label>
                    <Input id="value" name="value" type="number" step="0.01" value={project.value} onChange={handleValueChange} required />
                    {errors?.value && <p className="text-sm text-destructive">{Array.isArray(errors.value) ? errors.value[0]: ""}</p>}
                    {errors?.payments && <p className="text-sm text-destructive">{Array.isArray(errors.payments) ? errors.payments[0]: "A soma das parcelas deve ser igual ao valor total do projeto."}</p>}
                </div>
                
                <div className="space-y-2">
                    <Label>Forma de Pagamento</Label>
                    <RadioGroup name="paymentMethod" value={project.paymentMethod} onValueChange={(v) => handlePaymentMethodChange(v as any)} className="flex items-center pt-2 gap-4">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="vista" id="vista" />
                            <Label htmlFor="vista">À Vista</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="parcelado" id="parcelado" />
                            <Label htmlFor="parcelado">Parcelado (2x)</Label>
                        </div>
                    </RadioGroup>
                </div>
                
                {project.paymentMethod === 'parcelado' && (
                     <div className="grid sm:grid-cols-2 gap-4 p-4 border rounded-md">
                         <div className="space-y-2">
                            <Label htmlFor="installment-1-value">Valor da 1ª Parcela (Entrada)</Label>
                            <Input id="installment-1-value" name="installment-1-value" type="number" step="0.01" value={project.payments[0]?.amount || 0} onChange={handleInstallmentChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Valor da 2ª Parcela</Label>
                            <Input type="number" step="0.01" value={project.payments[1]?.amount || 0} readOnly disabled className="bg-muted"/>
                        </div>
                    </div>
                )}
                
                 <div className="flex justify-end gap-2 pt-4">
                    <Link href={`/projects/${id}`}>
                        <Button type="button" variant="outline">Voltar</Button>
                    </Link>
                    <Button type="submit" disabled={loading}>
                         {loading ? (
                            <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
                        ) : (
                            <><Save className="mr-2 h-4 w-4"/> Salvar Alterações</>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
      </form>
      
      <Card>
          <CardHeader>
              <CardTitle className="font-headline">Gerenciamento de Pagamentos</CardTitle>
              <CardDescription>Marque as parcelas como pagas assim que o pagamento for confirmado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              {project.payments.map((payment, index) => (
                  <div key={payment.id} className={cn("p-4 rounded-lg border flex items-center justify-between", payment.status === 'pago' ? 'bg-green-50 border-green-200' : '')}>
                      <div className="flex items-center gap-4">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", payment.status === 'pago' ? 'bg-green-100 text-green-700' : 'bg-muted')}>
                            {payment.status === 'pago' ? <Check className="w-5 h-5"/> : <DollarSign className="w-5 h-5 text-muted-foreground"/>}
                        </div>
                        <div>
                            <p className="font-semibold">{payment.description}</p>
                            <p className="text-sm text-muted-foreground">
                                Vencimento: {formatDate(payment.dueDate)} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount)}
                            </p>
                        </div>
                      </div>
                      {payment.status === 'pendente' ? (
                          <Button size="sm" onClick={() => handlePaymentStatusChange(payment.id, 'pago')}>Marcar como Pago</Button>
                      ) : (
                          <Button size="sm" variant="outline" onClick={() => handlePaymentStatusChange(payment.id, 'pendente')}>Marcar como Pendente</Button>
                      )}
                  </div>
              ))}
          </CardContent>
      </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PhotoUploader project={project} photoType="before" onPhotoAdded={setProject} />
            <PhotoUploader project={project} photoType="after" onPhotoAdded={setProject} />
        </div>

        <AlertDialog open={isPastDateAlertOpen} onOpenChange={setIsPastDateAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Data no Passado</AlertDialogTitle>
                    <AlertDialogDescription>
                        A data de início do projeto é anterior à data de hoje. Deseja continuar mesmo assim?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Alterar</AlertDialogCancel>
                    <AlertDialogAction onClick={proceedToSubmit}>Continuar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={isConflictAlertOpen} onOpenChange={setIsConflictAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Conflito de Agendamento</AlertDialogTitle>
                    <AlertDialogDescription>
                        {conflictMessage} Deseja continuar mesmo assim?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Alterar</AlertDialogCancel>
                    <AlertDialogAction onClick={proceedToSubmit}>Continuar Mesmo Assim</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
