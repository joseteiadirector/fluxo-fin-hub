import { supabase } from "@/integrations/supabase/client";

interface Transaction {
  valor: number;
  tipo: string;
  categoria: string;
  data: string;
  modo: string;
}

interface InsightData {
  titulo: string;
  mensagem: string;
  tipo: "alerta" | "oportunidade" | "informacao";
  origem: "regressao_linear" | "arvore_decisao" | "heuristica";
  prioridade: number;
  user_id: string;
}

// Árvore de Decisão para Análise de Gastos
class DecisionTreeAnalyzer {
  analyze(
    transactions: Transaction[],
    saldoAtual: number,
    userId: string
  ): InsightData[] {
    const insights: InsightData[] = [];
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const dayOfMonth = now.getDate();

    // Calcular métricas
    const gastosMes = transactions
      .filter(t => t.tipo === "saida")
      .reduce((sum, t) => sum + Number(t.valor), 0);

    const entradas = transactions
      .filter(t => t.tipo === "entrada")
      .reduce((sum, t) => sum + Number(t.valor), 0);

    // Gastos por categoria
    const gastosPorCategoria: { [key: string]: number } = {};
    transactions
      .filter(t => t.tipo === "saida")
      .forEach(t => {
        gastosPorCategoria[t.categoria] = (gastosPorCategoria[t.categoria] || 0) + Number(t.valor);
      });

    // REGRA 1: Análise de proporção de gastos vs receitas
    if (entradas > 0) {
      const proporcao = gastosMes / entradas;
      
      if (proporcao > 0.9) {
        insights.push({
          titulo: "⚠️ Gastos Críticos",
          mensagem: `Suas despesas estão em ${(proporcao * 100).toFixed(0)}% das suas receitas este mês. Risco alto de déficit!`,
          tipo: "alerta",
          origem: "arvore_decisao",
          prioridade: 1,
          user_id: userId
        });
      } else if (proporcao > 0.75) {
        insights.push({
          titulo: "⚡ Atenção aos Gastos",
          mensagem: `Você já gastou ${(proporcao * 100).toFixed(0)}% das suas receitas. Considere reduzir despesas não essenciais.`,
          tipo: "alerta",
          origem: "arvore_decisao",
          prioridade: 2,
          user_id: userId
        });
      } else if (proporcao < 0.5) {
        insights.push({
          titulo: "💰 Gestão Eficiente",
          mensagem: `Parabéns! Você gastou apenas ${(proporcao * 100).toFixed(0)}% das suas receitas. Continue assim!`,
          tipo: "oportunidade",
          origem: "arvore_decisao",
          prioridade: 3,
          user_id: userId
        });
      }
    }

    // REGRA 2: Análise de categorias específicas
    Object.entries(gastosPorCategoria).forEach(([categoria, valor]) => {
      const percentualCategoria = gastosMes > 0 ? (valor / gastosMes) * 100 : 0;

      // Categoria representa mais de 40% dos gastos
      if (percentualCategoria > 40) {
        insights.push({
          titulo: `📊 Concentração em ${categoria}`,
          mensagem: `A categoria "${categoria}" representa ${percentualCategoria.toFixed(0)}% dos seus gastos. Considere diversificar suas despesas.`,
          tipo: "informacao",
          origem: "arvore_decisao",
          prioridade: 2,
          user_id: userId
        });
      }

      // Gastos altos em categorias específicas
      if (categoria.toLowerCase().includes("alimentação") && valor > entradas * 0.3) {
        insights.push({
          titulo: "🍔 Gastos Elevados em Alimentação",
          mensagem: `Seus gastos com alimentação estão acima de 30% da renda. Considere cozinhar mais em casa.`,
          tipo: "alerta",
          origem: "arvore_decisao",
          prioridade: 2,
          user_id: userId
        });
      }

      if (categoria.toLowerCase().includes("transporte") && valor > entradas * 0.25) {
        insights.push({
          titulo: "🚗 Transporte Custando Muito",
          mensagem: `Gastos com transporte ultrapassaram 25% da renda. Avalie alternativas mais econômicas.`,
          tipo: "alerta",
          origem: "arvore_decisao",
          prioridade: 2,
          user_id: userId
        });
      }
    });

    // REGRA 3: Previsão de fim de mês
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const gastoDiarioMedio = gastosMes / dayOfMonth;
    const previsaoFimMes = saldoAtual - (gastoDiarioMedio * (daysInMonth - dayOfMonth));

    if (previsaoFimMes < 0) {
      insights.push({
        titulo: "🚨 Risco de Saldo Negativo",
        mensagem: `Com o ritmo atual de gastos, você pode fechar o mês com déficit de R$ ${Math.abs(previsaoFimMes).toFixed(2)}.`,
        tipo: "alerta",
        origem: "arvore_decisao",
        prioridade: 1,
        user_id: userId
      });
    } else if (previsaoFimMes < saldoAtual * 0.1) {
      insights.push({
        titulo: "⚠️ Margem Apertada",
        mensagem: `Projeção indica que você terá apenas R$ ${previsaoFimMes.toFixed(2)} no final do mês. Cuidado!`,
        tipo: "alerta",
        origem: "arvore_decisao",
        prioridade: 2,
        user_id: userId
      });
    }

    return insights;
  }
}

// Heurísticas para Detecção de Padrões
class HeuristicAnalyzer {
  analyze(
    transactions: Transaction[],
    saldoAtual: number,
    userId: string
  ): InsightData[] {
    const insights: InsightData[] = [];
    const now = new Date();

    // Agrupar transações por período
    const ultimos7Dias = transactions.filter(t => {
      const diff = now.getTime() - new Date(t.data).getTime();
      return diff <= 7 * 24 * 60 * 60 * 1000;
    });

    const ultimos30Dias = transactions.filter(t => {
      const diff = now.getTime() - new Date(t.data).getTime();
      return diff <= 30 * 24 * 60 * 60 * 1000;
    });

    // HEURÍSTICA 1: Frequência de transações
    const transacoesPorDia = ultimos7Dias.length / 7;
    if (transacoesPorDia > 5) {
      insights.push({
        titulo: "📈 Muitas Transações",
        mensagem: `Você está fazendo ${transacoesPorDia.toFixed(1)} transações por dia. Muitas pequenas despesas podem somar!`,
        tipo: "informacao",
        origem: "heuristica",
        prioridade: 3,
        user_id: userId
      });
    }

    // HEURÍSTICA 2: Crescimento rápido em categoria
    const gastosPorCategoria30d: { [key: string]: number } = {};
    ultimos30Dias
      .filter(t => t.tipo === "saida")
      .forEach(t => {
        gastosPorCategoria30d[t.categoria] = (gastosPorCategoria30d[t.categoria] || 0) + Number(t.valor);
      });

    const gastosPorCategoria7d: { [key: string]: number } = {};
    ultimos7Dias
      .filter(t => t.tipo === "saida")
      .forEach(t => {
        gastosPorCategoria7d[t.categoria] = (gastosPorCategoria7d[t.categoria] || 0) + Number(t.valor);
      });

    Object.keys(gastosPorCategoria7d).forEach(categoria => {
      const media30d = (gastosPorCategoria30d[categoria] || 0) / 30;
      const media7d = (gastosPorCategoria7d[categoria] || 0) / 7;
      
      if (media7d > media30d * 1.5 && gastosPorCategoria7d[categoria] > 50) {
        const aumento = ((media7d / media30d - 1) * 100).toFixed(0);
        insights.push({
          titulo: `📊 Aumento em ${categoria}`,
          mensagem: `Seus gastos em "${categoria}" aumentaram ${aumento}% na última semana. Fique atento!`,
          tipo: "alerta",
          origem: "heuristica",
          prioridade: 2,
          user_id: userId
        });
      }
    });

    // HEURÍSTICA 3: Padrão de gastos noturnos/finais de semana
    const gastosFinaisSemana = transactions.filter(t => {
      const dia = new Date(t.data).getDay();
      return t.tipo === "saida" && (dia === 0 || dia === 6);
    });

    if (gastosFinaisSemana.length > 0) {
      const totalFinsSemana = gastosFinaisSemana.reduce((sum, t) => sum + Number(t.valor), 0);
      const totalGeral = transactions
        .filter(t => t.tipo === "saida")
        .reduce((sum, t) => sum + Number(t.valor), 0);
      
      const proporcao = totalGeral > 0 ? (totalFinsSemana / totalGeral) * 100 : 0;
      
      if (proporcao > 35) {
        insights.push({
          titulo: "🎉 Gastos de Fim de Semana",
          mensagem: `${proporcao.toFixed(0)}% dos seus gastos ocorrem nos finais de semana. Planeje-se melhor para esses dias!`,
          tipo: "informacao",
          origem: "heuristica",
          prioridade: 3,
          user_id: userId
        });
      }
    }

    // HEURÍSTICA 4: Saldo vs meta mensal
    const metaIdeal = saldoAtual * 0.2; // 20% de reserva
    if (saldoAtual < metaIdeal && saldoAtual > 0) {
      insights.push({
        titulo: "💡 Construa sua Reserva",
        mensagem: `Tente manter pelo menos 20% do seu saldo como reserva de emergência. Meta: R$ ${metaIdeal.toFixed(2)}`,
        tipo: "oportunidade",
        origem: "heuristica",
        prioridade: 3,
        user_id: userId
      });
    }

    return insights;
  }
}

// Engine Principal de Insights
export class InsightsEngine {
  private decisionTree: DecisionTreeAnalyzer;
  private heuristics: HeuristicAnalyzer;

  constructor() {
    this.decisionTree = new DecisionTreeAnalyzer();
    this.heuristics = new HeuristicAnalyzer();
  }

  async generateInsights(userId: string, modo: string): Promise<void> {
    try {
      // Buscar saldo atual
      const { data: accountData } = await supabase
        .from("accounts")
        .select("saldo_atual")
        .eq("user_id", userId)
        .eq("tipo_conta", "principal")
        .maybeSingle();

      const saldoAtual = accountData ? Number(accountData.saldo_atual) : 0;

      // Buscar transações dos últimos 30 dias
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const { data: transactions } = await supabase
        .from("transactions")
        .select("valor, tipo, categoria, data, modo")
        .eq("user_id", userId)
        .eq("modo", modo)
        .gte("data", thirtyDaysAgo.toISOString());

      if (!transactions || transactions.length === 0) {
        // Criar insight informativo para novos usuários
        await supabase.from("insights").insert({
          user_id: userId,
          titulo: "👋 Bem-vindo ao Équilibra",
          mensagem: "Comece registrando suas transações para receber insights personalizados sobre seus hábitos financeiros!",
          tipo: "informacao",
          origem: "heuristica",
          prioridade: 3
        });
        return;
      }

      // Gerar insights usando árvore de decisão
      const treeInsights = this.decisionTree.analyze(transactions, saldoAtual, userId);

      // Gerar insights usando heurísticas
      const heuristicInsights = this.heuristics.analyze(transactions, saldoAtual, userId);

      // Combinar todos os insights
      const allInsights = [...treeInsights, ...heuristicInsights];

      // Limitar a 10 insights mais importantes
      const topInsights = allInsights
        .sort((a, b) => a.prioridade - b.prioridade)
        .slice(0, 10);

      // Remover insights antigos não lidos do mesmo tipo
      await supabase
        .from("insights")
        .delete()
        .eq("user_id", userId)
        .eq("lido", false);

      // Inserir novos insights
      if (topInsights.length > 0) {
        await supabase.from("insights").insert(topInsights);
      }

      console.log(`Generated ${topInsights.length} insights for user ${userId}`);
    } catch (error) {
      console.error("Error generating insights:", error);
    }
  }
}
