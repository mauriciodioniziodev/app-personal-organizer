"use client";

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getLeadById, updateLead, getClientSources } from '@/lib/data';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoaderCircle, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { z } from 'zod';
import type { Lead, MasterDataItem } from '@/lib/definitions';


const leadSchema = z.object({
  id: z.string(),
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

export default function EditLeadPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { toast } = useToast();
    
    const [lead, setLead] = useState<Lead | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [sources, setSources] = useState<MasterDataItem[]>([]);

    useEffect(() => {
        if(!id) return;
        async function fetchData() {
            setLoading(true);
            const [leadData, sourcesData] = await Promise.all([
                getLeadById(id),
                getClientSources()
            ]);

            if (leadData) {
                setLead(leadData);
            } else {
                 toast({ variant: 'destructive', title: 'Erro', description: 'Lead não encontrado.' });
                router.push('/leads');
            }
            setSources(sourcesData);
            setLoading(false);
        }
        fetchData();
    }, [id, router, toast]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!lead) return;
        const { name, value } = e.target;
        setLead(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleSelectChange = (name: keyof Lead, value: string) => {
        if (!lead) return;
        setLead(prev => prev ? { ...prev, [name]: value } : null);
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if(!lead) return;

        setIsSubmitting(true);
        setErrors({});

        const validationResult = leadSchema.safeParse(lead);

        if (!validationResult.success) {
            setErrors(validationResult.error.flatten().fieldErrors);
            setIsSubmitting(false);
            return;
        }

        try {
            await updateLead(validationResult.data);
            toast({
                title: 'Lead Atualizado!',
                description: `As informações de ${validationResult.data.name} foram salvas.`
            });
            router.push('/leads');
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro ao atualizar lead',
                description: (error as Error).message
            });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    if (loading || !lead) {
        return <div className="flex items-center justify-center h-full"><LoaderCircle className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <div className="flex flex-col gap-8">
            <PageHeader title={`Editar Lead: ${lead.name}`} />
            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Informações do Lead</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid sm:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="name">Nome</Label>
                                <Input id="name" name="name" value={lead.name} onChange={handleInputChange} required />
                                {errors.name && <p className="text-sm text-destructive">{errors.name[0]}</p>}
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="phone">Telefone</Label>
                                <Input id="phone" name="phone" value={lead.phone} onChange={handleInputChange} required />
                                {errors.phone && <p className="text-sm text-destructive">{errors.phone[0]}</p>}
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input id="email" name="email" type="email" value={lead.email} onChange={handleInputChange}/>
                            {errors.email && <p className="text-sm text-destructive">{errors.email[0]}</p>}
                        </div>
                        
                        <div className="grid sm:grid-cols-2 gap-4">
                           <div className="space-y-2">
                                <Label htmlFor="source">Origem do Lead</Label>
                                <Select name="source" value={lead.source} onValueChange={(v) => handleSelectChange('source', v)} required>
                                    <SelectTrigger><SelectValue placeholder="Selecione a origem"/></SelectTrigger>
                                    <SelectContent>
                                        {sources.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {errors.source && <p className="text-sm text-destructive">{errors.source[0]}</p>}
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="urgency">Nível de Urgência</Label>
                                <Select name="urgency" value={lead.urgency} onValueChange={(v) => handleSelectChange('urgency', v as any)} required>
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
                            <Select name="budget" value={lead.budget} onValueChange={(v) => handleSelectChange('budget', v)} required>
                                <SelectTrigger><SelectValue placeholder="Selecione o orçamento"/></SelectTrigger>
                                <SelectContent>
                                    {budgetOptions.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {errors.budget && <p className="text-sm text-destructive">{errors.budget[0]}</p>}
                        </div>
                        
                         <div className="space-y-2">
                            <Label htmlFor="notes">Observações</Label>
                            <Textarea id="notes" name="notes" value={lead.notes} onChange={handleInputChange}/>
                        </div>
                        
                        <div className="flex justify-end gap-2">
                            <Link href="/leads">
                                <Button type="button" variant="outline"><ArrowLeft className="mr-2 h-4 w-4"/> Cancelar</Button>
                            </Link>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <LoaderCircle className="animate-spin" /> : <><Save className="mr-2 h-4 w-4"/> Salvar Alterações</>}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}