
"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { getClientById, updateClient } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoaderCircle, Save } from "lucide-react";
import type { Client } from "@/lib/definitions";
import Link from "next/link";
import { z } from "zod";

const clientSchema = z.object({
  id: z.string(),
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  email: z.string().email("E-mail inválido.").or(z.literal('')),
  phone: z.string().min(10, "Telefone inválido."),
  address: z.string().min(5, "Endereço inválido."),
  cpf: z.string().optional(),
  birthday: z.string().optional(),
  preferences: z.string().optional(),
});

export default function EditClientPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const { toast } = useToast();

    const [client, setClient] = useState<Partial<Client> | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    useEffect(() => {
        if (!id) return;
        async function fetchClient() {
            setLoading(true);
            const clientData = await getClientById(id);
            if (clientData) {
                setClient(clientData);
            } else {
                toast({ variant: 'destructive', title: 'Erro', description: 'Cliente não encontrado.' });
                router.push('/clients');
            }
            setLoading(false);
        }
        fetchClient();
    }, [id, router, toast]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!client) return;
        const { name, value } = e.target;
        setClient(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!client) return;

        setIsSubmitting(true);
        setErrors({});

        const validationResult = clientSchema.safeParse(client);
        if (!validationResult.success) {
            setErrors(validationResult.error.flatten().fieldErrors);
            setIsSubmitting(false);
            return;
        }

        try {
            await updateClient(validationResult.data as Client);
            toast({
                title: "Cliente Atualizado!",
                description: "As informações do cliente foram salvas.",
            });
            router.push(`/clients/${id}`);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro ao salvar',
                description: 'Não foi possível atualizar o cliente.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || !client) {
        return <div className="flex items-center justify-center h-full"><LoaderCircle className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <div className="flex flex-col gap-8">
            <PageHeader title={`Editar: ${client.name}`} />
            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Detalhes do Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome Completo</Label>
                                <Input id="name" name="name" value={client.name || ''} onChange={handleInputChange} required />
                                {errors?.name && <p className="text-sm text-destructive">{errors.name[0]}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail</Label>
                                <Input id="email" name="email" type="email" value={client.email || ''} onChange={handleInputChange} />
                                {errors?.email && <p className="text-sm text-destructive">{errors.email[0]}</p>}
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefone</Label>
                                <Input id="phone" name="phone" value={client.phone || ''} onChange={handleInputChange} required />
                                {errors?.phone && <p className="text-sm text-destructive">{errors.phone[0]}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Endereço</Label>
                                <Input id="address" name="address" value={client.address || ''} onChange={handleInputChange} required />
                                {errors?.address && <p className="text-sm text-destructive">{errors.address[0]}</p>}
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cpf">CPF</Label>
                                <Input id="cpf" name="cpf" value={client.cpf || ''} onChange={handleInputChange} />
                                {errors?.cpf && <p className="text-sm text-destructive">{errors.cpf[0]}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="birthday">Aniversário (DD/MM)</Label>
                                <Input id="birthday" name="birthday" value={client.birthday || ''} onChange={handleInputChange} />
                                {errors?.birthday && <p className="text-sm text-destructive">{errors.birthday[0]}</p>}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="preferences">Preferências e Observações</Label>
                            <Textarea
                                id="preferences"
                                name="preferences"
                                value={client.preferences || ''}
                                onChange={handleInputChange}
                                className="min-h-[120px]"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Link href={`/clients/${id}`}>
                                <Button type="button" variant="outline">Cancelar</Button>
                            </Link>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
                                ) : (
                                    <><Save className="mr-2 h-4 w-4"/>Salvar Alterações</>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
