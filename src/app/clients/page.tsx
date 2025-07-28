"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getClients } from "@/lib/data";
import { PlusCircle, Mail, Phone } from "lucide-react";
import PageHeader from "@/components/page-header";
import { useState, useEffect } from "react";
import type { Client } from "@/lib/definitions";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    setClients(getClients());
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Clientes">
        <Link href="/clients/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Cliente
          </Button>
        </Link>
      </PageHeader>
      
      {clients.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="font-headline">{client.name}</CardTitle>
                <CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{client.email}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{client.phone}</span>
                    </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">{client.preferences || "Nenhuma preferência registrada."}</p>
              </CardContent>
              <CardFooter>
                <Link href={`/clients/${client.id}`} className="w-full">
                  <Button variant="outline" className="w-full">
                    Ver Detalhes
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-dashed border-2 rounded-lg">
            <h2 className="text-2xl font-headline">Nenhum cliente cadastrado</h2>
            <p className="text-muted-foreground mt-2 mb-4">Comece adicionando seu primeiro cliente.</p>
            <Link href="/clients/new">
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Cliente
                </Button>
            </Link>
        </div>
      )}
    </div>
  );
}
