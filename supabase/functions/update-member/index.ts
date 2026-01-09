import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdateMemberRequest {
  memberId: string;
  userId: string;
  organizationId: string;
  organizationName: string;
  updates: {
    name?: string;
    email?: string;
    role?: string;
    resetPassword?: boolean;
    newPassword?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("update-member function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify the requester is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { memberId, userId, organizationId, organizationName, updates }: UpdateMemberRequest = await req.json();

    if (!memberId || !userId || !organizationId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the requester is an owner or admin of the organization
    const { data: requesterMembership, error: membershipError } = await supabaseAdmin
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", userData.user.id)
      .single();

    if (membershipError || !requesterMembership) {
      return new Response(
        JSON.stringify({ error: "You are not a member of this organization" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["owner", "admin"].includes(requesterMembership.role)) {
      return new Response(
        JSON.stringify({ error: "Only owners and admins can update members" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if target is an owner (cannot edit owners)
    const { data: targetMembership } = await supabaseAdmin
      .from("organization_members")
      .select("role")
      .eq("id", memberId)
      .single();

    if (targetMembership?.role === "owner") {
      return new Response(
        JSON.stringify({ error: "Cannot edit organization owner" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: Record<string, boolean> = {};
    let emailSent = false;
    let newEmail: string | undefined;
    let newPassword: string | undefined;

    // Update name in profiles table
    if (updates.name) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ full_name: updates.name })
        .eq("id", userId);

      if (profileError) {
        console.error("Error updating profile name:", profileError);
        results.nameUpdated = false;
      } else {
        results.nameUpdated = true;
        console.log(`Profile name updated for user ${userId}`);
      }
    }

    // Update role in organization_members
    if (updates.role) {
      const { error: roleError } = await supabaseAdmin
        .from("organization_members")
        .update({ role: updates.role })
        .eq("id", memberId);

      if (roleError) {
        console.error("Error updating role:", roleError);
        results.roleUpdated = false;
      } else {
        results.roleUpdated = true;
        console.log(`Role updated to ${updates.role} for member ${memberId}`);
      }
    }

    // Update email in auth.users
    if (updates.email) {
      const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: updates.email,
        email_confirm: true,
      });

      if (emailError) {
        console.error("Error updating email:", emailError);
        results.emailUpdated = false;
      } else {
        results.emailUpdated = true;
        newEmail = updates.email;
        console.log(`Email updated for user ${userId}`);
      }
    }

    // Reset password
    if (updates.resetPassword && updates.newPassword) {
      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: updates.newPassword,
      });

      if (passwordError) {
        console.error("Error resetting password:", passwordError);
        results.passwordReset = false;
      } else {
        results.passwordReset = true;
        newPassword = updates.newPassword;
        console.log(`Password reset for user ${userId}`);
      }
    }

    // Get user's current email for sending notification
    const { data: userInfo } = await supabaseAdmin.auth.admin.getUserById(userId);
    const userEmail = newEmail || userInfo?.user?.email;

    // Send email notification if password was reset or email was changed
    if (userEmail && (newPassword || newEmail)) {
      try {
        await resend.emails.send({
          from: "Servire <noreply@servire.app.br>",
          to: [userEmail],
          subject: `Suas credenciais foram atualizadas - ${organizationName}`,
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
                      Credenciais Atualizadas
                    </h2>
                    <p style="color: #64748b; line-height: 1.6; margin: 0 0 24px;">
                      Suas credenciais de acesso ao <strong>${organizationName}</strong> foram atualizadas.
                    </p>
                    
                    <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
                      <p style="color: #64748b; font-size: 14px; margin: 0 0 8px;">Suas novas credenciais:</p>
                      <p style="color: #1e293b; font-size: 14px; margin: 0 0 4px;"><strong>Email:</strong> ${userEmail}</p>
                      ${newPassword ? `<p style="color: #1e293b; font-size: 14px; margin: 0;"><strong>Nova senha:</strong> ${newPassword}</p>` : ''}
                    </div>
                    
                    <a href="${req.headers.get('origin') || 'https://servire.app.br'}/auth" style="display: inline-block; background: #1E40AF; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">
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
        emailSent = true;
        console.log("Credentials update email sent successfully");
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        emailSent,
        message: "Member updated successfully"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in update-member function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
