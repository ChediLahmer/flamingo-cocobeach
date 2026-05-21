import { prisma } from "../lib/prisma.js";
import { authenticate, optionalAuth } from "../lib/auth.js";
import { deleteFile } from "../lib/storage.js";
import {
  validateMultilingual,
  validateIntegerId,
  validateEntityExists,
  handleValidationError,
} from "../lib/validation.js";

export async function spacesRoutes(app) {
  app.get("/", { preHandler: optionalAuth }, async (request) => {
    const { page, limit: rawLimit } = request.query;
    const where = request.admin ? {} : { available: true, visible: true };
    const limit = Math.min(Number(rawLimit) || 20, 100);
    const pageNum = Number(page) || 1;
    const offset = (pageNum - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.space.findMany({
        where,
        orderBy: { order: "asc" },
        take: limit,
        skip: offset,
      }),
      prisma.space.count({ where }),
    ]);
    return {
      items,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limit),
    };
  });

  app.post("/", { preHandler: authenticate }, async (request, reply) => {
    try {
      const {
        name,
        description,
        image,
        price,
        capacity,
        order,
        available,
        visible,
      } = request.body;
      validateMultilingual(name, "name", { required: true, maxLength: 200 });
      if (description)
        validateMultilingual(description, "description", { maxLength: 2000 });

      const space = await prisma.space.create({
        data: {
          name,
          description,
          image,
          price,
          capacity,
          order: order || 0,
          available: available ?? true,
          visible: visible ?? true,
        },
      });
      return reply.status(201).send(space);
    } catch (error) {
      return handleValidationError(error, reply, request.log);
    }
  });

  app.put("/:id", { preHandler: authenticate }, async (request, reply) => {
    try {
      const {
        name,
        description,
        image,
        price,
        capacity,
        order,
        available,
        visible,
      } = request.body;
      if (name) validateMultilingual(name, "name", { maxLength: 200 });
      if (description)
        validateMultilingual(description, "description", { maxLength: 2000 });

      const spaceId = validateIntegerId(Number(request.params.id), "id");
      const space = await prisma.space.findUnique({ where: { id: spaceId } });
      validateEntityExists(space, "id", "Space");

      let oldImage = null;
      if (image !== undefined && space.image && space.image !== image)
        oldImage = space.image;

      const updated = await prisma.space.update({
        where: { id: spaceId },
        data: {
          ...(name && { name }),
          ...(description && { description }),
          ...(image !== undefined && { image }),
          ...(price !== undefined && { price }),
          ...(capacity !== undefined && { capacity }),
          ...(order !== undefined && { order }),
          ...(available !== undefined && { available }),
          ...(visible !== undefined && { visible }),
        },
      });
      if (oldImage) deleteFile(oldImage).catch(() => {});
      return updated;
    } catch (error) {
      return handleValidationError(error, reply, request.log);
    }
  });

  app.delete("/:id", { preHandler: authenticate }, async (request, reply) => {
    const id = Number(request.params.id);
    const space = await prisma.space.findUnique({
      where: { id },
      select: { image: true },
    });
    if (!space)
      return reply
        .status(404)
        .send({ error: "NOT_FOUND_ERROR", message: "Espace non trouvé" });
    await prisma.space.delete({ where: { id } });
    if (space.image) deleteFile(space.image).catch(() => {});
    return reply.status(204).send();
  });
}
