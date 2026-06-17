import { prisma } from "../lib/prisma.js";
import { authenticate, optionalAuth } from "../lib/auth.js";
import { deleteFile } from "../lib/storage.js";
import {
  validateMultilingual,
  validateIntegerId,
  validateEntityExists,
  handleValidationError,
  ValidationError,
} from "../lib/validation.js";

let publicFlashCache = null;
export function invalidateFlashCache() {
  publicFlashCache = null;
}

function parseDate(value, field) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new ValidationError(field, `${field} doit être une date valide`);
  }
  return d;
}

function validatePayload(body, { partial = false } = {}) {
  const data = {};

  if (body.title !== undefined || !partial) {
    validateMultilingual(body.title, "title", {
      required: true,
      maxLength: 120,
    });
    data.title = body.title;
  }
  if (body.description !== undefined) {
    if (body.description) {
      validateMultilingual(body.description, "description", { maxLength: 600 });
    }
    data.description = body.description || null;
  }
  if (body.image !== undefined) data.image = body.image || null;

  if (body.discountPercent !== undefined) {
    const d = Number(body.discountPercent);
    if (!Number.isInteger(d) || d < 0 || d > 100) {
      throw new ValidationError(
        "discountPercent",
        "La remise doit être un entier entre 0 et 100",
      );
    }
    data.discountPercent = d;
  }
  if (
    body.originalPrice !== undefined &&
    body.originalPrice !== null &&
    body.originalPrice !== ""
  ) {
    const p = Number(body.originalPrice);
    if (Number.isNaN(p) || p < 0) {
      throw new ValidationError("originalPrice", "Prix invalide");
    }
    data.originalPrice = p;
  } else if (body.originalPrice === null || body.originalPrice === "") {
    data.originalPrice = null;
  }

  if (body.startsAt !== undefined)
    data.startsAt = parseDate(body.startsAt, "startsAt");
  if (body.endsAt !== undefined || !partial) {
    data.endsAt = parseDate(body.endsAt, "endsAt");
  }
  if (data.startsAt && data.endsAt && data.endsAt <= data.startsAt) {
    throw new ValidationError(
      "endsAt",
      "La date de fin doit être après le début",
    );
  }
  if (body.visible !== undefined) data.visible = Boolean(body.visible);
  if (body.order !== undefined) data.order = Number(body.order) || 0;

  return data;
}

export async function flashSaleRoutes(app) {
  app.get("/", { preHandler: optionalAuth }, async (request) => {
    if (request.admin) {
      return prisma.flashSale.findMany({
        orderBy: [{ order: "asc" }, { endsAt: "asc" }],
      });
    }

    if (publicFlashCache) return publicFlashCache;
    const now = new Date();
    const result = await prisma.flashSale.findMany({
      where: { visible: true, endsAt: { gt: now } },
      orderBy: [{ order: "asc" }, { endsAt: "asc" }],
    });
    publicFlashCache = result;
    return result;
  });

  app.post("/", { preHandler: authenticate }, async (request, reply) => {
    try {
      const data = validatePayload(request.body);
      const sale = await prisma.flashSale.create({ data });
      invalidateFlashCache();
      return reply.status(201).send(sale);
    } catch (error) {
      return handleValidationError(error, reply, request.log);
    }
  });

  app.put("/:id", { preHandler: authenticate }, async (request, reply) => {
    try {
      const id = validateIntegerId(Number(request.params.id), "id");
      const existing = await prisma.flashSale.findUnique({ where: { id } });
      validateEntityExists(existing, "id", "FlashSale");

      const data = validatePayload(request.body, { partial: true });
      if (
        data.image !== undefined &&
        existing.image &&
        existing.image !== data.image
      ) {
        deleteFile(existing.image).catch(() => {});
      }
      const updated = await prisma.flashSale.update({ where: { id }, data });
      invalidateFlashCache();
      return updated;
    } catch (error) {
      return handleValidationError(error, reply, request.log);
    }
  });

  app.delete("/:id", { preHandler: authenticate }, async (request, reply) => {
    const id = Number(request.params.id);
    const existing = await prisma.flashSale.findUnique({ where: { id } });
    if (existing?.image) deleteFile(existing.image).catch(() => {});
    await prisma.flashSale.delete({ where: { id } });
    invalidateFlashCache();
    return reply.status(204).send();
  });
}
