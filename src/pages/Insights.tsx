import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, Info, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { InsightsEngine } from "@/utils/insightsEngine";
import { toast } from "sonner";

interface Insight {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: "alerta" | "oportunidade" | "informacao";
  origem: "regressao_linear" | "arvore_decisao" | "heuristica";
  prioridade: number;
  gerado_em: string;
  lido: boolean;
}

interface InsightsProps {
  modoTrabalho: boolean;
}

const Insights = ({ modoTrabalho }: InsightsProps) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { user } = useAuth();
  const insightsEngine = new InsightsEngine();

  useEffect(() => {
    if (user) {
      fetchInsights();
      
      // Configurar realtime para insights
      const channel = supabase
        .channel('insights-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'insights',
            filter: `user_id=eq.${user.id}`
          },
          () => fetchInsights()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, modoTrabalho]);

  const generateNewInsights = async () => {
    if (!user) return;
    
    setGenerating(true);
    toast.info("Analisando seus padrões de gastos...");
    
    try {
      const modo = modoTrabalho ? "trabalho" : "pessoal";
      await insightsEngine.generateInsights(user.id, modo);
      toast.success("Novos insights gerados com sucesso!");
      await fetchInsights();
    } catch (error) {
      console.error("Error generating insights:", error);
      toast.error("Erro ao gerar insights");
    } finally {
      setGenerating(false);
    }
  };

  const fetchInsights = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("insights")
      .select("*")
      .eq("user_id", user?.id)
      .order("prioridade", { ascending: false })
      .order("gerado_em", { ascending: false });

    if (!error && data) {
      setInsights(data as Insight[]);
    }
    setLoading(false);
  };

  const getInsightIcon = (tipo: string) => {
    switch (tipo) {
      case "alerta":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "oportunidade":
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getInsightColor = (tipo: string) => {
    switch (tipo) {
      case "alerta":
        return "border-red-500/20 bg-red-500/5";
      case "oportunidade":
        return "border-green-500/20 bg-green-500/5";
      default:
        return "border-blue-500/20 bg-blue-500/5";
    }
  };

  const getOrigemLabel = (origem: string) => {
    switch (origem) {
      case "regressao_linear":
        return "Regressão Linear";
      case "arvore_decisao":
        return "Árvore de Decisão";
      case "heuristica":
        return "Heurística";
      default:
        return origem;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Insights Inteligentes - {modoTrabalho ? "Trabalho" : "Pessoal"}</h2>
          <p className="text-muted-foreground">
            Análise automática com IA dos seus padrões financeiros
          </p>
        </div>
        <Button 
          onClick={generateNewInsights}
          disabled={generating}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
          {generating ? "Analisando..." : "Gerar Insights"}
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">Carregando insights...</div>
      ) : insights.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Nenhum insight gerado ainda. Continue usando o app para receber análises automáticas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {insights.map((insight) => (
            <Card key={insight.id} className={`${getInsightColor(insight.tipo)}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getInsightIcon(insight.tipo)}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{insight.titulo}</CardTitle>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {insight.mensagem}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    Prioridade {insight.prioridade}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {getOrigemLabel(insight.origem)}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {insight.tipo}
                    </Badge>
                  </div>
                  <span>
                    {format(new Date(insight.gerado_em), "d 'de' MMM, HH:mm", { locale: ptBR })}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Insights;
