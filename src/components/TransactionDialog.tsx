import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface TransactionDialogProps {
  open: boolean;
  onClose: () => void;
  modoTrabalho: boolean;
  onSuccess: () => void;
}

const TransactionDialog = ({ open, onClose, modoTrabalho, onSuccess }: TransactionDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    tipo: "saida",
    categoria: "",
    data: new Date().toISOString().split("T")[0],
  });

  const categorias = [
    "Alimentação",
    "Transporte",
    "Moradia",
    "Utilidades",
    "Saúde",
    "Educação",
    "Lazer",
    "Vestuário",
    "Tecnologia",
    "Salário",
    "Freelance",
    "Investimento",
    "Outros"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    if (!formData.descricao || !formData.valor || !formData.categoria) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);

    try {
      // Obter ou criar conta
      let { data: accounts } = await supabase
        .from("accounts")
        .select("id, saldo_atual")
        .eq("user_id", user.id)
        .limit(1);

      // Se não existe conta, criar uma
      if (!accounts || accounts.length === 0) {
        const { data: newAccount, error: accountError } = await supabase
          .from("accounts")
          .insert({
            user_id: user.id,
            nome_da_conta: "Conta Principal",
            tipo_conta: "principal",
            saldo_atual: 0
          })
          .select()
          .single();

        if (accountError || !newAccount) {
          console.error("Erro ao criar conta:", accountError);
          toast.error("Erro ao criar conta. Tente fazer logout e login novamente.");
          return;
        }
        accounts = [newAccount];
      }

      const accountId = accounts[0].id;
      const valor = parseFloat(formData.valor);

      // Inserir transação
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          account_id: accountId,
          descricao: formData.descricao,
          valor: valor,
          tipo: formData.tipo,
          categoria: formData.categoria,
          modo: modoTrabalho ? "trabalho" : "pessoal",
          data: new Date(formData.data).toISOString()
        });

      if (transactionError) throw transactionError;

      // Atualizar saldo
      const novoSaldo = formData.tipo === "entrada"
        ? accounts[0].saldo_atual + valor
        : accounts[0].saldo_atual - valor;

      await supabase
        .from("accounts")
        .update({ saldo_atual: novoSaldo })
        .eq("id", accountId);

      toast.success("Transação adicionada com sucesso!");
      
      // Resetar formulário
      setFormData({
        descricao: "",
        valor: "",
        tipo: "saida",
        categoria: "",
        data: new Date().toISOString().split('T')[0]
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao adicionar transação:", error);
      toast.error("Erro ao adicionar transação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
          <DialogDescription>
            Adicione uma nova transação em modo {modoTrabalho ? "Trabalho" : "Pessoal"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo *</Label>
            <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Receita</SelectItem>
                <SelectItem value="saida">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Ex: Almoço, Salário, Uber"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor (R$) *</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria *</Label>
            <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">Data *</Label>
            <Input
              id="data"
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDialog;
