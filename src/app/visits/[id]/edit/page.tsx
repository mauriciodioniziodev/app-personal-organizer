
"use client";

import { useEffect, useState, FormEvent, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { getVisitById, getClients, updateVisit, checkForVisitConflict, getVisitStatusOptions } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoaderCircle, Save } from "lucide-react";
import type { Client, Visit } from "@/lib/definitions";
import Link from "next/link";
import { z } from "zod";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";


const visitSchema = z.object({
    id: z.string(),
    clientId: z.string().min(1, "Por favor, selecione um cliente."),
    date: z.string().min(1, "Data e hora são obrigatórios."),
    summary: z.string().min(3, "O resumo deve ter pelo menos 3 caracteres."),
    status: z.string(),
});

export default function EditVisitPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const { toast } = useToast();

    const [visit, setVisit] = useState<Visit | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [visitStatus, setVisitStatus] = useState<string[]>([]);
    const formRef = useRef<HTMLFormElement>(null);
    
    const [isPastDateAlertOpen, setIsPastDateAlertOpen] = useState(false);
    const [isConflictAlertOpen, setIsConflictAlertOpen] = useState(false);
    const [conflictMessage, setConflictMessage] = useState("");

    useEffect(() => {
        if (!id) return;
        async function fetchData() {
            const visitData = await getVisitById(id);
            if (visitData) {
                setVisit(visitData);
            } else {
                router.push('/visits');
            }
            const clientsData = await getClients();
            setClients(clientsData);
            const statusOptions = await getVisitStatusOptions();
            setVisitStatus(statusOptions);
        }
        fetchData();
    }, [id, router]);

    const proceedToSubmit = async () => {
        if (!formRef.current || !visit) return;
        setLoading(true);
        setErrors({});

        const formData = new FormData(formRef.current);
        const visitData = {
            ...visit,
            clientId: formData.get("clientId") as string,
            date: formData.get("date") as string,
            summary: formData.get("summary") as string,
            status: formData.get("status") as string,
        };

        const validationResult = visitSchema.safeParse(visitData);

        if (!validationResult.success) {
            setErrors(validationResult.error.flatten().fieldErrors);
            setLoading(false);
            return;
        }

        try {
            await updateVisit(validationResult.data);
            toast({
                title: "Visita Atualizada!",
                description: "As alterações foram salvas com sucesso.",
            });
            router.push(`/visits/${visit.id}`);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: "Erro ao atualizar visita",
                description: "Ocorreu um erro. Verifique os dados e tente novamente."
            });
        } finally {
            setLoading(false);
        }
    };
    
    const handleValidation = async () => {
        if (!formRef.current || !visit) return;
        const formData = new FormData(formRef.current);
        const date = formData.get("date") as string;
        const clientId = formData.get("clientId") as string;
        
        const conflict = await checkForVisitConflict({ clientId, date, visitId: visit.id });
        if(conflict) {
            const conflictDate = new Date(conflict.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short'});
            setConflictMessage(`Este cliente já tem uma visita agendada para ${conflictDate} (${conflict.summary}).`);
            setIsConflictAlertOpen(true);
            return;
        }
        
        const today = new Date();
        const selectedDate = new Date(date);

        if (selectedDate < today) {
            setIsPastDateAlertOpen(true);
        } else {
            await proceedToSubmit();
        }
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        handleValidation();
    };

    if (!visit) {
        return <div className="flex items-center justify-center h-full"><LoaderCircle className="w-8 h-8 animate-spin" /></div>;
    }
    
    // Format date for datetime-local input
    const formatDateForInput = (isoDate: string) => {
        const date = new Date(isoDate);
        // Adjust for timezone offset
        const timezoneOffset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - timezoneOffset);
        return localDate.toISOString().slice(0, 16);
    };

    return (
        <div className="flex flex-col gap-8">
            <PageHeader title="Editar Agendamento" />
            <form ref={formRef} onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Detalhes da Visita</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="clientId">Cliente</Label>
                            <Select name="clientId" required defaultValue={visit.clientId}>
                                <SelectTrigger>
                                <SelectValue placeholder="Selecione um cliente" />
                                </SelectTrigger>
                                <SelectContent>
                                {clients.length > 0 ? (
                                    clients.map(client => (
                                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                    ))
                                ) : (
                                    <div className="p-4 text-sm text-muted-foreground">Nenhum cliente encontrado.</div>
                                )}
                                </SelectContent>
                            </Select>
                            {errors.clientId && <p className="text-sm text-destructive">{errors.clientId[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date">Data e Hora</Label>
                            <Input id="date" name="date" type="datetime-local" required defaultValue={formatDateForInput(visit.date)} />
                             {errors.date && <p className="text-sm text-destructive">{errors.date[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="summary">Resumo/Objetivo da Visita</Label>
                            <Textarea id="summary" name="summary" placeholder="Ex: Avaliação inicial do ambiente, levantamento de necessidades." required defaultValue={visit.summary} />
                             {errors.summary && <p className="text-sm text-destructive">{errors.summary[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select name="status" defaultValue={visit.status} required>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    {visitStatus.map(status => (
                                        <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                             <Link href={`/visits/${id}`}>
                                <Button type="button" variant="outline">Cancelar</Button>
                            </Link>
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
                                ) : (
                                    <><Save className="mr-2 h-4 w-4"/>Salvar Alterações</>
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
