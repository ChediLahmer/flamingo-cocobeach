import { prisma } from "../lib/prisma.js";
import { authenticate, optionalAuth } from "../lib/auth.js";
import { uploadFile, deleteFile } from "../lib/storage.js";
import { fileTypeFromBuffer } from "file-type";
import { createHash } from "crypto";
import {
  isBrowserMimeAllowed,
  isDetectedMimeAllowed,
  isSvgBuffer,
  processMedia,
  ERROR_MSG_BROWSER,
  ERROR_MSG_CONTENT,
} from "../lib/media.js";
import {
  validateMultilingual,
  validateIntegerId,
  validateEntityExists,
  handleValidationError,
} from "../lib/validation.js";

export async function galleryRoutes(app) {
  // Categories
  app.get("/categories", async () => {
    return prisma.galleryCategory.findMany({ orderBy: { order: "asc" } });
  });

  app.post(
    "/categories",
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { name, order } = request.body;
        validateMultilingual(name, "name", { required: true, maxLength: 200 });
        const cat = await prisma.galleryCategory.create({
          data: { name, order: order ?? 0 },
        });
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
        const cat = await prisma.galleryCategory.findUnique({ where: { id } });
        validateEntityExists(cat, "id", "GalleryCategory");
        const data = {};
        if (name !== undefined) data.name = name;
        if (order !== undefined) data.order = order;
        const updated = await prisma.galleryCategory.update({
          where: { id },
          data,
        });
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
      await prisma.galleryCategory.delete({
        where: { id: Number(request.params.id) },
      });
      return reply.status(204).send();
    },
  );

  // Images
  app.get("/", { preHandler: optionalAuth }, async (request) => {
    const { limit: rawLimit, cursor, categoryId } = request.query;
    const limit = Math.min(Number(rawLimit) || 20, 100);
    const where = {};
    if (categoryId) where.categoryId = Number(categoryId);
    if (!request.admin) {
      where.visible = true;
      where.url = { not: { contains: "/incoming/" } };
    }

    const images = await prisma.galleryImage.findMany({
      where,
      include: { catRef: true },
      orderBy: { order: "asc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: Number(cursor) }, skip: 1 } : {}),
    });

    const hasMore = images.length > limit;
    const items = hasMore ? images.slice(0, limit) : images;
    const nextCursor = hasMore ? items[items.length - 1].id : null;
    return { items, nextCursor };
  });

  app.post("/", { preHandler: authenticate }, async (request, reply) => {
    try {
      if (!request.isMultipart || !request.isMultipart()) {
        const { url, alt, categoryId, order } = request.body || {};
        if (!url)
          return reply.status(400).send({
            error: "VALIDATION_ERROR",
            message: "URL ou fichier requis",
          });

        let validCatId = null;
        if (categoryId) {
          validCatId = validateIntegerId(categoryId, "categoryId");
          const cat = await prisma.galleryCategory.findUnique({
            where: { id: validCatId },
          });
          validateEntityExists(cat, "categoryId", "GalleryCategory");
        }

        const image = await prisma.galleryImage.create({
          data: {
            url,
            alt: alt || null,
            categoryId: validCatId,
            order: order ?? 0,
          },
          include: { catRef: true },
        });
        return reply.status(201).send(image);
      }

      const file = await request.file();
      if (!file)
        return reply
          .status(400)
          .send({ error: "VALIDATION_ERROR", message: "Aucun fichier fourni" });
      if (!isBrowserMimeAllowed(file.mimetype))
        return reply
          .status(400)
          .send({ error: "VALIDATION_ERROR", message: ERROR_MSG_BROWSER });

      const rawBuffer = await file.toBuffer();
      let detectedMime;
      if (isSvgBuffer(file.mimetype, rawBuffer)) {
        detectedMime = "image/svg+xml";
      } else {
        const detected = await fileTypeFromBuffer(rawBuffer);
        if (!detected || !isDetectedMimeAllowed(detected.mime))
          return reply.status(400).send({ error: ERROR_MSG_CONTENT });
        detectedMime = detected.mime;
      }

      const { buffer, mime, ext, baseName } = await processMedia(
        rawBuffer,
        detectedMime,
        file.filename,
      );
      const finalName = ext
        ? `${baseName || file.filename.replace(/\.[^.]+$/, "")}.${ext}`
        : file.filename;
      const url = await uploadFile(buffer, finalName, mime);

      const categoryId = file.fields?.categoryId?.value
        ? Number(file.fields.categoryId.value)
        : null;
      let validCatId = null;
      if (categoryId) {
        validCatId = validateIntegerId(categoryId, "categoryId");
        const cat = await prisma.galleryCategory.findUnique({
          where: { id: validCatId },
        });
        validateEntityExists(cat, "categoryId", "GalleryCategory");
      }

      const image = await prisma.galleryImage.create({
        data: { url, alt: file.filename, categoryId: validCatId, order: 0 },
        include: { catRef: true },
      });
      return reply.status(201).send(image);
    } catch (error) {
      return handleValidationError(error, reply, request.log);
    }
  });

  app.put("/:id", { preHandler: authenticate }, async (request, reply) => {
    try {
      const { order, alt, categoryId, visible } = request.body;
      const imageId = validateIntegerId(Number(request.params.id), "id");
      const image = await prisma.galleryImage.findUnique({
        where: { id: imageId },
      });
      validateEntityExists(image, "id", "GalleryImage");

      const data = {};
      if (order !== undefined) data.order = order;
      if (alt !== undefined) data.alt = alt;
      if (categoryId !== undefined) data.categoryId = categoryId;
      if (visible !== undefined) data.visible = visible;

      const updated = await prisma.galleryImage.update({
        where: { id: imageId },
        data,
        include: { catRef: true },
      });
      return updated;
    } catch (error) {
      return handleValidationError(error, reply, request.log);
    }
  });

  app.delete("/:id", { preHandler: authenticate }, async (request, reply) => {
    const id = Number(request.params.id);
    const image = await prisma.galleryImage.findUnique({ where: { id } });
    if (!image)
      return reply
        .status(404)
        .send({ error: "NOT_FOUND_ERROR", message: "Image non trouvée" });
    await prisma.galleryImage.delete({ where: { id } });
    deleteFile(image.url).catch(() => {});
    return reply.status(204).send();
  });
}
