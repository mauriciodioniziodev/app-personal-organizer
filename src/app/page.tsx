

"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getActiveProjects, getUpcomingVisits, getTodaysSchedule, getVisitsSummary, getClients } from "@/lib/data";
import { Calendar, CalendarClock, FolderKanban, Phone, MapPin, User, CheckCircle, FileText, XCircle, Clock, LoaderCircle, Info, Activity, Contact } from "lucide-react";
import PageHeader from "@/components/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Project, Visit, Client, VisitsSummary, ScheduleItem } from '@/lib/definitions';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function Dashboard() {
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [upcomingVisits, setUpcomingVisits] = useState<Visit[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [visitsSummary, setVisitsSummary] = useState<VisitsSummary>({});
  const [dailySchedule, setDailySchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
        setCurrentTime(new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchData() {
        setLoading(true);
        const [
            activeProjectsData, 
            upcomingVisitsData, 
            visitsSummaryData, 
            dailyScheduleData,
            clientsData,
        ] = await Promise.all([
            getActiveProjects(),
            getUpcomingVisits(),
            getVisitsSummary(),
            getTodaysSchedule(),
            getClients(),
        ]);

        setActiveProjects(activeProjectsData);
        setUpcomingVisits(upcomingVisitsData);
        setVisitsSummary(visitsSummaryData);
        setDailySchedule(dailyScheduleData);
        setClients(clientsData);
        setLoading(false);
    }
    fetchData();
  }, []);

  const getClient = (clientId: string) => {
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
  
  const paymentStatusColors: { [key: string]: string } = {
      pago: 'text-green-800 bg-green-100',
      pendente: 'text-yellow-800 bg-yellow-100',
      'parcialmente pago': 'text-blue-800 bg-blue-100',
  }

  const executionStatusColors: { [key: string]: string } = {
      'A iniciar': 'text-cyan-800 bg-cyan-100',
      'Em andamento': 'text-blue-800 bg-blue-100',
      'Pausado': 'text-orange-800 bg-orange-100',
      'Atrasado': 'text-red-800 bg-red-100',
      'Concluído': 'text-green-800 bg-green-100',
      'Cancelado': 'text-gray-800 bg-gray-100',
  }

  const scheduleIcons: { [key: string]: React.ReactNode } = {
      visit: <CalendarClock className="w-5 h-5 text-accent-foreground" />,
      project: <Activity className="w-5 h-5 text-accent-foreground" />,
  }
  
  if (loading) {
     return (
        <div className="flex items-center justify-center h-full">
            <LoaderCircle className="w-8 h-8 animate-spin" />
        </div>
    );
  }


  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Dashboard" />

       <div className="grid gap-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-xl">Agenda do Dia</CardTitle>
                    <CardDescription className='flex items-center justify-between'>
                        <span>{new Date().toLocaleDateString('pt-BR', { dateStyle: 'full' })}</span>
                        <span className='font-mono font-semibold text-lg text-foreground bg-muted px-2 py-1 rounded-md'>{currentTime} (Horário de Brasília)</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {dailySchedule.length > 0 ? (
                        <ul className="space-y-4">
                            {dailySchedule.map((item, index) => {
                                const isVisit = item.type === 'visit';
                                
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
                                                        {item.isOverdue && (
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
                                                {item.debug_visitDate && item.debug_now && (
                                                    <div className='mt-3 p-2 border border-dashed border-amber-500 bg-amber-50 rounded-md text-xs font-mono text-amber-800 space-y-1'>
                                                         <p className='font-bold'>[Debug Info]</p>
                                                         <p><span className='font-semibold'>Visit Date (UTC):</span> {item.debug_visitDate}</p>
                                                         <p><span className='font-semibold'>Server Time (UTC):</span> {item.debug_now}</p>
                                                         <p><span className='font-semibold'>Result:</span> isOverdue = {item.debug_isOverdue ? 'true' : 'false'}</p>
                                                    </div>
                                                )}
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
                Visitas agendadas para os próximos 7 dias.
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
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-headline">Projetos Ativos Recentes</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Os 5 projetos mais recentes com prazo futuro e pagamento pendente.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Card>
            <CardContent className="p-0">
              {activeProjects.length > 0 ? (
                <ul className="divide-y divide-border">
                  {activeProjects.slice(0, 5).map((project) => {
                        const client = getClient(project.clientId);
                        return (
                        <li key={project.id}>
                            <Link href={`/projects/${project.id}`} className="block p-4 hover:bg-muted transition-colors">
                                <p className="font-semibold text-lg">{project.name}</p>
                                {client && (
                                     <div className='flex items-center justify-between text-sm text-muted-foreground mb-3'>
                                        <div className='flex items-center gap-2'>
                                            <User className="w-3 h-3"/>
                                            <span>{client.name}</span>
                                        </div>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger onClick={(e) => e.preventDefault()}>
                                                    <Contact className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="w-3 h-3" />
                                                            <span>{client.phone}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="w-3 h-3" />
                                                            <span>{client.address}</span>
                                                        </div>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="font-medium text-muted-foreground">Status do Projeto</p>
                                        <Badge variant={'outline'} className={cn("capitalize mt-1", executionStatusColors[project.status] ?? 'border-border')}>
                                            {project.status}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="font-medium text-muted-foreground">Status Financeiro</p>
                                        <Badge variant={'outline'} className={cn("capitalize mt-1", paymentStatusColors[project.paymentStatus] ?? 'border-border')}>
                                            {project.paymentStatus}
                                        </Badge>
                                    </div>
                                </div>
                                
                                <div className="text-sm mt-3 pt-3 border-t">
                                     <p className="text-muted-foreground">
                                        Prazo: <span className='font-medium text-foreground'>{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
                                    </p>
                                </div>
                            </Link>
                        </li>
                     )
                  })}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-8 p-4">Nenhum projeto ativo no momento.</p>
              )}
            </CardContent>
          </Card>
        </div>
        <div>
           <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-headline">Próximas Visitas</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>As 5 próximas visitas nos próximos 7 dias.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Card>
            <CardContent className="p-0">
              {upcomingVisits.length > 0 ? (
                <ul className="divide-y divide-border">
                  {upcomingVisits.slice(0, 5).map((visit) => {
                    const client = getClient(visit.clientId);
                    return (
                        <li key={visit.id}>
                            <Link href={`/visits/${visit.id}`} className="block p-4 hover:bg-muted transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="font-semibold">{visit.date.substring(0, 16).replace('T', ' ')}</p>
                                    <Badge variant="outline" className={cn("capitalize", visitStatusColors[visit.status] ?? 'border-border')}>
                                        {visit.status}
                                    </Badge>
                                </div>
                                 {client && (
                                     <div className='space-y-1 text-sm text-muted-foreground border-t pt-2'>
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
                            </Link>
                        </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-8 p-4">Nenhuma visita agendada.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


