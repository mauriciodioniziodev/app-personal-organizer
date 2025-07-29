
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
import type { Client, Visit } from "@/lib/definitions";
import { z } from "zod";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const projectSchema = z.object({
    clientId: z.string({ required_error: "Cliente é obrigatório." }).min(1, "Cliente é obrigatório."),
    visitId: z.string().optional(),
    name: z.string().min(3, "O nome do projeto deve ter pelo menos 3 caracteres."),
    description: z.string().optional(),
    startDate: z.string().min(1, "Data de início é obrigatória."),
    endDate: z.string().min(1, "Data de conclusão é obrigatória."),
    value: z.coerce.number().min(0, "O valor deve ser positivo."),
    paymentStatus: z.string()
}).refine(data => new Date(data.endDate) >= new Date(data.startDate), {
    message: "A data de conclusão não pode ser anterior à data de início.",
    path: ["endDate"],
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
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  
  const { paymentStatus } = getMasterData();

  const [isPastDateAlertOpen, setIsPastDateAlertOpen] = useState(false);
  const [isConflictAlertOpen, setIsConflictAlertOpen] = useState(false);
  const [conflictMessage, setConflictMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

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
     const projectData = {
        clientId: selectedClientId,
        visitId: visitId ?? undefined,
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
            
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="value">Valor do Projeto (R$)</Label>
                    <Input id="value" name="value" type="number" step="0.01" placeholder="1200.00" required />
                    {errors?.value && <p className="text-sm text-destructive">{errors.value[0]}</p>}
                </div>
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
            </div>

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

    