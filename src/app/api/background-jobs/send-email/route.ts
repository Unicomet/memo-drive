import { EmailTemplate } from "~/components/email-welcome";
import { Resend } from "resend";
import { tryCatch } from "~/lib/utils";
import { z } from "zod";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendOnboardingEmail(toEmail: string, firstName: string) {
  console.log(toEmail, firstName);
  const { data, error } = await resend.emails.send({
    from: "Acme <onboarding@resend.dev>",
    to: toEmail,
    subject: "Hello world",
    react: EmailTemplate({ firstName }),
  });

  if (error) {
    console.error(error);
    throw new Error("Failed to send onboarding email");
  }
  return data;
}

const sendEmailSchema = z.object({
  type: z.string(),
  to: z.string().email(),
  firstName: z.string(),
});

async function handler(request: Request) {
  const body = (await request.json()) as unknown;
  const parsedBody = sendEmailSchema.safeParse(body);

  if (!parsedBody.success) {
    return new Response("Invalid request body", { status: 400 });
  }

  const { to, firstName } = parsedBody.data;

  const { data, error } = await tryCatch(sendOnboardingEmail(to, firstName));

  console.log("Email send result:", { data, error });
  if (error) {
    return new Response(`Failed to send email: ${error.message}`, {
      status: 500,
    });
  }
  return new Response(`Email successfully sent: ${JSON.stringify(data)}`, {
    status: 200,
  });
}

export const POST = verifySignatureAppRouter(handler);
