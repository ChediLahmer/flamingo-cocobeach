import { createHash } from "crypto";
import { prisma } from "./prisma.js";
import { processMedia } from "./media.js";
import {
  buildPublicUrl,
  deleteObjectKey,
  findExistingByHash,
  getObjectBuffer,
  listObjects,
  headObject,
  uploadBufferToKey,
  writeDedupMarker,
} from "./storage.js";

const INCOMING_PREFIX = "incoming/";

// Guards against concurrent runs (heavy ffmpeg transcodes) across the
// per-upload immediate trigger and the weekly cron fallback.
let isRunning = false;
let rerunRequested = false;

// Read routes cache config + menu + flash in memory; refresh them after a
// background swap so promoted media becomes visible without the next write.
async function invalidateReadCaches() {
  try {
    const [config, menu, flash] = await Promise.all([
      import("../routes/config.js"),
      import("../routes/menu.js"),
      import("../routes/flash-sales.js"),
    ]);
    config.invalidateConfigCache?.();
    menu.invalidateMenuCache?.();
    flash.invalidateFlashCache?.();
  } catch {
    // cache invalidation is best-effort
  }
}

function urlToIncomingKey(url) {
  const marker = "/incoming/";
  const index = typeof url === "string" ? url.indexOf(marker) : -1;
  if (index === -1) return null;
  return url.slice(index + 1);
}

async function replaceUrlEverywhere(oldUrl, newUrl) {
  if (!oldUrl || oldUrl === newUrl) return 0;

  const updates = await Promise.all([
    prisma.siteConfig.updateMany({
      where: { value: oldUrl },
      data: { value: newUrl },
    }),
    prisma.menuItem.updateMany({
      where: { image: oldUrl },
      data: { image: newUrl },
    }),
    prisma.space.updateMany({
      where: { image: oldUrl },
      data: { image: newUrl },
    }),
    prisma.flashSale.updateMany({
      where: { image: oldUrl },
      data: { image: newUrl },
    }),
    prisma.galleryImage.updateMany({
      where: { url: oldUrl },
      data: { url: newUrl },
    }),
  ]);

  return updates.reduce((sum, item) => sum + item.count, 0);
}

export async function processIncomingUploads(logger, { limit = 10 } = {}) {
  // Serialize runs: ffmpeg transcodes are heavy, and the immediate (setTimeout)
  // trigger fires once per upload. Without this guard, several quick video
  // uploads would spawn concurrent ffmpeg processes and could OOM a small VPS.
  // If a run is requested while one is active, re-run once it finishes so newly
  // arrived uploads are still picked up.
  if (isRunning) {
    rerunRequested = true;
    return 0;
  }
  isRunning = true;
  let total = 0;
  try {
    do {
      rerunRequested = false;
      total += await processIncomingBatch(logger, limit);
    } while (rerunRequested);
  } finally {
    isRunning = false;
  }
  return total;
}

async function processIncomingBatch(logger, limit) {
  const objects = await listObjects(INCOMING_PREFIX);
  const candidates = objects
    .filter((object) => object.Key && !object.Key.endsWith("/"))
    .slice(0, limit);

  if (!candidates.length) return 0;

  let processed = 0;
  for (const object of candidates) {
    const key = object.Key;
    const tempUrl = buildPublicUrl(key);
    try {
      const head = await headObject(key);
      const contentType = head.ContentType || "application/octet-stream";
      const buffer = await getObjectBuffer(key);

      // Transcode videos to a web-safe H.264 MP4 in the background so the
      // upload request itself never waits for ffmpeg (avoids proxy timeouts).
      let outBuffer = buffer;
      let outContentType = contentType;
      let strippedKey = key.replace(/^incoming\//, "");
      let finalKey = strippedKey;
      if (contentType.startsWith("video/")) {
        try {
          const processedMedia = await processMedia(
            buffer,
            contentType,
            strippedKey,
          );
          outBuffer = processedMedia.buffer;
          outContentType = processedMedia.mime || contentType;
          if (processedMedia.ext) {
            finalKey = `${strippedKey.replace(/\.[^.]+$/, "")}.${processedMedia.ext}`;
          }
        } catch (err) {
          logger.error(err, `Transcode failed for ${key}, promoting raw bytes`);
        }
      }

      const hash = createHash("sha256").update(outBuffer).digest("hex");
      const existing = await findExistingByHash(hash);

      if (existing && existing !== tempUrl) {
        const updated = await replaceUrlEverywhere(tempUrl, existing);
        await deleteObjectKey(key);
        if (updated > 0) await invalidateReadCaches();
        logger.info(
          `Upload cleanup: deduped ${key} -> ${existing} (${updated} DB ref(s) updated)`,
        );
      } else {
        const finalUrl = buildPublicUrl(finalKey);
        await uploadBufferToKey(finalKey, outBuffer, outContentType);
        await writeDedupMarker(hash, finalKey);
        const updated = await replaceUrlEverywhere(tempUrl, finalUrl);
        await deleteObjectKey(key);
        if (updated > 0) await invalidateReadCaches();
        logger.info(
          `Upload cleanup: promoted ${key} -> ${finalKey} (${updated} DB ref(s) updated)`,
        );
      }
      processed++;
    } catch (err) {
      logger.error(err, `Upload cleanup failed for ${key}`);
    }
  }

  return processed;
}

export function scheduleIncomingCleanup(logger, url) {
  const key = urlToIncomingKey(url);
  if (!key) return;
  setTimeout(async () => {
    try {
      await processIncomingUploads(logger, { limit: 10 });
    } catch (err) {
      logger.error(err, `Immediate upload cleanup failed for ${key}`);
    }
  }, 0);
}

// Manual safety valve: kick off processing of any pending incoming uploads
// without blocking the HTTP request (transcodes run in the background, so the
// caller returns immediately and the admin UI's polling reflects progress).
export function triggerIncomingProcessing(logger, { limit = 50 } = {}) {
  setTimeout(async () => {
    try {
      await processIncomingUploads(logger, { limit });
    } catch (err) {
      logger.error(err, "Manual incoming processing failed");
    }
  }, 0);
}
