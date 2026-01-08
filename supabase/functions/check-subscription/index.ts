import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// Allowed origins for CORS - prevents unauthorized sites from calling this endpoint
const getCorsHeaders = (origin: string | null) => {
  // Allow all Lovable preview and deployed origins
  const isAllowedOrigin = origin && (
    origin.includes('.lovableproject.com') ||
    origin.includes('.lovable.app') ||
    origin.includes('localhost')
  );
  
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin ? origin : "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR: STRIPE_SECRET_KEY is not set");
      throw new Error("Configuration error");
    }
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logStep("ERROR: No valid authorization header provided");
      return new Response(JSON.stringify({ 
        error: "Authentication required", 
        code: "NO_AUTH" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Validating JWT claims");
    
    // Use getClaims for faster JWT validation
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      logStep("ERROR: JWT validation failed", { message: claimsError?.message });
      return new Response(JSON.stringify({ 
        error: "Authentication failed", 
        code: "INVALID_SESSION" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;
    
    if (!userId || !userEmail) {
      logStep("ERROR: User claims incomplete");
      return new Response(JSON.stringify({ 
        error: "Authentication failed", 
        code: "INVALID_SESSION" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    
    // Get user creation date from auth.users for trial calculation
    const { data: fullUserData } = await supabaseClient.auth.admin.getUserById(userId);
    const userCreatedAt = fullUserData?.user?.created_at || new Date().toISOString();
    
    logStep("User authenticated", { userId, email: userEmail, createdAt: userCreatedAt });

    // Get user's organization and find the owner's email for subscription check
    const { data: membershipData, error: membershipError } = await supabaseClient
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', userId)
      .limit(1)
      .single();

    let ownerEmail = userEmail; // Default to current user's email
    let organizationId = null;

    if (membershipData && !membershipError) {
      organizationId = membershipData.organization_id;
      logStep("Found user organization", { organizationId, userRole: membershipData.role });

      // If user is not the owner, find the owner's email for subscription check
      if (membershipData.role !== 'owner') {
        const { data: ownerData, error: ownerError } = await supabaseClient
          .from('organization_members')
          .select('user_id')
          .eq('organization_id', organizationId)
          .eq('role', 'owner')
          .limit(1)
          .single();

        if (ownerData && !ownerError) {
          // Get owner's email from auth.users via profiles or directly
          const { data: ownerUserData, error: ownerUserError } = await supabaseClient.auth.admin.getUserById(ownerData.user_id);
          
          if (ownerUserData?.user?.email && !ownerUserError) {
            ownerEmail = ownerUserData.user.email;
            logStep("Found organization owner", { ownerId: ownerData.user_id, ownerEmail });
          }
        }
      } else {
        logStep("User is the organization owner");
      }
    } else {
      logStep("No organization membership found, using user's own email");
    }

    // Check trial status (7 days from account creation) - based on owner's account
    const TRIAL_DAYS = 7;
    const createdAtDate = new Date(userCreatedAt);
    const trialEndDate = new Date(createdAtDate.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    const now = new Date();
    const isInTrial = now < trialEndDate;
    const trialDaysRemaining = isInTrial ? Math.ceil((trialEndDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) : 0;
    logStep("Trial status checked", { isInTrial, trialDaysRemaining, trialEndDate: trialEndDate.toISOString() });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Check subscription using the owner's email (not the logged-in user)
    const customers = await stripe.customers.list({ email: ownerEmail, limit: 1 });
    logStep("Checking subscription for", { email: ownerEmail, isOwner: ownerEmail === userEmail });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found for owner, checking trial status");
      return new Response(JSON.stringify({ 
        subscribed: false,
        is_in_trial: isInTrial,
        trial_days_remaining: trialDaysRemaining,
        trial_end: trialEndDate.toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let subscriptionEnd = null;
    let planName = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      
      // Safe date conversion
      const periodEnd = subscription.current_period_end;
      if (periodEnd && typeof periodEnd === 'number') {
        subscriptionEnd = new Date(periodEnd * 1000).toISOString();
      }
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      const priceId = subscription.items.data[0].price.id;
      productId = subscription.items.data[0].price.product;
      
      // Map price IDs to plan names (Production)
      if (priceId === "price_1SnI4HHMyb0hj0n72D4sZjWE") {
        planName = "Start";
      } else if (priceId === "price_1SnI5SHMyb0hj0n7XZ4n1heP") {
        planName = "Pro";
      }
      
      logStep("Determined subscription tier", { productId, planName });
    } else {
      logStep("No active subscription found for owner");
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      product_id: productId,
      plan_name: planName,
      subscription_end: subscriptionEnd,
      is_in_trial: isInTrial,
      trial_days_remaining: trialDaysRemaining,
      trial_end: trialEndDate.toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    
    // Return generic error message to client
    return new Response(JSON.stringify({ error: "An error occurred processing your request" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});