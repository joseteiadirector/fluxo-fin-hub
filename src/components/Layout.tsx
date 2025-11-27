import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Wallet, 
  Home, 
  Briefcase, 
  Bell, 
  LogOut, 
  LayoutDashboard,
  Receipt,
  Lightbulb,
  CreditCard,
  HelpCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
  modoTrabalho: boolean;
  setModoTrabalho: (modo: boolean) => void;
}

const Layout = ({ children, modoTrabalho, setModoTrabalho }: LayoutProps) => {
  const { signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/extrato", icon: Receipt, label: "Extrato" },
    { path: "/servicos", icon: CreditCard, label: "Serviços" },
    { path: "/insights", icon: Lightbulb, label: "Insights" },
    { path: "/metas", icon: HelpCircle, label: "Metas" },
    { path: "/ofertas", icon: HelpCircle, label: "Ofertas" },
    { path: "/preferencias", icon: HelpCircle, label: "Config" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <h1 className="text-lg sm:text-xl font-bold">Équilibra</h1>
            </div>
            
            {/* Toggle Trabalho/Pessoal */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 sm:gap-3 bg-muted/50 rounded-full px-2 sm:px-4 py-1.5 sm:py-2 cursor-help">
                    <div className={`hidden sm:flex items-center gap-2 transition-opacity ${!modoTrabalho ? 'opacity-50' : ''}`}>
                      <Home className="h-4 w-4" />
                      <span className="text-sm font-medium">Pessoal</span>
                    </div>
                    <Home className={`sm:hidden h-4 w-4 ${!modoTrabalho ? 'opacity-50' : ''}`} />
                    <Switch 
                      checked={modoTrabalho} 
                      onCheckedChange={setModoTrabalho}
                      className="data-[state=checked]:bg-primary scale-75 sm:scale-100"
                    />
                    <div className={`hidden sm:flex items-center gap-2 transition-opacity ${modoTrabalho ? 'opacity-50' : ''}`}>
                      <Briefcase className="h-4 w-4" />
                      <span className="text-sm font-medium">Trabalho</span>
                    </div>
                    <Briefcase className={`sm:hidden h-4 w-4 ${modoTrabalho ? 'opacity-50' : ''}`} />
                    <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground ml-0.5 sm:ml-1" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-semibold mb-1">Modo Pessoal vs Trabalho</p>
                  <p className="text-sm">Separe suas finanças pessoais (despesas do dia a dia) das profissionais (gastos de trabalho/freelance). O app filtra transações, insights e relatórios automaticamente!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex items-center gap-1 sm:gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                      <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Notificações</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => signOut()} className="h-8 w-8 sm:h-10 sm:w-10">
                      <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Sair</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-border bg-card/30 overflow-x-auto">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex gap-0.5 sm:gap-1 min-w-max">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-1 sm:gap-2 rounded-none border-b-2 text-xs sm:text-sm px-2 sm:px-4 ${
                      isActive
                        ? "border-primary text-primary"
                        : "border-transparent"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
