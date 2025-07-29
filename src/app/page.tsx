
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getActiveProjects, getUpcomingVisits, getTotalRevenue, getClients, getTotalPendingRevenue, getVisitsSummary, getTodaysSchedule } from "@/lib/data";
import { Calendar, CalendarClock, FolderKanban, Wallet, Eye, EyeOff, Phone, MapPin, User, Hourglass, CheckCircle, FileText, XCircle, Clock } from "lucide-react";
import PageHeader from "@/components/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Project, Visit, Client, VisitsSummary, ScheduleItem } from '@/lib/definitions';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import React from 'react';

export default function Dashboard() {
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [upcomingVisits, setUpcomingVisits] = useState<Visit[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [visitsSummary, setVisitsSummary] = useState<VisitsSummary>({});
  const [dailySchedule, setDailySchedule] = useState<ScheduleItem[]>([]);

  useEffect(() => {
    // A simple way to force re-fetch on focus to keep data fresh
    // across tabs or after some inactivity.
    const refetch = () => {
        setActiveProjects(getActiveProjects());
        setUpcomingVisits(getUpcomingVisits());
        setClients(getClients());
        setVisitsSummary(getVisitsSummary());
        setDailySchedule(getTodaysSchedule());
    }
    refetch();

    window.addEventListener('focus', refetch);
    return () => window.removeEventListener('focus', refetch);
  }, []);

  const getClientData = (clientId: string) => {
    return clients.find(c => c.id === clientId);
  }

  const visitStatusIcons: { [key: string]: React.ReactNode } = {
        pendente: <Clock className="w-4 h-4 text-yellow-600" />,
        realizada: <CheckCircle className="w-4 h-4 text-green-600" />,
        cancelada: <XCircle className="w-4 h-4 text-red-600" />,
        orçamento: <FileText className="w-4 h-4 text-blue-600" />,
  };
  
  const visitStatusColors: { [key: string]: string } = {
      pendente: 'text-yellow-800 bg-yellow-100',
      realizada: 'text-green-800 bg-green-100',
      cancelada: 'text-red-800 bg-red-100',
      orçamento: 'text-blue-800 bg-blue-100',
  }

  const scheduleIcons: { [key: string]: React.ReactNode } = {
      visit: <CalendarClock className="w-5 h-5 text-accent-foreground" />,
      project: <FolderKanban className="w-5 h-5 text-accent-foreground" />,
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Dashboard" />

       <div className="grid gap-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-xl">Agenda do Dia</CardTitle>
                    <CardDescription>{new Date().toLocaleDateString('pt-BR', { dateStyle: 'full' })}</CardDescription>
                </CardHeader>
                <CardContent>
                    {dailySchedule.length > 0 ? (
                        <ul className="space-y-4">
                            {dailySchedule.map((item, index) => {
                                const isVisit = item.type === 'visit';
                                const isOverdue = isVisit && item.status === 'pendente' && new Date(item.date) < new Date();
                                
                                return (
                                <React.Fragment key={item.id}>
                                <li>
                                    <Link href={item.path} className="block p-4 -m-4 rounded-lg hover:bg-muted transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent shrink-0">
                                                {scheduleIcons[item.type]}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-semibold">{item.type === 'project' ? `Projeto: ${item.title}` : item.title}</p>
                                                        <p className="text-sm font-medium text-foreground">{item.clientName}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {isOverdue && (
                                                            <Badge variant="destructive">Atrasada</Badge>
                                                        )}
                                                         {isVisit && (
                                                            <Badge variant="outline" className={cn("capitalize", visitStatusColors[item.status] ?? 'border-border')}>
                                                                {item.status}
                                                            </Badge>
                                                        )}
                                                        {item.time && <p className="text-sm font-bold shrink-0">{item.time}</p>}
                                                    </div>
                                                </div>
                                                <div className='mt-2 space-y-1 text-sm text-muted-foreground'>
                                                    {item.clientPhone && (
                                                        <div className='flex items-center gap-2'>
                                                            <Phone className="w-3 h-3"/>
                                                            <span>{item.clientPhone}</span>
                                                        </div>
                                                    )}
                                                     {item.clientAddress && (
                                                        <div className='flex items-center gap-2'>
                                                            <MapPin className="w-3 h-3"/>
                                                            <span className='truncate'>{item.clientAddress}</span>
                                                        </div>
                                                    )}
                                                     {item.type === 'project' && item.projectStartDate && item.projectEndDate && (
                                                        <div className='flex items-center gap-2 pt-1'>
                                                            <Calendar className="w-3 h-3"/>
                                                            <span className="font-medium text-xs">
                                                                {formatDate(item.projectStartDate)} - {formatDate(item.projectEndDate)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                                 {index < dailySchedule.length - 1 && <Separator />}
                                </React.Fragment>
                            )})}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">Nenhum compromisso para hoje.</p>
                    )}
                </CardContent>
            </Card>
        </div>


      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <Link href="/projects" className="block">
          <Card className="hover:bg-muted/50 transition-colors h-full">
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
        </Link>
        <Link href="/visits" className="block">
          <Card className="hover:bg-muted/50 transition-colors h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximas Visitas</CardTitle>
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">{upcomingVisits.length}</div>
              <p className="text-xs text-muted-foreground">
                Visitas nos próximos 7 dias
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

       <div className="grid gap-8">
            <Link href="/visits">
                <Card className="hover:bg-muted/50 transition-colors">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl">Resumo de Visitas</CardTitle>
                        <CardDescription>Status geral de todos os agendamentos.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {Object.keys(visitsSummary).length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.entries(visitsSummary).map(([status, count]) => (
                                    <div key={status} className="flex items-center gap-3">
                                        {visitStatusIcons[status] || <div className="w-4 h-4" />}
                                        <div>
                                            <p className="font-bold text-lg">{count}</p>
                                            <p className="text-sm capitalize text-muted-foreground">{status}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <p className="text-muted-foreground text-center py-4">Nenhuma visita registrada.</p>
                        )}
                    </CardContent>
                </Card>
            </Link>
        </div>


      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-headline mb-4">Projetos Ativos Recentes</h2>
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
                                    <Badge variant="outline" className={cn("capitalize", visitStatusColors[visit.status] ?? 'border-border')}>
                                        {visit.status}
                                    </Badge>
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
