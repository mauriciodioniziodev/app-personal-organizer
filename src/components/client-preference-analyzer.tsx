"use client";

import { useState } from "react";
import { analyzeClientPreferences, AnalyzeClientPreferencesOutput } from "@/ai/flows/client-preference-analyzer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Lightbulb, LoaderCircle } from "lucide-react";

type PreferenceAnalyzerProps = {
  clientName: string;
  clientDetails: string;
};

export default function PreferenceAnalyzer({ clientName, clientDetails }: PreferenceAnalyzerProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeClientPreferencesOutput | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);
    try {
      const analysisResult = await analyzeClientPreferences({
        clientName,
        clientDetails,
      });
      setResult(analysisResult);
    } catch (error) {
      console.error("Analysis failed:", error);
      // Here you would typically show a toast notification
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Preferências e Histórico</CardTitle>
        <CardDescription>
          Notas sobre o cliente. Use o analisador de IA para obter insights.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          defaultValue={clientDetails}
          className="min-h-[150px] bg-background"
          readOnly // For this demo, we make it readonly. In a real app, it would be editable.
        />
        <Button onClick={handleAnalyze} disabled={loading}>
          {loading ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Lightbulb className="mr-2 h-4 w-4" />
              Analisar Preferências com IA
            </>
          )}
        </Button>

        {result && (
          <Card className="bg-primary/10 border-primary/30">
            <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary"/>
                Insights da IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/90">{result.preferenceSummary}</p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
