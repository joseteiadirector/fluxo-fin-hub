import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const systemPrompt = `Você é o assistente virtual do Équilibra, um hub financeiro para universitários que trabalham.

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

Seja conciso, amigável e sempre sugira atalhos relevantes. Responda em português brasileiro.`;

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
        temperature: 0.7,
        max_tokens: 500,
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
