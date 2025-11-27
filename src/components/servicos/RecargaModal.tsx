import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Smartphone, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface RecargaModalProps {
  open: boolean;
  onClose: () => void;
}

const RecargaModal = ({ open, onClose }: RecargaModalProps) => {
  const [telefone, setTelefone] = useState("");
  const [operadora, setOperadora] = useState("");
  const [valor, setValor] = useState("");
  const [metodoPagamento, setMetodoPagamento] = useState<"saldo" | "cartao">("saldo");
  const [numeroCartao, setNumeroCartao] = useState("");
  const [cvv, setCvv] = useState("");
  const [validade, setValidade] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const valoresRecarga = [10, 15, 20, 25, 30, 50, 100];
  const operadoras = ["Vivo", "Claro", "TIM", "Oi"];

  const handleRecarregar = async () => {
    if (!telefone || !operadora || !valor) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (metodoPagamento === "cartao" && (!numeroCartao || !cvv || !validade)) {
      toast.error("Preencha os dados do cartão de crédito");
      return;
    }

    const valorNum = parseFloat(valor);
    if (valorNum <= 0) {
      toast.error("Valor inválido");
      return;
    }

    setLoading(true);

    // Buscar conta principal
    const { data: account } = await supabase
      .from("accounts")
      .select("id, saldo_atual")
      .eq("user_id", user?.id)
      .eq("tipo_conta", "principal")
      .single();

    if (!account) {
      toast.error("Conta principal não encontrada");
      setLoading(false);
      return;
    }

    // Verificar saldo se for usar saldo
    if (metodoPagamento === "saldo" && account.saldo_atual < valorNum) {
      toast.error("Saldo insuficiente");
      setLoading(false);
      return;
    }

    // Criar transação de saída (recarga)
    const { error: transError } = await supabase
      .from("transactions")
      .insert({
        user_id: user?.id,
        account_id: account.id,
        descricao: `Recarga ${operadora} ${telefone} ${metodoPagamento === "cartao" ? "(via Cartão)" : ""}`,
        valor: valorNum,
        tipo: "saida",
        categoria: "Telefonia",
        modo: "pessoal"
      });

    if (transError) {
      toast.error("Erro ao realizar recarga");
      setLoading(false);
      return;
    }

    // Registrar em services_logs
    await supabase
      .from("services_logs")
      .insert({
        user_id: user?.id,
        tipo_servico: "Recarga",
        detalhes: {
          telefone: telefone,
          operadora: operadora,
          valor: valorNum,
          metodo_pagamento: metodoPagamento,
          data: new Date().toISOString()
        },
        valor: valorNum
      });

    toast.success("Recarga realizada com sucesso!", {
      description: `R$ ${valorNum.toFixed(2)} para ${telefone} (${operadora})`
    });

    setLoading(false);
    setTelefone("");
    setOperadora("");
    setValor("");
    setNumeroCartao("");
    setCvv("");
    setValidade("");
    setMetodoPagamento("saldo");
    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-blue-500" />
            Recarga de Celular
          </DialogTitle>
          <DialogDescription>
            Recarregue seu celular pré-pago rapidamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Dados da Recarga */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="telefone">Número do Celular *</Label>
              <Input
                id="telefone"
                placeholder="(00) 00000-0000"
                value={telefone}
                onChange={(e) => setTelefone(formatPhone(e.target.value))}
                maxLength={15}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="operadora">Operadora *</Label>
              <Select value={operadora} onValueChange={setOperadora}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a operadora" />
                </SelectTrigger>
                <SelectContent>
                  {operadoras.map((op) => (
                    <SelectItem key={op} value={op}>
                      {op}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Valor da Recarga *</Label>
              <div className="grid grid-cols-4 gap-2">
                {valoresRecarga.map((v) => (
                  <Button
                    key={v}
                    type="button"
                    variant={valor === v.toString() ? "default" : "outline"}
                    onClick={() => setValor(v.toString())}
                    className="w-full"
                  >
                    R$ {v}
                  </Button>
                ))}
              </div>
              <Input
                placeholder="Outro valor"
                type="number"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label>Método de Pagamento</Label>
              <RadioGroup value={metodoPagamento} onValueChange={(v) => setMetodoPagamento(v as "saldo" | "cartao")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="saldo" id="rec-saldo" />
                  <Label htmlFor="rec-saldo" className="cursor-pointer">Usar Saldo da Conta</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cartao" id="rec-cartao" />
                  <Label htmlFor="rec-cartao" className="cursor-pointer">Cartão de Crédito</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Dados do Cartão */}
            {metodoPagamento === "cartao" && (
              <Card className="bg-muted/30">
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="numero-cartao">Número do Cartão *</Label>
                    <Input
                      id="numero-cartao"
                      placeholder="0000 0000 0000 0000"
                      value={numeroCartao}
                      onChange={(e) => setNumeroCartao(e.target.value)}
                      maxLength={19}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="validade">Validade *</Label>
                      <Input
                        id="validade"
                        placeholder="MM/AA"
                        value={validade}
                        onChange={(e) => setValidade(e.target.value)}
                        maxLength={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV *</Label>
                      <Input
                        id="cvv"
                        placeholder="000"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        maxLength={4}
                        type="password"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Resumo */}
          {telefone && operadora && valor && parseFloat(valor) > 0 && (
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <CardContent className="py-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Número:</span>
                    <span className="font-semibold">{telefone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Operadora:</span>
                    <span className="font-semibold">{operadora}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor:</span>
                    <span className="font-semibold text-blue-500">{formatCurrency(parseFloat(valor))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Método:</span>
                    <span className="font-semibold">{metodoPagamento === "saldo" ? "Saldo da Conta" : "Cartão de Crédito"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botão de Confirmação */}
          <Button 
            onClick={handleRecarregar} 
            disabled={loading || !telefone || !operadora || !valor}
            className="w-full gap-2"
            size="lg"
          >
            <Check className="h-4 w-4" />
            {loading ? "Processando..." : "Confirmar Recarga"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecargaModal;
