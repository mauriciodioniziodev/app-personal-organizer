
"use client";

import { useEffect, useState } from 'react';
import PageHeader from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getClients, getVisits, getProjects } from '@/lib/data';
import { FileDown } from 'lucide-react';
import type { Client, Visit, Project } from '@/lib/definitions';
import { exportToExcel, formatDate } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

function ClientsReport() {
    const [clients, setClients] = useState<Client[]>([]);

    useEffect(() => {
        getClients().then(setClients);
    }, []);

    const handleExport = () => {
        const dataToExport = clients.map(c => ({
            'Nome': c.name,
            'Email': c.email,
            'Telefone': c.phone,
            'Endereço': c.address,
            'CPF': c.cpf,
            'Aniversário': c.birthday,
            'Preferências': c.preferences,
            'Data de Cadastro': formatDate(c.createdAt),
        }));
        exportToExcel(dataToExport, 'relatorio_clientes');
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Clientes Cadastrados</CardTitle>
                <Button onClick={handleExport} variant="outline">
                    <FileDown className="mr-2 h-4 w-4" />
                    Exportar para Excel
                </Button>
            </CardHeader>
            <CardContent>
                 <ScrollArea className="h-[60vh]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Telefone</TableHead>
                                <TableHead>Endereço</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clients.map(client => (
                                <TableRow key={client.id}>
                                    <TableCell>{client.name}</TableCell>
                                    <TableCell>{client.email}</TableCell>
                                    <TableCell>{client.phone}</TableCell>
                                    <TableCell>{client.address}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}


function VisitsReport() {
    const [allVisits, setAllVisits] = useState<Visit[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [filteredVisits, setFilteredVisits] = useState<Visit[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        getVisits().then(setAllVisits);
        getClients().then(setClients);
    }, []);
    
    useEffect(() => {
        let results = allVisits;
        if(startDate && endDate) {
            const start = new Date(startDate).getTime();
            const end = new Date(endDate).getTime();
            results = results.filter(v => {
                const visitDate = new Date(v.date).getTime();
                return visitDate >= start && visitDate <= end;
            })
        }
        setFilteredVisits(results);
    }, [startDate, endDate, allVisits]);

    const getClientName = (clientId: string) => {
        return clients.find(c => c.id === clientId)?.name || 'N/A';
    }

    const handleExport = () => {
        const dataToExport = filteredVisits.map(v => ({
            'Data': formatDate(v.date),
            'Cliente': getClientName(v.clientId),
            'Status': v.status,
            'Resumo': v.summary,
            'Orçamento (R$)': v.budgetAmount || '',
        }));
        exportToExcel(dataToExport, 'relatorio_visitas');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Relatório de Visitas</CardTitle>
                 <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="grid gap-2">
                        <Label htmlFor="visits-start-date">Data de Início</Label>
                        <Input id="visits-start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="visits-end-date">Data de Fim</Label>
                        <Input id="visits-end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                     <Button onClick={handleExport} variant="outline">
                        <FileDown className="mr-2 h-4 w-4" />
                        Exportar para Excel
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                 <ScrollArea className="h-[60vh]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Resumo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredVisits.map(visit => (
                                <TableRow key={visit.id}>
                                    <TableCell>{formatDate(visit.date)}</TableCell>
                                    <TableCell>{getClientName(visit.clientId)}</TableCell>
                                    <TableCell className="capitalize">{visit.status}</TableCell>
                                    <TableCell>{visit.summary}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

function ProjectsReport() {
    const [allProjects, setAllProjects] = useState<Project[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        getProjects().then(setAllProjects);
        getClients().then(setClients);
    }, []);

    useEffect(() => {
        let results = allProjects;
        if(startDate && endDate) {
            const start = new Date(startDate).getTime();
            const end = new Date(endDate).getTime();
            results = results.filter(p => {
                 const projectStart = new Date(p.startDate).getTime();
                 const projectEnd = new Date(p.endDate).getTime();
                 return Math.max(projectStart, start) <= Math.min(projectEnd, end);
            })
        }
        setFilteredProjects(results);
    }, [startDate, endDate, allProjects]);

     const getClientName = (clientId: string) => {
        return clients.find(c => c.id === clientId)?.name || 'N/A';
    }
    
    const getFinancials = (project: Project) => {
        const received = project.payments.filter(p => p.status === 'pago').reduce((sum, p) => sum + p.amount, 0);
        const receivable = project.finalValue - received;
        return { received, receivable };
    }

    const handleExport = () => {
        const dataToExport = filteredProjects.map(p => {
            const { received, receivable } = getFinancials(p);
            return {
                'Nome do Projeto': p.name,
                'Cliente': getClientName(p.clientId),
                'Data de Início': formatDate(p.startDate),
                'Data de Fim': formatDate(p.endDate),
                'Status do Projeto': p.status,
                'Status Financeiro': p.paymentStatus,
                'Valor Final (R$)': p.finalValue,
                'Valor Recebido (R$)': received,
                'Valor a Receber (R$)': receivable
            }
        });
        exportToExcel(dataToExport, 'relatorio_projetos');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Relatório de Projetos</CardTitle>
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="grid gap-2">
                        <Label htmlFor="projects-start-date">Período (Início)</Label>
                        <Input id="projects-start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="projects-end-date">Período (Fim)</Label>
                        <Input id="projects-end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                     <Button onClick={handleExport} variant="outline">
                        <FileDown className="mr-2 h-4 w-4" />
                        Exportar para Excel
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                 <ScrollArea className="h-[60vh]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Projeto</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Período</TableHead>
                                <TableHead>Valor Final</TableHead>
                                <TableHead>Recebido</TableHead>
                                <TableHead>A Receber</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProjects.map(project => {
                                const { received, receivable } = getFinancials(project);
                                return (
                                <TableRow key={project.id}>
                                    <TableCell>{project.name}</TableCell>
                                    <TableCell>{getClientName(project.clientId)}</TableCell>
                                    <TableCell>{formatDate(project.startDate)} - {formatDate(project.endDate)}</TableCell>
                                    <TableCell>{project.finalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                    <TableCell>{received.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                    <TableCell>{receivable.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

export default function ReportsPage() {
    return (
        <div className="flex flex-col gap-8">
            <PageHeader title="Relatórios" />
            <Tabs defaultValue="clients">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="clients">Clientes</TabsTrigger>
                    <TabsTrigger value="visits">Visitas</TabsTrigger>
                    <TabsTrigger value="projects">Projetos</TabsTrigger>
                </TabsList>
                <TabsContent value="clients">
                    <ClientsReport />
                </TabsContent>
                <TabsContent value="visits">
                    <VisitsReport />
                </TabsContent>
                <TabsContent value="projects">
                    <ProjectsReport />
                </TabsContent>
            </Tabs>
        </div>
    );
}
