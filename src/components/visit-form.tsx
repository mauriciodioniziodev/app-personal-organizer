
"use client";

import { useState, FormEvent } from "react";
import { addVisit, getMasterData } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoaderCircle, Plus } from "lucide-react";
import type { Visit } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type VisitFormProps = {
    clientId: string;
    onVisitCreated: (visit: Visit) => void;
}

const visitSchema = z.object({
    clientId: z.string().min(1, "Por favor, selecione um cliente."),
    date: z.string().min(1, "Data e hora são obrigatórios."),
    summary: z.string().min(3, "O resumo deve ter pelo menos 3 caracteres."),
    status: z.string(),
});

export function VisitForm({ clientId, onVisitCreated }: VisitFormProps) {
    const { visitStatus } = getMasterData();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setErrors({});

        const formData = new FormData(event.currentTarget);
        const visitData = {
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
            const newVisit = addVisit(validationResult.data);
            onVisitCreated(newVisit);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: "Erro ao agendar visita",
                description: "Ocorreu um erro. Verifique os dados e tente novamente."
            });
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="clientId" value={clientId} />
            <div>
                <Label htmlFor="date">Data e Hora</Label>
                <Input id="date" name="date" type="datetime-local" />
                {errors.date && <p className="text-sm text-destructive mt-1">{errors.date[0]}</p>}
            </div>
            <div>
                <Label htmlFor="summary">Resumo/Objetivo da Visita</Label>
                <Textarea id="summary" name="summary" placeholder="Ex: Avaliação inicial do ambiente, levantamento de necessidades." />
                {errors.summary && <p className="text-sm text-destructive mt-1">{errors.summary[0]}</p>}
            </div>
            <div>
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={visitStatus[0]}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        {visitStatus.map(status => (
                            <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 {errors.status && <p className="text-sm text-destructive mt-1">{errors.status[0]}</p>}
            </div>
            <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                    {loading ? (
                        <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
                    ) : (
                        <><Plus className="mr-2 h-4 w-4"/> Adicionar Visita</>
                    )}
                </Button>
            </div>
        </form>
    )
}
