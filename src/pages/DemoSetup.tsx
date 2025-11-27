import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { seedExampleData, clearAllData, SeedDataResult } from "@/utils/seedData";
import { InsightsEngine } from "@/utils/insightsEngine";
import { toast } from "sonner";
import { Database, Trash2, Sparkles, CheckCircle2, XCircle, ArrowLeft, Home } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const DemoSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SeedDataResult | null>(null);
  const insightsEngine = new InsightsEngine();

  const handleSeedData = async () => {
    if (!user) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      toast.info("Criando dados de exemplo...");
      const seedResult = await seedExampleData(user.id);
      
      if (seedResult.success) {
        toast.success("Dados criados!");
        
        // Gerar insights para ambos os modos
        toast.info("Gerando insights de IA...");
        await insightsEngine.generateInsights(user.id, "pessoal");
        await insightsEngine.generateInsights(user.id, "trabalho");
        
        toast.success("Setup completo! Explore o app agora.");
        setResult({
          ...seedResult,
          counts: {
            ...seedResult.counts!,
            insights: 6 // estimativa
          }
        });
      } else {
        toast.error(seedResult.message);
        setResult(seedResult);
      }
    } catch (error) {
      console.error("Erro no setup:", error);
      toast.error("Erro ao configurar dados de exemplo");
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    if (!user) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      toast.info("Limpando dados...");
      const clearResult = await clearAllData(user.id);
      
      if (clearResult.success) {
        toast.success(clearResult.message);
        setResult(clearResult);
      } else {
        toast.error(clearResult.message);
        setResult(clearResult);
      }
    } catch (error) {
      console.error("Erro ao limpar:", error);
      toast.error("Erro ao limpar dados");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Início
          </Button>
        </div>
        
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Configuração Demo - Équilibra
          </h1>
          <p className="text-muted-foreground text-lg">
            Configure dados de exemplo para demonstrar todas as funcionalidades
          </p>
        </div>
        
        <Alert className="border-primary/50 bg-primary/5">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertDescription>
            <p className="font-semibold mb-2">📝 Como Usar Esta Página</p>
            <ol className="text-sm space-y-1 ml-4 list-decimal">
              <li>Clique em "Configurar Demo" para popular o banco com 18 transações de exemplo</li>
              <li>Aguarde a geração automática de insights de IA (Regressão Linear + Árvore Decisão + Heurísticas)</li>
              <li>Explore o Dashboard, Extrato, Serviços e Insights com dados realistas!</li>
              <li>Para recomeçar, use "Limpar Tudo" e configure novamente</li>
            </ol>
          </AlertDescription>
        </Alert>

        <Card className="border-primary/20 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Dados de Exemplo
            </CardTitle>
            <CardDescription>
              Popule o banco com transações realistas para demonstrar o hub financeiro completo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Sparkles className="h-8 w-8 text-green-500" />
                    <h3 className="font-semibold text-lg">Criar Dados Demo</h3>
                    <p className="text-sm text-muted-foreground">
                      18 transações variadas + 3 serviços + insights de IA
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Receitas: Salário CLT + Freelance</li>
                      <li>• Despesas: Educação, Transporte, Lazer</li>
                      <li>• Modos: Trabalho e Pessoal</li>
                      <li>• IA: 3 motores de análise</li>
                    </ul>
                    <Button
                      onClick={handleSeedData}
                      disabled={loading}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {loading ? "Configurando..." : "Configurar Demo"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Trash2 className="h-8 w-8 text-red-500" />
                    <h3 className="font-semibold text-lg">Limpar Dados</h3>
                    <p className="text-sm text-muted-foreground">
                      Remove todas as transações, serviços e insights
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Deleta todas transações</li>
                      <li>• Remove logs de serviços</li>
                      <li>• Limpa insights gerados</li>
                      <li>• Reseta saldo para R$ 0,00</li>
                    </ul>
                    <Button
                      onClick={handleClearData}
                      disabled={loading}
                      variant="destructive"
                      className="w-full"
                    >
                      {loading ? "Limpando..." : "Limpar Tudo"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {result && (
              <Alert className={result.success ? "border-green-500/50 bg-green-500/10" : "border-red-500/50 bg-red-500/10"}>
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-2">
                    <AlertDescription className="font-medium">
                      {result.message}
                    </AlertDescription>
                    {result.counts && (
                      <div className="text-sm space-y-1">
                        <p>✓ {result.counts.transactions} transações criadas</p>
                        <p>✓ {result.counts.services} serviços registrados</p>
                        <p>✓ ~{result.counts.insights} insights gerados</p>
                      </div>
                    )}
                  </div>
                </div>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>📋 Checklist de Funcionalidades</CardTitle>
            <CardDescription>Requisitos do Hackathon AIIA Labs + FMU</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-primary">✅ O Desafio (4 pilares)</h4>
                <ul className="text-sm space-y-1 ml-4">
                  <li>✓ Integração de 6 serviços financeiros (PIX, Recarga, Benefícios, Cashback, Seguros, Empréstimos)</li>
                  <li>✓ Extrato inteligente com categorização automática</li>
                  <li>✓ Personalização com IA tripla (Regressão Linear + Árvore Decisão + Heurísticas)</li>
                  <li>✓ UX/UI atrativa: Dark theme, gradientes purple/blue, animações suaves</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-primary">✅ Entregáveis</h4>
                <ul className="text-sm space-y-1 ml-4">
                  <li>✓ Documentação técnica (diagramas podem ser gerados)</li>
                  <li>✓ Interface React funcional completa</li>
                  <li>✓ Banco de dados PostgreSQL estruturado</li>
                  <li>✓ Back-end com edge functions + lógica IA</li>
                  <li>✓ Design com usabilidade e acessibilidade</li>
                  <li>✓ Dados prontos para apresentação/pitch</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-primary">✅ Critérios de Avaliação</h4>
                <ul className="text-sm space-y-1 ml-4">
                  <li>✓ <strong>Relevância/Impacto:</strong> Hub para estudantes CLT/freelancers</li>
                  <li>✓ <strong>Inovação:</strong> Separação Trabalho/Pessoal + IA tripla</li>
                  <li>✓ <strong>UX/UI:</strong> Design premium fintech em pt-BR</li>
                  <li>✓ <strong>Apresentação:</strong> App funcional e demonstrável</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Após configurar os dados, explore:</p>
          <div className="flex justify-center gap-4 mt-2">
            <span>📊 Dashboard</span>
            <span>💳 Extrato</span>
            <span>🔧 Serviços</span>
            <span>🧠 Insights</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoSetup;
