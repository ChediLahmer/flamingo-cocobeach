import { prisma } from "../lib/prisma.js";
import { authenticate } from "../lib/auth.js";
import { deleteFile } from "../lib/storage.js";
import { handleValidationError, ValidationError } from "../lib/validation.js";

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

const MULTILINGUAL_KEYS = new Set([
  "name",
  "tagline",
  "description",
  "address",
  "hours",
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

function validateConfigValue(key, value) {
  if (MULTILINGUAL_KEYS.has(key)) {
    if (!value || typeof value !== "object") {
      throw new ValidationError(key, `${key} doit être un objet {fr, en, ar}`);
    }
    for (const lang of ["fr", "en", "ar"]) {
      if (
        !value[lang] ||
        typeof value[lang] !== "string" ||
        !value[lang].trim()
      ) {
        throw new ValidationError(key, `${key}.${lang} est requis`);
      }
    }
    return JSON.stringify(value);
  }
  if (typeof value !== "string") {
    throw new ValidationError(key, `${key} doit être une chaîne`);
  }
  return value;
}

function parseConfigValue(key, raw) {
  if (MULTILINGUAL_KEYS.has(key)) {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) return parsed;
    } catch {
      // Legacy plain string — wrap as fr-only for backward compat
      return { fr: raw, en: raw, ar: raw };
    }
  }
  return raw;
}

export async function configRoutes(app) {
  app.get("/", async () => {
    if (configCache) return configCache;
    const configs = await prisma.siteConfig.findMany();
    configCache = Object.fromEntries(
      configs.map((c) => [c.key, parseConfigValue(c.key, c.value)]),
    );
    return configCache;
  });

  app.put("/:key", { preHandler: authenticate }, async (request, reply) => {
    try {
      const { key } = request.params;
      if (!ALLOWED_CONFIG_KEYS.has(key)) {
        return reply.status(400).send({
          error: "VALIDATION_ERROR",
          message: `Clé invalide : ${key}`,
        });
      }
      const { value } = request.body;
      const serialized = validateConfigValue(key, value);

      let oldValue = null;
      if (MEDIA_KEYS.has(key)) {
        const old = await prisma.siteConfig.findUnique({ where: { key } });
        if (old?.value && old.value !== serialized) oldValue = old.value;
      }
      const result = await prisma.siteConfig.upsert({
        where: { key },
        update: { value: serialized },
        create: { key, value: serialized },
      });
      invalidateConfigCache();
      if (oldValue) deleteFile(oldValue).catch(() => {});
      return { ...result, value: parseConfigValue(key, result.value) };
    } catch (error) {
      return handleValidationError(error, reply, request.log);
    }
  });

  app.put("/", { preHandler: authenticate }, async (request, reply) => {
    try {
      const entries = Object.entries(request.body);
      const invalid = entries.filter(([k]) => !ALLOWED_CONFIG_KEYS.has(k));
      if (invalid.length) {
        return reply.status(400).send({
          error: "VALIDATION_ERROR",
          message: `Clé(s) invalide(s) : ${invalid.map(([k]) => k).join(", ")}`,
        });
      }

      const serializedEntries = entries.map(([k, v]) => [
        k,
        validateConfigValue(k, v),
      ]);

      const mediaEntries = serializedEntries.filter(([k]) => MEDIA_KEYS.has(k));
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
        serializedEntries.map(([key, value]) =>
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
      return Object.fromEntries(
        configs.map((c) => [c.key, parseConfigValue(c.key, c.value)]),
      );
    } catch (error) {
      return handleValidationError(error, reply, request.log);
    }
  });
}
