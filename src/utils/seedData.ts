import { supabase } from "@/integrations/supabase/client";

export interface SeedDataResult {
  success: boolean;
  message: string;
  counts?: {
    transactions: number;
    services: number;
    insights: number;
  };
}

export const seedExampleData = async (userId: string): Promise<SeedDataResult> => {
  try {
    // Verificar se já existem dados
    const { data: existingTransactions } = await supabase
      .from("transactions")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    if (existingTransactions && existingTransactions.length > 0) {
      return {
        success: false,
        message: "Dados já existem no banco. Limpe os dados primeiro antes de adicionar exemplos."
      };
    }

    // Obter account_id do usuário
    const { data: accounts } = await supabase
      .from("accounts")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    if (!accounts || accounts.length === 0) {
      return {
        success: false,
        message: "Nenhuma conta encontrada. Crie uma conta primeiro."
      };
    }

    const accountId = accounts[0].id;

    // Dados de exemplo - Transações variadas
    const today = new Date();
    const transactions = [
      // Receitas - Trabalho
      {
        user_id: userId,
        account_id: accountId,
        tipo: "receita",
        categoria: "Salário",
        descricao: "Salário CLT - Novembro",
        valor: 3500.00,
        modo: "trabalho",
        data: new Date(today.getFullYear(), today.getMonth(), 5).toISOString()
      },
      {
        user_id: userId,
        account_id: accountId,
        tipo: "receita",
        categoria: "Freelance",
        descricao: "Projeto de desenvolvimento web",
        valor: 1200.00,
        modo: "trabalho",
        data: new Date(today.getFullYear(), today.getMonth(), 12).toISOString()
      },
      
      // Despesas - Trabalho
      {
        user_id: userId,
        account_id: accountId,
        tipo: "despesa",
        categoria: "Transporte",
        descricao: "Uber para reunião cliente",
        valor: 45.80,
        modo: "trabalho",
        data: new Date(today.getFullYear(), today.getMonth(), 10).toISOString()
      },
      {
        user_id: userId,
        account_id: accountId,
        tipo: "despesa",
        categoria: "Alimentação",
        descricao: "Almoço reunião de negócios",
        valor: 78.90,
        modo: "trabalho",
        data: new Date(today.getFullYear(), today.getMonth(), 11).toISOString()
      },
      {
        user_id: userId,
        account_id: accountId,
        tipo: "despesa",
        categoria: "Tecnologia",
        descricao: "Assinatura Adobe Creative Cloud",
        valor: 85.00,
        modo: "trabalho",
        data: new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
      },
      
      // Despesas - Pessoal
      {
        user_id: userId,
        account_id: accountId,
        tipo: "despesa",
        categoria: "Alimentação",
        descricao: "Supermercado",
        valor: 287.50,
        modo: "pessoal",
        data: new Date(today.getFullYear(), today.getMonth(), 8).toISOString()
      },
      {
        user_id: userId,
        account_id: accountId,
        tipo: "despesa",
        categoria: "Alimentação",
        descricao: "iFood - Jantar",
        valor: 52.90,
        modo: "pessoal",
        data: new Date(today.getFullYear(), today.getMonth(), 15).toISOString()
      },
      {
        user_id: userId,
        account_id: accountId,
        tipo: "despesa",
        categoria: "Transporte",
        descricao: "Uber para faculdade",
        valor: 28.40,
        modo: "pessoal",
        data: new Date(today.getFullYear(), today.getMonth(), 9).toISOString()
      },
      {
        user_id: userId,
        account_id: accountId,
        tipo: "despesa",
        categoria: "Transporte",
        descricao: "Recarga Bilhete Único",
        valor: 100.00,
        modo: "pessoal",
        data: new Date(today.getFullYear(), today.getMonth(), 3).toISOString()
      },
      {
        user_id: userId,
        account_id: accountId,
        tipo: "despesa",
        categoria: "Educação",
        descricao: "Mensalidade Faculdade",
        valor: 890.00,
        modo: "pessoal",
        data: new Date(today.getFullYear(), today.getMonth(), 7).toISOString()
      },
      {
        user_id: userId,
        account_id: accountId,
        tipo: "despesa",
        categoria: "Educação",
        descricao: "Livros universitários",
        valor: 145.00,
        modo: "pessoal",
        data: new Date(today.getFullYear(), today.getMonth(), 14).toISOString()
      },
      {
        user_id: userId,
        account_id: accountId,
        tipo: "despesa",
        categoria: "Lazer",
        descricao: "Netflix",
        valor: 39.90,
        modo: "pessoal",
        data: new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
      },
      {
        user_id: userId,
        account_id: accountId,
        tipo: "despesa",
        categoria: "Lazer",
        descricao: "Cinema com amigos",
        valor: 67.00,
        modo: "pessoal",
        data: new Date(today.getFullYear(), today.getMonth(), 13).toISOString()
      },
      {
        user_id: userId,
        account_id: accountId,
        tipo: "despesa",
        categoria: "Saúde",
        descricao: "Farmácia - Medicamentos",
        valor: 89.50,
        modo: "pessoal",
        data: new Date(today.getFullYear(), today.getMonth(), 6).toISOString()
      },
      {
        user_id: userId,
        account_id: accountId,
        tipo: "despesa",
        categoria: "Moradia",
        descricao: "Aluguel República",
        valor: 650.00,
        modo: "pessoal",
        data: new Date(today.getFullYear(), today.getMonth(), 5).toISOString()
      },
      {
        user_id: userId,
        account_id: accountId,
        tipo: "despesa",
        categoria: "Utilidades",
        descricao: "Conta de Luz",
        valor: 135.80,
        modo: "pessoal",
        data: new Date(today.getFullYear(), today.getMonth(), 4).toISOString()
      },
      {
        user_id: userId,
        account_id: accountId,
        tipo: "despesa",
        categoria: "Utilidades",
        descricao: "Internet banda larga",
        valor: 99.90,
        modo: "pessoal",
        data: new Date(today.getFullYear(), today.getMonth(), 2).toISOString()
      },
      {
        user_id: userId,
        account_id: accountId,
        tipo: "despesa",
        categoria: "Vestuário",
        descricao: "Roupas para estágio",
        valor: 189.90,
        modo: "pessoal",
        data: new Date(today.getFullYear(), today.getMonth(), 16).toISOString()
      }
    ];

    // Inserir transações
    const { error: transactionsError } = await supabase
      .from("transactions")
      .insert(transactions);

    if (transactionsError) throw transactionsError;

    // Dados de exemplo - Services Logs
    const servicesLogs = [
      {
        user_id: userId,
        tipo_servico: "pix",
        valor: 150.00,
        detalhes: {
          chave: "email@exemplo.com",
          beneficiario: "Maria Silva",
          descricao: "Divisão conta restaurante"
        },
        criado_em: new Date(today.getFullYear(), today.getMonth(), 10).toISOString()
      },
      {
        user_id: userId,
        tipo_servico: "recarga",
        valor: 30.00,
        detalhes: {
          numero: "(11) 98765-4321",
          operadora: "Vivo"
        },
        criado_em: new Date(today.getFullYear(), today.getMonth(), 8).toISOString()
      },
      {
        user_id: userId,
        tipo_servico: "cashback",
        valor: 15.50,
        detalhes: {
          origem: "Compras no mês",
          aplicado: true
        },
        criado_em: new Date(today.getFullYear(), today.getMonth(), 12).toISOString()
      }
    ];

    const { error: servicesError } = await supabase
      .from("services_logs")
      .insert(servicesLogs);

    if (servicesError) throw servicesError;

    // Calcular saldo atual
    const totalReceitas = transactions
      .filter(t => t.tipo === "receita")
      .reduce((sum, t) => sum + t.valor, 0);
    
    const totalDespesas = transactions
      .filter(t => t.tipo === "despesa")
      .reduce((sum, t) => sum + t.valor, 0);

    const saldoAtual = totalReceitas - totalDespesas;

    // Atualizar saldo da conta
    await supabase
      .from("accounts")
      .update({ saldo_atual: saldoAtual })
      .eq("id", accountId);

    return {
      success: true,
      message: "Dados de exemplo criados com sucesso!",
      counts: {
        transactions: transactions.length,
        services: servicesLogs.length,
        insights: 0
      }
    };

  } catch (error) {
    console.error("Erro ao criar dados de exemplo:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido ao criar dados"
    };
  }
};

export const clearAllData = async (userId: string): Promise<SeedDataResult> => {
  try {
    // Deletar insights
    await supabase
      .from("insights")
      .delete()
      .eq("user_id", userId);

    // Deletar services_logs
    await supabase
      .from("services_logs")
      .delete()
      .eq("user_id", userId);

    // Deletar transactions
    await supabase
      .from("transactions")
      .delete()
      .eq("user_id", userId);

    // Resetar saldo da conta
    await supabase
      .from("accounts")
      .update({ saldo_atual: 0 })
      .eq("user_id", userId);

    return {
      success: true,
      message: "Todos os dados foram limpos com sucesso!"
    };
  } catch (error) {
    console.error("Erro ao limpar dados:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido ao limpar dados"
    };
  }
};
