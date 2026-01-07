import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
  role: string;
  inviteUrl: string;
}

const roleLabels: Record<string, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  member: 'Membro',
  cashier: 'Caixa',
  kitchen: 'Cozinha',
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-invite-email function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, inviterName, organizationName, role, inviteUrl }: InviteEmailRequest = await req.json();

    console.log(`Sending invite email to: ${to} for organization: ${organizationName}`);

    const roleLabel = roleLabels[role] || role;

    const emailResponse = await resend.emails.send({
      from: "Servire <noreply@servire.app.br>",
      to: [to],
      subject: `Convite para ${organizationName} - Servire`,
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
                  Você foi convidado! 🎉
                </h2>
                <p style="color: #64748b; line-height: 1.6; margin: 0 0 24px;">
                  <strong>${inviterName || 'Um administrador'}</strong> convidou você para fazer parte de <strong>${organizationName}</strong> como <strong>${roleLabel}</strong>.
                </p>
                <a href="${inviteUrl}" style="display: inline-block; background: #1E40AF; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">
                  Aceitar Convite
                </a>
                <p style="color: #94a3b8; font-size: 13px; margin: 24px 0 0; line-height: 1.5;">
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

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
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
