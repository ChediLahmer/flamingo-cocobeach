import { BrevoClient } from "@getbrevo/brevo";

if (process.env.NODE_ENV === "production" && !process.env.BREVO_API_KEY) {
  console.warn(
    "WARNING: BREVO_API_KEY not set — password reset emails will fail",
  );
}

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
      </div>
    `,
  });
}

export async function sendUserPasswordResetEmail(toEmail, resetUrl) {
  await brevo.transactionalEmails.sendTransacEmail({
    sender: {
      name: "Flamingo Coco Beach",
      email: process.env.BREVO_SENDER_EMAIL || "noreply@flamingo-cocobeach.com",
    },
    to: [{ email: toEmail }],
    subject: "Réinitialisation de votre mot de passe",
    htmlContent: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; background:#fdf6f0; border-radius:18px; overflow:hidden;">
        <div style="background: linear-gradient(135deg,#ff6b9d,#ff8a50); padding: 32px; text-align:center;">
          <div style="font-size:42px;">🦩</div>
          <h1 style="color:#fff; margin:6px 0 0; font-size:22px; letter-spacing:1px;">FLAMINGO COCO BEACH</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="color:#1a1a2e; margin-top:0;">Réinitialisation du mot de passe</h2>
          <p style="color:#555; line-height:1.6;">Vous avez demandé la réinitialisation du mot de passe de votre compte Flamingo Coco Beach.</p>
          <p style="color:#555; line-height:1.6;">Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe. Ce lien expire dans <strong>15 minutes</strong>.</p>
          <a href="${resetUrl}" style="display:inline-block; margin: 22px 0 6px; padding: 13px 30px; background:#ff6b9d; color:white; text-decoration:none; border-radius:999px; font-weight:bold;">
            Réinitialiser le mot de passe
          </a>
          <p style="color:#999; font-size:12px; margin-top:18px;">Si vous n'avez pas fait cette demande, ignorez cet email.</p>
        </div>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(toEmail, name, siteUrl) {
  const greeting = name ? `Bonjour ${name}` : "Bonjour";
  const cta = siteUrl || "https://flamingo-cocobeach.com";
  await brevo.transactionalEmails.sendTransacEmail({
    sender: {
      name: "Flamingo Coco Beach",
      email: process.env.BREVO_SENDER_EMAIL || "noreply@flamingo-cocobeach.com",
    },
    to: [{ email: toEmail }],
    subject: "🦩 Bienvenue chez Flamingo Coco Beach !",
    htmlContent: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; background:#fdf6f0; border-radius:18px; overflow:hidden;">
        <div style="background: linear-gradient(135deg,#ff6b9d,#ff8a50); padding: 36px 32px; text-align:center;">
          <div style="font-size:46px;">🦩</div>
          <h1 style="color:#fff; margin:8px 0 0; font-size:26px; letter-spacing:1px;">FLAMINGO COCO BEACH</h1>
          <p style="color:rgba(255,255,255,0.9); margin:6px 0 0; font-size:14px;">Le paradis tropical qui prend vie</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="color:#1a1a2e; margin-top:0;">${greeting} 🌴</h2>
          <p style="color:#555; line-height:1.6;">Merci d'avoir rejoint la communauté Flamingo Coco Beach&nbsp;! Vous pourrez désormais enregistrer vos plats préférés et retrouver vos coups de cœur à chaque visite.</p>
          <p style="color:#555; line-height:1.6;">Soleil, cocktails tropicaux et bonne ambiance vous attendent. 🍹</p>
          <a href="${cta}" style="display:inline-block; margin: 22px 0 6px; padding: 13px 30px; background:#ff6b9d; color:white; text-decoration:none; border-radius:999px; font-weight:bold;">
            Découvrir le menu
          </a>
        </div>
        <div style="padding: 18px 32px; background:#fff0f5; text-align:center;">
          <p style="color:#999; font-size:12px; margin:0;">À très vite sur la plage ! 🌊</p>
        </div>
      </div>
    `,
  });
}
