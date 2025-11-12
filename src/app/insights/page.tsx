

"use client";

import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, BarChart, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const InsightCard = ({ href, title, description, icon: Icon, disabled }: { href: string; title: string; description: string; icon: React.ElementType, disabled?: boolean }) => (
    <Link href={href} className={cn("block", disabled && "pointer-events-none")}>
        <Card className={cn("hover:bg-muted/50 transition-colors h-full", disabled && "bg-muted/50 opacity-50")}>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Icon className="w-6 h-6 text-primary" />
                    {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-end text-sm font-medium text-primary">
                    Acessar <ArrowRight className="w-4 h-4 ml-2" />
                </div>
            </CardContent>
        </Card>
    </Link>
);

export default function InsightsPage() {
    return (
        <div className="flex flex-col gap-8">
            <PageHeader title="Insights com IA" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <InsightCard
                    href="/insights/recommendations"
                    title="Recomendação de Serviços"
                    description="Sugestões de upsell e novos serviços com base no histórico do cliente e em padrões de outros clientes."
                    icon={Lightbulb}
                />
                
                 <InsightCard
                    href="/insights/preferences"
                    title="Análise de Preferências"
                    description="Gere um resumo inteligente das preferências, gostos e histórico de interações de um cliente específico."
                    icon={FileText}
                />
                
                 <InsightCard
                    href="/insights/financial-analysis"
                    title="Análise Financeira"
                    description="Receba uma análise do faturamento, pagamentos pendentes e desempenho financeiro geral."
                    icon={BarChart}
                    disabled={true}
                />
            </div>
        </div>
    );
}
