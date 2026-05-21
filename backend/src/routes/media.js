import {
  extractStorageKeyFromUrl,
  getObjectStream,
  headObject,
} from "../lib/storage.js";

function parseByteRange(rangeHeader, totalLength) {
  if (!rangeHeader || !rangeHeader.startsWith("bytes=")) return null;
  const [startRaw, endRaw] = rangeHeader.replace("bytes=", "").split("-");
  let start = Number.parseInt(startRaw, 10);
  let end = Number.parseInt(endRaw, 10);
  if (Number.isNaN(start)) {
    const suffix = Number.parseInt(endRaw, 10);
    if (Number.isNaN(suffix) || suffix <= 0) return null;
    start = Math.max(0, totalLength - suffix);
    end = totalLength - 1;
  } else {
    if (Number.isNaN(end) || end >= totalLength) end = totalLength - 1;
  }
  if (start < 0 || end < start || start >= totalLength) return null;
  return { start, end };
}

export async function mediaRoutes(app) {
  app.get("/proxy", async (request, reply) => {
    const { url } = request.query;
    const key = extractStorageKeyFromUrl(url);
    if (!key)
      return reply
        .status(400)
        .send({ error: "VALIDATION_ERROR", message: "URL média invalide" });

    try {
      const rangeHeader = request.headers.range;
      const meta = await headObject(key);
      const totalLength = Number(meta.ContentLength || 0);
      const range = parseByteRange(rangeHeader, totalLength);

      if (range) {
        const partial = await getObjectStream(
          key,
          `bytes=${range.start}-${range.end}`,
        );
        const length = range.end - range.start + 1;
        reply.header(
          "Content-Type",
          partial.ContentType || "application/octet-stream",
        );
        reply.header("Accept-Ranges", "bytes");
        reply.header(
          "Content-Range",
          `bytes ${range.start}-${range.end}/${totalLength}`,
        );
        reply.header("Content-Length", String(length));
        reply.header("Cache-Control", "public, max-age=31536000, immutable");
        reply.header("Access-Control-Allow-Origin", "*");
        return reply.status(206).send(partial.Body);
      }

      const full = await getObjectStream(key);
      reply.header(
        "Content-Type",
        meta.ContentType || "application/octet-stream",
      );
      if (meta.ContentLength != null)
        reply.header("Content-Length", String(meta.ContentLength));
      reply.header("Accept-Ranges", "bytes");
      reply.header("Cache-Control", "public, max-age=31536000, immutable");
      reply.header("Access-Control-Allow-Origin", "*");
      return reply.send(full.Body);
    } catch (error) {
      if (
        error?.name === "NoSuchKey" ||
        error?.$metadata?.httpStatusCode === 404
      ) {
        return reply
          .status(404)
          .send({ error: "NOT_FOUND_ERROR", message: "Média non trouvé" });
      }
      throw error;
    }
  });
}
