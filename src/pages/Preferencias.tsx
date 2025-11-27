import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, User, Bell, Shield } from "lucide-react";
import { toast } from "sonner";
import SimpleLayout from "@/components/SimpleLayout";

interface Preferences {
  notificacoes_insights: boolean;
  notificacoes_metas: boolean;
  notificacoes_ofertas: boolean;
  tema_escuro: boolean;
  idioma: string;
}

export default function Preferencias() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [profile, setProfile] = useState({
    nome_completo: "",
    avatar_url: ""
  });

  const [preferences, setPreferences] = useState<Preferences>({
    notificacoes_insights: true,
    notificacoes_metas: true,
    notificacoes_ofertas: true,
    tema_escuro: true,
    idioma: "pt-BR"
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) throw error;

      setProfile({
        nome_completo: data?.nome_completo || "",
        avatar_url: data?.avatar_url || ""
      });

      // Carregar preferências do JSON
      if (data?.preferencias && typeof data.preferencias === 'object') {
        setPreferences({
          ...preferences,
          ...(data.preferencias as Partial<Preferences>)
        });
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          nome_completo: profile.nome_completo,
          avatar_url: profile.avatar_url,
          preferencias: preferences as any
        })
        .eq("id", user?.id);

      if (error) throw error;

      toast.success("Preferências salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar preferências");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SimpleLayout>
        <div className="container mx-auto p-6">
          <div className="text-center py-12">Carregando...</div>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout>
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Preferências
          </h1>
          <p className="text-muted-foreground mt-1">
            Personalize sua experiência no Équilibra
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Perfil */}
          <Card className="animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Perfil
              </CardTitle>
              <CardDescription>
                Informações pessoais da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nome Completo</Label>
                <Input
                  value={profile.nome_completo}
                  onChange={(e) => setProfile({ ...profile, nome_completo: e.target.value })}
                  placeholder="Seu nome completo"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled />
              </div>
              <div>
                <Label>Avatar URL</Label>
                <Input
                  value={profile.avatar_url}
                  onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card className="animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notificações
              </CardTitle>
              <CardDescription>
                Gerencie suas preferências de notificação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Insights Financeiros</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber alertas e recomendações de IA
                  </p>
                </div>
                <Switch
                  checked={preferences.notificacoes_insights}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, notificacoes_insights: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Alertas de Metas</Label>
                  <p className="text-sm text-muted-foreground">
                    Avisos quando atingir limites de gastos
                  </p>
                </div>
                <Switch
                  checked={preferences.notificacoes_metas}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, notificacoes_metas: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Ofertas Personalizadas</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber sugestões de produtos e serviços
                  </p>
                </div>
                <Switch
                  checked={preferences.notificacoes_ofertas}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, notificacoes_ofertas: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Segurança */}
          <Card className="animate-scale-in lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Segurança
              </CardTitle>
              <CardDescription>
                Gerencie a segurança da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full">
                Alterar Senha
              </Button>
              <Button variant="outline" className="w-full">
                Ativar Autenticação de Dois Fatores
              </Button>
              <Separator />
              <Button variant="destructive" className="w-full">
                Excluir Conta
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Botão Salvar */}
        <div className="flex justify-end">
          <Button onClick={saveProfile} disabled={saving} size="lg">
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>
    </SimpleLayout>
  );
}