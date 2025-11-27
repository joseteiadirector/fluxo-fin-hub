import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    // Obter token do header de autorização
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Sem autorização");
    }

    // Criar cliente Supabase com service role para acessar dados
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Extrair user do JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Erro de autenticação:", userError);
      throw new Error("Usuário não autenticado");
    }

    console.log("User ID:", user.id);

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    // Buscar dados financeiros do usuário
    const { data: accounts } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id);

    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("data", { ascending: false })
      .limit(50);

    const { data: insights } = await supabase
      .from("insights")
      .select("*")
      .eq("user_id", user.id)
      .eq("lido", false)
      .order("prioridade", { ascending: false })
      .limit(10);

    const { data: metas } = await supabase
      .from("metas")
      .select("*")
      .eq("user_id", user.id);

    // Análise de gastos
    const saldoTotal = accounts?.reduce((acc, acc_item) => acc + Number(acc_item.saldo_atual), 0) || 0;
    
    const despesas = transactions?.filter(t => t.tipo === "saida") || [];
    const maioresDespesas = despesas
      .sort((a, b) => Number(b.valor) - Number(a.valor))
      .slice(0, 5)
      .map(t => `R$ ${Number(t.valor).toFixed(2)} - ${t.descricao} (${t.categoria}) em ${new Date(t.data).toLocaleDateString('pt-BR')}`);

    const gastosPorCategoria: Record<string, number> = {};
    despesas.forEach(t => {
      gastosPorCategoria[t.categoria] = (gastosPorCategoria[t.categoria] || 0) + Number(t.valor);
    });

    const categoriasMaisGastam = Object.entries(gastosPorCategoria)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, valor]) => `${cat}: R$ ${valor.toFixed(2)}`);

    // Verificar metas próximas do limite
    const metasEmAlerta = metas?.filter(meta => {
      const gastoCategoria = gastosPorCategoria[meta.categoria] || 0;
      const percentual = (gastoCategoria / Number(meta.valor_limite)) * 100;
      return percentual >= 80;
    }).map(meta => {
      const gastoCategoria = gastosPorCategoria[meta.categoria] || 0;
      const percentual = ((gastoCategoria / Number(meta.valor_limite)) * 100).toFixed(0);
      return `${meta.categoria}: ${percentual}% do limite (R$ ${gastoCategoria.toFixed(2)} / R$ ${Number(meta.valor_limite).toFixed(2)})`;
    }) || [];

    const contextoDados = `
DADOS FINANCEIROS ATUAIS DO USUÁRIO:

💰 SALDO TOTAL: R$ ${saldoTotal.toFixed(2)}

🔥 5 MAIORES DESPESAS RECENTES:
${maioresDespesas.length > 0 ? maioresDespesas.join('\n') : 'Nenhuma despesa registrada'}

📊 CATEGORIAS COM MAIS GASTOS:
${categoriasMaisGastam.length > 0 ? categoriasMaisGastam.join('\n') : 'Nenhum gasto registrado'}

⚠️ METAS EM ALERTA (>80% do limite):
${metasEmAlerta.length > 0 ? metasEmAlerta.join('\n') : 'Nenhuma meta em alerta'}

💡 INSIGHTS NÃO LIDOS: ${insights?.length || 0}
${insights && insights.length > 0 ? insights.slice(0, 3).map(i => `- ${i.titulo}: ${i.mensagem}`).join('\n') : ''}

📈 TOTAL DE TRANSAÇÕES RECENTES: ${transactions?.length || 0}
`;

    console.log("Contexto de dados:", contextoDados);

    const systemPrompt = `Você é o assistente virtual do Équilibra, um hub financeiro para universitários que trabalham.

${contextoDados}

COMO RESPONDER:
1. Use os DADOS REAIS do usuário acima para dar respostas personalizadas
2. Se perguntarem sobre gastos, cite as despesas específicas com valores e datas
3. Se perguntarem sobre categorias, mostre os gastos por categoria com valores reais
4. Sempre que possível, sugira atalhos para o usuário navegar
5. Seja proativo: se notar metas em alerta, mencione!
6. Use emojis para deixar as respostas mais visuais
7. Seja conciso mas informativo

SOBRE O ÉQUILIBRA:
- App para gerenciar finanças separando gastos de Trabalho e Pessoais
- Previsão de saldo usando IA (Regressão Linear)
- Insights automáticos sobre gastos
- Serviços financeiros: PIX, Recarga, Benefícios (VR/VA/VT), Cashback, Seguros, Empréstimos, Payment Links
- Sistema de Metas por categoria
- Ofertas personalizadas

ATALHOS DISPONÍVEIS (use o formato [ATALHO:nome]):
- [ATALHO:dashboard] - Ir para Dashboard
- [ATALHO:extrato] - Ver Extrato completo
- [ATALHO:insights] - Ver Insights de IA
- [ATALHO:metas] - Gerenciar Metas
- [ATALHO:ofertas] - Ver Ofertas personalizadas
- [ATALHO:servicos] - Acessar Serviços
- [ATALHO:preferencias] - Configurações
- [ATALHO:pix] - Abrir PIX rápido
- [ATALHO:recarga] - Fazer Recarga
- [ATALHO:beneficios] - Consultar Benefícios
- [ATALHO:cashback] - Ver Cashback
- [ATALHO:seguros] - Seguros
- [ATALHO:emprestimos] - Empréstimos
- [ATALHO:payment-link] - Criar Payment Link

FUNCIONALIDADES:
1. Dashboard: Saldo atual, previsão de fim de mês, gráficos de gastos
2. Extrato: Histórico de transações com filtros
3. Insights: IA analisa seus gastos e dá dicas
4. Metas: Defina limites de gastos por categoria
5. Ofertas: Cashback, seguros e empréstimos personalizados
6. Serviços: 7 serviços financeiros integrados

MODO TRABALHO vs PESSOAL:
- Toggle no topo alterna entre gastos de trabalho e pessoais
- Todas as visualizações respeitam esse filtro

EXEMPLOS DE RESPOSTAS INTELIGENTES:
- "Seus maiores gastos este mês foram em [categoria] com R$ [valor]. Quer ver o extrato completo? [ATALHO:extrato]"
- "Você está usando 85% do seu limite em [categoria]! Quer ajustar sua meta? [ATALHO:metas]"
- "Percebi que você gastou R$ [valor] em [data]. Isso está acima do seu padrão. Quer ver insights sobre isso? [ATALHO:insights]"

Seja conciso, amigável, use os dados reais e sempre sugira atalhos relevantes. Responda em português brasileiro.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []),
      { role: "user", content: message }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.8,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro da API:", response.status, errorText);
      throw new Error(`Erro da API: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ message: aiMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro no chatbot:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
