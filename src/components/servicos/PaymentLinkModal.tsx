import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link2, Copy, ExternalLink } from "lucide-react";

interface PaymentLinkModalProps {
  open: boolean;
  onClose: () => void;
}

const PaymentLinkModal = ({ open, onClose }: PaymentLinkModalProps) => {
  const [productName, setProductName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const { user } = useAuth();

  const handleCreateLink = async () => {
    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    if (!productName || !amount) {
      toast.error("Preencha o nome e o valor");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Valor inválido");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment-link', {
        body: {
          productName,
          amount: Math.round(amountNum * 100), // Converter para centavos
          description,
          quantity: parseInt(quantity) || 1,
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falha ao criar link");

      console.log("Link de pagamento criado:", data);
      setGeneratedLink(data.paymentLink);
      toast.success("Link de pagamento criado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao criar link:", error);
      toast.error(error.message || "Erro ao criar link de pagamento");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast.success("Link copiado!");
    }
  };

  const handleReset = () => {
    setProductName("");
    setAmount("");
    setDescription("");
    setQuantity("1");
    setGeneratedLink(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Link2 className="h-6 w-6 text-primary" />
            {generatedLink ? "Link Criado!" : "Criar Link de Pagamento"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {generatedLink 
              ? "Compartilhe este link para receber pagamentos"
              : "Crie um link de pagamento profissional para serviços ou produtos"
            }
          </DialogDescription>
        </DialogHeader>

        {!generatedLink ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Nome do Produto/Serviço *</Label>
              <Input
                id="product-name"
                placeholder="Ex: Desenvolvimento de Site, Aulas Particulares..."
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="bg-muted border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-muted border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="bg-muted border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Textarea
                id="description"
                placeholder="Descrição detalhada do que está sendo oferecido..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-muted border-border min-h-[80px]"
              />
            </div>

            {amount && parseFloat(amount) > 0 && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total a receber:</span>
                  <span className="font-bold text-primary text-lg">
                    {formatCurrency(parseFloat(amount) * parseInt(quantity || "1"))}
                  </span>
                </div>
              </div>
            )}

            <Button 
              onClick={handleCreateLink} 
              className="w-full" 
              disabled={isLoading || !productName || !amount}
            >
              {isLoading ? "Criando Link..." : "Criar Link de Pagamento"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              O link será criado via Stripe com métodos de pagamento: Cartão, Boleto e PIX
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 p-4 rounded-lg">
              <p className="text-sm font-medium text-foreground mb-2">
                ✅ Link criado com sucesso!
              </p>
              <p className="text-xs text-muted-foreground">
                Compartilhe este link para receber {formatCurrency(parseFloat(amount) * parseInt(quantity || "1"))}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Link de Pagamento</Label>
              <div className="flex gap-2">
                <Input
                  value={generatedLink}
                  readOnly
                  className="bg-muted border-border text-xs font-mono"
                />
                <Button onClick={handleCopyLink} size="sm" variant="outline">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => window.open(generatedLink, '_blank')}
                variant="outline"
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Link
              </Button>
              <Button 
                onClick={handleReset}
                className="flex-1"
              >
                Criar Novo Link
              </Button>
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Produto:</strong> {productName}<br />
                <strong>Valor:</strong> {formatCurrency(parseFloat(amount))}<br />
                <strong>Quantidade:</strong> {quantity}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentLinkModal;
