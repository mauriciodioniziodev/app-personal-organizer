
"use client";

import { useState } from "react";
import { recommendServices, ServiceRecommendationOutput } from "@/ai/flows/service-recommender";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, LoaderCircle, Sparkles } from "lucide-react";
import type { Client, Project } from "@/lib/definitions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useToast } from "@/hooks/use-toast";

type ServiceRecommenderProps = {
  allClients: Client[];
  allProjects: Project[];
};

export default function ServiceRecommender({ allClients, allProjects }: ServiceRecommenderProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ServiceRecommendationOutput | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!selectedClientId) {
      toast({
        variant: 'destructive',
        title: "Selecione um cliente",
        description: "Você precisa escolher um cliente para gerar recomendações."
      })
      return;
    }

    setLoading(true);
    setResult(null);

    const targetClient = allClients.find(c => c.id === selectedClientId);
    if (!targetClient) {
      setLoading(false);
      return;
    }

    // Prepare context from other clients' projects
    const otherProjects = allProjects
      .filter(p => p.clientId !== selectedClientId)
      .map(p => {
        const client = allClients.find(c => c.id === p.clientId);
        return `Projeto "${p.name}" para ${client?.name || 'cliente desconhecido'}: Descrição - ${p.description}, Valor - R$${p.finalValue}, Status - ${p.status}`;
      }).join('\n');


    try {
      const analysisResult = await recommendServices({
        clientProfile: `Nome: ${targetClient.name}, Email: ${targetClient.email}, Endereço: ${targetClient.address}, Preferências: ${targetClient.preferences}`,
        clientHistory: allProjects.filter(p => p.clientId === selectedClientId).map(p => `Projeto "${p.name}": ${p.description}`).join('\n') || "Nenhum projeto anterior.",
        pastProjectsContext: otherProjects
      });
      setResult(analysisResult);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Erro na Análise",
        description: "Não foi possível gerar as recomendações. Tente novamente."
      })
      console.error("Analysis failed:", error);
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary"/>
            Oportunidades com IA
        </CardTitle>
        <CardDescription>
          Selecione um cliente e use a IA para descobrir serviços e produtos que podem ser oferecidos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
            <Select onValueChange={setSelectedClientId}>
                <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                    {allClients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button onClick={handleAnalyze} disabled={loading} className="shrink-0">
            {loading ? (
                <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Analisando...
                </>
            ) : (
                <>
                <Lightbulb className="mr-2 h-4 w-4" />
                Gerar Recomendações
                </>
            )}
            </Button>
        </div>

        {result && result.recommendations.length > 0 && (
          <div className="pt-4">
            <h4 className="font-headline text-lg mb-2">Sugestões para {allClients.find(c => c.id === selectedClientId)?.name}:</h4>
            <ul className="space-y-3">
              {result.recommendations.map((rec, index) => (
                <li key={index} className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-semibold">{rec.serviceName}</p>
                  <p className="text-sm text-muted-foreground">{rec.justification}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
         {result && result.recommendations.length === 0 && !loading && (
             <p className="text-center text-muted-foreground py-4">Nenhuma recomendação específica encontrada para este cliente no momento.</p>
         )}
      </CardContent>
    </Card>
  );
}
