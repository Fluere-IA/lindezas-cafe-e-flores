import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SupportEmailRequest {
  userName: string;
  userEmail: string;
  userPhone?: string;
  message: string;
  ownerEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userName, userEmail, userPhone, message, ownerEmail }: SupportEmailRequest = await req.json();

    console.log("Sending support emails to:", { userEmail, ownerEmail });

    const phoneInfo = userPhone ? `<p><strong>Telefone:</strong> ${userPhone}</p>` : '';

    // Email para o dono (você)
    const ownerEmailResponse = await resend.emails.send({
      from: "Suporte Servire <onboarding@resend.dev>",
      to: [ownerEmail],
      subject: `Nova mensagem de suporte de ${userName}`,
      html: `
        <h2>Nova mensagem de suporte</h2>
        <p><strong>De:</strong> ${userName} (${userEmail})</p>
        ${phoneInfo}
        <hr />
        <p><strong>Mensagem:</strong></p>
        <p>${message.replace(/\n/g, '<br />')}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">Responda diretamente para ${userEmail}</p>
      `,
    });

    console.log("Owner email sent:", ownerEmailResponse);

    // Email de confirmação para o usuário
    const userEmailResponse = await resend.emails.send({
      from: "Suporte Servire <onboarding@resend.dev>",
      to: [userEmail],
      subject: "Recebemos sua mensagem - Suporte Servire",
      html: `
        <h2>Olá, ${userName}!</h2>
        <p>Recebemos sua mensagem e responderemos em breve.</p>
        <hr />
        <p><strong>Sua mensagem:</strong></p>
        <p>${message.replace(/\n/g, '<br />')}</p>
        <hr />
        <p>Atenciosamente,<br />Equipe Servire</p>
      `,
    });

    console.log("User confirmation email sent:", userEmailResponse);

    return new Response(
      JSON.stringify({ success: true, ownerEmailResponse, userEmailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-support-email:", error);
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
