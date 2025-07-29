// src/components/visit-form.tsx
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createVisit } from "@/lib/actions";
import { getMasterData } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoaderCircle, Plus } from "lucide-react";
import type { Visit } from "@/lib/definitions";

type VisitFormProps = {
    clientId: string;
    onVisitCreated: (visit: Visit) => void;
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : children}</Button>;
}

export function VisitForm({ clientId, onVisitCreated }: VisitFormProps) {
    const { visitStatus } = getMasterData();
    
    const [state, dispatch] = useActionState(async (prevState: any, formData: FormData) => {
        try {
            const newVisit = await createVisit(formData);
            onVisitCreated(newVisit);
        } catch (error) {
            // Handle error, maybe show a toast
            console.error(error);
        }
    }, null);

    return (
        <form action={dispatch} className="space-y-4">
            <input type="hidden" name="clientId" value={clientId} />
            <div>
                <Label htmlFor="date">Data e Hora</Label>
                <Input id="date" name="date" type="datetime-local" required />
            </div>
            <div>
                <Label htmlFor="summary">Resumo/Objetivo da Visita</Label>
                <Textarea id="summary" name="summary" placeholder="Ex: Avaliação inicial do ambiente, levantamento de necessidades." required />
            </div>
            <div>
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={visitStatus[0]} required>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        {visitStatus.map(status => (
                            <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex justify-end">
                <SubmitButton><Plus className="mr-2 h-4 w-4"/> Adicionar Visita</SubmitButton>
            </div>
        </form>
    )
}
