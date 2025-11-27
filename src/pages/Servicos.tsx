import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CreditCard, Smartphone, Gift, ArrowRight, Coins, Shield, PiggyBank, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import CashbackModal from "@/components/servicos/CashbackModal";
import SegurosModal from "@/components/servicos/SegurosModal";
import EmprestimosModal from "@/components/servicos/EmprestimosModal";

const Servicos = () => {
  const [selectedServico, setSelectedServico] = useState<string | null>(null);
  const navigate = useNavigate();

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
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Serviços Financeiros</h2>
        <p className="text-muted-foreground">
          Acesso rápido aos seus serviços favoritos - 6 serviços integrados em um só lugar
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <p className="font-semibold mb-2">💡 Sobre os Serviços</p>
          <p className="text-sm">Esta é a central de serviços financeiros do Équilibra. Cada operação realizada aqui é registrada automaticamente no seu extrato e analisada pelos insights de IA. <strong>Cashback, Seguros e Empréstimos</strong> estão funcionais para demonstração. Os demais serão disponibilizados em breve.</p>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      <CashbackModal 
        open={selectedServico === "cashback"} 
        onClose={() => setSelectedServico(null)} 
      />
      <SegurosModal 
        open={selectedServico === "seguros"} 
        onClose={() => setSelectedServico(null)} 
      />
      <EmprestimosModal 
        open={selectedServico === "emprestimos"} 
        onClose={() => setSelectedServico(null)} 
      />

      {/* Modal genérico para serviços não implementados */}
      <Dialog open={selectedServico === "pix" || selectedServico === "recarga" || selectedServico === "beneficios"} onOpenChange={(open) => !open && setSelectedServico(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Serviço em Desenvolvimento</DialogTitle>
            <DialogDescription>
              Este serviço está em desenvolvimento e estará disponível em breve.
            </DialogDescription>
          </DialogHeader>
          <p className="text-muted-foreground">
            Por enquanto, experimente os serviços de <strong>Cashback</strong>, <strong>Seguros</strong> e <strong>Empréstimos</strong> que estão totalmente funcionais para demonstração!
          </p>
          <Button onClick={() => setSelectedServico(null)}>
            Entendido
          </Button>
        </DialogContent>
      </Dialog>

      {/* Histórico de Serviços */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico Recente</CardTitle>
          <CardDescription>Suas últimas operações de serviços</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Nenhuma operação realizada ainda.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Servicos;
