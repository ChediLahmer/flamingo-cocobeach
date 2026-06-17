import { prisma } from "../lib/prisma.js";
import { authenticate, optionalAuth, authenticateUser } from "../lib/auth.js";
import {
  validateMultilingual,
  validateIntegerId,
  validateEntityExists,
  handleValidationError,
  ValidationError,
} from "../lib/validation.js";

let publicTestimonialsCache = null;
export function invalidateTestimonialsCache() {
  publicTestimonialsCache = null;
}

function validateRating(value) {
  const r = Number(value);
  if (!Number.isInteger(r) || r < 1 || r > 5) {
    throw new ValidationError(
      "rating",
      "La note doit être un entier entre 1 et 5",
    );
  }
  return r;
}

function validatePayload(body, { partial = false } = {}) {
  const data = {};

  if (body.name !== undefined || !partial) {
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      throw new ValidationError("name", "Le nom est requis");
    }
    if (body.name.length > 100) {
      throw new ValidationError(
        "name",
        "Le nom ne doit pas dépasser 100 caractères",
      );
    }
    data.name = body.name.trim();
  }

  if (body.comment !== undefined || !partial) {
    validateMultilingual(body.comment, "comment", {
      required: true,
      maxLength: 600,
    });
    data.comment = body.comment;
  }

  if (body.role !== undefined) {
    if (body.role) {
      validateMultilingual(body.role, "role", { maxLength: 120 });
    }
    data.role = body.role || null;
  }

  if (body.rating !== undefined || !partial) {
    data.rating = validateRating(body.rating ?? 5);
  }

  if (body.visible !== undefined) data.visible = Boolean(body.visible);
  if (body.order !== undefined) data.order = Number(body.order) || 0;

  return data;
}

export async function testimonialRoutes(app) {
  app.get("/", { preHandler: optionalAuth }, async (request) => {
    if (request.admin) {
      return prisma.testimonial.findMany({
        orderBy: [{ order: "asc" }, { id: "desc" }],
      });
    }

    if (publicTestimonialsCache) return publicTestimonialsCache;
    const result = await prisma.testimonial.findMany({
      where: { visible: true },
      orderBy: [{ order: "asc" }, { id: "desc" }],
    });
    publicTestimonialsCache = result;
    return result;
  });

  app.post("/", { preHandler: authenticate }, async (request, reply) => {
    try {
      const data = validatePayload(request.body);
      const created = await prisma.testimonial.create({ data });
      invalidateTestimonialsCache();
      return reply.status(201).send(created);
    } catch (error) {
      return handleValidationError(error, reply, request.log);
    }
  });

  // Public submission from a logged-in customer. The visitor writes in a single
  // language, which we mirror into all three locale slots so it renders
  // regardless of the active language. Saved hidden, awaiting admin approval.
  app.post(
    "/submit",
    {
      preHandler: authenticateUser,
      config: { rateLimit: { max: 3, timeWindow: "1 hour" } },
    },
    async (request, reply) => {
      try {
        const text =
          typeof request.body?.comment === "string"
            ? request.body.comment.trim()
            : "";
        if (!text) {
          throw new ValidationError("comment", "Le commentaire est requis");
        }
        if (text.length > 600) {
          throw new ValidationError(
            "comment",
            "Le commentaire ne doit pas dépasser 600 caractères",
          );
        }
        const rating = validateRating(request.body?.rating ?? 5);

        const user = await prisma.user.findUnique({
          where: { id: request.user.id },
        });
        if (!user) {
          return reply
            .status(404)
            .send({ error: "NOT_FOUND", message: "Compte introuvable." });
        }

        const name = (user.name || user.email.split("@")[0]).slice(0, 100);
        await prisma.testimonial.create({
          data: {
            name,
            comment: { fr: text, en: text, ar: text },
            rating,
            visible: false,
          },
        });
        return reply.status(201).send({
          message:
            "Merci ! Votre avis a été envoyé et sera publié après validation.",
        });
      } catch (error) {
        return handleValidationError(error, reply, request.log);
      }
    },
  );

  app.put("/:id", { preHandler: authenticate }, async (request, reply) => {
    try {
      const id = validateIntegerId(Number(request.params.id), "id");
      const existing = await prisma.testimonial.findUnique({ where: { id } });
      validateEntityExists(existing, "id", "Testimonial");

      const data = validatePayload(request.body, { partial: true });
      const updated = await prisma.testimonial.update({ where: { id }, data });
      invalidateTestimonialsCache();
      return updated;
    } catch (error) {
      return handleValidationError(error, reply, request.log);
    }
  });

  app.delete("/:id", { preHandler: authenticate }, async (request, reply) => {
    const id = Number(request.params.id);
    await prisma.testimonial.delete({ where: { id } });
    invalidateTestimonialsCache();
    return reply.status(204).send();
  });
}
