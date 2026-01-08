import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0?target=deno";

const isAllowedOrigin = (origin: string | null) => {
  return origin && (
    origin.includes('.lovableproject.com') ||
    origin.includes('.lovable.app') ||
    origin.includes('localhost')
  );
};

const getCorsHeaders = (origin: string | null) => {
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin(origin) ? origin! : "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require authentication
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    logStep("Authentication required - no auth header");
    return new Response(
      JSON.stringify({ error: "Authentication required" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
    );
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );

  try {
    // Validate user authentication
    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !userData?.user) {
      logStep("Invalid token", { error: userError?.message });
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const userId = userData.user.id;
    const userEmail = userData.user.email;
    logStep("User authenticated", { userId, email: userEmail });

    const { priceId, successUrl, cancelUrl } = await req.json();
    logStep("Creating checkout session", { priceId });

    if (!priceId) {
      logStep("ERROR: Price ID is required");
      throw new Error("Missing required parameter");
    }

    // Validate priceId against allowed values (whitelist)
    const allowedPriceIds = [
      Deno.env.get("STRIPE_PRICE_START"),
      Deno.env.get("STRIPE_PRICE_PRO"),
    ].filter(Boolean);
    
    // If we have configured price IDs, validate against them
    if (allowedPriceIds.length > 0 && !allowedPriceIds.includes(priceId)) {
      logStep("Invalid priceId", { priceId, allowed: allowedPriceIds });
      throw new Error("Invalid request");
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      logStep("ERROR: Stripe secret key not configured");
      throw new Error("Configuration error");
    }

    let customerId: string | undefined;

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer already exists in Stripe
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Existing Stripe customer found", { customerId });
      }
    }

    // Validate and use origin from allowlist for redirect URLs
    const validOrigin = isAllowedOrigin(origin) ? origin : 'https://lindezas.lovable.app';

    // Create Stripe checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${validOrigin}/checkout/sucesso`,
      cancel_url: cancelUrl || `${validOrigin}/planos?checkout=cancelled`,
      allow_promotion_codes: true,
    });

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR creating checkout session", { message: errorMessage });
    
    // Return generic error message to client
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});