

"use client";

import { useEffect, useState, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import { addVisit, getClients, getVisitStatusOptions, checkForVisitConflict } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CalendarPlus, LoaderCircle } from "lucide-react";
import type { Client, MasterDataItem } from "@/lib/definitions";
import Link from "next/link";
import { z } from "zod";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const visitSchema = z.object({
    clientId: z.string().min(1, "Por favor, selecione um cliente."),
    date: z.string().min(1, "Data e hora são obrigatórios."),
    summary: z.string().min(3, "O resumo deve ter pelo menos 3 caracteres."),
    status: z.string(),
});

export default function NewVisitPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [visitStatus, setVisitStatus] = useState<MasterDataItem[]>([]);
    const [isPastDateAlertOpen, setIsPastDateAlertOpen] = useState(false);
    const [isConflictAlertOpen, setIsConflictAlertOpen] = useState(false);
    const [conflictMessage, setConflictMessage] = useState("");
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const [clientsData, statusOptions] = await Promise.all([
                getClients(),
                getVisitStatusOptions()
            ]);
            setClients(clientsData);
            setVisitStatus(statusOptions);
            setLoading(false);
        }
        fetchData();
    }, []);

    const proceedToSubmit = async () => {
        if (!formRef.current) return;
        setIsSubmitting(true);
        setErrors({});
        const formData = new FormData(formRef.current);
        const visitData = {
            clientId: formData.get("clientId") as string,
            date: formData.get("date") as string,
            summary: formData.get("summary") as string,
            status: formData.get("status") as string,
        };

        const validationResult = visitSchema.safeParse(visitData);

        if (!validationResult.success) {
            setErrors(validationResult.error.flatten().fieldErrors);
            setIsSubmitting(false);
            return;
        }

        try {
            await addVisit(validationResult.data);
            toast({
                title: "Visita Agendada!",
                description: "A nova visita foi salva com sucesso.",
            });
            router.push('/visits');
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: "Erro ao agendar visita",
                description: "Ocorreu um erro. Verifique os dados e tente novamente."
            });
            setIsSubmitting(false);
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleValidation = async () => {
        if (!formRef.current) return;
        const formData = new FormData(formRef.current);
        const date = formData.get("date") as string;
        const clientId = formData.get("clientId") as string;
        
        if (!date || !clientId) {
            toast({ variant: 'destructive', title: "Erro", description: "Cliente e data são obrigatórios." });
            return;
        }

        const conflict = await checkForVisitConflict({ clientId, date });
        if(conflict) {
            const conflictDate = new Date(conflict.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short'});
            setConflictMessage(`Este cliente já tem uma visita agendada para ${conflictDate} (${conflict.summary}).`);
            setIsConflictAlertOpen(true);
            return;
        }
        
        const now = new Date();
        const selectedDate = new Date(date);

        if (selectedDate < now) {
            setIsPastDateAlertOpen(true);
        } else {
            await proceedToSubmit();
        }
    }

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        handleValidation();
    };

    if (loading) {
         return (
            <div className="flex items-center justify-center h-full">
                <LoaderCircle className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <PageHeader title="Agendar Nova Visita" />
            <form ref={formRef} onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Detalhes da Visita</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="clientId">Cliente</Label>
                            <Select name="clientId" required>
                                <SelectTrigger>
                                <SelectValue placeholder="Selecione um cliente" />
                                </SelectTrigger>
                                <SelectContent>
                                {clients.length > 0 ? (
                                    clients.map(client => (
                                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                    ))
                                ) : (
                                    <div className="p-4 text-sm text-muted-foreground">Nenhum cliente encontrado. <Link href="/clients/new" className="text-primary underline">Adicione um cliente</Link> primeiro.</div>
                                )}
                                </SelectContent>
                            </Select>
                            {errors.clientId && <p className="text-sm text-destructive">{errors.clientId[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date">Data e Hora</Label>
                            <Input id="date" name="date" type="datetime-local" required />
                             {errors.date && <p className="text-sm text-destructive">{errors.date[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="summary">Resumo/Objetivo da Visita</Label>
                            <Textarea id="summary" name="summary" placeholder="Ex: Avaliação inicial do ambiente, levantamento de necessidades." required />
                             {errors.summary && <p className="text-sm text-destructive">{errors.summary[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select name="status" defaultValue={visitStatus[0]?.name} required>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    {visitStatus.map(status => (
                                        <SelectItem key={status.id} value={status.name} className="capitalize">{status.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                             <Link href="/visits">
                                <Button type="button" variant="outline">Cancelar</Button>
                            </Link>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <CalendarPlus className="mr-2 h-4 w-4" />
                                        Agendar Visita
                                    </>
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
                           A data da visita é anterior à data e hora atuais. Deseja continuar mesmo assim?
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
