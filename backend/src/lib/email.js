import { BrevoClient } from "@getbrevo/brevo";

const brevo = new BrevoClient({ apiKey: process.env.BREVO_API_KEY || "" });

export async function sendPasswordResetEmail(toEmail, resetUrl) {
  await brevo.transactionalEmails.sendTransacEmail({
    sender: {
      name: "Flamingo Coco Beach",
      email: process.env.BREVO_SENDER_EMAIL || "noreply@flamingo-cocobeach.com",
    },
    to: [{ email: toEmail }],
    subject: "Réinitialisation de votre mot de passe",
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1a1a1a;">Réinitialisation du mot de passe</h2>
        <p style="color: #555;">Vous avez demandé la réinitialisation de votre mot de passe pour l'espace admin Flamingo Coco Beach.</p>
        <p style="color: #555;">Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe. Ce lien expire dans <strong>15 minutes</strong>.</p>
        <a href="${resetUrl}" style="display: inline-block; margin: 24px 0; padding: 12px 28px; background-color: #ff6b9d; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
          Réinitialiser le mot de passe
        </a>
        <p style="color: #999; font-size: 12px;">Si vous n'avez pas fait cette demande, ignorez cet email.</p>
      </div>
    `,
  });
}
