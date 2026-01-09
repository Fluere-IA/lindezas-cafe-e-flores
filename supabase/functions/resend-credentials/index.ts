import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ResendCredentialsRequest {
  userId: string;
  organizationId: string;
  organizationName: string;
  newPassword: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("resend-credentials function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header missing");
    }

    const { userId, organizationId, organizationName, newPassword }: ResendCredentialsRequest = await req.json();

    console.log(`Resending credentials for user: ${userId}`);

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify requester is authorized (owner or admin of org)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: requester }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !requester) {
      throw new Error("Unauthorized");
    }

    // Check if requester is owner or admin
    const { data: requesterMembership } = await supabaseAdmin
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', requester.id)
      .single();

    if (!requesterMembership || !['owner', 'admin'].includes(requesterMembership.role)) {
      throw new Error("Sem permissão para reenviar credenciais");
    }

    // Get target user info
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !userData.user) {
      throw new Error("Usuário não encontrado");
    }

    const userEmail = userData.user.email;
    if (!userEmail) {
      throw new Error("Email do usuário não encontrado");
    }

    // Get user profile name
    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    const userName = profileData?.full_name || 'Membro';

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (updateError) {
      console.error("Error updating password:", updateError);
      throw new Error(`Erro ao atualizar senha: ${updateError.message}`);
    }

    console.log("Password updated successfully");

    // Build login URL
    const loginUrl = `${req.headers.get('origin') || 'https://servire.app.br'}/auth`;

    // Send email with new credentials
    const emailResponse = await resend.emails.send({
      from: "Servire <noreply@servire.app.br>",
      to: [userEmail],
      subject: `Suas novas credenciais - ${organizationName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 40px 20px;">
            <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%); padding: 32px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Servire</h1>
              </div>
              <div style="padding: 32px;">
                <h2 style="color: #1e293b; margin: 0 0 16px; font-size: 20px;">
                  Olá, ${userName}! 👋
                </h2>
                <p style="color: #64748b; line-height: 1.6; margin: 0 0 24px;">
                  Sua senha de acesso à <strong>${organizationName}</strong> foi redefinida. Confira suas novas credenciais:
                </p>
                
                <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
                  <p style="color: #64748b; font-size: 14px; margin: 0 0 8px;">Credenciais de acesso:</p>
                  <p style="color: #1e293b; font-size: 14px; margin: 0 0 4px;"><strong>Email:</strong> ${userEmail}</p>
                  <p style="color: #1e293b; font-size: 14px; margin: 0;"><strong>Senha:</strong> ${newPassword}</p>
                </div>
                
                <a href="${loginUrl}" style="display: inline-block; background: #1E40AF; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">
                  Acessar o Sistema
                </a>
                
                <p style="color: #94a3b8; font-size: 13px; margin: 24px 0 0; line-height: 1.5;">
                  Recomendamos alterar sua senha após o acesso.
                </p>
              </div>
              <div style="background: #f8fafc; padding: 20px 32px; text-align: center;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} Servire. Todos os direitos reservados.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Credentials email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Credenciais enviadas por email com sucesso",
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in resend-credentials function:", error);
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
