import { prisma } from "../lib/prisma.js";
import { authenticate, optionalAuth } from "../lib/auth.js";
import { deleteFile } from "../lib/storage.js";
import {
  validateMultilingual,
  validateIntegerId,
  validateEntityExists,
  handleValidationError,
} from "../lib/validation.js";

let publicMenuCache = null;
export function invalidateMenuCache() {
  publicMenuCache = null;
}

export async function menuRoutes(app) {
  app.get("/categories", { preHandler: optionalAuth }, async (request) => {
    if (!request.admin && publicMenuCache) return publicMenuCache;

    const itemWhere = request.admin ? {} : { visible: true, available: true };
    const result = await prisma.menuCategory.findMany({
      include: { items: { where: itemWhere, orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    });

    if (!request.admin) publicMenuCache = result;
    return result;
  });

  app.post(
    "/categories",
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { name, order } = request.body;
        validateMultilingual(name, "name", { required: true, maxLength: 200 });
        const cat = await prisma.menuCategory.create({
          data: { name, order: order || 0 },
        });
        invalidateMenuCache();
        return reply.status(201).send(cat);
      } catch (error) {
        return handleValidationError(error, reply, request.log);
      }
    },
  );

  app.put(
    "/categories/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { name, order } = request.body;
        if (name) validateMultilingual(name, "name", { maxLength: 200 });
        const id = validateIntegerId(Number(request.params.id), "id");
        const cat = await prisma.menuCategory.findUnique({ where: { id } });
        validateEntityExists(cat, "id", "MenuCategory");
        const updated = await prisma.menuCategory.update({
          where: { id },
          data: { name, order },
        });
        invalidateMenuCache();
        return updated;
      } catch (error) {
        return handleValidationError(error, reply, request.log);
      }
    },
  );

  app.delete(
    "/categories/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      const items = await prisma.menuItem.findMany({
        where: { categoryId: Number(request.params.id) },
        select: { image: true },
      });
      await prisma.menuCategory.delete({
        where: { id: Number(request.params.id) },
      });
      for (const item of items) {
        if (item.image) deleteFile(item.image).catch(() => {});
      }
      invalidateMenuCache();
      return reply.status(204).send();
    },
  );

  app.get("/items", { preHandler: optionalAuth }, async (request) => {
    const { categoryId, page, limit: rawLimit } = request.query;
    const where = request.admin ? {} : { visible: true, available: true };
    if (categoryId) where.categoryId = Number(categoryId);

    const limit = Math.min(Number(rawLimit) || 20, 100);
    const pageNum = Number(page) || 1;
    const offset = (pageNum - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.menuItem.findMany({
        where,
        orderBy: { order: "asc" },
        take: limit,
        skip: offset,
      }),
      prisma.menuItem.count({ where }),
    ]);
    return {
      items,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limit),
    };
  });

  app.post("/items", { preHandler: authenticate }, async (request, reply) => {
    try {
      const {
        name,
        description,
        image,
        priceStandard,
        priceExtra,
        available,
        visible,
        categoryId,
        order,
      } = request.body;
      validateMultilingual(name, "name", { required: true, maxLength: 200 });
      if (description)
        validateMultilingual(description, "description", { maxLength: 2000 });
      const validCatId = validateIntegerId(categoryId, "categoryId");
      const cat = await prisma.menuCategory.findUnique({
        where: { id: validCatId },
      });
      validateEntityExists(cat, "categoryId", "MenuCategory");

      const item = await prisma.menuItem.create({
        data: {
          name,
          description,
          image,
          priceStandard,
          priceExtra: priceExtra || 0,
          available: available ?? true,
          visible: visible ?? true,
          categoryId: validCatId,
          order: order || 0,
        },
      });
      invalidateMenuCache();
      return reply.status(201).send(item);
    } catch (error) {
      return handleValidationError(error, reply, request.log);
    }
  });

  app.put(
    "/items/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const {
          name,
          description,
          image,
          priceStandard,
          priceExtra,
          available,
          visible,
          categoryId,
          order,
        } = request.body;
        if (name) validateMultilingual(name, "name", { maxLength: 200 });
        if (description)
          validateMultilingual(description, "description", { maxLength: 2000 });

        const itemId = validateIntegerId(Number(request.params.id), "id");
        const item = await prisma.menuItem.findUnique({
          where: { id: itemId },
        });
        validateEntityExists(item, "id", "MenuItem");

        let oldImage = null;
        if (image !== undefined && item.image && item.image !== image)
          oldImage = item.image;

        const updated = await prisma.menuItem.update({
          where: { id: itemId },
          data: {
            ...(name && { name }),
            ...(description && { description }),
            ...(image !== undefined && { image }),
            ...(priceStandard !== undefined && { priceStandard }),
            ...(priceExtra !== undefined && { priceExtra }),
            ...(available !== undefined && { available }),
            ...(visible !== undefined && { visible }),
            ...(categoryId && { categoryId }),
            ...(order !== undefined && { order }),
          },
        });
        if (oldImage) deleteFile(oldImage).catch(() => {});
        invalidateMenuCache();
        return updated;
      } catch (error) {
        return handleValidationError(error, reply, request.log);
      }
    },
  );

  app.delete(
    "/items/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      const id = Number(request.params.id);
      const item = await prisma.menuItem.findUnique({
        where: { id },
        select: { image: true },
      });
      if (!item)
        return reply
          .status(404)
          .send({ error: "NOT_FOUND_ERROR", message: "Article non trouvé" });
      await prisma.menuItem.delete({ where: { id } });
      if (item.image) deleteFile(item.image).catch(() => {});
      invalidateMenuCache();
      return reply.status(204).send();
    },
  );
}
