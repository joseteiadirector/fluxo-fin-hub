import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { InsightsEngine } from "@/utils/insightsEngine";

export const useInitialData = () => {
  const { user } = useAuth();
  const [hasData, setHasData] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkAndInitializeData();
    }
  }, [user]);

  const checkAndInitializeData = async () => {
    try {
      // SEMPRE garantir que o usuário tem conta primeiro
      let { data: accounts } = await supabase
        .from("accounts")
        .select("id, saldo_atual")
        .eq("user_id", user?.id)
        .limit(1);

      // Se não existe conta, criar uma
      if (!accounts || accounts.length === 0) {
        const { data: newAccount, error: accountError } = await supabase
          .from("accounts")
          .insert({
            user_id: user!.id,
            nome_da_conta: "Conta Principal",
            tipo_conta: "principal",
            saldo_atual: 0
          })
          .select()
          .single();

        if (accountError) {
          console.error("Erro ao criar conta:", accountError);
          setLoading(false);
          return;
        }
        accounts = [newAccount];
      }

      // Verificar quantas transações o usuário tem
      const { data: transactions, count } = await supabase
        .from("transactions")
        .select("id", { count: 'exact' })
        .eq("user_id", user?.id);

      // Se tem menos de 10 transações, popular com dados
      if (!transactions || !count || count < 10) {
        console.log("🔄 Gerando transações automáticas para o protótipo...");
        await populateInitialData();
        setHasData(true);
        
        // Forçar reload da página para atualizar todos os dados
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        setHasData(true);
      }
    } catch (error) {
      console.error("Error checking initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const populateInitialData = async () => {
    if (!user) return;

    try {
      // Obter ou criar conta principal
      let { data: accounts } = await supabase
        .from("accounts")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      // Se não existe conta, criar uma
      if (!accounts || accounts.length === 0) {
        const { data: newAccount, error: accountError } = await supabase
          .from("accounts")
          .insert({
            user_id: user.id,
            nome_da_conta: "Conta Principal",
            tipo_conta: "principal",
            saldo_atual: 0
          })
          .select()
          .single();

        if (accountError || !newAccount) {
          console.error("Erro ao criar conta:", accountError);
          return;
        }
        accounts = [newAccount];
      }

      const accountId = accounts[0].id;
      const today = new Date();

      // Transações de exemplo - últimos 30 dias
      const transactions = [
        // Receitas - Trabalho
        {
          user_id: user.id,
          account_id: accountId,
          tipo: "receita",
          categoria: "Salário",
          descricao: "Salário CLT - Novembro",
          valor: 3500.00,
          modo: "trabalho",
          data: new Date(today.getFullYear(), today.getMonth(), 5).toISOString()
        },
        {
          user_id: user.id,
          account_id: accountId,
          tipo: "receita",
          categoria: "Freelance",
          descricao: "Projeto desenvolvimento web",
          valor: 1200.00,
          modo: "trabalho",
          data: new Date(today.getFullYear(), today.getMonth(), 12).toISOString()
        },
        // Despesas - Trabalho
        {
          user_id: user.id,
          account_id: accountId,
          tipo: "despesa",
          categoria: "Transporte",
          descricao: "Uber reunião cliente",
          valor: 45.80,
          modo: "trabalho",
          data: new Date(today.getFullYear(), today.getMonth(), 10).toISOString()
        },
        {
          user_id: user.id,
          account_id: accountId,
          tipo: "despesa",
          categoria: "Alimentação",
          descricao: "Almoço reunião",
          valor: 78.90,
          modo: "trabalho",
          data: new Date(today.getFullYear(), today.getMonth(), 11).toISOString()
        },
        // Despesas - Pessoal
        {
          user_id: user.id,
          account_id: accountId,
          tipo: "despesa",
          categoria: "Alimentação",
          descricao: "Supermercado",
          valor: 287.50,
          modo: "pessoal",
          data: new Date(today.getFullYear(), today.getMonth(), 8).toISOString()
        },
        {
          user_id: user.id,
          account_id: accountId,
          tipo: "despesa",
          categoria: "Alimentação",
          descricao: "iFood - Jantar",
          valor: 52.90,
          modo: "pessoal",
          data: new Date(today.getFullYear(), today.getMonth(), 15).toISOString()
        },
        {
          user_id: user.id,
          account_id: accountId,
          tipo: "despesa",
          categoria: "Transporte",
          descricao: "Uber faculdade",
          valor: 28.40,
          modo: "pessoal",
          data: new Date(today.getFullYear(), today.getMonth(), 9).toISOString()
        },
        {
          user_id: user.id,
          account_id: accountId,
          tipo: "despesa",
          categoria: "Transporte",
          descricao: "Bilhete Único",
          valor: 100.00,
          modo: "pessoal",
          data: new Date(today.getFullYear(), today.getMonth(), 3).toISOString()
        },
        {
          user_id: user.id,
          account_id: accountId,
          tipo: "despesa",
          categoria: "Educação",
          descricao: "Mensalidade Faculdade",
          valor: 890.00,
          modo: "pessoal",
          data: new Date(today.getFullYear(), today.getMonth(), 7).toISOString()
        },
        {
          user_id: user.id,
          account_id: accountId,
          tipo: "despesa",
          categoria: "Educação",
          descricao: "Livros universitários",
          valor: 145.00,
          modo: "pessoal",
          data: new Date(today.getFullYear(), today.getMonth(), 14).toISOString()
        },
        {
          user_id: user.id,
          account_id: accountId,
          tipo: "despesa",
          categoria: "Lazer",
          descricao: "Netflix",
          valor: 39.90,
          modo: "pessoal",
          data: new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
        },
        {
          user_id: user.id,
          account_id: accountId,
          tipo: "despesa",
          categoria: "Lazer",
          descricao: "Cinema",
          valor: 67.00,
          modo: "pessoal",
          data: new Date(today.getFullYear(), today.getMonth(), 13).toISOString()
        },
        {
          user_id: user.id,
          account_id: accountId,
          tipo: "despesa",
          categoria: "Saúde",
          descricao: "Farmácia",
          valor: 89.50,
          modo: "pessoal",
          data: new Date(today.getFullYear(), today.getMonth(), 6).toISOString()
        },
        {
          user_id: user.id,
          account_id: accountId,
          tipo: "despesa",
          categoria: "Moradia",
          descricao: "Aluguel",
          valor: 650.00,
          modo: "pessoal",
          data: new Date(today.getFullYear(), today.getMonth(), 5).toISOString()
        },
        {
          user_id: user.id,
          account_id: accountId,
          tipo: "despesa",
          categoria: "Utilidades",
          descricao: "Conta de Luz",
          valor: 135.80,
          modo: "pessoal",
          data: new Date(today.getFullYear(), today.getMonth(), 4).toISOString()
        }
      ];

      // Inserir transações
      await supabase.from("transactions").insert(transactions);

      // Calcular saldo
      const totalReceitas = transactions
        .filter(t => t.tipo === "receita")
        .reduce((sum, t) => sum + t.valor, 0);
      
      const totalDespesas = transactions
        .filter(t => t.tipo === "despesa")
        .reduce((sum, t) => sum + t.valor, 0);

      const saldoAtual = totalReceitas - totalDespesas;

      // Atualizar saldo
      await supabase
        .from("accounts")
        .update({ saldo_atual: saldoAtual })
        .eq("id", accountId);

      // Gerar insights automaticamente
      const insightsEngine = new InsightsEngine();
      await insightsEngine.generateInsights(user.id, "pessoal");
      await insightsEngine.generateInsights(user.id, "trabalho");

      console.log("✅ Dados iniciais populados com sucesso!");
    } catch (error) {
      console.error("Erro ao popular dados iniciais:", error);
    }
  };

  return { hasData, loading };
};
