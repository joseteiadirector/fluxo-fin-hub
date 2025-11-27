import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Shield, Smartphone, Heart, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SegurosModalProps {
  open: boolean;
  onClose: () => void;
}

const segurosDisponiveis = [
  {
    id: "celular",
    nome: "Seguro de Celular",
    descricao: "Proteção contra roubo, furto e danos acidentais",
    valor: 29.90,
    icon: Smartphone,
    cobertura: "Até R$ 5.000"
  },
  {
    id: "vida",
    nome: "Seguro de Vida Básico",
    descricao: "Proteção para você e sua família",
    valor: 49.90,
    icon: Heart,
    cobertura: "Até R$ 50.000"
  },
  {
    id: "residencia",
    nome: "Seguro Residencial",
    descricao: "Proteção completa para seu lar",
    valor: 89.90,
    icon: Home,
    cobertura: "Até R$ 200.000"
  }
];

const SegurosModal = ({ open, onClose }: SegurosModalProps) => {
  const [seguroSelecionado, setSeguroSelecionado] = useState<string>("");
  const [modo, setModo] = useState<"trabalho" | "pessoal">("pessoal");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleContratacao = async () => {
    if (!seguroSelecionado) {
      toast.error("Selecione um seguro");
      return;
    }

    setLoading(true);

    const seguro = segurosDisponiveis.find(s => s.id === seguroSelecionado);
    if (!seguro) return;

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

    // Criar transação de saída
    const { error: transError } = await supabase
      .from("transactions")
      .insert({
        user_id: user?.id,
        account_id: account.id,
        descricao: `Contratação: ${seguro.nome}`,
        valor: seguro.valor,
        tipo: "saida",
        categoria: "seguros",
        modo: modo
      });

    if (transError) {
      toast.error("Erro ao contratar seguro");
      setLoading(false);
      return;
    }

    // Registrar em services_logs
    await supabase
      .from("services_logs")
      .insert({
        user_id: user?.id,
        tipo_servico: "Seguro",
        detalhes: {
          seguro: seguro.nome,
          valor_mensal: seguro.valor,
          cobertura: seguro.cobertura,
          modo: modo,
          data_contratacao: new Date().toISOString()
        },
        valor: seguro.valor
      });

    // Gerar insight de proteção
    await supabase
      .from("insights")
      .insert({
        user_id: user?.id,
        titulo: "Proteção Contratada",
        mensagem: `Você contratou o ${seguro.nome} com cobertura de ${seguro.cobertura}. Sua segurança aumentou!`,
        tipo: "oportunidade",
        origem: "heuristica",
        prioridade: 2
      });

    toast.success("Seguro contratado com sucesso!", {
      description: `${seguro.nome} - R$ ${seguro.valor.toFixed(2)}/mês`
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
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-500" />
            Seguros
          </DialogTitle>
          <DialogDescription>
            Proteja o que é importante para você com nossos seguros simulados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lista de Seguros */}
          <div className="space-y-4">
            <h3 className="font-semibold">Escolha um Seguro</h3>
            <RadioGroup value={seguroSelecionado} onValueChange={setSeguroSelecionado}>
              {segurosDisponiveis.map((seguro) => {
                const Icon = seguro.icon;
                return (
                  <Card 
                    key={seguro.id} 
                    className={`cursor-pointer transition-colors ${
                      seguroSelecionado === seguro.id ? "border-purple-500 bg-purple-500/5" : ""
                    }`}
                    onClick={() => setSeguroSelecionado(seguro.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-purple-500" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-base">{seguro.nome}</CardTitle>
                            <CardDescription className="mt-1">{seguro.descricao}</CardDescription>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">Cobertura: {seguro.cobertura}</Badge>
                              <Badge variant="secondary">{formatCurrency(seguro.valor)}/mês</Badge>
                            </div>
                          </div>
                        </div>
                        <RadioGroupItem value={seguro.id} />
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </RadioGroup>
          </div>

          {/* Modo */}
          {seguroSelecionado && (
            <div className="space-y-2">
              <Label>Modo de Pagamento</Label>
              <RadioGroup value={modo} onValueChange={(v) => setModo(v as "trabalho" | "pessoal")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pessoal" id="pessoal" />
                  <Label htmlFor="pessoal" className="cursor-pointer">Pessoal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="trabalho" id="trabalho" />
                  <Label htmlFor="trabalho" className="cursor-pointer">Trabalho</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Botão de Contratação */}
          <Button 
            onClick={handleContratacao} 
            disabled={loading || !seguroSelecionado}
            className="w-full"
            size="lg"
          >
            {loading ? "Contratando..." : "Simular Contratação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SegurosModal;
