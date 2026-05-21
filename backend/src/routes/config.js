import { prisma } from "../lib/prisma.js";
import { authenticate } from "../lib/auth.js";
import { deleteFile } from "../lib/storage.js";
import { handleValidationError } from "../lib/validation.js";

let configCache = null;
export function invalidateConfigCache() {
  configCache = null;
}

const MEDIA_KEYS = new Set([
  "hero_video_url",
  "hero_poster_url",
  "section_video_url",
  "section_poster_url",
  "about_image_1",
  "about_image_2",
  "logo_url",
]);

const ALLOWED_CONFIG_KEYS = new Set([
  "name",
  "email",
  "phone",
  "whatsapp",
  "instagram",
  "facebook",
  "tiktok",
  "address",
  "lat",
  "lng",
  "hours",
  "hero_video_url",
  "hero_poster_url",
  "section_video_url",
  "section_poster_url",
  "about_image_1",
  "about_image_2",
  "logo_url",
  "tagline",
  "description",
]);

export async function configRoutes(app) {
  app.get("/", async () => {
    if (configCache) return configCache;
    const configs = await prisma.siteConfig.findMany();
    configCache = Object.fromEntries(configs.map((c) => [c.key, c.value]));
    return configCache;
  });

  app.put("/:key", { preHandler: authenticate }, async (request, reply) => {
    try {
      const { key } = request.params;
      if (!ALLOWED_CONFIG_KEYS.has(key)) {
        return reply
          .status(400)
          .send({
            error: "VALIDATION_ERROR",
            message: `Clé invalide : ${key}`,
          });
      }
      const { value } = request.body;
      let oldValue = null;
      if (MEDIA_KEYS.has(key)) {
        const old = await prisma.siteConfig.findUnique({ where: { key } });
        if (old?.value && old.value !== value) oldValue = old.value;
      }
      const result = await prisma.siteConfig.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
      invalidateConfigCache();
      if (oldValue) deleteFile(oldValue).catch(() => {});
      return result;
    } catch (error) {
      return handleValidationError(error, reply, request.log);
    }
  });

  app.put("/", { preHandler: authenticate }, async (request, reply) => {
    try {
      const entries = Object.entries(request.body);
      const invalid = entries.filter(([k]) => !ALLOWED_CONFIG_KEYS.has(k));
      if (invalid.length) {
        return reply
          .status(400)
          .send({
            error: "VALIDATION_ERROR",
            message: `Clé(s) invalide(s) : ${invalid.map(([k]) => k).join(", ")}`,
          });
      }

      const mediaEntries = entries.filter(([k]) => MEDIA_KEYS.has(k));
      const oldMediaToDelete = [];
      if (mediaEntries.length) {
        const oldConfigs = await prisma.siteConfig.findMany({
          where: { key: { in: mediaEntries.map(([k]) => k) } },
        });
        const oldMap = Object.fromEntries(
          oldConfigs.map((c) => [c.key, c.value]),
        );
        for (const [k, v] of mediaEntries) {
          if (oldMap[k] && oldMap[k] !== v) oldMediaToDelete.push(oldMap[k]);
        }
      }

      await prisma.$transaction(
        entries.map(([key, value]) =>
          prisma.siteConfig.upsert({
            where: { key },
            update: { value },
            create: { key, value },
          }),
        ),
      );

      invalidateConfigCache();
      for (const url of oldMediaToDelete) deleteFile(url).catch(() => {});

      const configs = await prisma.siteConfig.findMany();
      return Object.fromEntries(configs.map((c) => [c.key, c.value]));
    } catch (error) {
      return handleValidationError(error, reply, request.log);
    }
  });
}
