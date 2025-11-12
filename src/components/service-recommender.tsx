
'use client';
import {useEffect, useState} from 'react';
import {
  getClients,
  getProjectsByClientId,
  getVisitsByClientId,
} from '@/lib/data';
import type {Client, Project, Visit} from '@/lib/definitions';
import {
  recommendServices,
  type ServiceRecommenderOutput,
} from '@/ai/flows/service-recommender';
import {Button} from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {LoaderCircle, Wand2, Lightbulb} from 'lucide-react';
import {Alert, AlertDescription, AlertTitle} from './ui/alert';
import {Badge} from './ui/badge';

export function ServiceRecommender() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendations, setRecommendations] =
    useState<ServiceRecommenderOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClientsData() {
      setLoading(true);
      const clientsData = await getClients();
      setClients(clientsData);
      setLoading(false);
    }
    fetchClientsData();
  }, []);

  const handleAnalyze = async () => {
    if (!selectedClientId) return;
    setAnalyzing(true);
    setError(null);
    setRecommendations(null);

    try {
      const [client, projects, visits] = await Promise.all([
        clients.find((c) => c.id === selectedClientId)!,
        getProjectsByClientId(selectedClientId),
        getVisitsByClientId(selectedClientId),
      ]);

      const result = await recommendServices({client, projects, visits});
      setRecommendations(result);
    } catch (e: any) {
      console.error('Analysis failed:', e);
      setError(
        e.message ||
          'An unexpected error occurred while generating recommendations.'
      );
    } finally {
      setAnalyzing(false);
    }
  };
  
    const urgencyColors: {[key: string]: string} = {
        high: 'bg-red-100 text-red-800 border-red-200',
        medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        low: 'bg-blue-100 text-blue-800 border-blue-200',
    };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Recomendador de Serviços</CardTitle>
        <CardDescription>
          Selecione um cliente para receber sugestões de novos serviços com base em seu histórico.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select
            onValueChange={setSelectedClientId}
            disabled={loading || analyzing}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um cliente..." />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleAnalyze}
            disabled={!selectedClientId || analyzing}
            className="w-full sm:w-auto"
          >
            {analyzing ? (
              <>
                <LoaderCircle className="mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Wand2 className="mr-2" />
                Gerar Sugestões
              </>
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Erro na Análise</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {recommendations && (
          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-semibold font-headline">Recomendações Geradas</h3>
            {recommendations.recommendations.length > 0 ? (
                <ul className="space-y-4">
                {recommendations.recommendations.map((rec, index) => (
                    <li key={index} className="p-4 border rounded-lg bg-muted/20">
                    <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-primary">{rec.serviceName}</h4>
                        <Badge className={`capitalize ${urgencyColors[rec.urgency]}`}>
                            Urgência: {rec.urgency}
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{rec.justification}</p>
                    </li>
                ))}
                </ul>
            ) : (
                <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertTitle>Nenhuma Nova Oportunidade</AlertTitle>
                    <AlertDescription>
                        No momento, não há novas recomendações de serviço para este cliente com base em seu histórico atual.
                    </AlertDescription>
                </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
