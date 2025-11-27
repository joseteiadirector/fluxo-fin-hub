import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[PIX] Iniciando criação de pagamento PIX");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Autenticar usuário
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("Usuário não autenticado");
    }

    console.log(`[PIX] Usuário autenticado: ${user.email}`);

    // Parse do body da requisição
    const { amount, pixKey, description } = await req.json();
    
    if (!amount || amount <= 0) {
      throw new Error("Valor inválido");
    }

    console.log(`[PIX] Valor: R$ ${(amount / 100).toFixed(2)}`);

    // Inicializar Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Verificar ou criar cliente Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log(`[PIX] Cliente Stripe existente: ${customerId}`);
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id }
      });
      customerId = customer.id;
      console.log(`[PIX] Novo cliente Stripe criado: ${customerId}`);
    }

    // Criar PaymentIntent para PIX
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Valor em centavos
      currency: "brl",
      customer: customerId,
      payment_method_types: ["pix"],
      description: description || `Transferência PIX - ${pixKey}`,
      metadata: {
        pixKey: pixKey,
        userId: user.id,
      },
    });

    console.log(`[PIX] PaymentIntent criado: ${paymentIntent.id}`);

    // Confirmar o PaymentIntent para gerar o QR Code
    const confirmedIntent = await stripe.paymentIntents.confirm(paymentIntent.id, {
      payment_method_data: {
        type: "pix",
        billing_details: {
          email: user.email,
        },
      },
      return_url: `${req.headers.get("origin")}/servicos`,
    });

    console.log(`[PIX] PaymentIntent confirmado, status: ${confirmedIntent.status}`);

    // Extrair dados do PIX
    const pixData = confirmedIntent.next_action?.pix_display_qr_code;
    
    if (!pixData) {
      throw new Error("Falha ao gerar dados PIX");
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentIntentId: confirmedIntent.id,
        pixCode: pixData.data,
        qrCodeUrl: pixData.image_url_svg,
        expiresAt: pixData.expires_at,
        hostedInstructionsUrl: pixData.hosted_instructions_url,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[PIX] Erro:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
