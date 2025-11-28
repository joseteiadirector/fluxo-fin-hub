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
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY não configurada");
    }

    const presentationText = `
      Bem-vindo ao Équilibra, seu assistente financeiro universitário inteligente.
      
      O Équilibra foi desenvolvido especialmente para estudantes que trabalham, oferecendo uma solução completa para gerenciar suas finanças de forma eficiente e inteligente.
      
      Com nosso sistema único de separação automática entre gastos de Trabalho e Pessoais, você mantém total controle sobre suas despesas em cada área da sua vida.
      
      Nossa plataforma oferece análise financeira em tempo real, previsões inteligentes de saldo mensal usando regressão linear, e insights personalizados gerados por inteligência artificial.
      
      Acesse seis serviços financeiros integrados: PIX, recarga de celular, benefícios, cashback, seguros e empréstimos, tudo em um único lugar.
      
      Defina metas de gastos por categoria e receba alertas inteligentes quando se aproximar dos limites. Conte com nosso chatbot financeiro que analisa seus padrões de consumo e oferece orientações personalizadas.
      
      Visualize sua saúde financeira através de indicadores de humor que mostram sua situação atual de forma intuitiva: do dia, do mês e do período geral.
      
      Équilibra: equilibrando sua vida financeira enquanto você foca em seus estudos e carreira.
    `;

    console.log("Gerando áudio de apresentação...");

    const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/FGY2WhTYpPnrIDTdsKH5", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: presentationText,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro da API Eleven Labs:", response.status, errorText);
      throw new Error(`Erro da API Eleven Labs: ${response.status}`);
    }

    // Obter o áudio como array buffer
    const audioBuffer = await response.arrayBuffer();
    
    // Converter para base64
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(audioBuffer))
    );

    console.log("Áudio gerado com sucesso");

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );

  } catch (error) {
    console.error("Erro ao gerar áudio:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});
