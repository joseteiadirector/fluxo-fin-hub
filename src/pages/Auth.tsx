import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, X } from "lucide-react";
import { toast } from "sonner";
import backgroundImage from "@/assets/auth-background.jpg";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);
    
    if (error) {
      toast.error("Erro ao entrar", {
        description: error.message
      });
    } else {
      toast.success("Login realizado com sucesso!");
      navigate("/");
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!nomeCompleto.trim()) {
      toast.error("Nome completo é obrigatório");
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password, nomeCompleto);
    
    if (error) {
      toast.error("Erro ao cadastrar", {
        description: error.message
      });
    } else {
      toast.success("Cadastro realizado com sucesso!", {
        description: "Você já pode fazer login."
      });
      navigate("/");
    }
    
    setLoading(false);
  };

  return (
    <div 
      className="min-h-screen flex flex-col justify-between p-4 sm:p-8 lg:p-16 relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Título no TOPO */}
      <div className="flex items-center gap-2 sm:gap-3 justify-center z-10 pt-4 sm:pt-8">
        <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center">
          <Wallet className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
        </div>
        <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold text-white drop-shadow-lg">Équilibra</h1>
      </div>

      {/* Slogan e botões na PARTE DE BAIXO */}
      <div className="flex flex-col items-center justify-center text-center gap-2 sm:gap-3 z-10 pb-8 sm:pb-12 lg:pb-16 px-4">
        <p className="text-lg sm:text-xl lg:text-2xl text-white font-medium drop-shadow-md">
          Seu assistente financeiro universitário
        </p>
        <p className="text-sm sm:text-base lg:text-lg text-white/90 drop-shadow-md max-w-xl">
          Equilibrando trabalho, estudo e vida. Gerencie suas finanças com inteligência.
        </p>

        {!showForm && (
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 w-full sm:w-auto px-4 sm:px-0">
            <Button 
              size="lg" 
              onClick={() => { setShowForm(true); setIsSignUp(false); }}
              className="text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto"
            >
              Entrar
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => { setShowForm(true); setIsSignUp(true); }}
              className="text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20"
            >
              Cadastrar
            </Button>
          </div>
        )}
      </div>

      {/* Formulário sobreposto quando aberto */}
      {showForm && (
        <Card className="w-full max-w-md mx-4 sm:mx-0 sm:absolute sm:right-8 lg:right-16 top-1/2 sm:transform sm:-translate-y-1/2 bg-background shadow-2xl animate-enter">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl sm:text-2xl">{isSignUp ? "Criar Conta" : "Entrar"}</CardTitle>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowForm(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <CardDescription>
              {isSignUp ? "Crie sua conta no Équilibra" : "Acesse sua conta"}
            </CardDescription>
          </CardHeader>
        <CardContent>
          {isSignUp ? (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome-cadastro">Nome Completo</Label>
                <Input
                  id="nome-cadastro"
                  type="text"
                  placeholder="Seu nome completo"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-cadastro">Email</Label>
                <Input
                  id="email-cadastro"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-cadastro">Senha</Label>
                <Input
                  id="password-cadastro"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Cadastrando..." : "Criar Conta"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Já tem conta?{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="text-primary hover:underline"
                >
                  Entrar
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-login">Email</Label>
                  <Input
                    id="email-login"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-login">Senha</Label>
                  <Input
                    id="password-login"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Não tem conta?{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="text-primary hover:underline"
                >
                  Cadastrar
                </button>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
};

export default Auth;
