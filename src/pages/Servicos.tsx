import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Smartphone, Gift, ArrowRight } from "lucide-react";

const Servicos = () => {
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
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Serviços Financeiros</h2>
        <p className="text-muted-foreground">
          Acesso rápido aos seus serviços favoritos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {servicos.map((servico) => {
          const Icon = servico.icon;
          return (
            <Card key={servico.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className={`h-12 w-12 rounded-full bg-${servico.cor}/10 flex items-center justify-center mb-3`}>
                  <Icon className={`h-6 w-6 text-${servico.cor}`} />
                </div>
                <CardTitle>{servico.titulo}</CardTitle>
                <CardDescription>{servico.descricao}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full gap-2" variant="outline">
                  Acessar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
