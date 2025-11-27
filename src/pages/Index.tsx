import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, CreditCard, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

interface DashboardProps {
  modoTrabalho: boolean;
}

const Index = ({ modoTrabalho }: DashboardProps) => {
  const [saldoAtual, setSaldoAtual] = useState(0);
  const [previsaoMes, setPrevisaoMes] = useState(0);
  const [gastosMes, setGastosMes] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, modoTrabalho]);

  const fetchDashboardData = async () => {
    const modo = modoTrabalho ? "trabalho" : "pessoal";
    
    // Buscar saldo da conta principal
    const { data: accounts } = await supabase
      .from("accounts")
      .select("saldo_atual")
      .eq("user_id", user?.id)
      .eq("tipo_conta", "principal")
      .single();

    if (accounts) {
      setSaldoAtual(Number(accounts.saldo_atual));
    }

    // Buscar transações do mês atual
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const { data: transactions } = await supabase
      .from("transactions")
      .select("valor, tipo")
      .eq("user_id", user?.id)
      .eq("modo", modo)
      .gte("data", firstDay.toISOString());

    if (transactions) {
      const gastos = transactions
        .filter(t => t.tipo === "saida")
        .reduce((sum, t) => sum + Number(t.valor), 0);
      
      setGastosMes(gastos);
      
      // Previsão simples baseada na proporção do mês
      const dayOfMonth = now.getDate();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const projecao = saldoAtual - (gastos / dayOfMonth) * (daysInMonth - dayOfMonth);
      setPrevisaoMes(projecao);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const getPrevisaoStatus = () => {
    if (previsaoMes > saldoAtual * 0.5) {
      return { text: "Projeção positiva", color: "blue-500" };
    } else if (previsaoMes > 0) {
      return { text: "Atenção ao saldo", color: "amber-500" };
    } else {
      return { text: "Risco alto", color: "red-500" };
    }
  };

  const previsaoStatus = getPrevisaoStatus();
  const percentualGasto = saldoAtual > 0 ? Math.round((gastosMes / saldoAtual) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">
          {modoTrabalho ? "Dashboard - Trabalho" : "Dashboard - Pessoal"}
        </h2>
        <p className="text-muted-foreground">
          Bem-vindo ao seu assistente financeiro inteligente
        </p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(saldoAtual)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Atualizado agora
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br from-${previsaoStatus.color}/10 to-${previsaoStatus.color}/5 border-${previsaoStatus.color}/20`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Previsão do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold text-${previsaoStatus.color}`}>
              {formatCurrency(previsaoMes)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className={`h-4 w-4 text-${previsaoStatus.color}`} />
              <p className={`text-xs text-${previsaoStatus.color}`}>{previsaoStatus.text}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gastos no Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500">
              {formatCurrency(gastosMes)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingDown className="h-4 w-4 text-amber-500" />
              <p className="text-xs text-amber-500">{percentualGasto}% do saldo</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Serviços Rápidos */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Acesso Rápido</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/servicos">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">PIX</h3>
                    <p className="text-sm text-muted-foreground">Transferir agora</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/servicos">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Recarga</h3>
                    <p className="text-sm text-muted-foreground">Celular pré-pago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/servicos">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Benefícios</h3>
                    <p className="text-sm text-muted-foreground">VR/VA/VT</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
