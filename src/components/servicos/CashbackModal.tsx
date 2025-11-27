import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CashbackModalProps {
  open: boolean;
  onClose: () => void;
}

interface CashbackTransaction {
  id: string;
  data: string;
  descricao: string;
  valor: number;
}

const CashbackModal = ({ open, onClose }: CashbackModalProps) => {
  const [cashbackTotal, setCashbackTotal] = useState(0);
  const [historico, setHistorico] = useState<CashbackTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (open && user) {
      fetchCashback();
    }
  }, [open, user]);

  const fetchCashback = async () => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user?.id)
      .eq("tipo", "entrada")
      .ilike("categoria", "%cashback%")
      .order("data", { ascending: false });

    if (!error && data) {
      setHistorico(data as CashbackTransaction[]);
      const total = data.reduce((sum, t) => sum + Number(t.valor), 0);
      setCashbackTotal(total);
    }
  };

  const aplicarCashback = async () => {
    if (cashbackTotal <= 0) {
      toast.error("Não há cashback disponível para aplicar");
      return;
    }

    setLoading(true);

    // Buscar conta principal
    const { data: account } = await supabase
      .from("accounts")
      .select("id")
      .eq("user_id", user?.id)
      .eq("tipo_conta", "principal")
      .single();

    if (!account) {
      toast.error("Conta principal não encontrada");
      setLoading(false);
      return;
    }

    // Criar transação de entrada
    const { error: transError } = await supabase
      .from("transactions")
      .insert({
        user_id: user?.id,
        account_id: account.id,
        descricao: "Aplicação de Cashback Acumulado",
        valor: cashbackTotal,
        tipo: "entrada",
        categoria: "cashback aplicado",
        modo: "pessoal"
      });

    if (transError) {
      toast.error("Erro ao aplicar cashback");
      setLoading(false);
      return;
    }

    // Registrar em services_logs
    await supabase
      .from("services_logs")
      .insert({
        user_id: user?.id,
        tipo_servico: "Cashback",
        detalhes: {
          acao: "aplicacao",
          valor_aplicado: cashbackTotal,
          data: new Date().toISOString()
        },
        valor: cashbackTotal
      });

    toast.success("Cashback aplicado com sucesso!", {
      description: `R$ ${cashbackTotal.toFixed(2)} foi creditado na sua conta.`
    });

    setLoading(false);
    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            Cashback
          </DialogTitle>
          <DialogDescription>
            Cashback é um retorno em dinheiro de compras elegíveis. Acumule e aplique no seu saldo!
          </DialogDescription>
        </DialogHeader>

        {/* Saldo Total */}
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Cashback Disponível</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-amber-500">
                {formatCurrency(cashbackTotal)}
              </div>
              <Button 
                onClick={aplicarCashback} 
                disabled={loading || cashbackTotal <= 0}
                className="gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Aplicar Cashback
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Histórico */}
        <div className="space-y-3">
          <h3 className="font-semibold">Histórico de Cashback</h3>
          {historico.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum cashback recebido ainda
              </CardContent>
            </Card>
          ) : (
            historico.map((item) => (
              <Card key={item.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.descricao}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(item.data), "d 'de' MMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-amber-500 border-amber-500">
                      +{formatCurrency(item.valor)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CashbackModal;
