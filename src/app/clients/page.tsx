
"use client";

import { useEffect, useState } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getClients } from "@/lib/data";
import { PlusCircle, Mail, Phone, Search } from "lucide-react";
import PageHeader from "@/components/page-header";
import type { Client } from "@/lib/definitions";
import { Input } from '@/components/ui/input';

export default function ClientsPage() {
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Carrega e ordena os clientes na montagem inicial.
    const clientsData = getClients().sort((a, b) => a.name.localeCompare(b.name));
    setAllClients(clientsData);
    setFilteredClients(clientsData);
  }, []);

  // Garante que a lista seja atualizada se os dados mudarem em outra aba.
  useEffect(() => {
    const handleFocus = () => {
      const clientsData = getClients().sort((a, b) => a.name.localeCompare(b.name));
      setAllClients(clientsData);
      // Re-aplica o filtro com os dados atualizados
      setFilteredClients(
        clientsData.filter(client =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [searchTerm]);

  useEffect(() => {
    const results = allClients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClients(results);
  }, [searchTerm, allClients]);

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
      
      <div className="flex justify-start">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Filtrar por nome do cliente..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      {filteredClients.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
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
            <h2 className="text-2xl font-headline">Nenhum cliente encontrado</h2>
            <p className="text-muted-foreground mt-2 mb-4">
              {allClients.length > 0 ? 'Tente um termo de busca diferente.' : 'Comece adicionando seu primeiro cliente.'}
            </p>
            {allClients.length === 0 && (
                <Link href="/clients/new">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Cliente
                    </Button>
                </Link>
            )}
        </div>
      )}
    </div>
  );
}
