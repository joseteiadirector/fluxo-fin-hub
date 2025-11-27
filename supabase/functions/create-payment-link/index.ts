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
    console.log("[PAYMENT-LINK] Iniciando criação de link de pagamento");

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

    console.log(`[PAYMENT-LINK] Usuário: ${user.email}`);

    // Parse do body
    const { productName, amount, description, quantity } = await req.json();
    
    if (!productName || !amount || amount <= 0) {
      throw new Error("Nome do produto e valor são obrigatórios");
    }

    console.log(`[PAYMENT-LINK] Produto: ${productName}, Valor: R$ ${(amount / 100).toFixed(2)}`);

    // Inicializar Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Criar produto
    const product = await stripe.products.create({
      name: productName,
      description: description || undefined,
      metadata: {
        created_by: user.id,
        created_by_email: user.email,
      },
    });

    console.log(`[PAYMENT-LINK] Produto criado: ${product.id}`);

    // Criar preço
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(amount), // em centavos
      currency: "brl",
    });

    console.log(`[PAYMENT-LINK] Preço criado: ${price.id}`);

    // Criar Payment Link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: quantity || 1,
        },
      ],
      after_completion: {
        type: "hosted_confirmation",
        hosted_confirmation: {
          custom_message: "Obrigado pelo pagamento! Você receberá uma confirmação por e-mail.",
        },
      },
    });

    console.log(`[PAYMENT-LINK] Link criado: ${paymentLink.url}`);

    // Salvar no banco para histórico
    await supabaseClient.from("services_logs").insert({
      user_id: user.id,
      tipo_servico: "PaymentLink",
      detalhes: {
        product_name: productName,
        amount: amount / 100,
        link_url: paymentLink.url,
        product_id: product.id,
        price_id: price.id,
        payment_link_id: paymentLink.id,
        created_at: new Date().toISOString(),
      },
      valor: amount / 100,
    });

    return new Response(
      JSON.stringify({
        success: true,
        paymentLink: paymentLink.url,
        productId: product.id,
        priceId: price.id,
        linkId: paymentLink.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[PAYMENT-LINK] Erro:", error);
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
