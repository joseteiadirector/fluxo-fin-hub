import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw, Calendar, CalendarDays, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface MoodData {
  emoji: string;
  titulo: string;
  analise: string;
  dados: {
    saldoTotal: number;
    totalReceitas: number;
    totalDespesas: number;
    saldoPeriodo: number;
    periodo: string;
  };
}

export const FinancialMoodCard = () => {
  const [mood, setMood] = useState<MoodData | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<"current" | "month" | "day">("current");

  const analyzeMood = async (selectedPeriod: "current" | "month" | "day") => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Você precisa estar autenticado");
        return;
      }

      const { data, error } = await supabase.functions.invoke("analyze-financial-mood", {
        body: { period: selectedPeriod },
      });

      if (error) throw error;

      setMood(data);
      setPeriod(selectedPeriod);
    } catch (error) {
      console.error("Erro ao analisar humor:", error);
      toast.error("Erro ao analisar situação financeira");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    analyzeMood("current");
  }, []);

  const periodLabels = {
    current: "Situação Atual",
    month: "Este Mês",
    day: "Hoje"
  };

  const periodIcons = {
    current: TrendingUp,
    month: CalendarDays,
    day: Calendar
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Análise de IA Generativa
          </h3>
          <p className="text-sm text-muted-foreground">
            Situação financeira analisada por inteligência artificial
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => analyzeMood(period)}
          disabled={loading}
          className="h-8 w-8"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="flex gap-2 mb-6">
        {(["current", "month", "day"] as const).map((p) => {
          const Icon = periodIcons[p];
          return (
            <Button
              key={p}
              variant={period === p ? "default" : "outline"}
              size="sm"
              onClick={() => analyzeMood(p)}
              disabled={loading}
              className="flex-1"
            >
              <Icon className="h-3 w-3 mr-1" />
              {periodLabels[p]}
            </Button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Analisando sua situação financeira...</p>
        </div>
      ) : mood ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-background/50 rounded-lg border border-border/50">
            <div className="text-6xl">{mood.emoji}</div>
            <div className="flex-1">
              <h4 className="text-xl font-semibold text-foreground mb-1">
                {mood.titulo}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {mood.analise}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-background/30 rounded-lg border border-border/30">
              <p className="text-xs text-muted-foreground mb-1">Saldo Total</p>
              <p className={`text-lg font-bold ${mood.dados.saldoTotal >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                R$ {mood.dados.saldoTotal.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-background/30 rounded-lg border border-border/30">
              <p className="text-xs text-muted-foreground mb-1">Saldo {mood.dados.periodo}</p>
              <p className={`text-lg font-bold ${mood.dados.saldoPeriodo >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                R$ {mood.dados.saldoPeriodo.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-background/30 rounded-lg border border-border/30">
              <p className="text-xs text-muted-foreground mb-1">Receitas</p>
              <p className="text-lg font-bold text-green-500">
                R$ {mood.dados.totalReceitas.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-background/30 rounded-lg border border-border/30">
              <p className="text-xs text-muted-foreground mb-1">Despesas</p>
              <p className="text-lg font-bold text-red-500">
                R$ {mood.dados.totalDespesas.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
};
