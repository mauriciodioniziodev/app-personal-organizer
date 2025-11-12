
"use client";

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { addLead, getClientSources } from '@/lib/data';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoaderCircle } from 'lucide-react';
import Link from 'next/link';
import { z } from 'zod';
import { useEffect } from 'react';
import type { MasterDataItem } from '@/lib/definitions';


const leadSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  email: z.string().email("E-mail inválido.").optional().or(z.literal('')),
  phone: z.string().min(10, "Telefone inválido."),
  source: z.string().min(1, "A origem é obrigatória"),
  urgency: z.enum(['baixa', 'media', 'alta'], { required_error: "O nível de urgência é obrigatório."}),
  budget: z.string().min(1, "A estimativa de orçamento é obrigatória."),
  notes: z.string().optional(),
});


const budgetOptions = [
    "Ainda não sei",
    "Até R$ 500",
    "R$ 500 - R$ 1.500",
    "R$ 1.500 - R$ 3.000",
    "Acima de R$ 3.000"
];

export default function NewLeadPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [sources, setSources] = useState<MasterDataItem[]>([]);

    useEffect(() => {
        getClientSources().then(setSources);
    }, []);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        const formData = new FormData(e.currentTarget);
        const leadData = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            phone: formData.get('phone') as string,
            source: formData.get('source') as string,
            urgency: formData.get('urgency') as any,
            budget: formData.get('budget') as string,
            notes: formData.get('notes') as string,
        };

        const validationResult = leadSchema.safeParse(leadData);

        if (!validationResult.success) {
            setErrors(validationResult.error.flatten().fieldErrors);
            setIsSubmitting(false);
            return;
        }

        try {
            await addLead(validationResult.data);
            toast({
                title: 'Lead Adicionado!',
                description: `${validationResult.data.name} foi adicionado ao seu funil.`
            });
            router.push('/leads');
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro ao adicionar lead',
                description: (error as Error).message
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex flex-col gap-8">
            <PageHeader title="Novo Lead" />
            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Informações do Lead</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid sm:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="name">Nome</Label>
                                <Input id="name" name="name" placeholder="Nome do potencial cliente" required />
                                {errors.name && <p className="text-sm text-destructive">{errors.name[0]}</p>}
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="phone">Telefone</Label>
                                <Input id="phone" name="phone" placeholder="(11) 98765-4321" required />
                                {errors.phone && <p className="text-sm text-destructive">{errors.phone[0]}</p>}
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input id="email" name="email" type="email" placeholder="email@example.com" />
                            {errors.email && <p className="text-sm text-destructive">{errors.email[0]}</p>}
                        </div>
                        
                        <div className="grid sm:grid-cols-2 gap-4">
                           <div className="space-y-2">
                                <Label htmlFor="source">Origem do Lead</Label>
                                <Select name="source" required>
                                    <SelectTrigger><SelectValue placeholder="Selecione a origem"/></SelectTrigger>
                                    <SelectContent>
                                        {sources.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {errors.source && <p className="text-sm text-destructive">{errors.source[0]}</p>}
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="urgency">Nível de Urgência</Label>
                                <Select name="urgency" required>
                                    <SelectTrigger><SelectValue placeholder="Selecione a urgência"/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="baixa">Baixa (Só pesquisando)</SelectItem>
                                        <SelectItem value="media">Média (Próximos 30 dias)</SelectItem>
                                        <SelectItem value="alta">Alta (Imediato)</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.urgency && <p className="text-sm text-destructive">{errors.urgency[0]}</p>}
                            </div>
                        </div>

                         <div className="space-y-2">
                            <Label htmlFor="budget">Estimativa de Orçamento</Label>
                            <Select name="budget" required>
                                <SelectTrigger><SelectValue placeholder="Selecione o orçamento"/></SelectTrigger>
                                <SelectContent>
                                    {budgetOptions.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {errors.budget && <p className="text-sm text-destructive">{errors.budget[0]}</p>}
                        </div>
                        
                         <div className="space-y-2">
                            <Label htmlFor="notes">Observações</Label>
                            <Textarea id="notes" name="notes" placeholder="Detalhes da conversa, serviço de interesse, etc." />
                        </div>
                        
                        <div className="flex justify-end gap-2">
                            <Link href="/leads">
                                <Button type="button" variant="outline">Cancelar</Button>
                            </Link>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <LoaderCircle className="animate-spin" /> : "Salvar Lead"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}

