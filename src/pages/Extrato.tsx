import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import TransactionDialog from "@/components/TransactionDialog";

interface Transaction {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: "entrada" | "saida";
  categoria: string;
  modo: "trabalho" | "pessoal";
}

interface ExtratoProps {
  modoTrabalho: boolean;
}

const Extrato = ({ modoTrabalho }: ExtratoProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchTransactions();
      
      // Configurar realtime para transactions
      const modo = modoTrabalho ? "trabalho" : "pessoal";
      const channel = supabase
        .channel('transactions-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transactions',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            // Recarregar apenas se for do modo correto
            if (payload.new && (payload.new as any).modo === modo) {
              fetchTransactions();
            } else if (payload.old && (payload.old as any).modo === modo) {
              fetchTransactions();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, modoTrabalho]);

  const fetchTransactions = async () => {
    setLoading(true);
    const modo = modoTrabalho ? "trabalho" : "pessoal";
    
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user?.id)
      .eq("modo", modo)
      .order("data", { ascending: false });

    if (!error && data) {
      setTransactions(data as Transaction[]);
    }
    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Extrato</h2>
            <p className="text-muted-foreground">
              {modoTrabalho ? "Transações de Trabalho" : "Transações Pessoais"}
            </p>
          </div>
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova Transação
          </Button>
        </div>
      </div>

      <TransactionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        modoTrabalho={modoTrabalho}
        onSuccess={fetchTransactions}
      />

      {loading ? (
        <div className="text-center py-12">Carregando transações...</div>
      ) : transactions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma transação encontrada</CardTitle>
            <CardDescription>
              Comece adicionando suas primeiras transações em modo {modoTrabalho ? 'Trabalho' : 'Pessoal'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center">
              <p className="text-muted-foreground mb-4">
                Clique em "Nova Transação" para começar a registrar suas finanças.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <Card key={transaction.id} className="hover:bg-accent/50 transition-colors">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        transaction.tipo === "entrada" ? "bg-green-500/10" : "bg-red-500/10"
                      }`}
                    >
                      {transaction.tipo === "entrada" ? (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.descricao}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(transaction.data), "d 'de' MMM, HH:mm", { locale: ptBR })}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {transaction.categoria}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p
                    className={`text-lg font-bold ${
                      transaction.tipo === "entrada" ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {transaction.tipo === "entrada" ? "+" : "-"}
                    {formatCurrency(transaction.valor)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Extrato;
