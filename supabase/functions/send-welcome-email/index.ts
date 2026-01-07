import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0?target=deno";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name?: string;
  companyName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-welcome-email function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, companyName }: WelcomeEmailRequest = await req.json();
    
    console.log(`Sending welcome email to ${email}`);

    if (!email) {
      console.error("Missing email field");
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Use defaults for optional fields
    const displayName = name || "Usuário";
    const displayCompany = companyName || "seu estabelecimento";

    const emailResponse = await resend.emails.send({
      from: "Servire <noreply@servire.app.br>",
      to: [email],
      subject: "Bem-vindo ao Servire! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563EB; margin: 0;">Servire</h1>
          </div>
          
          <div style="background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h2 style="margin: 0 0 10px 0; font-size: 24px;">Bem-vindo(a), ${displayName}! 🎉</h2>
            <p style="margin: 0; opacity: 0.9;">Sua conta foi criada com sucesso!</p>
          </div>
          
          <div style="background: #f9fafb; padding: 25px; border-radius: 12px; margin-bottom: 30px;">
            <h3 style="margin: 0 0 15px 0; color: #1f2937;">Próximos passos:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
              <li style="margin-bottom: 10px;">Complete o onboarding do seu estabelecimento</li>
              <li style="margin-bottom: 10px;">Configure seu cardápio de produtos</li>
              <li style="margin-bottom: 10px;">Convide membros da sua equipe</li>
              <li style="margin-bottom: 10px;">Comece a receber pedidos!</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <p style="color: #4b5563; margin-bottom: 15px;">Você tem <strong>7 dias de teste grátis</strong> para explorar todas as funcionalidades.</p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            Se você não criou esta conta, pode ignorar este e-mail.
          </p>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} Servire. Todos os direitos reservados.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
