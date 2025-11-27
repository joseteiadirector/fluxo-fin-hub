import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Smartphone, Gift, ArrowRight, Coins, Shield, PiggyBank, ArrowLeft, Link2, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import PixModal from "@/components/servicos/PixModal";
import RecargaModal from "@/components/servicos/RecargaModal";
import BeneficiosModal from "@/components/servicos/BeneficiosModal";
import CashbackModal from "@/components/servicos/CashbackModal";
import SegurosModal from "@/components/servicos/SegurosModal";
import EmprestimosModal from "@/components/servicos/EmprestimosModal";
import PaymentLinkModal from "@/components/servicos/PaymentLinkModal";

interface ServiceLog {
  id: string;
  criado_em: string;
  tipo_servico: string;
  valor: number;
  detalhes: any;
}

const Servicos = () => {
  const [selectedServico, setSelectedServico] = useState<string | null>(null);
  const [historico, setHistorico] = useState<ServiceLog[]>([]);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchHistorico();
    }
  }, [user]);

  const fetchHistorico = async () => {
    const { data, error } = await supabase
      .from("services_logs")
      .select("*")
      .eq("user_id", user?.id)
      .order("criado_em", { ascending: false })
      .limit(10);

    if (!error && data) {
      setHistorico(data as ServiceLog[]);
    }
  };

  const handleServicoSuccess = () => {
    fetchHistorico(); // Atualizar histórico após operação
  };

  const clearHistorico = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("services_logs")
        .delete()
        .eq("user_id", user?.id);

      if (error) throw error;

      toast.success("Histórico limpo com sucesso!");
      setHistorico([]);
    } catch (error) {
      console.error("Erro ao limpar histórico:", error);
      toast.error("Erro ao limpar histórico");
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const getServiceIcon = (tipo: string) => {
    switch (tipo) {
      case "PIX": return <CreditCard className="h-4 w-4" />;
      case "Recarga": return <Smartphone className="h-4 w-4" />;
      case "Beneficios": return <Gift className="h-4 w-4" />;
      case "Cashback": return <Coins className="h-4 w-4" />;
      case "Seguros": return <Shield className="h-4 w-4" />;
      case "Emprestimo": return <PiggyBank className="h-4 w-4" />;
      case "PaymentLink": return <Link2 className="h-4 w-4" />;
      default: return <ArrowRight className="h-4 w-4" />;
    }
  };

  const servicos = [
    {
      id: "pix",
      titulo: "PIX",
      descricao: "Transferências instantâneas",
      icon: CreditCard,
      cor: "primary"
    },
    {
      id: "recarga",
      titulo: "Recarga de Celular",
      descricao: "Recarregue seu celular pré-pago",
      icon: Smartphone,
      cor: "blue-500"
    },
    {
      id: "beneficios",
      titulo: "Benefícios",
      descricao: "Gerencie VR, VA e VT",
      icon: Gift,
      cor: "green-500"
    },
    {
      id: "cashback",
      titulo: "Cashback",
      descricao: "Retorno em dinheiro de compras",
      icon: Coins,
      cor: "amber-500"
    },
    {
      id: "seguros",
      titulo: "Seguros",
      descricao: "Proteção e segurança",
      icon: Shield,
      cor: "purple-500"
    },
    {
      id: "emprestimos",
      titulo: "Empréstimos",
      descricao: "Crédito pessoal simulado",
      icon: PiggyBank,
      cor: "pink-500"
    },
    {
      id: "payment-link",
      titulo: "Link de Pagamento",
      descricao: "Crie links para receber pagamentos",
      icon: Link2,
      cor: "cyan-500"
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Serviços Financeiros</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Acesso rápido aos seus serviços favoritos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {servicos.map((servico) => {
          const Icon = servico.icon;
          return (
            <Card key={servico.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedServico(servico.id)}>
              <CardHeader>
                <div className={`h-12 w-12 rounded-full bg-${servico.cor}/10 flex items-center justify-center mb-3`}>
                  <Icon className={`h-6 w-6 text-${servico.cor}`} />
                </div>
                <CardTitle>{servico.titulo}</CardTitle>
                <CardDescription>{servico.descricao}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full gap-2" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedServico(servico.id); }}>
                  Acessar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modais dos Serviços */}
      <PixModal 
        open={selectedServico === "pix"} 
        onClose={() => { setSelectedServico(null); handleServicoSuccess(); }} 
      />
      <RecargaModal 
        open={selectedServico === "recarga"} 
        onClose={() => { setSelectedServico(null); handleServicoSuccess(); }} 
      />
      <BeneficiosModal 
        open={selectedServico === "beneficios"} 
        onClose={() => { setSelectedServico(null); handleServicoSuccess(); }} 
      />
      <CashbackModal 
        open={selectedServico === "cashback"} 
        onClose={() => { setSelectedServico(null); handleServicoSuccess(); }} 
      />
      <SegurosModal 
        open={selectedServico === "seguros"} 
        onClose={() => { setSelectedServico(null); handleServicoSuccess(); }} 
      />
      <EmprestimosModal 
        open={selectedServico === "emprestimos"} 
        onClose={() => { setSelectedServico(null); handleServicoSuccess(); }} 
      />
      <PaymentLinkModal 
        open={selectedServico === "payment-link"} 
        onClose={() => { setSelectedServico(null); handleServicoSuccess(); }} 
      />

      {/* Histórico de Serviços */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Histórico Recente</CardTitle>
              <CardDescription>Suas últimas operações de serviços</CardDescription>
            </div>
            {historico.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={deleting}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleting ? "Limpando..." : "Limpar Histórico"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Limpar histórico de serviços?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isso irá remover permanentemente todo o histórico de operações de serviços (PIX, Recarga, Benefícios, etc.).
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={clearHistorico}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Sim, limpar histórico
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {historico.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma operação realizada ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {historico.map((log) => (
                <Card key={log.id} className="border-muted">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {getServiceIcon(log.tipo_servico)}
                        </div>
                        <div>
                          <p className="font-medium">{log.tipo_servico}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(log.criado_em), "d 'de' MMM 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-primary border-primary">
                        {formatCurrency(log.valor)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Servicos;
