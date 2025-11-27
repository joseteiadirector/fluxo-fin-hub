import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Wallet, CreditCard, Briefcase, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useInitialData } from "@/hooks/useInitialData";
import { Link, useNavigate } from "react-router-dom";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

interface DashboardProps {
  modoTrabalho: boolean;
}

const Index = ({ modoTrabalho }: DashboardProps) => {
  const [saldoAtual, setSaldoAtual] = useState(0);
  const [previsaoMes, setPrevisaoMes] = useState(0);
  const [gastosMes, setGastosMes] = useState(0);
  const [gastosDiarios, setGastosDiarios] = useState<{dia: number, valor: number}[]>([]);
  const [tendenciaMensal, setTendenciaMensal] = useState<{mes: string, valor: number, previsao?: number}[]>([]);
  const [distribuicaoCategoria, setDistribuicaoCategoria] = useState<{categoria: string, valor: number}[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { hasData, loading: initialLoading } = useInitialData();

  const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

  useEffect(() => {
    if (initialLoading) {
      toast.loading("Preparando seu dashboard...", { id: "loading-data" });
    } else if (!initialLoading && hasData) {
      toast.dismiss("loading-data");
      toast.success("Dashboard atualizado com dados reais!");
    }
  }, [initialLoading, hasData]);

  useEffect(() => {
    if (user && hasData) {
      fetchDashboardData();
      
      // Configurar realtime para atualizações automáticas
      const channel = supabase
        .channel('dashboard-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transactions'
          },
          () => fetchDashboardData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
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
      .maybeSingle();

    if (accounts) {
      setSaldoAtual(Number(accounts.saldo_atual));
    } else {
      setSaldoAtual(0);
    }

    // Buscar transações do mês atual
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const { data: transactions } = await supabase
      .from("transactions")
      .select("valor, tipo, categoria, data")
      .eq("user_id", user?.id)
      .eq("modo", modo)
      .gte("data", firstDay.toISOString())
      .order("data", { ascending: true });

    if (transactions && transactions.length > 0) {
      // Saídas totais do mês
      const gastos = transactions
        .filter((t) => t.tipo === "saida")
        .reduce((sum, t) => sum + Number(t.valor), 0);

      setGastosMes(gastos);

      // Entradas do mês
      const receitas = transactions
        .filter((t) => t.tipo === "entrada")
        .reduce((sum, t) => sum + Number(t.valor), 0);

      // Previsão baseada no saldo atual e média de gastos
      const dayOfMonth = now.getDate();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const mediaDiaria = dayOfMonth > 0 ? gastos / dayOfMonth : 0;
      const projecaoGastos = mediaDiaria * (daysInMonth - dayOfMonth);
      const saldoAtualCalculado = accounts ? Number(accounts.saldo_atual) : 0;
      const projecao = saldoAtualCalculado - projecaoGastos;
      setPrevisaoMes(projecao);

      // Processar gastos diários
      const gastosPorDia: { [key: number]: number } = {};
      transactions
        .filter((t) => t.tipo === "saida")
        .forEach((t) => {
          const dia = new Date(t.data).getDate();
          gastosPorDia[dia] = (gastosPorDia[dia] || 0) + Number(t.valor);
        });
      
      const chartDiario = Object.entries(gastosPorDia).map(([dia, valor]) => ({
        dia: Number(dia),
        valor: Number(valor.toFixed(2))
      })).sort((a, b) => a.dia - b.dia);
      setGastosDiarios(chartDiario);

      // Distribuição por categoria
      const gastosPorCategoria: { [key: string]: number } = {};
      transactions
        .filter((t) => t.tipo === "saida")
        .forEach((t) => {
          gastosPorCategoria[t.categoria] = (gastosPorCategoria[t.categoria] || 0) + Number(t.valor);
        });
      
      const chartCategoria = Object.entries(gastosPorCategoria).map(([categoria, valor]) => ({
        categoria,
        valor: Number(valor.toFixed(2))
      }));
      setDistribuicaoCategoria(chartCategoria);

      // Tendência mensal (últimos 6 meses + previsão)
      await calcularTendenciaMensal(modo);
    } else {
      // Se não há transações, zerar valores
      setGastosMes(0);
      setPrevisaoMes(accounts ? Number(accounts.saldo_atual) : 0);
      setGastosDiarios([]);
      setDistribuicaoCategoria([]);
      setTendenciaMensal([]);
    }
  };

  const calcularTendenciaMensal = async (modo: string) => {
    const now = new Date();
    const meses = [];
    
    for (let i = 5; i >= 0; i--) {
      const mesData = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const proximoMes = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const { data } = await supabase
        .from("transactions")
        .select("valor, tipo")
        .eq("user_id", user?.id)
        .eq("modo", modo)
        .gte("data", mesData.toISOString())
        .lt("data", proximoMes.toISOString());

      const gastos =
        data?.filter((t) => t.tipo === "saida").reduce((sum, t) => sum + Number(t.valor), 0) || 0;

      meses.push({
        mes: mesData.toLocaleDateString("pt-BR", { month: "short" }),
        valor: Number(gastos.toFixed(2))
      });
    }

    // Regressão linear simples para previsão
    const n = meses.length;
    const sumX = meses.reduce((sum, _, i) => sum + i, 0);
    const sumY = meses.reduce((sum, m) => sum + m.valor, 0);
    const sumXY = meses.reduce((sum, m, i) => sum + i * m.valor, 0);
    const sumX2 = meses.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const previsaoProxMes = slope * n + intercept;

    meses.push({
      mes: "Prev",
      valor: 0,
      previsao: Number(Math.max(0, previsaoProxMes).toFixed(2))
    });

    setTendenciaMensal(meses);
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

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução de Gastos Diários */}
        <Card>
          <CardHeader>
            <CardTitle>Gastos Diários no Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={gastosDiarios}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="dia" label={{ value: "Dia", position: "insideBottom", offset: -5 }} />
                <YAxis label={{ value: "R$", angle: -90, position: "insideLeft" }} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Dia ${label}`}
                />
                <Line type="monotone" dataKey="valor" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tendência Mensal com Previsão */}
        <Card>
          <CardHeader>
            <CardTitle>Tendência Mensal (6 meses + Previsão)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={tendenciaMensal}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mes" />
                <YAxis label={{ value: "R$", angle: -90, position: "insideLeft" }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="valor" name="Real" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="previsao" name="Previsão" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição por Categoria */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Distribuição de Gastos por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distribuicaoCategoria}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.categoria} (${(entry.percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="valor"
                >
                  {distribuicaoCategoria.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
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
