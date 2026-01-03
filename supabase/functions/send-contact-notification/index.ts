import { Resend } from "https://esm.sh/resend@2.0.0";
import { z } from "https://esm.sh/zod@3.25.76";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(1).max(5000),
});

type ContactFormRequest = z.infer<typeof contactSchema>;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const raw = await req.json();
    const { name, email, message }: ContactFormRequest = contactSchema.parse(raw);

    console.log("Received contact form submission:", { name, email });

    // NOTE:
    // - The From address must be a verified domain address.
    // - To make the message appear "from" the sender, we set Reply-To to the sender's email.
    const emailResponse = await resend.emails.send({
      from: `${name} via Contact Form <contact@mail.dens.so>`,
      to: ["denis.akoka@gmail.com"],
      subject: `Nouveau message de ${name}`,
      html: `
        <h2>Nouveau message via le formulaire</h2>
        <p><strong>Nom :</strong> ${escapeHtml(name)}</p>
        <p><strong>Email :</strong> ${escapeHtml(email)}</p>
        <p><strong>Message :</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
      `,
      // Reply-To allows you to respond directly to the sender.
      reply_to: email,
      text: `Nouveau message via le formulaire\n\nNom: ${name}\nEmail: ${email}\n\n${message}`,
    });

    console.log("Email send response:", emailResponse);

    // Return provider response so the frontend can detect failures
    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error?.message ?? "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

Deno.serve(handler);
