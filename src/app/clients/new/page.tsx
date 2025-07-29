
"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/page-header";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { addClient } from "@/lib/data"; // Importa a função que interage com o localStorage

// Zod schema para validação no lado do cliente
import { z } from "zod";
const clientSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  email: z.string().email("E-mail inválido."),
  phone: z.string().min(10, "Telefone inválido."),
  address: z.string().min(5, "Endereço inválido."),
  preferences: z.string().optional(),
});


export default function NewClientPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrors({});
    
    const formData = new FormData(event.currentTarget);
    const clientData = {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        address: formData.get("address") as string,
        preferences: formData.get("preferences") as string,
    }

    const validationResult = clientSchema.safeParse(clientData);

    if (!validationResult.success) {
      setErrors(validationResult.error.flatten().fieldErrors);
      setLoading(false);
      return;
    }

    try {
      const newClient = addClient(validationResult.data);
      toast({
        title: "Cliente Criado com Sucesso!",
        description: `${newClient.name} foi adicionado(a) à sua lista de clientes.`,
      });
      router.push(`/clients`); 
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar cliente",
        description: "Ocorreu um erro inesperado. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Novo Cliente" />
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Detalhes do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" name="name" placeholder="Ex: Ana Silva" required />
                {errors?.name && <p className="text-sm text-destructive">{errors.name[0]}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" placeholder="email@example.com" required />
                {errors?.email && <p className="text-sm text-destructive">{errors.email[0]}</p>}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" name="phone" placeholder="(11) 98765-4321" required />
                {errors?.phone && <p className="text-sm text-destructive">{errors.phone[0]}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" name="address" placeholder="Rua, Número, Bairro, Cidade" required />
                {errors?.address && <p className="text-sm text-destructive">{errors.address[0]}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferences">Preferências e Observações</Label>
              <Textarea
                id="preferences"
                name="preferences"
                placeholder="Descreva aqui as preferências do cliente, histórico, etc."
                className="min-h-[120px]"
              />
            </div>
            <div className="flex justify-end gap-2">
                <Link href="/clients">
                    <Button type="button" variant="outline">Cancelar</Button>
                </Link>
                <Button type="submit" disabled={loading} aria-disabled={loading}>
                  {loading ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Cliente"
                  )}
                </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
