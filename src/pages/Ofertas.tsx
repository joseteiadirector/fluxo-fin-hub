import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Percent, CreditCard, TrendingUp, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import SimpleLayout from "@/components/SimpleLayout";

interface Oferta {
  id: string;
  tipo_oferta: string;
  titulo: string;
  descricao: string;
  detalhes: any;
  validade: string;
  ativa: boolean;
  criado_em: string;
}

export default function Ofertas() {
  const { user } = useAuth();
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOfertas();
      gerarOfertasPersonalizadas();
    }
  }, [user]);

  const fetchOfertas = async () => {
    try {
      const { data, error } = await supabase
        .from("ofertas")
        .select("*")
        .eq("user_id", user?.id)
        .eq("ativa", true)
        .order("criado_em", { ascending: false });

      if (error) throw error;
      setOfertas(data || []);
    } catch (error) {
      console.error("Erro ao buscar ofertas:", error);
    } finally {
      setLoading(false);
    }
  };

  const gerarOfertasPersonalizadas = async () => {
    try {
      // Buscar transações do último mês
      const umMesAtras = new Date();
      umMesAtras.setMonth(umMesAtras.getMonth() - 1);

      const { data: transacoes, error } = await supabase
        .from("transactions")
        .select("categoria, tipo, valor")
        .eq("user_id", user?.id)
        .gte("data", umMesAtras.toISOString());

      if (error) throw error;

      // Analisar padrões de gastos
      const gastosPorCategoria: Record<string, number> = {};
      transacoes?.forEach((t: any) => {
        if (t.tipo === "saida") {
          gastosPorCategoria[t.categoria] = (gastosPorCategoria[t.categoria] || 0) + parseFloat(t.valor);
        }
      });

      // Gerar ofertas baseadas nos padrões
      const novasOfertas = [];

      // Oferta de cashback para categoria mais gasta
      const categoriaMaisGasta = Object.keys(gastosPorCategoria).length > 0 
        ? Object.keys(gastosPorCategoria).reduce((a, b) => 
            gastosPorCategoria[a] > gastosPorCategoria[b] ? a : b
          ) 
        : "";

      if (categoriaMaisGasta) {
        novasOfertas.push({
          user_id: user?.id,
          tipo_oferta: "cashback",
          titulo: `Cashback Especial em ${categoriaMaisGasta}`,
          descricao: `Ganhe 5% de cashback em todas as compras de ${categoriaMaisGasta} durante este mês!`,
          detalhes: {
            categoria: categoriaMaisGasta,
            percentual: 5,
            tipo: "category_boost"
          },
          validade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      // Oferta de empréstimo com juros reduzidos
      const totalGastos = Object.values(gastosPorCategoria).reduce((a: any, b: any) => a + b, 0);
      if (totalGastos > 500) {
        novasOfertas.push({
          user_id: user?.id,
          tipo_oferta: "emprestimo",
          titulo: "Empréstimo com Taxa Especial",
          descricao: "Taxa de juros reduzida de 1.5% ao mês para bons pagadores. Até R$ 5.000 aprovados na hora!",
          detalhes: {
            taxa_juros: 1.5,
            valor_max: 5000,
            parcelas_max: 12
          },
          validade: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      // Oferta de desconto em seguros
      if (gastosPorCategoria["Transporte"] > 200) {
        novasOfertas.push({
          user_id: user?.id,
          tipo_oferta: "seguro",
          titulo: "Seguro Auto com Desconto",
          descricao: "20% de desconto no primeiro mês do seguro automotivo. Proteção completa para seu veículo!",
          detalhes: {
            desconto_percentual: 20,
            tipo_seguro: "auto",
            cobertura: "completa"
          },
          validade: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      // Inserir ofertas apenas se não existirem similares ativas
      for (const oferta of novasOfertas) {
        const { data: existente } = await supabase
          .from("ofertas")
          .select("id")
          .eq("user_id", user?.id)
          .eq("tipo_oferta", oferta.tipo_oferta)
          .eq("ativa", true)
          .single();

        if (!existente) {
          await supabase.from("ofertas").insert(oferta);
        }
      }

    } catch (error) {
      console.error("Erro ao gerar ofertas:", error);
    }
  };

  const desativarOferta = async (id: string) => {
    try {
      const { error } = await supabase
        .from("ofertas")
        .update({ ativa: false })
        .eq("id", id);

      if (error) throw error;

      toast.success("Oferta removida");
      fetchOfertas();
    } catch (error) {
      console.error("Erro ao desativar oferta:", error);
      toast.error("Erro ao remover oferta");
    }
  };

  const getIconByType = (tipo: string) => {
    switch (tipo) {
      case "cashback": return <Percent className="w-6 h-6" />;
      case "emprestimo": return <CreditCard className="w-6 h-6" />;
      case "seguro": return <TrendingUp className="w-6 h-6" />;
      default: return <Gift className="w-6 h-6" />;
    }
  };

  const getColorByType = (tipo: string) => {
    switch (tipo) {
      case "cashback": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "emprestimo": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "seguro": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      default: return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <SimpleLayout>
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-8 h-8" />
            Ofertas Personalizadas
          </h1>
          <p className="text-muted-foreground mt-1">
            Recomendações exclusivas baseadas no seu perfil financeiro
          </p>
        </div>

        {/* Lista de Ofertas */}
        {loading ? (
          <div className="text-center py-12">Carregando ofertas...</div>
        ) : ofertas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Gift className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhuma oferta disponível no momento.
                <br />
                Continue usando o app para receber recomendações personalizadas!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {ofertas.map((oferta) => (
              <Card key={oferta.id} className="border-2 hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <div className={`p-3 rounded-lg border-2 ${getColorByType(oferta.tipo_oferta)}`}>
                      {getIconByType(oferta.tipo_oferta)}
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="w-3 h-3" />
                      Válido até {formatDate(oferta.validade)}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{oferta.titulo}</CardTitle>
                  <CardDescription className="text-base">
                    {oferta.descricao}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Detalhes específicos */}
                  {oferta.tipo_oferta === "cashback" && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-sm">
                        <strong>Categoria:</strong> {oferta.detalhes.categoria}
                        <br />
                        <strong>Cashback:</strong> {oferta.detalhes.percentual}%
                      </p>
                    </div>
                  )}
                  
                  {oferta.tipo_oferta === "emprestimo" && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-sm">
                        <strong>Taxa:</strong> {oferta.detalhes.taxa_juros}% ao mês
                        <br />
                        <strong>Valor máximo:</strong> R$ {oferta.detalhes.valor_max.toLocaleString('pt-BR')}
                        <br />
                        <strong>Parcelas:</strong> Até {oferta.detalhes.parcelas_max}x
                      </p>
                    </div>
                  )}
                  
                  {oferta.tipo_oferta === "seguro" && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-sm">
                        <strong>Desconto:</strong> {oferta.detalhes.desconto_percentual}% no 1º mês
                        <br />
                        <strong>Tipo:</strong> {oferta.detalhes.tipo_seguro}
                        <br />
                        <strong>Cobertura:</strong> {oferta.detalhes.cobertura}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button className="flex-1">
                      Aproveitar Oferta
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => desativarOferta(oferta.id)}
                    >
                      Dispensar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SimpleLayout>
  );
}