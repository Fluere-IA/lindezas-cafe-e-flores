import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface LoginStatusRequest {
  userIds: string[];
  organizationId: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("get-members-login-status function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header missing");
    }

    const { userIds, organizationId }: LoginStatusRequest = await req.json();

    if (!userIds || userIds.length === 0) {
      return new Response(JSON.stringify({ loginStatus: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Checking login status for ${userIds.length} users`);

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify requester is authorized
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: requester }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !requester) {
      throw new Error("Unauthorized");
    }

    // Check if requester belongs to the organization
    const { data: membership } = await supabaseAdmin
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', requester.id)
      .single();

    if (!membership) {
      throw new Error("Sem permissão para ver status de login");
    }

    // Get login status for all users
    const loginStatus: Record<string, { hasLoggedIn: boolean; lastSignIn: string | null }> = {};

    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersData?.users) {
      for (const userId of userIds) {
        const user = usersData.users.find(u => u.id === userId);
        if (user) {
          // Check if user has logged in by comparing last_sign_in_at with created_at
          // If they're very close (within 1 minute), user was created but never logged in manually
          const createdAt = new Date(user.created_at).getTime();
          const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : null;
          
          // User has logged in if:
          // 1. last_sign_in_at exists AND
          // 2. last_sign_in_at is more than 1 minute after created_at (indicating manual login, not just account creation)
          const hasLoggedIn = lastSignIn !== null && (lastSignIn - createdAt > 60000);
          
          loginStatus[userId] = {
            hasLoggedIn,
            lastSignIn: user.last_sign_in_at || null,
          };
        }
      }
    }

    console.log("Login status retrieved successfully");

    return new Response(JSON.stringify({ loginStatus }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in get-members-login-status function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
