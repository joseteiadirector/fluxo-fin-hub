import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface PixModalProps {
  open: boolean;
  onClose: () => void;
}

const PixModal = ({ open, onClose }: PixModalProps) => {
  const [chave, setChave] = useState("");
  const [valor, setValor] = useState("");
  const [metodoPagamento, setMetodoPagamento] = useState<"saldo" | "cartao">("saldo");
  const [numeroCartao, setNumeroCartao] = useState("");
  const [cvv, setCvv] = useState("");
  const [validade, setValidade] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleTransferir = async () => {
    if (!chave || !valor) {
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

    // Criar transação de saída (PIX enviado)
    const { error: transError } = await supabase
      .from("transactions")
      .insert({
        user_id: user?.id,
        account_id: account.id,
        descricao: `PIX para ${chave} ${metodoPagamento === "cartao" ? "(via Cartão)" : ""}`,
        valor: valorNum,
        tipo: "saida",
        categoria: "Transferência",
        modo: "pessoal"
      });

    if (transError) {
      toast.error("Erro ao realizar transferência");
      setLoading(false);
      return;
    }

    // Registrar em services_logs
    await supabase
      .from("services_logs")
      .insert({
        user_id: user?.id,
        tipo_servico: "PIX",
        detalhes: {
          chave_destino: chave,
          valor: valorNum,
          metodo_pagamento: metodoPagamento,
          data: new Date().toISOString()
        },
        valor: valorNum
      });

    toast.success("Transferência PIX realizada com sucesso!", {
      description: `R$ ${valorNum.toFixed(2)} transferido para ${chave}`
    });

    setLoading(false);
    setChave("");
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            PIX - Transferência Instantânea
          </DialogTitle>
          <DialogDescription>
            Transfira dinheiro de forma rápida e segura usando chave PIX
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Dados da Transferência */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chave">Chave PIX Destino *</Label>
              <Input
                id="chave"
                placeholder="CPF, e-mail, telefone ou chave aleatória"
                value={chave}
                onChange={(e) => setChave(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
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
              <Label>Método de Pagamento</Label>
              <RadioGroup value={metodoPagamento} onValueChange={(v) => setMetodoPagamento(v as "saldo" | "cartao")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="saldo" id="pix-saldo" />
                  <Label htmlFor="pix-saldo" className="cursor-pointer">Usar Saldo da Conta</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cartao" id="pix-cartao" />
                  <Label htmlFor="pix-cartao" className="cursor-pointer">Cartão de Crédito</Label>
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
          {valor && parseFloat(valor) > 0 && (
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="py-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Destinatário:</span>
                    <span className="font-semibold">{chave || "---"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor:</span>
                    <span className="font-semibold text-primary">{formatCurrency(parseFloat(valor))}</span>
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
            onClick={handleTransferir} 
            disabled={loading || !chave || !valor}
            className="w-full gap-2"
            size="lg"
          >
            <Check className="h-4 w-4" />
            {loading ? "Processando..." : "Confirmar Transferência"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PixModal;
