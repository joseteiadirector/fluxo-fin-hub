import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, ArrowLeft } from "lucide-react";

interface PixModalProps {
  open: boolean;
  onClose: () => void;
}

const PixModal = ({ open, onClose }: PixModalProps) => {
  const [chavePix, setChavePix] = useState("");
  const [valor, setValor] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const [pixPaymentData, setPixPaymentData] = useState<{
    pixCode: string;
    qrCodeUrl: string;
    expiresAt: number;
    hostedInstructionsUrl: string;
  } | null>(null);

  const handleTransferir = async () => {
    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    if (!chavePix || !valor) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    const valorNumerico = parseFloat(valor);
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      toast.error("Valor inválido");
      return;
    }

    setIsLoading(true);

    try {
      // Chamar edge function para criar pagamento PIX via Stripe
      const { data, error } = await supabase.functions.invoke('create-pix-payment', {
        body: {
          amount: Math.round(valorNumerico * 100), // Converter para centavos
          pixKey: chavePix,
          description: `Transferência PIX para ${chavePix}`
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falha ao criar pagamento PIX");

      console.log("Pagamento PIX criado:", data);

      // Armazenar dados do PIX para mostrar QR Code
      setPixPaymentData({
        pixCode: data.pixCode,
        qrCodeUrl: data.qrCodeUrl,
        expiresAt: data.expiresAt,
        hostedInstructionsUrl: data.hostedInstructionsUrl
      });

      toast.success("QR Code PIX gerado! Escaneie para pagar");
    } catch (error: any) {
      console.error("Erro ao criar transferência PIX:", error);
      toast.error(error.message || "Erro ao processar transferência PIX");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPixCode = () => {
    if (pixPaymentData?.pixCode) {
      navigator.clipboard.writeText(pixPaymentData.pixCode);
      toast.success("Código PIX copiado!");
    }
  };

  const handleReset = () => {
    setChavePix("");
    setValor("");
    setPixPaymentData(null);
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
      <DialogContent className="sm:max-w-[500px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            {pixPaymentData ? "QR Code PIX Gerado" : "Transferência PIX"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {pixPaymentData ? "Escaneie o QR Code ou copie o código PIX" : "Realize transferências instantâneas via PIX"}
          </DialogDescription>
        </DialogHeader>

        {!pixPaymentData ? (
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Chave PIX
              </label>
              <Input
                placeholder="E-mail, CPF, CNPJ, telefone ou chave aleatória"
                value={chavePix}
                onChange={(e) => setChavePix(e.target.value)}
                className="bg-muted border-border"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Valor (R$)
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="bg-muted border-border"
              />
            </div>

            {valor && parseFloat(valor) > 0 && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor da transferência:</span>
                  <span className="font-medium text-foreground">{formatCurrency(parseFloat(valor))}</span>
                </div>
              </div>
            )}

            <Button 
              onClick={handleTransferir} 
              className="w-full" 
              disabled={isLoading || !chavePix || !valor || parseFloat(valor) <= 0}
            >
              {isLoading ? "Gerando PIX..." : "Gerar QR Code PIX"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg">
                <img 
                  src={pixPaymentData.qrCodeUrl} 
                  alt="QR Code PIX" 
                  className="w-64 h-64"
                />
              </div>

              <div className="w-full bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium text-foreground">Código PIX (Copiar e Colar):</p>
                <div className="flex gap-2">
                  <Input
                    value={pixPaymentData.pixCode}
                    readOnly
                    className="bg-background border-border text-xs font-mono"
                  />
                  <Button onClick={handleCopyPixCode} size="sm" variant="outline">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground space-y-1">
                <p>Escaneie o QR Code ou copie o código PIX no seu banco</p>
                <p className="font-medium">Expira em: {new Date(pixPaymentData.expiresAt * 1000).toLocaleString('pt-BR')}</p>
              </div>

              <div className="flex gap-2 w-full">
                <Button 
                  onClick={() => window.open(pixPaymentData.hostedInstructionsUrl, '_blank')}
                  variant="outline"
                  className="flex-1"
                >
                  Ver Instruções
                </Button>
                <Button 
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Nova Transferência
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PixModal;
