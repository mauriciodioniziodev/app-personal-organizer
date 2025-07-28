"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createClient } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/page-header";
import Link from "next/link";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? "Salvando..." : "Salvar Cliente"}
    </Button>
  );
}

export default function NewClientPage() {
  const initialState = { errors: {}, message: null };
  const [state, dispatch] = useActionState(createClient, initialState);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Novo Cliente" />
      <form action={dispatch}>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Detalhes do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" name="name" placeholder="Ex: Ana Silva" required />
                {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" placeholder="email@example.com" required />
                {state.errors?.email && <p className="text-sm text-destructive">{state.errors.email}</p>}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" name="phone" placeholder="(11) 98765-4321" required />
                {state.errors?.phone && <p className="text-sm text-destructive">{state.errors.phone}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" name="address" placeholder="Rua, Número, Bairro, Cidade" required />
                {state.errors?.address && <p className="text-sm text-destructive">{state.errors.address}</p>}
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
                    <Button variant="outline">Cancelar</Button>
                </Link>
                <SubmitButton />
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
