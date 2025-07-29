
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveProjects, getUpcomingVisits, getTotalRevenue, getClients } from "@/lib/data";
import { CalendarClock, FolderKanban, Wallet, Eye, EyeOff, Phone, MapPin, User } from "lucide-react";
import PageHeader from "@/components/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Project, Visit, Client } from '@/lib/definitions';

export default function Dashboard() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [upcomingVisits, setUpcomingVisits] = useState<Visit[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showRevenue, setShowRevenue] = useState(false);

  useEffect(() => {
    // A simple way to force re-fetch on focus to keep data fresh
    // across tabs or after some inactivity.
    const refetch = () => {
        setTotalRevenue(getTotalRevenue());
        setActiveProjects(getActiveProjects());
        setUpcomingVisits(getUpcomingVisits());
        setClients(getClients());
    }
    refetch();

    window.addEventListener('focus', refetch);
    return () => window.removeEventListener('focus', refetch);
  }, []);

  const getClientData = (clientId: string) => {
    return clients.find(c => c.id === clientId);
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Dashboard" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
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
              Receita total de todos os projetos pagos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">{activeProjects.length}</div>
            <p className="text-xs text-muted-foreground">
              Projetos atualmente em andamento
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximas Visitas</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">{upcomingVisits.length}</div>
            <p className="text-xs text-muted-foreground">
              Visitas agendadas para os próximos 7 dias
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-headline mb-4">Projetos Ativos</h2>
          <Card>
            <CardContent className="p-4">
              {activeProjects.length > 0 ? (
                <ul className="space-y-2">
                  {activeProjects.slice(0, 5).map((project) => {
                     const client = getClientData(project.clientId);
                     return (
                        <li key={project.id}>
                            <Link href={`/projects/${project.id}`} className="block p-4 -m-2 rounded-lg hover:bg-muted transition-colors">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold">{project.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Prazo: {new Date(project.endDate).toLocaleDateString('pt-BR', { timeZone: 'UTC'})}
                                        </p>
                                        {client && (
                                            <div className='mt-2 space-y-1 text-sm text-muted-foreground'>
                                                <div className='flex items-center gap-2 font-medium text-foreground'>
                                                    <User className="w-3 h-3"/>
                                                    <span>{client.name}</span>
                                                </div>
                                                <div className='flex items-center gap-2'>
                                                   <Phone className="w-3 h-3"/>
                                                   <span>{client.phone}</span>
                                                </div>
                                                <div className='flex items-center gap-2'>
                                                   <MapPin className="w-3 h-3"/>
                                                   <span className='truncate'>{client.address}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        </li>
                     )
                  })}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-4">Nenhum projeto ativo no momento.</p>
              )}
            </CardContent>
          </Card>
        </div>
        <div>
          <h2 className="text-xl font-headline mb-4">Próximas Visitas</h2>
          <Card>
            <CardContent className="p-4">
              {upcomingVisits.length > 0 ? (
                <ul className="space-y-2">
                  {upcomingVisits.slice(0, 5).map((visit) => {
                    const client = getClientData(visit.clientId);
                    return (
                        <li key={visit.id}>
                            <Link href={`/visits/${visit.id}`} className="block p-4 -m-2 rounded-lg hover:bg-muted transition-colors">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold">{new Date(visit.date).toLocaleString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                        {client && (
                                            <div className='mt-2 space-y-1 text-sm text-muted-foreground'>
                                                 <div className='flex items-center gap-2 font-medium text-foreground'>
                                                    <User className="w-3 h-3"/>
                                                    <span>{client.name}</span>
                                                </div>
                                                <div className='flex items-center gap-2'>
                                                   <Phone className="w-3 h-3"/>
                                                   <span>{client.phone}</span>
                                                </div>
                                                <div className='flex items-center gap-2'>
                                                   <MapPin className="w-3 h-3"/>
                                                   <span className='truncate'>{client.address}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-xs font-semibold capitalize px-2 py-1 rounded-full bg-secondary text-secondary-foreground">{visit.status}</span>
                                </div>
                            </Link>
                        </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-4">Nenhuma visita agendada.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
