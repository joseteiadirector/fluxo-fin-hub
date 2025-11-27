import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Target, Plus, Trash2, TrendingUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import SimpleLayout from "@/components/SimpleLayout";

interface Meta {
  id: string;
  categoria: string;
  modo: string;
  valor_limite: number;
  mes_referencia: string;
  gasto_atual?: number;
  percentual?: number;
}

const categorias = [
  "Alimentação", "Transporte", "Moradia", "Saúde", "Educação",
  "Lazer", "Compras", "Contas", "Outros"
];

export default function Metas() {
  const { user } = useAuth();
  const [metas, setMetas] = useState<Meta[]>([]);
  const [modo, setModo] = useState<"Work" | "Personal">("Personal");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [novaMeta, setNovaMeta] = useState({
    categoria: "",
    valor_limite: ""
  });

  const mesAtual = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    if (user) {
      fetchMetas();
      
      // Configurar realtime para metas e transactions
      const channel = supabase
        .channel('metas-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'metas',
            filter: `user_id=eq.${user.id}`
          },
          () => fetchMetas()
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transactions',
            filter: `user_id=eq.${user.id}`
          },
          () => fetchMetas()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, modo]);

  const fetchMetas = async () => {
    setLoading(true);
    try {
      // Buscar metas
      const { data: metasData, error: metasError } = await supabase
        .from("metas")
        .select("*")
        .eq("user_id", user?.id)
        .eq("modo", modo)
        .eq("mes_referencia", mesAtual);

      if (metasError) throw metasError;

      // Buscar gastos do mês atual
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const fimMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59).toISOString();

      const { data: transacoes, error: transError } = await supabase
        .from("transactions")
        .select("categoria, valor")
        .eq("user_id", user?.id)
        .eq("modo", modo)
        .eq("tipo", "saida")
        .gte("data", inicioMes)
        .lte("data", fimMes);

      if (transError) throw transError;

      // Calcular gastos por categoria
      const gastosPorCategoria = transacoes?.reduce((acc: any, t: any) => {
        acc[t.categoria] = (acc[t.categoria] || 0) + parseFloat(t.valor);
        return acc;
      }, {});

      // Combinar metas com gastos
      const metasComGastos = metasData?.map(meta => ({
        ...meta,
        gasto_atual: gastosPorCategoria?.[meta.categoria] || 0,
        percentual: ((gastosPorCategoria?.[meta.categoria] || 0) / meta.valor_limite) * 100
      }));

      setMetas(metasComGastos || []);
    } catch (error) {
      console.error("Erro ao buscar metas:", error);
      toast.error("Erro ao carregar metas");
    } finally {
      setLoading(false);
    }
  };

  const criarMeta = async () => {
    if (!novaMeta.categoria || !novaMeta.valor_limite) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      const { error } = await supabase
        .from("metas")
        .insert({
          user_id: user?.id,
          categoria: novaMeta.categoria,
          modo: modo,
          valor_limite: parseFloat(novaMeta.valor_limite),
          mes_referencia: mesAtual
        });

      if (error) throw error;

      toast.success("Meta criada com sucesso!");
      setDialogOpen(false);
      setNovaMeta({ categoria: "", valor_limite: "" });
      fetchMetas();
    } catch (error: any) {
      console.error("Erro ao criar meta:", error);
      if (error.code === "23505") {
        toast.error("Já existe uma meta para esta categoria neste mês");
      } else {
        toast.error("Erro ao criar meta");
      }
    }
  };

  const deletarMeta = async (id: string) => {
    try {
      const { error } = await supabase
        .from("metas")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Meta removida");
      fetchMetas();
    } catch (error) {
      console.error("Erro ao deletar meta:", error);
      toast.error("Erro ao remover meta");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (percentual: number) => {
    if (percentual >= 100) return "text-destructive";
    if (percentual >= 80) return "text-yellow-500";
    return "text-green-500";
  };

  const getStatusIcon = (percentual: number) => {
    if (percentual >= 100) return <AlertTriangle className="w-5 h-5 text-destructive" />;
    if (percentual >= 80) return <TrendingUp className="w-5 h-5 text-yellow-500" />;
    return <Target className="w-5 h-5 text-green-500" />;
  };

  return (
    <SimpleLayout>
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Target className="w-8 h-8" />
              Metas Financeiras
            </h1>
            <p className="text-muted-foreground mt-1">
              Defina e acompanhe seus limites de gastos por categoria
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nova Meta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Meta</DialogTitle>
                <DialogDescription>
                  Defina um limite de gastos para uma categoria no mês atual
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Categoria</Label>
                  <Select
                    value={novaMeta.categoria}
                    onValueChange={(value) => setNovaMeta({ ...novaMeta, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor Limite</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={novaMeta.valor_limite}
                    onChange={(e) => setNovaMeta({ ...novaMeta, valor_limite: e.target.value })}
                  />
                </div>
                <Button onClick={criarMeta} className="w-full">
                  Criar Meta
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Toggle Work/Personal */}
        <div className="flex gap-2">
          <Button
            variant={modo === "Personal" ? "default" : "outline"}
            onClick={() => setModo("Personal")}
          >
            Personal
          </Button>
          <Button
            variant={modo === "Work" ? "default" : "outline"}
            onClick={() => setModo("Work")}
          >
            Work
          </Button>
        </div>

        {/* Lista de Metas */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4">Carregando metas...</p>
          </div>
        ) : metas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhuma meta definida para este mês.
                <br />
                Clique em "Nova Meta" para começar!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metas.map((meta) => (
              <Card key={meta.id} className="animate-scale-in group cursor-pointer bg-gradient-to-br from-card to-card/50">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(meta.percentual || 0)}
                      <CardTitle>{meta.categoria}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deletarMeta(meta.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardDescription>
                    Limite: {formatCurrency(meta.valor_limite)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Gasto atual:</span>
                    <span className={getStatusColor(meta.percentual || 0)}>
                      {formatCurrency(meta.gasto_atual || 0)}
                    </span>
                  </div>
                  <Progress value={Math.min(meta.percentual || 0, 100)} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{(meta.percentual || 0).toFixed(1)}% utilizado</span>
                    <span>
                      Restante: {formatCurrency(Math.max(0, meta.valor_limite - (meta.gasto_atual || 0)))}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SimpleLayout>
  );
}