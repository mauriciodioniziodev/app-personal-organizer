
"use client";

import { useState, FormEvent, useEffect } from "react";
import { getMasterData, updateProject } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LoaderCircle, Save } from "lucide-react";
import type { Project } from "@/lib/definitions";
import { z } from "zod";

type ProjectFormProps = {
    project: Project;
    onProjectUpdated: (project: Project) => void;
}

const projectSchema = z.object({
    id: z.string(),
    clientId: z.string(),
    visitId: z.string(),
    name: z.string().min(3, "O nome do projeto deve ter pelo menos 3 caracteres."),
    description: z.string().optional(),
    startDate: z.string().min(1, "Data de início é obrigatória."),
    endDate: z.string().min(1, "Data de conclusão é obrigatória."),
    value: z.coerce.number().min(0, "O valor deve ser positivo."),
    paymentStatus: z.string()
});


export function ProjectForm({ project, onProjectUpdated }: ProjectFormProps) {
    const { paymentStatus } = getMasterData();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setErrors({});

        const formData = new FormData(event.currentTarget);
        const projectData = {
            id: project.id,
            clientId: project.clientId,
            visitId: project.visitId,
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
            const updated = updateProject(validationResult.data);
            onProjectUpdated(updated);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                     {loading ? (
                        <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
                    ) : (
                        <><Save className="mr-2 h-4 w-4"/> Salvar Alterações</>
                    )}
                </Button>
            </div>
        </form>
    )
}
