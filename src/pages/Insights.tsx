import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

const Insights = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchInsights();
    }
  }, [user]);

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
      <div>
        <h2 className="text-2xl font-bold">Insights Inteligentes</h2>
        <p className="text-muted-foreground">
          Análises e alertas gerados pela IA
        </p>
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
