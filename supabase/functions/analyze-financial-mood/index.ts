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
    const { period } = await req.json(); // 'day', 'month', or 'current'
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Sem autorização");
    }

    const token = authHeader.replace("Bearer ", "");

    // Decodificar JWT validado pelo Lovable Cloud para obter o ID do usuário
    const tokenParts = token.split(".");
    if (tokenParts.length !== 3) {
      throw new Error("Token inválido");
    }

    const payloadJson = atob(tokenParts[1]);
    const payload = JSON.parse(payloadJson) as { sub?: string };

    const userId = payload.sub;
    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Buscar dados financeiros
    const { data: accounts } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", userId);

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let timeFilter = startOfMonth.toISOString();
    let periodLabel = "do mês";
    
    if (period === "day") {
      timeFilter = startOfDay.toISOString();
      periodLabel = "do dia";
    }

    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .gte("data", timeFilter)
      .order("data", { ascending: false });

    const saldoTotal = accounts?.reduce((acc, acc_item) => acc + Number(acc_item.saldo_atual), 0) || 0;
    const despesas = transactions?.filter(t => t.tipo === "saida") || [];
    const receitas = transactions?.filter(t => t.tipo === "entrada") || [];
    
    const totalDespesas = despesas.reduce((acc, t) => acc + Number(t.valor), 0);
    const totalReceitas = receitas.reduce((acc, t) => acc + Number(t.valor), 0);
    const saldoPeriodo = totalReceitas - totalDespesas;

    const contextoDados = `
ANÁLISE FINANCEIRA ${periodLabel.toUpperCase()}:

💰 Saldo Total Atual: R$ ${saldoTotal.toFixed(2)}
📊 Período: ${periodLabel}
💵 Receitas ${periodLabel}: R$ ${totalReceitas.toFixed(2)}
💸 Despesas ${periodLabel}: R$ ${totalDespesas.toFixed(2)}
📈 Saldo ${periodLabel}: R$ ${saldoPeriodo.toFixed(2)}
🔢 Total de transações ${periodLabel}: ${transactions?.length || 0}

Categorias com mais gastos ${periodLabel}:
${despesas.slice(0, 3).map(t => `- ${t.categoria}: R$ ${Number(t.valor).toFixed(2)}`).join('\n')}
`;

    const systemPrompt = `Você é um analista financeiro que avalia a situação financeira do usuário e responde com:
1. Um emoji que representa o estado financeiro (😊 excelente, 🙂 bom, 😐 neutro, 😟 preocupante, 😢 crítico)
2. Uma frase curta e direta sobre a situação (máximo 15 palavras)
3. Uma análise breve explicando o motivo (máximo 30 palavras)

Baseie-se em:
- Saldo positivo/negativo
- Proporção receitas vs despesas
- Volume de transações
- Categorias de gastos

Formato da resposta (EXATAMENTE neste formato):
EMOJI: [emoji]
TITULO: [frase curta]
ANALISE: [explicação breve]`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contextoDados }
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro da API:", response.status, errorText);
      throw new Error(`Erro da API: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    // Parse da resposta
    const emojiMatch = aiMessage.match(/EMOJI:\s*(.+)/);
    const tituloMatch = aiMessage.match(/TITULO:\s*(.+)/);
    const analiseMatch = aiMessage.match(/ANALISE:\s*(.+)/);

    return new Response(
      JSON.stringify({
        emoji: emojiMatch ? emojiMatch[1].trim() : "😐",
        titulo: tituloMatch ? tituloMatch[1].trim() : "Situação neutra",
        analise: analiseMatch ? analiseMatch[1].trim() : "Dados insuficientes para análise",
        dados: {
          saldoTotal,
          totalReceitas,
          totalDespesas,
          saldoPeriodo,
          periodo: periodLabel
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro ao analisar humor financeiro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
