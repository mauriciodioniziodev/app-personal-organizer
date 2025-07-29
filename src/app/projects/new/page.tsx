
"use client";

import { useEffect, useState, FormEvent, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from 'next/navigation'
import { getClients, getMasterData, getVisitById, addProject, checkForProjectConflict } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LoaderCircle } from "lucide-react";
import type { Client, Visit, Payment } from "@/lib/definitions";
import { z } from "zod";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { v4 as uuidv4 } from 'uuid';

const paymentSchema = z.object({
  id: z.string(),
  amount: z.coerce.number().min(0, "O valor da parcela deve ser positivo."),
  status: z.enum(['pendente', 'pago']),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória."),
  description: z.string(),
});

const projectSchema = z.object({
    clientId: z.string({ required_error: "Cliente é obrigatório." }).min(1, "Cliente é obrigatório."),
    visitId: z.string().optional(),
    name: z.string().min(3, "O nome do projeto deve ter pelo menos 3 caracteres."),
    description: z.string().optional(),
    startDate: z.string().min(1, "Data de início é obrigatória."),
    endDate: z.string().min(1, "Data de conclusão é obrigatória."),
    value: z.coerce.number().min(0, "O valor deve ser positivo."),
    paymentMethod: z.enum(['vista', 'parcelado']),
    payments: z.array(paymentSchema)
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


function NewProjectPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const visitId = searchParams.get('fromVisit');
  
  const [clients, setClients] = useState<Client[]>([]);
  const [visit, setVisit] = useState<Visit | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, any>>({});
  
  const { paymentStatus } = getMasterData();

  const [isPastDateAlertOpen, setIsPastDateAlertOpen] = useState(false);
  const [isConflictAlertOpen, setIsConflictAlertOpen] = useState(false);
  const [conflictMessage, setConflictMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // A temporary workaround to install uuid. In a real scenario, this would be a dev dependency.
    if(typeof window !== 'undefined' && !window.require) {
       const script = document.createElement('script');
       script.src = 'https://cdnjs.cloudflare.com/ajax/libs/uuid/8.3.2/uuid.min.js';
       script.onload = () => console.log('uuid loaded');
       document.head.appendChild(script);
    }
  },[])

  useEffect(() => {
    setClients(getClients());
    if (visitId) {
      const foundVisit = getVisitById(visitId);
      if(foundVisit) {
        setVisit(foundVisit);
        setSelectedClientId(foundVisit.clientId);
      }
    }
  }, [visitId]);

  const proceedToSubmit = () => {
    if (!formRef.current) return;
    
    setLoading(true);
    setErrors({});
    const formData = new FormData(formRef.current);
    
    const paymentMethod = formData.get("paymentMethod") as 'vista' | 'parcelado';
    const totalValue = parseFloat(formData.get("value") as string || '0');
    const endDate = formData.get("endDate") as string;
    
    let payments: Payment[] = [];

    if(paymentMethod === 'vista') {
        payments.push({
            id: uuidv4(),
            amount: totalValue,
            status: formData.get('paymentStatus') as 'pendente' | 'pago',
            dueDate: endDate,
            description: 'Pagamento Único'
        });
    } else {
        const firstInstallmentValue = parseFloat(formData.get('installment-1-value') as string || '0');
        payments.push({
            id: uuidv4(),
            amount: firstInstallmentValue,
            status: 'pendente',
            dueDate: formData.get('startDate') as string,
            description: '1ª Parcela (Entrada)'
        });
        payments.push({
            id: uuidv4(),
            amount: totalValue - firstInstallmentValue,
            status: 'pendente',
            dueDate: endDate,
            description: '2ª Parcela (Conclusão)'
        });
    }

     const projectData = {
        clientId: selectedClientId,
        visitId: visitId ?? undefined,
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        startDate: formData.get("startDate") as string,
        endDate: endDate,
        value: totalValue,
        paymentMethod: paymentMethod,
        payments: payments,
    };
    
    const validationResult = projectSchema.safeParse(projectData);

    if (!validationResult.success) {
      setErrors(validationResult.error.flatten().fieldErrors);
      setLoading(false);
      return;
    }

    try {
        addProject(validationResult.data);
        toast({
            title: "Projeto Criado com Sucesso!",
            description: `O projeto "${validationResult.data.name}" foi salvo.`,
        });
        router.push('/projects');
    } catch(e) {
        toast({
            variant: "destructive",
            title: "Erro ao criar projeto",
            description: "Ocorreu um erro inesperado. Tente novamente.",
        });
        setLoading(false);
    }
  }
  
  const handleValidation = () => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;

    const projectData = {
        clientId: selectedClientId,
        startDate,
        endDate
    };
    
    const conflict = checkForProjectConflict(projectData);
    if (conflict) {
        setConflictMessage(`Este cliente já tem o projeto "${conflict.name}" agendado no período de ${new Date(conflict.startDate).toLocaleDateString('pt-BR')} a ${new Date(conflict.endDate).toLocaleDateString('pt-BR')}.`);
        setIsConflictAlertOpen(true);
        return;
    }

    const today = new Date();
    today.setHours(0,0,0,0);
    const selectedDate = new Date(`${startDate}T00:00:00`);

    if (selectedDate < today) {
        setIsPastDateAlertOpen(true);
    } else {
        proceedToSubmit();
    }
  }


  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleValidation();
  }
  
  const [paymentMethod, setPaymentMethod] = useState<'vista' | 'parcelado'>('vista');
  const [totalValue, setTotalValue] = useState(0);
  const [firstInstallment, setFirstInstallment] = useState(0);
  
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value) || 0;
      setTotalValue(value);
      setFirstInstallment(value / 2);
  }

  const handleFirstInstallmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFirstInstallment(parseFloat(e.target.value) || 0);
  }


  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Novo Projeto" />
      <form ref={formRef} onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Detalhes do Projeto</CardTitle>
            {visit && (
              <CardDescription>
                Este projeto está sendo criado a partir da visita de {new Date(visit.date).toLocaleDateString('pt-BR')}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="clientId">Cliente</Label>
              <Select key={selectedClientId} name="clientId" required value={selectedClientId} onValueChange={setSelectedClientId} disabled={!!visitId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.length > 0 ? (
                    clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))
                  ) : (
                    <div className="p-4 text-sm text-muted-foreground">Nenhum cliente encontrado. Adicione um cliente primeiro.</div>
                  )}
                </SelectContent>
              </Select>
               {errors?.clientId && <p className="text-sm text-destructive">{errors.clientId[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome do Projeto</Label>
              <Input id="name" name="name" placeholder="Ex: Organização da Cozinha" required />
              {errors?.name && <p className="text-sm text-destructive">{errors.name[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" name="description" placeholder="Descreva os objetivos e o escopo do projeto." defaultValue={visit?.summary ?? ''} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data de Início</Label>
                <Input id="startDate" name="startDate" type="date" required />
                {errors?.startDate && <p className="text-sm text-destructive">{errors.startDate[0]}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data de Conclusão</Label>
                <Input id="endDate" name="endDate" type="date" required />
                 {errors?.endDate && <p className="text-sm text-destructive">{errors.endDate[0]}</p>}
              </div>
            </div>
            
             <div className="space-y-2">
                <Label htmlFor="value">Valor Total do Projeto (R$)</Label>
                <Input id="value" name="value" type="number" step="0.01" placeholder="1200.00" required onChange={handleValueChange}/>
                {errors?.value && <p className="text-sm text-destructive">{Array.isArray(errors.value) ? errors.value[0] : errors.value}</p>}
            </div>
            
            <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <RadioGroup name="paymentMethod" value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)} className="flex items-center pt-2 gap-4">
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
            
            {paymentMethod === 'vista' ? (
                <div className="space-y-2">
                    <Label>Status do Pagamento</Label>
                    <RadioGroup name="paymentStatus" defaultValue={paymentStatus[0]} className="flex items-center pt-2 gap-4">
                        {paymentStatus.map(status => (
                            <div key={status} className="flex items-center space-x-2">
                                <RadioGroupItem value={status} id={status} />
                                <Label htmlFor={status} className="capitalize">{status}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 gap-4 p-4 border rounded-md">
                     <div className="space-y-2">
                        <Label htmlFor="installment-1-value">Valor da 1ª Parcela (Entrada)</Label>
                        <Input id="installment-1-value" name="installment-1-value" type="number" step="0.01" value={firstInstallment} onChange={handleFirstInstallmentChange} />
                    </div>
                    <div className="space-y-2">
                        <Label>Valor da 2ª Parcela</Label>
                        <Input type="number" step="0.01" value={totalValue - firstInstallment} readOnly disabled className="bg-muted"/>
                    </div>
                </div>
            )}


            <div className="flex justify-end gap-2 pt-4">
                <Link href="/projects">
                    <Button type="button" variant="outline">Cancelar</Button>
                </Link>
                 <Button type="submit" disabled={loading} aria-disabled={loading}>
                    {loading ? (
                        <>
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                        </>
                    ) : (
                        "Salvar Projeto"
                    )}
                </Button>
            </div>
          </CardContent>
        </Card>
      </form>
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


export default function NewProjectPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <NewProjectPageContent />
        </Suspense>
    )
}
