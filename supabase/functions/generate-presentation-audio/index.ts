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
      Équilibra: seu assistente financeiro universitário. Gerencie trabalho e vida pessoal com inteligência artificial. Equilíbrio financeiro ao seu alcance.
    `;

    console.log("Gerando áudio de apresentação...");

    // Usando voz Alice (brasileira, feminina, suave)
    const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/Xb7hH8MSUJpSbSDYk0k2", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: presentationText,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.8,
          style: 0.3,
          use_speaker_boost: true
        },
        language_code: "pt-br"
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro da API Eleven Labs:", response.status, errorText);
      throw new Error(`Erro da API Eleven Labs: ${response.status}`);
    }

    // Obter o áudio como array buffer
    const audioBuffer = await response.arrayBuffer();
    
    // Converter para base64 em chunks para evitar stack overflow
    const bytes = new Uint8Array(audioBuffer);
    const chunkSize = 8192;
    let base64Audio = '';
    
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      base64Audio += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    base64Audio = btoa(base64Audio);

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
