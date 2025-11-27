import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, modo } = await req.json();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch user's financial data
    const { data: accountData } = await supabase
      .from("accounts")
      .select("saldo_atual")
      .eq("user_id", userId)
      .eq("tipo_conta", "principal")
      .maybeSingle();

    const saldoAtual = accountData ? Number(accountData.saldo_atual) : 0;

    // Fetch transactions from last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: transactions } = await supabase
      .from("transactions")
      .select("valor, tipo, categoria, data")
      .eq("user_id", userId)
      .eq("modo", modo)
      .gte("data", thirtyDaysAgo);

    if (!transactions || transactions.length === 0) {
      // Create welcome insight for new users
      await supabase.from("insights").insert({
        user_id: userId,
        titulo: "👋 Bem-vindo ao Équilibra",
        mensagem: "Comece registrando suas transações para receber insights personalizados sobre seus hábitos financeiros!",
        tipo: "informacao",
        origem: "heuristica",
        prioridade: 3
      });

      return new Response(JSON.stringify({ success: true, count: 1 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate financial metrics
    const totalGastos = transactions
      .filter(t => t.tipo === "saida")
      .reduce((sum, t) => sum + Number(t.valor), 0);
    
    const totalEntradas = transactions
      .filter(t => t.tipo === "entrada")
      .reduce((sum, t) => sum + Number(t.valor), 0);

    // Group by category
    const gastosPorCategoria: Record<string, number> = {};
    transactions
      .filter(t => t.tipo === "saida")
      .forEach(t => {
        gastosPorCategoria[t.categoria] = (gastosPorCategoria[t.categoria] || 0) + Number(t.valor);
      });

    const categoriasOrdenadas = Object.entries(gastosPorCategoria)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // Prepare context for AI
    const financialContext = `
Análise Financeira do Usuário (Modo: ${modo === "trabalho" ? "Trabalho" : "Pessoal"}):

RESUMO GERAL:
- Saldo atual: R$ ${saldoAtual.toFixed(2)}
- Total de gastos (30 dias): R$ ${totalGastos.toFixed(2)}
- Total de entradas (30 dias): R$ ${totalEntradas.toFixed(2)}
- Taxa de consumo: ${totalEntradas > 0 ? ((totalGastos / totalEntradas) * 100).toFixed(1) : 'N/A'}%

TOP 5 CATEGORIAS DE GASTOS:
${categoriasOrdenadas.map(([cat, val], idx) => 
  `${idx + 1}. ${cat}: R$ ${val.toFixed(2)} (${((val / totalGastos) * 100).toFixed(1)}%)`
).join('\n')}

HISTÓRICO DE TRANSAÇÕES (últimas 10):
${transactions.slice(-10).map(t => 
  `- ${t.tipo === "entrada" ? "✅ Entrada" : "❌ Saída"}: R$ ${Number(t.valor).toFixed(2)} em ${t.categoria} (${new Date(t.data).toLocaleDateString('pt-BR')})`
).join('\n')}
`;

    console.log("Financial context prepared:", financialContext);

    // Call Lovable AI with tool calling for structured output
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um analista financeiro especializado do Équilibra, uma plataforma para estudantes e jovens profissionais brasileiros.

IMPORTANTE: Gere insights ÚNICOS e VARIADOS cada vez. NUNCA repita os mesmos insights. Use criatividade e contexto real dos dados.

Analise os dados financeiros e gere 3-5 insights personalizados:
- Seja ESPECÍFICO com números e percentuais reais
- Varie os tópicos: não repita categorias ou alertas
- Misture tipos: alertas (problemas), oportunidades (melhorias) e informações (padrões)
- Use emojis relevantes nos títulos
- Seja direto, prático e motivador
- NUNCA gere insights genéricos ou repetidos

Tipos de insights válidos: "alerta", "oportunidade", "informacao"
Origens válidas: "regressao_linear", "arvore_decisao", "heuristica"
Prioridades: 1 (urgente), 2 (importante), 3 (informativo)`
          },
          {
            role: "user",
            content: financialContext
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_insights",
              description: "Gerar insights financeiros únicos e personalizados",
              parameters: {
                type: "object",
                  properties: {
                    insights: {
                      type: "array",
                      description: "Lista de 3-5 insights variados e únicos",
                      items: {
                        type: "object",
                        properties: {
                          titulo: {
                            type: "string",
                            description: "Título curto e chamativo com emoji relevante"
                          },
                          mensagem: {
                            type: "string",
                            description: "Mensagem clara e específica com dados reais"
                          },
                          tipo: {
                            type: "string",
                            description: "Tipo do insight baseado na urgência"
                          },
                          origem: {
                            type: "string",
                            description: "Sistema que gerou o insight"
                          },
                          prioridade: {
                            type: "number",
                            description: "1=urgente, 2=importante, 3=informativo"
                          }
                        }
                      }
                    }
                  }
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_insights" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Aguarde alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes no workspace." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`AI Gateway error: ${response.status} ${errorText}`);
    }

    const aiResponse = await response.json();
    console.log("AI Response:", JSON.stringify(aiResponse, null, 2));

    // Extract insights from tool call
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "create_insights") {
      throw new Error("Invalid AI response format");
    }

    const { insights } = JSON.parse(toolCall.function.arguments);
    console.log("Generated insights:", insights);

    // Delete old unread insights
    await supabase
      .from("insights")
      .delete()
      .eq("user_id", userId)
      .eq("lido", false);

    // Insert new AI-generated insights
    const insightsToInsert = insights.map((insight: any) => ({
      user_id: userId,
      titulo: insight.titulo,
      mensagem: insight.mensagem,
      tipo: insight.tipo,
      origem: insight.origem,
      prioridade: insight.prioridade
    }));

    const { error: insertError } = await supabase
      .from("insights")
      .insert(insightsToInsert);

    if (insertError) {
      console.error("Error inserting insights:", insertError);
      throw insertError;
    }

    console.log(`Successfully generated ${insights.length} unique insights`);

    return new Response(JSON.stringify({ 
      success: true, 
      count: insights.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in generate-insights function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});