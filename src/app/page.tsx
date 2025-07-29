
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveProjects, getUpcomingVisits, getTotalRevenue } from "@/lib/data";
import { CalendarClock, FolderKanban, Wallet } from "lucide-react";
import PageHeader from "@/components/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { Project, Visit } from '@/lib/definitions';

export default function Dashboard() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [upcomingVisits, setUpcomingVisits] = useState<Visit[]>([]);

  useEffect(() => {
    setTotalRevenue(getTotalRevenue());
    setActiveProjects(getActiveProjects());
    setUpcomingVisits(getUpcomingVisits());
  }, []);

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
            <div className="text-2xl font-bold font-headline">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Receita total de todos os projetos
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
                <ul className="space-y-4">
                  {activeProjects.slice(0, 5).map((project) => (
                    <li key={project.id} className="flex items-center justify-between">
                      <div>
                        <Link href={`/projects/${project.id}`} className="font-semibold hover:underline">{project.name}</Link>
                        <p className="text-sm text-muted-foreground">
                          Prazo: {formatDate(project.endDate)}
                        </p>
                      </div>
                      <Link href={`/projects/${project.id}`}>
                        <Button variant="outline" size="sm">Ver Detalhes</Button>
                      </Link>
                    </li>
                  ))}
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
                <ul className="space-y-4">
                  {upcomingVisits.slice(0, 5).map((visit) => (
                     <li key={visit.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{new Date(visit.date).toLocaleString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        <Link href={`/projects/${visit.projectId}`} className="text-sm text-muted-foreground hover:underline">
                          Projeto: {activeProjects.find(p => p.id === visit.projectId)?.name || 'Desconhecido'}
                        </Link>
                      </div>
                       <span className={`text-xs font-semibold capitalize px-2 py-1 rounded-full ${
                        visit.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' : 
                        visit.status === 'realizada' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                       }`}>{visit.status}</span>
                    </li>
                  ))}
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
