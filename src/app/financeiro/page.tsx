

"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTotalRevenue, getClients, getTotalPendingRevenue, getProjects, getTotalBudgetedRevenue, getTotalCommissionsPaid, getTotalCommissionsPending, getAllOrganizerCosts } from "@/lib/data";
import { Wallet, Eye, EyeOff, Hourglass, User, Calendar, LoaderCircle, Phone, Activity, CheckCircle, FileText, Handshake } from "lucide-react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import type { Project, Client, ProjectOrganizerCost } from '@/lib/definitions';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn, formatDate } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function FinanceiroPage() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingRevenue, setPendingRevenue] = useState(0);
  const [budgetedRevenue, setBudgetedRevenue] = useState(0);
  const [commissionsPaid, setCommissionsPaid] = useState(0);
  const [commissionsPending, setCommissionsPending] = useState(0);

  const [allPendingProjects, setAllPendingProjects] = useState<Project[]>([]);
  const [filteredPendingProjects, setFilteredPendingProjects] = useState<Project[]>([]);
  const [allPaidProjects, setAllPaidProjects] = useState<Project[]>([]);
  const [filteredPaidProjects, setFilteredPaidProjects] = useState<Project[]>([]);
  
  const [allPendingCommissions, setAllPendingCommissions] = useState<ProjectOrganizerCost[]>([]);
  const [filteredPendingCommissions, setFilteredPendingCommissions] = useState<ProjectOrganizerCost[]>([]);
  const [allPaidCommissions, setAllPaidCommissions] = useState<ProjectOrganizerCost[]>([]);
  const [filteredPaidCommissions, setFilteredPaidCommissions] = useState<ProjectOrganizerCost[]>([]);

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [showRevenue, setShowRevenue] = useState(false);
  const [showPendingRevenue, setShowPendingRevenue] = useState(false);
  const [showBudgetedRevenue, setShowBudgetedRevenue] = useState(false);
  const [showCommissionsPaid, setShowCommissionsPaid] = useState(false);
  const [showCommissionsPending, setShowCommissionsPending] = useState(false);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const refetch = useCallback(async () => {
        setLoading(true);
        const [clientsData, allProjectsData, allCostsData] = await Promise.all([
            getClients(),
            getProjects(),
            getAllOrganizerCosts()
        ]);
        
        const pendingProjects = allProjectsData.filter(p => p.paymentStatus !== 'pago');
        const paidProjects = allProjectsData.filter(p => p.paymentStatus === 'pago');
        
        setAllPendingProjects(pendingProjects);
        setAllPaidProjects(paidProjects);
        setClients(clientsData);

        const pendingCommissions = allCostsData.filter(c => c.commissionStatus === 'em aberto');
        const paidCommissions = allCostsData.filter(c => c.commissionStatus === 'pago');
        setAllPendingCommissions(pendingCommissions);
        setAllPaidCommissions(paidCommissions);


        // Fetch initial financial data without date filters
        const [
            totalRevenueData, 
            pendingRevenueData, 
            budgetedRevenueData,
            commissionsPaidData,
            commissionsPendingData
        ] = await Promise.all([
            getTotalRevenue(),
            getTotalPendingRevenue(),
            getTotalBudgetedRevenue(),
            getTotalCommissionsPaid(),
            getTotalCommissionsPending()
        ]);
        setTotalRevenue(totalRevenueData);
        setPendingRevenue(pendingRevenueData);
        setBudgetedRevenue(budgetedRevenueData);
        setCommissionsPaid(commissionsPaidData);
        setCommissionsPending(commissionsPendingData);

        setFilteredPendingProjects(pendingProjects);
        setFilteredPaidProjects(paidProjects);
        setFilteredPendingCommissions(pendingCommissions);
        setFilteredPaidCommissions(paidCommissions);
        setLoading(false);
  }, [])

  useEffect(() => {
    refetch();

    const handleFocus = () => refetch();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetch]);

  useEffect(() => {
    async function filterFinancialData() {
        const [total, pending, budgeted, commissionsPaid, commissionsPending] = await Promise.all([
            getTotalRevenue({ startDate, endDate }),
            getTotalPendingRevenue({ startDate, endDate }),
            getTotalBudgetedRevenue({ startDate, endDate }),
            getTotalCommissionsPaid({ startDate, endDate }),
            getTotalCommissionsPending({ startDate, endDate })
        ]);
        setTotalRevenue(total);
        setPendingRevenue(pending);
        setBudgetedRevenue(budgeted);
        setCommissionsPaid(commissionsPaid);
        setCommissionsPending(commissionsPending);

        // Filter projects and commissions lists based on date
         if (startDate && endDate) {
            const filterStart = new Date(startDate).getTime();
            const filterEnd = new Date(endDate).getTime();

            const filterProjectByDate = (p: Project) => {
                const projectStart = new Date(p.startDate).getTime();
                const projectEnd = new Date(p.endDate).getTime();
                return Math.max(projectStart, filterStart) <= Math.min(projectEnd, filterEnd);
            };
            setFilteredPendingProjects(allPendingProjects.filter(filterProjectByDate));
            setFilteredPaidProjects(allPaidProjects.filter(filterProjectByDate));

             const filterCommissionByDate = (c: ProjectOrganizerCost) => {
                if (!c.projectStartDate || !c.projectEndDate) return false;
                const projectStart = new Date(c.projectStartDate).getTime();
                const projectEnd = new Date(c.projectEndDate).getTime();
                return Math.max(projectStart, filterStart) <= Math.min(projectEnd, filterEnd);
            }
            setFilteredPendingCommissions(allPendingCommissions.filter(filterCommissionByDate));
            setFilteredPaidCommissions(allPaidCommissions.filter(filterCommissionByDate));
        } else {
            setFilteredPendingProjects(allPendingProjects);
            setFilteredPaidProjects(allPaidProjects);
            setFilteredPendingCommissions(allPendingCommissions);
            setFilteredPaidCommissions(allPaidCommissions);
        }
    }
    
    if(!loading) { // only run filter if initial load is complete
        filterFinancialData();
    }
  }, [startDate, endDate, allPendingProjects, allPaidProjects, allPendingCommissions, allPaidCommissions, loading]);


  const getClient = (clientId: string) => {
    return clients.find(c => c.id === clientId);
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

  const commissionStatusColors: { [key: string]: string } = {
    'em aberto': 'text-yellow-800 bg-yellow-100',
    'pago': 'text-green-800 bg-green-100',
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
      <PageHeader title="Financeiro" />
      
       <Card>
        <CardHeader>
            <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
            <div className='w-full space-y-2'>
                <Label htmlFor='start-date'>Data de Início</Label>
                <Input id='start-date' type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className='w-full space-y-2'>
                <Label htmlFor='end-date'>Data de Fim</Label>
                <Input id='end-date' type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
        </CardContent>
       </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Realizada</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="flex items-center justify-between">
                <div className="text-2xl font-bold font-headline text-green-600">
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
              Soma de parcelas pagas no período.
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
                <div className="text-2xl font-bold font-headline text-yellow-600">
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
               Soma de parcelas pendentes com vencimento no período.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamentos em Aberto</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="flex items-center justify-between">
                <div className="text-2xl font-bold font-headline text-blue-600">
                {showBudgetedRevenue ? (
                    new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                    }).format(budgetedRevenue)
                ) : (
                    'R$ ••••••'
                )}
                </div>
                 <Button variant="ghost" size="icon" onClick={() => setShowBudgetedRevenue(!showBudgetedRevenue)}>
                    {showBudgetedRevenue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">Mostrar/Ocultar orçamentos</span>
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">
               Soma de visitas com status 'orçamento' no período.
            </p>
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Comissões Recebidas</CardTitle>
                <Handshake className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold font-headline text-green-600">
                    {showCommissionsPaid ? (
                        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(commissionsPaid)
                    ) : (
                        'R$ ••••••'
                    )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setShowCommissionsPaid(!showCommissionsPaid)}>
                        {showCommissionsPaid ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span className="sr-only">Mostrar/Ocultar comissões recebidas</span>
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                Soma de comissões de parceiros recebidas no período.
                </p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Comissões a Receber</CardTitle>
                <Handshake className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold font-headline text-yellow-600">
                    {showCommissionsPending ? (
                        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(commissionsPending)
                    ) : (
                        'R$ ••••••'
                    )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setShowCommissionsPending(!showCommissionsPending)}>
                        {showCommissionsPending ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span className="sr-only">Mostrar/Ocultar comissões a receber</span>
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                Soma de comissões de parceiros em aberto a serem recebidas no período.
                </p>
            </CardContent>
        </Card>
      </div>

       <div className="space-y-8">
            <div>
                <h2 className="text-xl font-headline mb-4">Comissões a Receber</h2>
                <Card>
                    <CardContent className="p-4">
                    {filteredPendingCommissions.length > 0 ? (
                        <ul className="space-y-4">
                        {filteredPendingCommissions.map((cost) => (
                            <li key={cost.id}>
                                <Link href={`/projects/${cost.projectId}`} className="block p-4 -m-4 rounded-lg hover:bg-muted transition-colors">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                                        <div className="flex-grow space-y-2">
                                            <p className="font-semibold">{cost.projectName}</p>
                                            <div className='text-sm text-muted-foreground space-y-1'>
                                                <div className='flex items-center gap-2'>
                                                    <User className="w-3 h-3"/>
                                                    <span className='font-medium text-foreground'>{cost.clientName}</span>
                                                </div>
                                                <div className='flex items-center gap-2'>
                                                    <Handshake className="w-3 h-3"/>
                                                    <span>{cost.partnerName}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='flex sm:flex-col items-end gap-2 sm:gap-1 mt-2 sm:mt-0 shrink-0'>
                                            <p className="font-semibold text-lg">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cost.commissionValue)}</p>
                                            <Badge variant={'outline'} className={cn("capitalize", commissionStatusColors[cost.commissionStatus] ?? 'border-border')}>
                                                A Receber
                                            </Badge>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">Nenhuma comissão a receber no período selecionado.</p>
                    )}
                    </CardContent>
                </Card>
            </div>
             <div>
                <h2 className="text-xl font-headline mb-4">Comissões Recebidas</h2>
                <Card>
                    <CardContent className="p-4">
                    {filteredPaidCommissions.length > 0 ? (
                        <ul className="space-y-4">
                        {filteredPaidCommissions.map((cost) => (
                            <li key={cost.id}>
                                <Link href={`/projects/${cost.projectId}`} className="block p-4 -m-4 rounded-lg hover:bg-muted transition-colors">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                                        <div className="flex-grow space-y-2">
                                            <p className="font-semibold">{cost.projectName}</p>
                                            <div className='text-sm text-muted-foreground space-y-1'>
                                                <div className='flex items-center gap-2'>
                                                    <User className="w-3 h-3"/>
                                                    <span className='font-medium text-foreground'>{cost.clientName}</span>
                                                </div>
                                                <div className='flex items-center gap-2'>
                                                    <Handshake className="w-3 h-3"/>
                                                    <span>{cost.partnerName}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='flex sm:flex-col items-end gap-2 sm:gap-1 mt-2 sm:mt-0 shrink-0'>
                                            <p className="font-semibold text-lg">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cost.commissionValue)}</p>
                                            <Badge variant={'outline'} className={cn("capitalize", commissionStatusColors[cost.commissionStatus] ?? 'border-border')}>
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Recebida
                                            </Badge>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">Nenhuma comissão recebida no período selecionado.</p>
                    )}
                    </CardContent>
                </Card>
            </div>
          <div>
            <h2 className="text-xl font-headline mb-4">Projetos com Pagamento Pendente</h2>
            <Card>
                <CardContent className="p-4">
                {filteredPendingProjects.length > 0 ? (
                    <ul className="space-y-4">
                    {filteredPendingProjects.map((project) => {
                        const client = getClient(project.clientId);
                        return (
                            <li key={project.id}>
                                <Link href={`/projects/${project.id}`} className="block p-4 -m-4 rounded-lg hover:bg-muted transition-colors">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                                        <div className="flex-grow space-y-2">
                                            <p className="font-semibold">{project.name}</p>
                                            {client && (
                                                <div className='text-sm text-muted-foreground space-y-1'>
                                                    <div className='flex items-center gap-2'>
                                                        <User className="w-3 h-3"/>
                                                        <span className='font-medium text-foreground'>{client.name}</span>
                                                    </div>
                                                    <div className='flex items-center gap-2'>
                                                        <Phone className="w-3 h-3"/>
                                                        <span>{client.phone}</span>
                                                    </div>
                                                </div>
                                            )}
                                            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                                <Calendar className="w-3 h-3"/>
                                                <span className='font-medium'>
                                                    {formatDate(project.startDate)} - {formatDate(project.endDate)}
                                                </span>
                                            </div>
                                            <div className='flex items-center gap-2 text-sm'>
                                                <Activity className="w-3 h-3 text-muted-foreground"/>
                                                <Badge variant={'outline'} className={cn("capitalize", executionStatusColors[project.status] ?? 'border-border')}>
                                                    {project.status}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className='flex sm:flex-col items-end gap-2 sm:gap-1 mt-2 sm:mt-0 shrink-0'>
                                            <p className="font-semibold text-lg">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(project.finalValue)}</p>
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
                    <p className="text-muted-foreground text-center py-8">Nenhum projeto com pagamento pendente no período selecionado.</p>
                )}
                </CardContent>
            </Card>
            </div>
            <div>
            <h2 className="text-xl font-headline mb-4">Projetos Pagos</h2>
            <Card>
                <CardContent className="p-4">
                {filteredPaidProjects.length > 0 ? (
                    <ul className="space-y-4">
                    {filteredPaidProjects.map((project) => {
                        const client = getClient(project.clientId);
                        return (
                            <li key={project.id}>
                                <Link href={`/projects/${project.id}`} className="block p-4 -m-4 rounded-lg hover:bg-muted transition-colors">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                                        <div className="flex-grow space-y-2">
                                            <p className="font-semibold">{project.name}</p>
                                            {client && (
                                                <div className='text-sm text-muted-foreground space-y-1'>
                                                    <div className='flex items-center gap-2'>
                                                        <User className="w-3 h-3"/>
                                                        <span className='font-medium text-foreground'>{client.name}</span>
                                                    </div>
                                                    <div className='flex items-center gap-2'>
                                                        <Phone className="w-3 h-3"/>
                                                        <span>{client.phone}</span>
                                                    </div>
                                                </div>
                                            )}
                                            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                                <Calendar className="w-3 h-3"/>
                                                <span className='font-medium'>
                                                    {formatDate(project.startDate)} - {formatDate(project.endDate)}
                                                </span>
                                            </div>
                                            <div className='flex items-center gap-2 text-sm'>
                                                <Activity className="w-3 h-3 text-muted-foreground"/>
                                                <Badge variant={'outline'} className={cn("capitalize", executionStatusColors[project.status] ?? 'border-border')}>
                                                    {project.status}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className='flex sm:flex-col items-end gap-2 sm:gap-1 mt-2 sm:mt-0 shrink-0'>
                                            <p className="font-semibold text-lg">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(project.finalValue)}</p>
                                            <Badge variant={'outline'} className={cn("capitalize", paymentStatusColors[project.paymentStatus] ?? 'border-border')}>
                                                <CheckCircle className="w-3 h-3 mr-1" />
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
                    <p className="text-muted-foreground text-center py-8">Nenhum projeto pago no período selecionado.</p>
                )}
                </CardContent>
            </Card>
            </div>
        </div>
    </div>
  );
}
