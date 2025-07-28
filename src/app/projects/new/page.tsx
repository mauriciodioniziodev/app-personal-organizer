"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createProject } from "@/lib/actions";
import { getClients, getMasterData } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LoaderCircle } from "lucide-react";
import type { Client } from "@/lib/definitions";
import { useState, useEffect } from "react";


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? (
        <>
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          Salvando...
        </>
      ) : (
        "Salvar Projeto"
      )}
    </Button>
  );
}

export default function NewProjectPage() {
  const initialState = { errors: {}, message: null };
  const [state, dispatch] = useActionState(createProject, initialState);
  const [clients, setClients] = useState<Client[]>([]);
  const [masterData, setMasterData] = useState(getMasterData());

  useEffect(() => {
    // Fetch clients and master data on component mount
    setClients(getClients());
    setMasterData(getMasterData());
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Novo Projeto" />
      <form action={dispatch}>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Detalhes do Projeto</CardTitle>
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
                    <div className="p-4 text-sm text-muted-foreground">Nenhum cliente encontrado. Adicione um cliente primeiro.</div>
                  )}
                </SelectContent>
              </Select>
               {state.errors?.clientId && <p className="text-sm text-destructive">{state.errors.clientId}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome do Projeto</Label>
              <Input id="name" name="name" placeholder="Ex: Organização da Cozinha" required />
              {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" name="description" placeholder="Descreva os objetivos e o escopo do projeto." />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data de Início</Label>
                <Input id="startDate" name="startDate" type="date" required />
                {state.errors?.startDate && <p className="text-sm text-destructive">{state.errors.startDate}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data de Conclusão</Label>
                <Input id="endDate" name="endDate" type="date" required />
                 {state.errors?.endDate && <p className="text-sm text-destructive">{state.errors.endDate}</p>}
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="value">Valor do Projeto (R$)</Label>
                    <Input id="value" name="value" type="number" step="0.01" placeholder="1200.00" required />
                    {state.errors?.value && <p className="text-sm text-destructive">{state.errors.value}</p>}
                </div>
                 <div className="space-y-2">
                    <Label>Status do Pagamento</Label>
                    <RadioGroup name="paymentStatus" defaultValue={masterData.paymentStatus[0]} className="flex items-center pt-2 gap-4">
                        {masterData.paymentStatus.map(status => (
                            <div key={status} className="flex items-center space-x-2">
                                <RadioGroupItem value={status} id={status} />
                                <Label htmlFor={status} className="capitalize">{status}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Link href="/projects">
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
