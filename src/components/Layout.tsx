import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Wallet, 
  Home, 
  Briefcase, 
  Bell, 
  LogOut, 
  LayoutDashboard,
  Receipt,
  Lightbulb,
  CreditCard
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
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Équilibra</h1>
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

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => signOut()}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-border bg-card/30">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant="ghost"
                    className={`gap-2 rounded-none border-b-2 ${
                      isActive
                        ? "border-primary text-primary"
                        : "border-transparent"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
