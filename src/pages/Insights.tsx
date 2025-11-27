import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, Info, RefreshCw, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  const navigate = useNavigate();

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
    toast.info("Analisando seus padrões de gastos com IA...");
    
    try {
      const modo = modoTrabalho ? "trabalho" : "pessoal";
      
      const { data, error } = await supabase.functions.invoke('generate-insights', {
        body: { userId: user.id, modo }
      });

      if (error) {
        console.error("Error invoking function:", error);
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success(`${data.count} novos insights gerados com IA!`);
      await fetchInsights();
    } catch (error: any) {
      console.error("Error generating insights:", error);
      
      if (error.message?.includes("429") || error.message?.includes("Limite")) {
        toast.error("Muitas requisições. Aguarde alguns segundos e tente novamente.");
      } else if (error.message?.includes("402") || error.message?.includes("Créditos")) {
        toast.error("Créditos insuficientes. Configure créditos no workspace.");
      } else {
        toast.error("Erro ao gerar insights. Tente novamente.");
      }
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 flex items-center justify-between">
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
      </div>

      {/* Explicação dos Sistemas de IA */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Sistemas de Inteligência Artificial
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Équilibra utiliza três sistemas de IA distintos trabalhando em conjunto para gerar insights personalizados:
          </p>
          <div className="grid gap-3 text-sm">
            <div className="p-3 rounded-lg bg-background/50 border">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs">Regressão Linear</Badge>
                <span className="text-xs text-muted-foreground">Sistema Preditivo</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Analisa histórico de gastos para calcular tendências e projetar saldo futuro usando fórmula matemática (y = mx + b). 
                Prevê se você terminará o mês no azul ou vermelho baseado no padrão atual.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-background/50 border">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs">Árvore de Decisão</Badge>
                <span className="text-xs text-muted-foreground">Sistema Classificador</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Classifica padrões complexos analisando múltiplos critérios (categoria, aumento percentual, frequência, saldo projetado). 
                Identifica alertas, oportunidades e informações priorizadas automaticamente.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-background/50 border">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs">Heurística</Badge>
                <span className="text-xs text-muted-foreground">Sistema Baseado em Regras</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Detecta padrões específicos usando regras if/else (gastos acima de X% do salário, picos em transporte, parcelamentos). 
                Rápido e eficiente para alertas imediatos sobre comportamentos críticos.
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground pt-2 border-t">
            💡 <strong>Para avaliadores:</strong> Cada insight mostra sua origem (badge) permitindo rastrear qual sistema de IA o gerou. 
            A prioridade (1-3) define a urgência da recomendação.
          </p>
        </CardContent>
      </Card>

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
