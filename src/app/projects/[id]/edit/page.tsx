

"use client";

import { useRouter, useParams } from "next/navigation";
import { getProjectById, updateProject, addPhotoToProject, checkForProjectConflict, getPaymentInstrumentsOptions } from "@/lib/data";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoaderCircle, Save, Camera, Upload, Image as ImageIcon, X, DollarSign, Check, Percent, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, FormEvent, useRef } from "react";
import Link from "next/link";
import type { Project, Payment, MasterDataItem } from "@/lib/definitions";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const paymentSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  amount: z.coerce.number().min(0, "O valor da parcela deve ser positivo."),
  status: z.enum(['pendente', 'pago']),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória."),
  description: z.string(),
});


const projectSchema = z.object({
    id: z.string(),
    clientId: z.string(),
    visitId: z.string().optional().nullable(),
    name: z.string().min(3, "O nome do projeto deve ter pelo menos 3 caracteres."),
    description: z.string().optional(),
    status: z.string(),
    startDate: z.string().min(1, "Data de início é obrigatória."),
    endDate: z.string().min(1, "Data de conclusão é obrigatória."),
    value: z.coerce.number().min(0, "O valor deve ser positivo."),
    discountPercentage: z.coerce.number().min(0).optional(),
    discountAmount: z.coerce.number().min(0).optional(),
    finalValue: z.coerce.number().min(0),
    paymentMethod: z.enum(['vista', 'parcelado']),
    paymentInstrument: z.string().min(1, "O meio de pagamento é obrigatório."),
    paymentStatus: z.string(),
    payments: z.array(paymentSchema),
    photosBefore: z.array(z.any()).optional(),
    photosAfter: z.array(z.any()).optional(),
}).refine(data => new Date(data.endDate) >= new Date(data.startDate), {
    message: "A data de conclusão não pode ser anterior à data de início.",
    path: ["endDate"],
}).refine(data => {
    if (!data.payments) return true;
    const totalPayments = data.payments.reduce((sum, p) => sum + p.amount, 0);
    // Allow for small floating point discrepancies
    return Math.abs(totalPayments - data.finalValue) < 0.01;
}, {
    message: "A soma das parcelas deve ser igual ao valor final do projeto.",
    path: ["finalValue"],
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

    const handlePhotoSubmit = async (event: FormEvent) => {
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
          const updatedProject = await addPhotoToProject(project.id, photoType, photoData);
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

const projectStatusOptions = [
    "A iniciar",
    "Em andamento",
    "Pausado",
    "Atrasado",
    "Concluído",
    "Cancelado"
];


export default function ProjectEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, any>>({});
  
  const [isPastDateAlertOpen, setIsPastDateAlertOpen] = useState(false);
  const [isConflictAlertOpen, setIsConflictAlertOpen] = useState(false);
  const [conflictMessage, setConflictMessage] = useState("");
  const [pendingSubmit, setPendingSubmit] = useState<(() => Promise<void>) | null>(null);

  const [paymentInstruments, setPaymentInstruments] = useState<MasterDataItem[]>([]);
  const [firstInstallmentPercentage, setFirstInstallmentPercentage] = useState(50);
  
  useEffect(() => {
    if (!id) return;
    const fetchProjectData = async () => {
        setLoading(true);
        const [projectData, instrumentsData] = await Promise.all([
          getProjectById(id),
          getPaymentInstrumentsOptions()
        ]);
        
        if (projectData) {
            setProject(projectData);
            if(projectData.paymentMethod === 'parcelado' && projectData.payments.length === 2 && projectData.finalValue > 0) {
                const percentage = (projectData.payments[0].amount / projectData.finalValue) * 100;
                setFirstInstallmentPercentage(Math.round(percentage));
            }
        } else {
            toast({ variant: 'destructive', title: 'Erro', description: 'Projeto não encontrado.'});
            router.push("/projects");
        }
        setPaymentInstruments(instrumentsData);
        setLoading(false);
    }
    fetchProjectData();
  }, [id, router, toast]);

  const updateCalculatedValues = (projectToUpdate: Project | null) => {
    if (!projectToUpdate) return;
  
    let finalProject = { ...projectToUpdate };
  
    // Recalculate financial values
    if (finalProject.paymentMethod === 'vista') {
      finalProject.discountAmount = (finalProject.value * (finalProject.discountPercentage || 0)) / 100;
    } else {
      finalProject.discountPercentage = 0;
      finalProject.discountAmount = 0;
    }
    finalProject.finalValue = finalProject.value - (finalProject.discountAmount || 0);
  
    // Recalculate payments
    if (finalProject.paymentMethod === 'vista') {
      finalProject.payments = [{
        id: finalProject.payments[0]?.id || uuidv4(),
        project_id: finalProject.id,
        amount: finalProject.finalValue,
        status: finalProject.payments[0]?.status || 'pendente',
        dueDate: finalProject.endDate,
        description: "Pagamento Único"
      }];
    } else {
      const firstInstallmentValue = (finalProject.finalValue * firstInstallmentPercentage) / 100;
      const secondInstallmentValue = finalProject.finalValue - firstInstallmentValue;
      finalProject.payments = [
        {
          id: finalProject.payments[0]?.id || uuidv4(),
          project_id: finalProject.id,
          amount: firstInstallmentValue,
          status: finalProject.payments[0]?.status || 'pendente',
          dueDate: finalProject.startDate,
          description: '1ª Parcela (Entrada)'
        },
        {
          id: finalProject.payments[1]?.id || uuidv4(),
          project_id: finalProject.id,
          amount: secondInstallmentValue,
          status: finalProject.payments[1]?.status || 'pendente',
          dueDate: finalProject.endDate,
          description: '2ª Parcela (Conclusão)'
        }
      ];
    }
  
    const paidCount = finalProject.payments.filter(p => p.status === 'pago').length;
    if (paidCount === 0) {
      finalProject.paymentStatus = 'pendente';
    } else if (paidCount === finalProject.payments.length) {
      finalProject.paymentStatus = 'pago';
    } else {
      finalProject.paymentStatus = 'parcialmente pago';
    }
    
    setProject(finalProject);
  };
  
  // Update calculated values when dependencies change
  useEffect(() => {
    updateCalculatedValues(project);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.value, project?.discountPercentage, project?.paymentMethod, firstInstallmentPercentage]);
  
  const handlePaymentStatusChange = async (paymentId: string, status: 'pago' | 'pendente') => {
    if (!project) return;
    
    const updatedPayments = project.payments.map(p =>
        p.id === paymentId ? { ...p, status } : p
    );

    const paidCount = updatedPayments.filter(p => p.status === 'pago').length;
    const newPaymentStatus = paidCount === 0 ? 'pendente' : (paidCount === updatedPayments.length ? 'pago' : 'parcialmente pago');

    const updatedProjectState: Project = {
        ...project,
        payments: updatedPayments,
        paymentStatus: newPaymentStatus,
    };
    
    setProject(updatedProjectState);

    try {
        await updateProject(updatedProjectState);
        toast({ title: "Status do Pagamento Alterado!", description: "A alteração foi salva com sucesso." });
    } catch (error) {
        console.error("Failed to update payment status:", error);
        toast({ variant: 'destructive', title: "Erro", description: "Não foi possível salvar a alteração. A página será recarregada."});
        const originalProject = await getProjectById(project.id);
        if(originalProject) setProject(originalProject);
    }
  };


  const proceedToSubmit = async () => {
    if (!project) return;
    setIsSubmitting(true);
    setErrors({});

    const validationResult = projectSchema.safeParse(project);

    if (!validationResult.success) {
      setErrors(validationResult.error.flatten().fieldErrors);
      setIsSubmitting(false);
      toast({ variant: 'destructive', title: "Erro de Validação", description: "Verifique os campos do formulário."});
      console.log(validationResult.error.flatten().fieldErrors);
      return;
    }

    try {
      const updated = await updateProject(validationResult.data as Project);
      setProject(updated); 
      toast({ title: "Projeto Atualizado!", description: "As alterações no projeto foram salvas." });
      router.push(`/projects/${id}`);
    } catch (error) {
        const errorMessage = (error as Error).message || "Falha ao atualizar o projeto.";
        toast({ variant: 'destructive', title: "Erro", description: errorMessage});
        console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProjectSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!project) return;

    const action = async () => {
        const conflict = await checkForProjectConflict({ clientId: project.clientId, startDate: project.startDate, endDate: project.endDate, projectId: project.id });
        if (conflict) {
            setConflictMessage(`Este cliente já tem o projeto "${conflict.name}" agendado no período de ${formatDate(conflict.startDate)} a ${formatDate(conflict.endDate)}.`);
            setIsConflictAlertOpen(true);
            setPendingSubmit(() => () => proceedToSubmit()); // Store the submit action
            return; // Stop execution until user confirms
        }
        await proceedToSubmit();
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(`${project.startDate}T00:00:00`);

    if (selectedDate < today) {
        setIsPastDateAlertOpen(true);
        setPendingSubmit(() => action); // Store the action
    } else {
        await action();
    }
  };
  
  if (loading || !project) {
    return <div className="flex items-center justify-center h-full"><LoaderCircle className="w-8 h-8 animate-spin" /></div>;
  }
  
  const handleGenericChange = (field: keyof Project, value: any) => {
      if (!project) return;
      setProject(prev => prev ? { ...prev, [field]: value } : null);
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={`Editar: ${project.name}`} >
        <Link href={`/projects/${id}`}>
            <Button type="button" variant="outline"><ArrowLeft className="mr-2 h-4 w-4"/>Voltar</Button>
        </Link>
      </PageHeader>
      
       <form onSubmit={handleProjectSubmit}>
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Detalhes do Projeto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nome do Projeto</Label>
                    <Input id="name" name="name" value={project.name} onChange={e => handleGenericChange('name', e.target.value)} required />
                    {errors?.name && <p className="text-sm text-destructive">{errors.name[0]}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea id="description" name="description" value={project.description || ''} onChange={e => handleGenericChange('description', e.target.value)} />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="startDate">Data de Início</Label>
                        <Input id="startDate" name="startDate" type="date" value={project.startDate} onChange={e => handleGenericChange('startDate', e.target.value)} required />
                        {errors?.startDate && <p className="text-sm text-destructive">{errors.startDate[0]}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="endDate">Data de Conclusão</Label>
                        <Input id="endDate" name="endDate" type="date" value={project.endDate} onChange={e => handleGenericChange('endDate', e.target.value)} required />
                        {errors?.endDate && <p className="text-sm text-destructive">{errors.endDate[0]}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="status">Status do Projeto</Label>
                     <Select name="status" value={project.status} onValueChange={(v) => handleGenericChange('status', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o status do projeto"/>
                        </SelectTrigger>
                        <SelectContent>
                            {projectStatusOptions.map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
      
       <Card>
        <CardHeader>
            <CardTitle className="font-headline">Financeiro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            {/* Valor e Desconto */}
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="value">Valor Bruto do Projeto (R$)</Label>
                    <Input id="value" name="value" type="number" step="0.01" value={project.value} onChange={e => handleGenericChange('value', parseFloat(e.target.value) || 0)} required />
                    {errors?.value && <p className="text-sm text-destructive">{Array.isArray(errors.value) ? errors.value[0]: ""}</p>}
                </div>
                 {project.paymentMethod === 'vista' && (
                    <div className="space-y-2">
                        <Label htmlFor="discountPercentage">Desconto à Vista (%)</Label>
                        <div className="relative">
                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                id="discountPercentage" 
                                name="discountPercentage" 
                                type="number" 
                                value={project.discountPercentage || ''} 
                                onChange={e => handleGenericChange('discountPercentage', parseFloat(e.target.value) || 0)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                )}
            </div>
             <div className="p-4 bg-muted/50 rounded-lg flex justify-between items-center">
                <div className="text-sm">
                    <p>Desconto Aplicado: <span className="font-medium text-destructive">- {(project.discountAmount ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                    <p className="font-semibold">Valor Final:</p>
                </div>
                <p className="text-2xl font-bold font-headline">{(project.finalValue ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
             </div>
             {errors?.finalValue && <p className="text-sm text-destructive">{Array.isArray(errors.finalValue) ? errors.finalValue[0]: "A soma das parcelas deve ser igual ao valor total do projeto."}</p>}
             <Separator/>

            {/* Forma e Meio de Pagamento */}
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Forma de Pagamento</Label>
                    <RadioGroup name="paymentMethod" value={project.paymentMethod} onValueChange={(v) => handleGenericChange('paymentMethod', v as any)} className="flex items-center pt-2 gap-4">
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
                 <div className="space-y-2">
                    <Label htmlFor="paymentInstrument">Meio de Pagamento</Label>
                    <Select name="paymentInstrument" value={project.paymentInstrument} onValueChange={(v) => handleGenericChange('paymentInstrument', v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger>
                        <SelectContent>
                            {paymentInstruments.map(instrument => (
                                <SelectItem key={instrument.id} value={instrument.name}>{instrument.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     {errors?.paymentInstrument && <p className="text-sm text-destructive">{errors.paymentInstrument[0]}</p>}
                </div>
            </div>

            {/* Parcelas */}
            {project.paymentMethod === 'parcelado' && (
                 <div className="grid sm:grid-cols-2 gap-4 p-4 border rounded-md">
                     <div className="space-y-2">
                        <Label htmlFor="installment-percentage">Porcentagem da 1ª Parcela (%)</Label>
                         <div className="relative">
                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                id="installment-percentage" 
                                name="installment-percentage" 
                                type="number" 
                                step="1" 
                                value={firstInstallmentPercentage} 
                                onChange={e => setFirstInstallmentPercentage(parseFloat(e.target.value) || 0)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Valor da 1ª Parcela (Entrada)</Label>
                        <Input type="number" step="0.01" value={project.payments[0]?.amount || 0} readOnly disabled className="bg-muted"/>
                    </div>
                </div>
            )}
        </CardContent>
    </Card>


      <Card>
          <CardHeader>
              <CardTitle className="font-headline">Gerenciamento de Pagamentos</CardTitle>
              <CardDescription>Marque as parcelas como pagas assim que o pagamento for confirmado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              {project.payments && project.payments.map((payment, index) => (
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
                          <Button size="sm" type="button" onClick={() => handlePaymentStatusChange(payment.id, 'pago')}>Marcar como Pago</Button>
                      ) : (
                          <Button size="sm" type="button" variant="outline" onClick={() => handlePaymentStatusChange(payment.id, 'pendente')}>Marcar como Pendente</Button>
                      )}
                  </div>
              ))}
          </CardContent>
      </Card>
      
        <div className="flex justify-end gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting}>
                 {isSubmitting ? (
                    <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
                ) : (
                    <><Save className="mr-2 h-4 w-4"/> Salvar Alterações</>
                )}
            </Button>
        </div>
    </form>
        
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
                    <AlertDialogAction onClick={() => pendingSubmit && pendingSubmit()}>Continuar</AlertDialogAction>
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
                    <AlertDialogAction onClick={() => pendingSubmit && pendingSubmit()}>Continuar Mesmo Assim</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
