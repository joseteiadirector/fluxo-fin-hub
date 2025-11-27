import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TrendingUp, TrendingDown, Briefcase, Home, Wallet, CreditCard, Bell } from "lucide-react";

const Index = () => {
  const [modoTrabalho, setModoTrabalho] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      {/* Header com Toggle */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Workflow</h1>
            </div>
            
            {/* Toggle Trabalho/Pessoal */}
            <div className="flex items-center gap-3 bg-muted/50 rounded-full px-4 py-2">
              <div className={`flex items-center gap-2 transition-opacity ${!modoTrabalho ? 'opacity-50' : ''}`}>
                <Home className="h-4 w-4" />
                <span className="text-sm font-medium">Pessoal</span>
              </div>
              <Switch 
                checked={modoTrabalho} 
                onCheckedChange={setModoTrabalho}
                className="data-[state=checked]:bg-primary"
              />
              <div className={`flex items-center gap-2 transition-opacity ${modoTrabalho ? 'opacity-50' : ''}`}>
                <Briefcase className="h-4 w-4" />
                <span className="text-sm font-medium">Trabalho</span>
              </div>
            </div>

            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Dashboard */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-1">
            {modoTrabalho ? "Dashboard - Trabalho" : "Dashboard - Pessoal"}
          </h2>
          <p className="text-muted-foreground">
            Bem-vindo ao seu assistente financeiro inteligente
          </p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Saldo Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">R$ 2.450,00</div>
              <p className="text-xs text-muted-foreground mt-1">
                Atualizado agora
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Previsão do Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">R$ 1.890,00</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <p className="text-xs text-blue-500">Projeção positiva</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Gastos no Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">R$ 1.320,00</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingDown className="h-4 w-4 text-amber-500" />
                <p className="text-xs text-amber-500">54% do orçamento</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Serviços Rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">PIX</h3>
                  <p className="text-sm text-muted-foreground">Transferir agora</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Recarga</h3>
                  <p className="text-sm text-muted-foreground">Celular pré-pago</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Benefícios</h3>
                  <p className="text-sm text-muted-foreground">VR/VA/VT</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
