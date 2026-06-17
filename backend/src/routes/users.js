import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "../lib/prisma.js";
import { signUserToken, authenticateUser } from "../lib/auth.js";
import { sendWelcomeEmail, sendUserPasswordResetEmail } from "../lib/email.js";

const MAX_FAVORITES = 50;

function clientUrl() {
  if (process.env.CLIENT_URL) return process.env.CLIENT_URL;
  const origin = (process.env.CORS_ORIGIN || "").split(",")[0].trim();
  return origin || "http://localhost:5173";
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    favorites: Array.isArray(user.favorites) ? user.favorites : [],
    createdAt: user.createdAt,
  };
}

function sanitizeFavorite(item) {
  if (!item || typeof item !== "object") return null;
  const id = Number(item.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  return {
    id,
    name:
      item.name && typeof item.name === "object"
        ? {
            fr: String(item.name.fr || "").slice(0, 200),
            en: String(item.name.en || "").slice(0, 200),
            ar: String(item.name.ar || "").slice(0, 200),
          }
        : { fr: String(item.name || "").slice(0, 200), en: "", ar: "" },
    image: item.image ? String(item.image).slice(0, 500) : null,
    priceStandard:
      item.priceStandard != null ? Number(item.priceStandard) : null,
    addedAt: new Date().toISOString(),
  };
}

export async function userRoutes(app) {
  app.post(
    "/register",
    {
      config: { rateLimit: { max: 10, timeWindow: "15 minutes" } },
      schema: {
        body: {
          type: "object",
          required: ["email", "password"],
          additionalProperties: false,
          properties: {
            email: { type: "string", format: "email", maxLength: 254 },
            password: { type: "string", minLength: 8, maxLength: 128 },
            name: { type: "string", maxLength: 80 },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password, name } = request.body;
      const normalizedEmail = email.toLowerCase().trim();

      const existing = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (existing) {
        return reply.status(409).send({
          error: "DUPLICATE_ERROR",
          message: "Un compte avec cet email existe déjà.",
        });
      }

      const hashed = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashed,
          name: name?.trim() || null,
          favorites: [],
        },
      });

      sendWelcomeEmail(normalizedEmail, user.name, clientUrl()).catch((err) =>
        request.log.error(err, "Failed to send welcome email"),
      );

      const token = signUserToken({ id: user.id, email: user.email });
      return reply.status(201).send({ token, user: publicUser(user) });
    },
  );

  app.post(
    "/login",
    {
      config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
      schema: {
        body: {
          type: "object",
          required: ["email", "password"],
          additionalProperties: false,
          properties: {
            email: { type: "string", format: "email", maxLength: 254 },
            password: { type: "string", minLength: 1, maxLength: 128 },
          },
        },
      },
    },
    async (request, reply) => {
      const email = request.body.email.toLowerCase().trim();
      const user = await prisma.user.findUnique({ where: { email } });
      const hash =
        user?.password ||
        "$2b$12$invalidhashpaddingtoconsumetime00000000000000000000";
      const valid = await bcrypt.compare(request.body.password, hash);
      if (!user || !valid) {
        return reply
          .status(401)
          .send({ error: "AUTH_ERROR", message: "Identifiants invalides." });
      }
      const token = signUserToken({ id: user.id, email: user.email });
      return { token, user: publicUser(user) };
    },
  );

  app.get("/me", { preHandler: authenticateUser }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
    });
    if (!user) {
      return reply
        .status(404)
        .send({ error: "NOT_FOUND", message: "Compte introuvable." });
    }
    return publicUser(user);
  });

  // Toggle a dish in the user's saved list ("my last picks" profile).
  app.put(
    "/me/favorites",
    {
      preHandler: authenticateUser,
      schema: {
        body: {
          type: "object",
          required: ["item"],
          additionalProperties: false,
          properties: {
            item: { type: "object" },
          },
        },
      },
    },
    async (request, reply) => {
      const fav = sanitizeFavorite(request.body.item);
      if (!fav) {
        return reply
          .status(400)
          .send({ error: "VALIDATION_ERROR", message: "Plat invalide." });
      }

      const user = await prisma.user.findUnique({
        where: { id: request.user.id },
      });
      if (!user) {
        return reply
          .status(404)
          .send({ error: "NOT_FOUND", message: "Compte introuvable." });
      }

      const current = Array.isArray(user.favorites) ? user.favorites : [];
      const exists = current.some((f) => f.id === fav.id);
      let next = exists
        ? current.filter((f) => f.id !== fav.id)
        : [fav, ...current];
      if (next.length > MAX_FAVORITES) next = next.slice(0, MAX_FAVORITES);

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { favorites: next },
      });
      return { favorites: updated.favorites, added: !exists };
    },
  );

  // Lightweight email capture from the home popup. Always returns a generic
  // message so the endpoint can't be used to probe existing accounts.
  app.post(
    "/subscribe",
    {
      config: { rateLimit: { max: 5, timeWindow: "15 minutes" } },
      schema: {
        body: {
          type: "object",
          required: ["email"],
          additionalProperties: false,
          properties: {
            email: { type: "string", format: "email", maxLength: 254 },
            name: { type: "string", maxLength: 80 },
          },
        },
      },
    },
    async (request) => {
      const email = request.body.email.toLowerCase().trim();
      sendWelcomeEmail(email, request.body.name, clientUrl()).catch((err) =>
        request.log.error(err, "Failed to send welcome email"),
      );
      return {
        message: "Merci ! Surveillez votre boîte mail 🦩",
      };
    },
  );

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
      const email = request.body.email.toLowerCase().trim();
      const genericMessage = {
        message:
          "Si cet email existe, un lien de réinitialisation a été envoyé.",
      };

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return genericMessage;

      await prisma.userPasswordReset.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await prisma.userPasswordReset.create({
        data: { token: tokenHash, userId: user.id, expiresAt },
      });

      const resetUrl = `${clientUrl()}/reset-password?token=${encodeURIComponent(token)}`;

      try {
        await sendUserPasswordResetEmail(email, resetUrl);
      } catch (err) {
        request.log.error(err, "Failed to send user reset email");
        return reply.status(500).send({
          error: "INTERNAL_ERROR",
          message: "Impossible d'envoyer l'email. Réessayez plus tard.",
        });
      }

      return genericMessage;
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

      const resetRecord = await prisma.userPasswordReset.findUnique({
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
        prisma.user.update({
          where: { id: resetRecord.userId },
          data: { password: hashedPassword },
        }),
        prisma.userPasswordReset.update({
          where: { id: resetRecord.id },
          data: { usedAt: new Date() },
        }),
      ]);

      return { message: "Mot de passe mis à jour avec succès" };
    },
  );
}
