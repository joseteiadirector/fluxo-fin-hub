import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, Utensils, Bus, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface BeneficiosModalProps {
  open: boolean;
  onClose: () => void;
}

const BeneficiosModal = ({ open, onClose }: BeneficiosModalProps) => {
  const [vrSaldo, setVrSaldo] = useState(350);
  const [vaSaldo, setVaSaldo] = useState(200);
  const [vtSaldo, setVtSaldo] = useState(150);
  const [valorGasto, setValorGasto] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleGastar = async (tipoBeneficio: "VR" | "VA" | "VT", saldoAtual: number) => {
    if (!valorGasto) {
      toast.error("Informe o valor do gasto");
      return;
    }

    const valor = parseFloat(valorGasto);
    if (valor <= 0 || valor > saldoAtual) {
      toast.error("Valor inválido ou saldo insuficiente");
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

    const descricaoMap = {
      VR: "Vale Refeição",
      VA: "Vale Alimentação",
      VT: "Vale Transporte"
    };

    const categoriaMap = {
      VR: "Alimentação",
      VA: "Alimentação",
      VT: "Transporte"
    };

    // Criar transação
    const { error: transError } = await supabase
      .from("transactions")
      .insert({
        user_id: user?.id,
        account_id: account.id,
        descricao: `Gasto com ${descricaoMap[tipoBeneficio]}`,
        valor: valor,
        tipo: "saida",
        categoria: categoriaMap[tipoBeneficio],
        modo: "pessoal"
      });

    if (transError) {
      toast.error("Erro ao registrar gasto");
      setLoading(false);
      return;
    }

    // Registrar em services_logs
    await supabase
      .from("services_logs")
      .insert({
        user_id: user?.id,
        tipo_servico: "Beneficios",
        detalhes: {
          tipo: tipoBeneficio,
          valor_gasto: valor,
          saldo_anterior: saldoAtual,
          saldo_novo: saldoAtual - valor,
          data: new Date().toISOString()
        },
        valor: valor
      });

    // Atualizar saldo local
    if (tipoBeneficio === "VR") setVrSaldo(vrSaldo - valor);
    if (tipoBeneficio === "VA") setVaSaldo(vaSaldo - valor);
    if (tipoBeneficio === "VT") setVtSaldo(vtSaldo - valor);

    toast.success(`Gasto de ${formatCurrency(valor)} registrado!`, {
      description: `Saldo restante: ${formatCurrency(saldoAtual - valor)}`
    });

    setLoading(false);
    setValorGasto("");
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
            <Gift className="h-5 w-5 text-green-500" />
            Benefícios
          </DialogTitle>
          <DialogDescription>
            Gerencie seus vales: VR, VA e VT
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="vr" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="vr" className="gap-2">
              <Utensils className="h-4 w-4" />
              VR
            </TabsTrigger>
            <TabsTrigger value="va" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              VA
            </TabsTrigger>
            <TabsTrigger value="vt" className="gap-2">
              <Bus className="h-4 w-4" />
              VT
            </TabsTrigger>
          </TabsList>

          {/* VR - Vale Refeição */}
          <TabsContent value="vr" className="space-y-4">
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Saldo Disponível</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-500">
                  {formatCurrency(vrSaldo)}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="vr-valor">Valor do Gasto (R$)</Label>
              <Input
                id="vr-valor"
                type="number"
                placeholder="0.00"
                value={valorGasto}
                onChange={(e) => setValorGasto(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <Button 
              onClick={() => handleGastar("VR", vrSaldo)} 
              disabled={loading || !valorGasto}
              className="w-full"
            >
              {loading ? "Processando..." : "Registrar Gasto VR"}
            </Button>
          </TabsContent>

          {/* VA - Vale Alimentação */}
          <TabsContent value="va" className="space-y-4">
            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Saldo Disponível</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">
                  {formatCurrency(vaSaldo)}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="va-valor">Valor do Gasto (R$)</Label>
              <Input
                id="va-valor"
                type="number"
                placeholder="0.00"
                value={valorGasto}
                onChange={(e) => setValorGasto(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <Button 
              onClick={() => handleGastar("VA", vaSaldo)} 
              disabled={loading || !valorGasto}
              className="w-full"
            >
              {loading ? "Processando..." : "Registrar Gasto VA"}
            </Button>
          </TabsContent>

          {/* VT - Vale Transporte */}
          <TabsContent value="vt" className="space-y-4">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Saldo Disponível</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-500">
                  {formatCurrency(vtSaldo)}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="vt-valor">Valor do Gasto (R$)</Label>
              <Input
                id="vt-valor"
                type="number"
                placeholder="0.00"
                value={valorGasto}
                onChange={(e) => setValorGasto(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <Button 
              onClick={() => handleGastar("VT", vtSaldo)} 
              disabled={loading || !valorGasto}
              className="w-full"
            >
              {loading ? "Processando..." : "Registrar Gasto VT"}
            </Button>
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="border-muted">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Dica:</strong> Use seus benefícios para separar gastos corporativos e pessoais. 
              VR/VA para alimentação e VT para transporte relacionado ao trabalho.
            </p>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default BeneficiosModal;
