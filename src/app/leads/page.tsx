

"use client";

import { useEffect, useState } from 'react';
import { getLeads, updateLeadStatus } from '@/lib/data';
import type { Lead } from '@/lib/definitions';
import { LoaderCircle, PlusCircle, Flame, Phone, Mail, DollarSign, GripVertical, Edit, FileDown } from 'lucide-react';
import PageHeader from '@/components/page-header';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, exportToExcel } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const leadStatuses: Lead['status'][] = ['novo', 'contato', 'proposta', 'convertido', 'perdido'];
const statusTitles: Record<Lead['status'], string> = {
    novo: 'Novo Lead',
    contato: 'Contato Realizado',
    proposta: 'Proposta Enviada',
    convertido: 'Convertido',
    perdido: 'Perdido',
};

const temperatureColors: Record<Lead['temperature'], string> = {
    quente: 'fill-red-500 text-red-500',
    morno: 'fill-yellow-500 text-yellow-500',
    frio: 'fill-gray-400 text-gray-400',
}

function LeadCard({ lead, onDragStart }: { lead: Lead; onDragStart: (e: React.DragEvent<HTMLDivElement>, leadId: string) => void }) {
    const router = useRouter();

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Evita que o evento de arrastar seja acionado
        router.push(`/leads/${lead.id}/edit`);
    }

    return (
        <Card draggable onDragStart={(e) => onDragStart(e, lead.id)} className="mb-4 cursor-grab active:cursor-grabbing group/card">
            <CardHeader className='pb-4'>
                <div className='flex justify-between items-start'>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Flame className={cn("h-5 w-5", temperatureColors[lead.temperature])} />
                        {lead.name}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover/card:opacity-100 transition-opacity" onClick={handleEditClick}>
                            <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </div>
                </div>
                <CardDescription className='capitalize'>{lead.source}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{lead.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>Orçamento: {lead.budget}</span>
                </div>
                {lead.notes && <p className='text-xs pt-2 border-t text-muted-foreground line-clamp-2'>{lead.notes}</p>}
            </CardContent>
        </Card>
    );
}

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        getLeads().then(data => {
            setLeads(data);
            setLoading(false);
        });
    }, []);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, leadId: string) => {
        setDraggedLeadId(leadId);
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: Lead['status']) => {
        e.preventDefault();
        if (!draggedLeadId) return;

        const leadToUpdate = leads.find(l => l.id === draggedLeadId);
        if (leadToUpdate && leadToUpdate.status !== newStatus) {
            
            // Optimistic UI update
            setLeads(prevLeads => prevLeads.map(l => l.id === draggedLeadId ? { ...l, status: newStatus } : l));

            try {
                const updatedLead = await updateLeadStatus(draggedLeadId, newStatus);
                // Replace with server data to ensure consistency
                setLeads(prevLeads => prevLeads.map(l => l.id === updatedLead.id ? updatedLead : l));

                if(newStatus === 'convertido') {
                    toast({
                        title: 'Lead Convertido!',
                        description: `${updatedLead.name} foi movido para "Convertido" e adicionado como cliente (se não existir).`
                    })
                }

            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Erro ao mover lead',
                    description: (error as Error).message
                });
                // Revert UI change on error
                setLeads(prevLeads => prevLeads.map(l => l.id === draggedLeadId ? leadToUpdate : l));
            }
        }
        setDraggedLeadId(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); // Necessary to allow drop
    };

    const handleExport = () => {
        const dataToExport = leads.map(l => ({
            'Nome': l.name,
            'Telefone': l.phone,
            'Email': l.email,
            'Status': l.status,
            'Temperatura': l.temperature,
            'Origem': l.source,
            'Urgência': l.urgency,
            'Orçamento': l.budget,
            'Observações': l.notes,
            'Data de Criação': new Date(l.createdAt).toLocaleDateString('pt-BR'),
        }));
        exportToExcel(dataToExport, 'relatorio_leads');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <LoaderCircle className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <PageHeader title="Funil de Leads">
                <div className="flex items-center gap-4">
                     <div className="flex items-center gap-4 text-sm text-muted-foreground border p-2 rounded-lg">
                        <div className="flex items-center gap-1"><Flame className="w-4 h-4 fill-red-500 text-red-500" /> Quente</div>
                        <div className="flex items-center gap-1"><Flame className="w-4 h-4 fill-yellow-500 text-yellow-500" /> Morno</div>
                        <div className="flex items-center gap-1"><Flame className="w-4 h-4 fill-gray-400 text-gray-400" /> Frio</div>
                    </div>
                    <Button onClick={handleExport} variant="outline">
                        <FileDown className="mr-2 h-4 w-4" />
                        Exportar
                    </Button>
                    <Link href="/leads/new">
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Adicionar Lead
                        </Button>
                    </Link>
                </div>
            </PageHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-start">
                {leadStatuses.map(status => (
                    <div
                        key={status}
                        onDrop={(e) => handleDrop(e, status)}
                        onDragOver={handleDragOver}
                        className="bg-muted/50 rounded-lg p-4 h-full min-h-[300px]"
                    >
                        <h2 className="font-headline text-lg mb-4 text-center">{statusTitles[status]}</h2>
                        <div className="space-y-4">
                            {leads.filter(lead => lead.status === status).map(lead => (
                                <LeadCard key={lead.id} lead={lead} onDragStart={handleDragStart} />
                            ))}
                            {leads.filter(lead => lead.status === status).length === 0 && (
                                <div className="text-center text-sm text-muted-foreground pt-10">
                                    Arraste um card aqui
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

    