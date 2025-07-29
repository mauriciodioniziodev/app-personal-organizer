

"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTotalRevenue, getClients, getTotalPendingRevenue, getProjects } from "@/lib/data";
import { Wallet, Eye, EyeOff, Hourglass, User, Calendar } from "lucide-react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import type { Project, Client } from '@/lib/definitions';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn, formatDate } from '@/lib/utils';

export default function FinanceiroPage() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingRevenue, setPendingRevenue] = useState(0);
  const [pendingProjects, setPendingProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const [showRevenue, setShowRevenue] = useState(false);
  const [showPendingRevenue, setShowPendingRevenue] = useState(false);

  useEffect(() => {
    const refetch = () => {
        setTotalRevenue(getTotalRevenue());
        setPendingRevenue(getTotalPendingRevenue());
        setClients(getClients());
        setPendingProjects(getProjects().filter(p => p.paymentStatus !== 'pago'));
    }
    refetch();

    window.addEventListener('focus', refetch);
    return () => window.removeEventListener('focus', refetch);
  }, []);

  const getClient = (clientId: string) => {
    return clients.find(c => c.id === clientId);
  }
  
  const paymentStatusColors: { [key: string]: string } = {
      pago: 'text-green-800 bg-green-100',
      pendente: 'text-yellow-800 bg-yellow-100',
      'parcialmente pago': 'text-blue-800 bg-blue-100',
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Financeiro" />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Realizada</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="flex items-center justify-between">
                <div className="text-2xl font-bold font-headline">
                {showRevenue ? (
                    new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                    }).format(totalRevenue)
                ) : (
                    'R$ ••••••'
                )}
                </div>
                 <Button variant="ghost" size="icon" onClick={() => setShowRevenue(!showRevenue)}>
                    {showRevenue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">Mostrar/Ocultar receita</span>
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Soma de todas as parcelas com status "pago".
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="flex items-center justify-between">
                <div className="text-2xl font-bold font-headline">
                {showPendingRevenue ? (
                    new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                    }).format(pendingRevenue)
                ) : (
                    'R$ ••••••'
                )}
                </div>
                 <Button variant="ghost" size="icon" onClick={() => setShowPendingRevenue(!showPendingRevenue)}>
                    {showPendingRevenue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">Mostrar/Ocultar receita pendente</span>
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">
               Soma de todas as parcelas com status "pendente".
            </p>
          </CardContent>
        </Card>
      </div>

       <div>
          <h2 className="text-xl font-headline mb-4">Projetos com Pagamento Pendente</h2>
          <Card>
            <CardContent className="p-4">
              {pendingProjects.length > 0 ? (
                <ul className="space-y-4">
                  {pendingProjects.map((project) => {
                     const client = getClient(project.clientId);
                     return (
                        <li key={project.id}>
                            <Link href={`/projects/${project.id}`} className="block p-4 -m-4 rounded-lg hover:bg-muted transition-colors">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                                    <div className="flex-grow">
                                        <p className="font-semibold">{project.name}</p>
                                        {client && (
                                            <div className='flex items-center gap-2 mt-1 text-sm text-muted-foreground'>
                                                <User className="w-3 h-3"/>
                                                <span>{client.name}</span>
                                            </div>
                                        )}
                                        <div className='flex items-center gap-2 mt-1 text-sm text-muted-foreground'>
                                            <Calendar className="w-3 h-3"/>
                                            <span>
                                                Prazo: {formatDate(project.endDate)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className='flex sm:flex-col items-end gap-2 sm:gap-1 mt-2 sm:mt-0 shrink-0'>
                                        <p className="font-semibold text-lg">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(project.value)}</p>
                                        <Badge variant={'outline'} className={cn("capitalize", paymentStatusColors[project.paymentStatus] ?? 'border-border')}>
                                            {project.paymentStatus}
                                        </Badge>
                                    </div>
                                </div>
                            </Link>
                        </li>
                     )
                  })}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-8">Nenhum projeto com pagamento pendente.</p>
              )}
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
