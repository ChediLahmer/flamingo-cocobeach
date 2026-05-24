import crypto from "crypto";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { sendPasswordResetEmail } from "../lib/email.js";

export async function passwordResetRoutes(app) {
  app.post(
    "/forgot-password",
    {
      config: { rateLimit: { max: 3, timeWindow: "15 minutes" } },
      schema: {
        body: {
          type: "object",
          required: ["email"],
          additionalProperties: false,
          properties: {
            email: { type: "string", format: "email", maxLength: 254 },
          },
        },
      },
    },
    async (request, reply) => {
      const { email } = request.body;

      const admin = await prisma.admin.findUnique({ where: { email } });

      if (!admin) {
        return {
          message:
            "Si cet email existe, un lien de réinitialisation a été envoyé.",
        };
      }

      await prisma.passwordReset.updateMany({
        where: { adminId: admin.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await prisma.passwordReset.create({
        data: { token: tokenHash, adminId: admin.id, expiresAt },
      });

      const adminUrl = process.env.ADMIN_URL || "http://localhost:5174";
      const resetUrl = `${adminUrl}/reset-password?token=${encodeURIComponent(token)}`;

      try {
        await sendPasswordResetEmail(email, resetUrl);
      } catch (err) {
        request.log.error(err, "Failed to send reset email");
        return reply.status(500).send({
          error: "INTERNAL_ERROR",
          message: "Impossible d'envoyer l'email. Réessayez plus tard.",
        });
      }

      return {
        message:
          "Si cet email existe, un lien de réinitialisation a été envoyé.",
      };
    },
  );

  app.post(
    "/reset-password",
    {
      schema: {
        body: {
          type: "object",
          required: ["token", "password"],
          additionalProperties: false,
          properties: {
            token: {
              type: "string",
              minLength: 64,
              maxLength: 64,
              pattern: "^[a-f0-9]+$",
            },
            password: { type: "string", minLength: 8, maxLength: 128 },
          },
        },
      },
    },
    async (request, reply) => {
      const { token, password } = request.body;

      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      const resetRecord = await prisma.passwordReset.findUnique({
        where: { token: tokenHash },
      });

      if (
        !resetRecord ||
        resetRecord.usedAt ||
        resetRecord.expiresAt < new Date()
      ) {
        return reply.status(400).send({
          error: "VALIDATION_ERROR",
          message: "Token invalide ou expiré",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      await prisma.$transaction([
        prisma.admin.update({
          where: { id: resetRecord.adminId },
          data: { password: hashedPassword },
        }),
        prisma.passwordReset.update({
          where: { id: resetRecord.id },
          data: { usedAt: new Date() },
        }),
      ]);

      return { message: "Mot de passe mis à jour avec succès" };
    },
  );
}
