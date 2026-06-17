import sharp from "sharp";

const WEB_SAFE_IMAGES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const CONVERTIBLE_IMAGES = new Set([
  "image/heic",
  "image/heif",
  "image/tiff",
  "image/bmp",
]);

const WEB_SAFE_VIDEOS = new Set(["video/mp4", "video/webm"]);

const CONVERTIBLE_VIDEOS = new Set([
  "video/quicktime",
  "video/x-m4v",
  "video/x-msvideo",
  "video/x-matroska",
]);

const ALL_ALLOWED = new Set([
  ...WEB_SAFE_IMAGES,
  ...CONVERTIBLE_IMAGES,
  ...WEB_SAFE_VIDEOS,
  ...CONVERTIBLE_VIDEOS,
  "image/svg+xml",
]);

const ALL_BROWSER = new Set([...ALL_ALLOWED, "application/octet-stream"]);

export function isBrowserMimeAllowed(mime) {
  return ALL_BROWSER.has(mime);
}

export function isDetectedMimeAllowed(mime) {
  return ALL_ALLOWED.has(mime);
}

function sanitizeSvg(buffer) {
  let svg = buffer.toString("utf8");
  svg = svg.replace(/<script[\s\S]*?<\/script>/gi, "");
  svg = svg.replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, "");
  svg = svg.replace(/javascript\s*:/gi, "removed:");
  return Buffer.from(svg, "utf8");
}

export async function processMedia(buffer, detectedMime, filename) {
  if (detectedMime === "image/svg+xml") {
    return { buffer: sanitizeSvg(buffer), mime: "image/svg+xml", ext: "svg" };
  }

  if (CONVERTIBLE_IMAGES.has(detectedMime)) {
    const converted = await sharp(buffer).webp({ quality: 82 }).toBuffer();
    const baseName = filename.replace(/\.[^.]+$/, "");
    return { buffer: converted, mime: "image/webp", ext: "webp", baseName };
  }

  if (WEB_SAFE_IMAGES.has(detectedMime)) {
    return { buffer, mime: detectedMime, ext: null };
  }

  if (detectedMime === "video/quicktime" || detectedMime === "video/x-m4v") {
    const baseName = filename.replace(/\.[^.]+$/, "");
    return { buffer, mime: "video/mp4", ext: "mp4", baseName };
  }

  return { buffer, mime: detectedMime, ext: null };
}

export function isSvgBuffer(mimetype, buffer) {
  return (
    mimetype === "image/svg+xml" &&
    buffer.length < 1_000_000 &&
    buffer.toString("utf8", 0, Math.min(buffer.length, 500)).includes("<svg")
  );
}

export const ERROR_MSG_BROWSER =
  "Type de fichier non supporté. Formats acceptés : JPEG, PNG, WebP, GIF, AVIF, HEIC, SVG, MP4, WebM, MOV.";

export const ERROR_MSG_CONTENT =
  "Le contenu du fichier ne correspond pas à un format supporté.";
