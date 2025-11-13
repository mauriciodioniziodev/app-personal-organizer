

"use client";

import { useEffect, useState, useMemo } from 'react';
import PageHeader from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { getClients, getVisits, getProjects, getAllOrganizerCosts } from '@/lib/data';
import { FileDown, Cake, Handshake, File } from 'lucide-react';
import type { Client, Visit, Project, ProjectOrganizerCost } from '@/lib/definitions';
import { exportToExcel, formatDate, exportToPdf } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

function ClientsReport() {
    const [clients, setClients] = useState<Client[]>([]);

    useEffect(() => {
        getClients().then(clients => {
            const sortedClients = clients.sort((a,b) => {
                if (!a.birthday) return 1;
                if (!b.birthday) return -1;
                const [dayA, monthA] = a.birthday.split('/').map(Number);
                const [dayB, monthB] = b.birthday.split('/').map(Number);
                if (monthA !== monthB) return monthA - monthB;
                return dayA - dayB;
            });
            setClients(sortedClients);
        });
    }, []);

    const handleExportExcel = () => {
        const dataToExport = clients.map(c => ({
            'Nome': c.name,
            'Email': c.email,
            'Telefone': c.phone,
            'Endereço': c.address,
            'CPF': c.cpf,
            'Aniversário': c.birthday,
            'Origem': c.source,
            'Data de Cadastro': formatDate(c.createdAt),
        }));
        exportToExcel(dataToExport, 'relatorio_clientes');
    };
    
    const handleExportPdf = () => {
        const columns = [
            { title: 'Nome', dataKey: 'name' },
            { title: 'Email', dataKey: 'email' },
            { title: 'Telefone', dataKey: 'phone' },
            { title: 'Aniversário', dataKey: 'birthday' },
            { title: 'Origem', dataKey: 'source' },
        ];
        const data = clients.map(c => ({
            name: c.name,
            email: c.email,
            phone: c.phone,
            birthday: c.birthday || '-',
            source: c.source || '-',
        }));
        const footerRows = [
            [{ content: `Total de Clientes: ${data.length}`, colSpan: columns.length, styles: { halign: 'right', fontStyle: 'bold' } }]
        ];
        exportToPdf(columns, data, 'relatorio_clientes', 'Relatório de Clientes', footerRows);
    };

    const currentMonth = new Date().getMonth() + 1;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Clientes Cadastrados</CardTitle>
                <div className="flex gap-2">
                    <Button onClick={handleExportExcel} variant="outline">
                        <FileDown className="mr-2 h-4 w-4" />
                        Excel
                    </Button>
                     <Button onClick={handleExportPdf} variant="outline">
                        <File className="mr-2 h-4 w-4" />
                        PDF
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                 <ScrollArea className="h-[60vh]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Telefone</TableHead>
                                <TableHead>Aniversário</TableHead>
                                <TableHead>Origem</TableHead>
                                <TableHead>Endereço</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clients.map(client => {
                                const birthdayMonth = client.birthday ? parseInt(client.birthday.split('/')[1], 10) : null;
                                const isBirthdayMonth = birthdayMonth === currentMonth;

                                return (
                                <TableRow key={client.id} className={cn(isBirthdayMonth && "bg-primary/10")}>
                                    <TableCell>{client.name}</TableCell>
                                    <TableCell>{client.email}</TableCell>
                                    <TableCell>{client.phone}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {isBirthdayMonth && <Cake className="w-4 h-4 text-primary" />}
                                            <span>{client.birthday || '-'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{client.source || '-'}</TableCell>
                                    <TableCell>{client.address}</TableCell>
                                </TableRow>
                            )})}
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

    const handleExportExcel = () => {
        const dataToExport = filteredVisits.map(v => ({
            'Data': formatDate(v.date),
            'Cliente': getClientName(v.clientId),
            'Status': v.status,
            'Resumo': v.summary,
            'Orçamento (R$)': v.budgetAmount || '',
        }));
        exportToExcel(dataToExport, 'relatorio_visitas');
    };

    const handleExportPdf = () => {
        const columns = [
            { title: 'Data', dataKey: 'date' },
            { title: 'Cliente', dataKey: 'clientName' },
            { title: 'Status', dataKey: 'status' },
            { title: 'Resumo', dataKey: 'summary' },
        ];
        const data = filteredVisits.map(v => ({
            date: formatDate(v.date),
            clientName: getClientName(v.clientId),
            status: v.status,
            summary: v.summary,
        }));
         const footerRows = [
            [{ content: `Total de Visitas: ${data.length}`, colSpan: columns.length, styles: { halign: 'right', fontStyle: 'bold' } }]
        ];
        let dateRangeString = '';
        if (startDate && endDate) {
            dateRangeString = `Período: ${formatDate(startDate)} a ${formatDate(endDate)}`;
        }
        exportToPdf(columns, data, 'relatorio_visitas', 'Relatório de Visitas', footerRows, dateRangeString);
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
                    <div className="flex gap-2">
                        <Button onClick={handleExportExcel} variant="outline">
                            <FileDown className="mr-2 h-4 w-4" />
                            Excel
                        </Button>
                        <Button onClick={handleExportPdf} variant="outline">
                            <File className="mr-2 h-4 w-4" />
                            PDF
                        </Button>
                    </div>
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

    const { totalFinalValue, totalReceived, totalReceivable } = useMemo(() => {
        return filteredProjects.reduce((acc, project) => {
            const { received, receivable } = getFinancials(project);
            acc.totalFinalValue += project.finalValue;
            acc.totalReceived += received;
            acc.totalReceivable += receivable;
            return acc;
        }, { totalFinalValue: 0, totalReceived: 0, totalReceivable: 0 });
    }, [filteredProjects]);

    const handleExportExcel = () => {
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
    
    const handleExportPdf = () => {
        const columns = [
            { title: 'Projeto', dataKey: 'name' },
            { title: 'Cliente', dataKey: 'clientName' },
            { title: 'Período', dataKey: 'period' },
            { title: 'Valor Final', dataKey: 'finalValue' },
            { title: 'Recebido', dataKey: 'received' },
            { title: 'A Receber', dataKey: 'receivable' },
        ];
        const data = filteredProjects.map(p => {
            const { received, receivable } = getFinancials(p);
            return {
                name: p.name,
                clientName: getClientName(p.clientId),
                period: `${formatDate(p.startDate)} - ${formatDate(p.endDate)}`,
                finalValue: p.finalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                received: received.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                receivable: receivable.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            }
        });
         const footerRows = [
            [
                { content: 'Totais', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
                { content: totalFinalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), styles: { fontStyle: 'bold' } },
                { content: totalReceived.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), styles: { fontStyle: 'bold' } },
                { content: totalReceivable.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), styles: { fontStyle: 'bold' } }
            ]
        ];
        let dateRangeString = '';
        if (startDate && endDate) {
            dateRangeString = `Período: ${formatDate(startDate)} a ${formatDate(endDate)}`;
        }
        exportToPdf(columns, data, 'relatorio_projetos', 'Relatório de Projetos', footerRows, dateRangeString);
    }

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
                     <div className="flex gap-2">
                        <Button onClick={handleExportExcel} variant="outline">
                            <FileDown className="mr-2 h-4 w-4" />
                            Excel
                        </Button>
                        <Button onClick={handleExportPdf} variant="outline">
                            <File className="mr-2 h-4 w-4" />
                            PDF
                        </Button>
                    </div>
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
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={3} className="font-semibold text-right">Totais</TableCell>
                                <TableCell className="font-bold">
                                    {totalFinalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </TableCell>
                                <TableCell className="font-bold">
                                    {totalReceived.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </TableCell>
                                <TableCell className="font-bold">
                                    {totalReceivable.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

function CommissionsReport() {
    const [allCosts, setAllCosts] = useState<ProjectOrganizerCost[]>([]);
    const [filteredCosts, setFilteredCosts] = useState<ProjectOrganizerCost[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        getAllOrganizerCosts().then(setAllCosts);
    }, []);

    useEffect(() => {
        let results = allCosts;
        
        if (startDate && endDate) {
            const start = new Date(startDate).getTime();
            const end = new Date(endDate).getTime();
            results = results.filter(c => {
                if (!c.projectEndDate || !c.projectStartDate) return false;
                 const costStart = new Date(c.projectStartDate).getTime();
                 const costEnd = new Date(c.projectEndDate).getTime();
                 return Math.max(costStart, start) <= Math.min(costEnd, end);
            });
        }

        if (statusFilter !== 'all') {
            results = results.filter(c => c.commissionStatus === statusFilter);
        }

        setFilteredCosts(results);
    }, [startDate, endDate, statusFilter, allCosts]);

    const { totalCostAmount, totalCommissions } = useMemo(() => {
        return filteredCosts.reduce((acc, cost) => {
            acc.totalCostAmount += cost.costAmount;
            acc.totalCommissions += cost.commissionValue;
            return acc;
        }, { totalCostAmount: 0, totalCommissions: 0 });
    }, [filteredCosts]);

    const handleExportExcel = () => {
        const dataToExport = filteredCosts.map(c => ({
            'Parceiro': c.partnerName,
            'Cliente': c.clientName,
            'Projeto': c.projectName,
            'Custo (R$)': c.costAmount,
            'Comissão (%)': c.commissionPercentage,
            'Valor da Comissão (R$)': c.commissionValue,
            'Status': c.commissionStatus === 'pago' ? 'Recebida' : 'A Receber',
            'Data do Projeto': c.projectStartDate ? `${formatDate(c.projectStartDate)} - ${formatDate(c.projectEndDate || '')}` : 'N/A'
        }));
        exportToExcel(dataToExport, 'relatorio_comissoes');
    };
    
    const handleExportPdf = () => {
        const columns = [
            { title: 'Parceiro', dataKey: 'partnerName' },
            { title: 'Projeto', dataKey: 'projectName' },
            { title: 'Custo (R$)', dataKey: 'costAmount' },
            { title: 'Comissão (%)', dataKey: 'commissionPercentage' },
            { title: 'Valor Comissão (R$)', dataKey: 'commissionValue' },
            { title: 'Status', dataKey: 'commissionStatus' },
        ];
        const data = filteredCosts.map(c => ({
            partnerName: c.partnerName,
            projectName: c.projectName,
            costAmount: c.costAmount.toFixed(2),
            commissionPercentage: `${c.commissionPercentage}%`,
            commissionValue: c.commissionValue.toFixed(2),
            commissionStatus: c.commissionStatus === 'pago' ? 'Recebida' : 'A Receber',
        }));
        const footerRows = [
            [
                { content: 'Totais', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
                { content: totalCostAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), styles: { fontStyle: 'bold' } },
                { content: '' },
                { content: totalCommissions.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), styles: { fontStyle: 'bold' } },
                { content: '' },
            ]
        ];
        let dateRangeString = '';
        if (startDate && endDate) {
            dateRangeString = `Período: ${formatDate(startDate)} a ${formatDate(endDate)}`;
        }
        exportToPdf(columns, data, 'relatorio_comissoes', 'Relatório de Comissões', footerRows, dateRangeString);
    }
    
    const commissionStatusColors: { [key: string]: string } = {
        'em aberto': 'text-yellow-800 bg-yellow-100',
        'pago': 'text-green-800 bg-green-100',
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Relatório de Comissões</CardTitle>
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="grid gap-2">
                        <Label htmlFor="commissions-start-date">Período (Início)</Label>
                        <Input id="commissions-start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="commissions-end-date">Período (Fim)</Label>
                        <Input id="commissions-end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="commissions-status">Status</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger id="commissions-status">
                                <SelectValue placeholder="Filtrar por status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="pago">Recebidas</SelectItem>
                                <SelectItem value="em aberto">A Receber</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleExportExcel} variant="outline">
                            <FileDown className="mr-2 h-4 w-4" />
                            Excel
                        </Button>
                        <Button onClick={handleExportPdf} variant="outline">
                            <File className="mr-2 h-4 w-4" />
                            PDF
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                 <ScrollArea className="h-[60vh]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Parceiro</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Projeto</TableHead>
                                <TableHead>Custo (R$)</TableHead>
                                <TableHead>Comissão (%)</TableHead>
                                <TableHead>Valor Comissão (R$)</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCosts.map(cost => (
                                <TableRow key={cost.id}>
                                    <TableCell>{cost.partnerName}</TableCell>
                                    <TableCell>{cost.clientName}</TableCell>
                                    <TableCell>{cost.projectName}</TableCell>
                                    <TableCell>{cost.costAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                    <TableCell>{cost.commissionPercentage}%</TableCell>
                                    <TableCell>{cost.commissionValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                    <TableCell>
                                         <Badge variant={'outline'} className={cn("capitalize", commissionStatusColors[cost.commissionStatus] ?? 'border-border')}>
                                            {cost.commissionStatus === 'pago' ? 'Recebida' : 'A Receber'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                         <TableFooter>
                            <TableRow>
                                <TableCell colSpan={3} className="font-semibold text-right">Totais</TableCell>
                                <TableCell className="font-bold">
                                    {totalCostAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </TableCell>
                                <TableCell></TableCell>
                                <TableCell className="font-bold">
                                    {totalCommissions.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableFooter>
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
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="clients">Clientes</TabsTrigger>
                    <TabsTrigger value="visits">Visitas</TabsTrigger>
                    <TabsTrigger value="projects">Projetos</TabsTrigger>
                    <TabsTrigger value="commissions">Comissões</TabsTrigger>
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
                <TabsContent value="commissions">
                    <CommissionsReport />
                </TabsContent>
            </Tabs>
        </div>
    );
}
