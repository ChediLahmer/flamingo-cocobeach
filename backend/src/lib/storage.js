import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint: process.env.S3_ENDPOINT || "http://localhost:9100",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.S3_SECRET_KEY || "minioadmin",
  },
});

const BUCKET = process.env.S3_BUCKET || "flamingo";

function sanitizeFilename(filename) {
  return filename
    .replace(/^.*[\\/]/, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/^\.+/, "_");
}

export function buildPublicUrl(key) {
  const baseUrl = process.env.S3_PUBLIC_URL || "http://localhost:9100";
  return `${baseUrl}/${BUCKET}/${key}`;
}

export function extractStorageKeyFromUrl(url) {
  try {
    const parsed = new URL(url);
    const marker = `/${BUCKET}/`;
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(parsed.pathname.slice(idx + marker.length));
  } catch {
    return null;
  }
}

export function createStorageKey(filename) {
  return `${Date.now()}-${sanitizeFilename(filename)}`;
}

export async function createPresignedUpload({ filename, contentType }) {
  const key = createStorageKey(filename);
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  });
  let url = await getSignedUrl(s3, command, { expiresIn: 900 });

  const internalBase = (
    process.env.S3_ENDPOINT || "http://localhost:9100"
  ).replace(/\/$/, "");
  const publicBase = (process.env.S3_PUBLIC_URL || internalBase).replace(
    /\/$/,
    "",
  );
  if (internalBase !== publicBase && url.startsWith(internalBase)) {
    url = publicBase + url.slice(internalBase.length);
  }

  return { key, url, publicUrl: buildPublicUrl(key) };
}

export async function uploadFile(buffer, filename, contentType) {
  const key = createStorageKey(filename);
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return buildPublicUrl(key);
}

export async function headObject(key) {
  return s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
}

export async function getObjectStream(key, range) {
  return s3.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ...(range ? { Range: range } : {}),
    }),
  );
}

export async function deleteFile(url) {
  const key = extractStorageKeyFromUrl(url);
  if (!key) return;
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
