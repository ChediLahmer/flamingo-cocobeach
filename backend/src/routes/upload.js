import { authenticate } from "../lib/auth.js";
import {
  createPresignedUpload,
  deleteFile,
  uploadFile,
} from "../lib/storage.js";
import { triggerIncomingProcessing } from "../lib/upload-cleanup.js";
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

const PRESIGN_MAX_VIDEO_BYTES = Number(
  process.env.PRESIGN_MAX_VIDEO_BYTES || 200 * 1024 * 1024,
);

export async function uploadRoutes(app) {
  app.post("/cleanup", { preHandler: authenticate }, async (request, reply) => {
    const { url } = request.body;
    await deleteFile(url);
    return reply.status(204).send();
  });

  app.post("/presign", { preHandler: authenticate }, async (request, reply) => {
    const { filename, contentType, sizeBytes } = request.body;
    if (!contentType?.startsWith("video/")) {
      return reply.status(400).send({
        error: "VALIDATION_ERROR",
        message: "Presigned uploads uniquement pour les vidéos.",
      });
    }
    if (!isBrowserMimeAllowed(contentType)) {
      return reply
        .status(400)
        .send({ error: "VALIDATION_ERROR", message: ERROR_MSG_BROWSER });
    }
    if (sizeBytes && sizeBytes > PRESIGN_MAX_VIDEO_BYTES) {
      return reply.status(400).send({
        error: "VALIDATION_ERROR",
        message: `Vidéo trop volumineuse (max ${Math.round(PRESIGN_MAX_VIDEO_BYTES / (1024 * 1024))} Mo).`,
      });
    }
    const upload = await createPresignedUpload({ filename, contentType });
    return reply.send(upload);
  });

  app.post(
    "/process-incoming",
    { preHandler: authenticate },
    async (request, reply) => {
      triggerIncomingProcessing(request.log);
      return reply.status(202).send({ triggered: true });
    },
  );

  app.post(
    "/",
    { bodyLimit: 50 * 1024 * 1024, preHandler: authenticate },
    async (request, reply) => {
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
      return reply.status(201).send({ url });
    },
  );
}
