import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteEmailRequest {
  to: string;
  inviterName: string;
  organizationName: string;
  organizationId: string;
  role: string;
  inviteId: string;
  tempPassword: string;
  memberName?: string;
}

const roleLabels: Record<string, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  waiter: 'Garçom',
  cashier: 'Caixa',
  kitchen: 'Cozinha',
};

// Map display role to organization_members role (now supports all roles)
const orgRoleMap: Record<string, string> = {
  admin: 'admin',
  waiter: 'member',
  cashier: 'cashier',
  kitchen: 'kitchen',
  member: 'member',
  owner: 'owner',
};

// Map display role to user_roles database role
const dbRoleMap: Record<string, string> = {
  admin: 'admin',
  waiter: 'cashier',
  cashier: 'cashier',
  kitchen: 'kitchen',
  member: 'cashier',
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-invite-email function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, inviterName, organizationName, organizationId, role, inviteId, tempPassword, memberName }: InviteEmailRequest = await req.json();

    console.log(`Processing invite for: ${to}, organization: ${organizationName}, role: ${role}`);

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === to.toLowerCase());

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      console.log(`User already exists: ${existingUser.id}`);
      userId = existingUser.id;
      
      // Update profile name if provided
      if (memberName) {
        await supabaseAdmin
          .from('profiles')
          .upsert({ id: userId, full_name: memberName }, { onConflict: 'id' });
      }
    } else {
      // Create new user
      console.log(`Creating new user for: ${to}`);
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: to,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { invited: true, full_name: memberName },
      });

      if (createError) {
        console.error("Error creating user:", createError);
        throw new Error(`Erro ao criar usuário: ${createError.message}`);
      }

      if (!newUser.user) {
        throw new Error("Usuário não foi criado");
      }

      userId = newUser.user.id;
      isNewUser = true;
      console.log(`User created successfully: ${userId}`);
      
      // Create profile with name
      if (memberName) {
        await supabaseAdmin
          .from('profiles')
          .upsert({ id: userId, full_name: memberName }, { onConflict: 'id' });
      }
    }

    // Add user to organization with mapped role
    const orgRole = orgRoleMap[role] || 'member';
    console.log(`Adding member with org role: ${orgRole} (from: ${role})`);
    
    const { error: memberError } = await supabaseAdmin
      .from('organization_members')
      .upsert({
        organization_id: organizationId,
        user_id: userId,
        role: orgRole,
      }, { onConflict: 'organization_id,user_id' });

    if (memberError) {
      console.error("Error adding member:", memberError);
      throw new Error(`Erro ao adicionar membro: ${memberError.message}`);
    }

    console.log(`Member added to organization: ${organizationId}`);

    // Add user_roles entry if needed
    const dbRole = dbRoleMap[role] || 'cashier';
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: dbRole,
      }, { onConflict: 'user_id' });

    if (roleError) {
      console.error("Error adding user role:", roleError);
      // Don't throw, role might already exist
    }

    // Update invite status to accepted
    const { error: inviteError } = await supabaseAdmin
      .from('organization_invites')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', inviteId);

    if (inviteError) {
      console.error("Error updating invite:", inviteError);
      // Don't throw, invite update is not critical
    }

    const roleLabel = roleLabels[role] || role;
    
    // Build login URL - user can go straight to login
    const loginUrl = `${req.headers.get('origin') || 'https://servire.app.br'}/auth`;

    const emailResponse = await resend.emails.send({
      from: "Servire <noreply@servire.app.br>",
      to: [to],
      subject: `Você foi adicionado a ${organizationName} - Servire`,
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
                  Você foi adicionado! 🎉
                </h2>
                <p style="color: #64748b; line-height: 1.6; margin: 0 0 24px;">
                  <strong>${inviterName || 'Um administrador'}</strong> adicionou você em <strong>${organizationName}</strong> como <strong>${roleLabel}</strong>.
                </p>
                
                ${isNewUser ? `
                <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
                  <p style="color: #64748b; font-size: 14px; margin: 0 0 8px;">Suas credenciais de acesso:</p>
                  <p style="color: #1e293b; font-size: 14px; margin: 0 0 4px;"><strong>Email:</strong> ${to}</p>
                  <p style="color: #1e293b; font-size: 14px; margin: 0;"><strong>Senha:</strong> ${tempPassword}</p>
                </div>
                ` : `
                <div style="background: #dbeafe; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
                  <p style="color: #1e40af; font-size: 14px; margin: 0;">
                    Você já possui uma conta. Use suas credenciais atuais para acessar.
                  </p>
                </div>
                `}
                
                <a href="${loginUrl}" style="display: inline-block; background: #1E40AF; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">
                  Acessar o Sistema
                </a>
                
                ${isNewUser ? `
                <p style="color: #94a3b8; font-size: 13px; margin: 24px 0 0; line-height: 1.5;">
                  Recomendamos alterar sua senha após o primeiro acesso.
                </p>
                ` : ''}
                <p style="color: #94a3b8; font-size: 13px; margin: 8px 0 0; line-height: 1.5;">
                  Se você não esperava este convite, pode ignorar este email.
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

    console.log("Invite email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      data: emailResponse,
      userId,
      isNewUser,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-invite-email function:", error);
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
