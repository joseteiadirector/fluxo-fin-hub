import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PiggyBank, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface EmprestimosModalProps {
  open: boolean;
  onClose: () => void;
}

const EmprestimosModal = ({ open, onClose }: EmprestimosModalProps) => {
  const [valor, setValor] = useState("");
  const [prazo, setPrazo] = useState("");
  const [modo, setModo] = useState<"trabalho" | "pessoal">("pessoal");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const TAXA_JUROS = 0.03; // 3% ao mês

  const calcularParcela = () => {
    if (!valor || !prazo) return 0;
    const valorNum = parseFloat(valor);
    const prazoNum = parseInt(prazo);
    
    if (isNaN(valorNum) || isNaN(prazoNum) || prazoNum <= 0) return 0;

    // Fórmula de juros compostos simples
    const montante = valorNum * Math.pow(1 + TAXA_JUROS, prazoNum);
    const parcela = montante / prazoNum;
    
    return parcela;
  };

  const calcularTotal = () => {
    const parcela = calcularParcela();
    const prazoNum = parseInt(prazo);
    return parcela * prazoNum;
  };

  const handleConfirmar = async () => {
    if (!valor || !prazo) {
      toast.error("Preencha todos os campos");
      return;
    }

    const valorNum = parseFloat(valor);
    const prazoNum = parseInt(prazo);

    if (valorNum <= 0 || prazoNum <= 0) {
      toast.error("Valores inválidos");
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

    const parcela = calcularParcela();
    const total = calcularTotal();

    // Criar transação de entrada (empréstimo recebido)
    const { error: transError } = await supabase
      .from("transactions")
      .insert({
        user_id: user?.id,
        account_id: account.id,
        descricao: `Empréstimo Recebido - ${prazoNum}x de R$ ${parcela.toFixed(2)}`,
        valor: valorNum,
        tipo: "entrada",
        categoria: "empréstimo recebido",
        modo: modo
      });

    if (transError) {
      toast.error("Erro ao registrar empréstimo");
      setLoading(false);
      return;
    }

    // Registrar em services_logs
    await supabase
      .from("services_logs")
      .insert({
        user_id: user?.id,
        tipo_servico: "Emprestimo",
        detalhes: {
          valor_solicitado: valorNum,
          prazo_meses: prazoNum,
          taxa_juros: TAXA_JUROS * 100,
          parcela_mensal: parcela,
          total_a_pagar: total,
          modo: modo,
          data_contratacao: new Date().toISOString()
        },
        valor: valorNum
      });

    // Gerar insight de alerta
    const percentualJuros = ((total - valorNum) / valorNum * 100).toFixed(1);
    await supabase
      .from("insights")
      .insert({
        user_id: user?.id,
        titulo: "Empréstimo Contratado - Atenção ao Orçamento",
        mensagem: `Você contratou um empréstimo de R$ ${valorNum.toFixed(2)} em ${prazoNum}x. Total a pagar: R$ ${total.toFixed(2)} (${percentualJuros}% em juros). Parcela mensal: R$ ${parcela.toFixed(2)}. Lembre-se de incluir essa despesa no seu orçamento mensal.`,
        tipo: "alerta",
        origem: "heuristica",
        prioridade: 3
      });

    toast.success("Empréstimo simulado com sucesso!", {
      description: `Parcela mensal: R$ ${parcela.toFixed(2)}`
    });

    setLoading(false);
    setValor("");
    setPrazo("");
    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const parcela = calcularParcela();
  const total = calcularTotal();
  const valorNum = parseFloat(valor) || 0;
  const jurosTotal = total - valorNum;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-pink-500" />
            Empréstimos
          </DialogTitle>
          <DialogDescription>
            Simule um empréstimo pessoal com taxa fixa de 3% ao mês
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor Desejado (R$)</Label>
              <Input
                id="valor"
                type="number"
                placeholder="0.00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prazo">Prazo (meses)</Label>
              <Input
                id="prazo"
                type="number"
                placeholder="12"
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
                min="1"
                max="60"
              />
            </div>

            <div className="space-y-2">
              <Label>Modo</Label>
              <RadioGroup value={modo} onValueChange={(v) => setModo(v as "trabalho" | "pessoal")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pessoal" id="emp-pessoal" />
                  <Label htmlFor="emp-pessoal" className="cursor-pointer">Pessoal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="trabalho" id="emp-trabalho" />
                  <Label htmlFor="emp-trabalho" className="cursor-pointer">Trabalho</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Simulação */}
          {valor && prazo && parcela > 0 && (
            <Card className="bg-gradient-to-br from-pink-500/10 to-pink-500/5 border-pink-500/20">
              <CardHeader>
                <CardTitle className="text-base">Simulação do Empréstimo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor Solicitado:</span>
                  <span className="font-semibold">{formatCurrency(valorNum)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Parcela Mensal:</span>
                  <span className="font-semibold text-pink-500">{formatCurrency(parcela)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total a Pagar:</span>
                  <span className="font-semibold">{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total em Juros:</span>
                  <span className="font-semibold text-amber-500">{formatCurrency(jurosTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa de Juros:</span>
                  <span className="font-semibold">3% ao mês</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alerta */}
          {parcela > 0 && (
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="py-4">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Atenção!</p>
                    <p>
                      Este empréstimo irá gerar um compromisso mensal de {formatCurrency(parcela)}. 
                      Certifique-se de que essa parcela cabe no seu orçamento.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botão de Confirmação */}
          <Button 
            onClick={handleConfirmar} 
            disabled={loading || !valor || !prazo || parcela <= 0}
            className="w-full"
            size="lg"
          >
            {loading ? "Processando..." : "Confirmar Simulação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmprestimosModal;
