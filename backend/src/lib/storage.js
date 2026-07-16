import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint: process.env.S3_ENDPOINT || "http://localhost:9100",
  forcePathStyle: true,
  // AWS SDK v3 (>= 3.729) adds a default CRC32 checksum to PutObject; keep it
  // off for MinIO compatibility (matches the pre-SDK-bump behavior).
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.S3_SECRET_KEY || "minioadmin",
  },
});

// Presigned uploads must be signed for the EXACT host the browser PUTs to
// (SigV4 signs the Host header). Sign with the public/upload host so the
// signature matches; do NOT sign the internal host then string-replace it.
const s3Presign = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint:
    process.env.S3_UPLOAD_URL ||
    process.env.S3_PUBLIC_URL ||
    process.env.S3_ENDPOINT ||
    "http://localhost:9100",
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.S3_SECRET_KEY || "minioadmin",
  },
});

const BUCKET = process.env.S3_BUCKET || "flamingo";

function getS3Metadata() {
  return {
    CacheControl: "public, max-age=31536000, immutable",
    Metadata: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range, Content-Type",
    },
  };
}

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
  return createStorageKeyWithPrefix(filename, "");
}

export function createStorageKeyWithPrefix(filename, prefix = "") {
  return `${prefix}${Date.now()}-${sanitizeFilename(filename)}`;
}

// A media URL still under the "incoming/" prefix has not been processed yet
// (a freshly uploaded video awaiting background transcode). Matches raw and
// proxy-wrapped (URL-encoded) forms.
export function isIncomingUrl(url) {
  if (typeof url !== "string") return false;
  return url.includes("/incoming/") || url.includes("%2Fincoming%2F");
}

export async function createPresignedUpload({ filename, contentType }) {
  // Land presigned uploads under incoming/ so the background job can transcode
  // and promote them; the URL stays "processing" until promotion completes.
  const key = createStorageKeyWithPrefix(filename, "incoming/");
  // Only ContentType is signed: the browser PUT sends nothing else, so adding
  // CacheControl / metadata here would force those headers and break the SigV4
  // signature. The final cache header is set when the file is (re)stored.
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  const url = await getSignedUrl(s3Presign, command, { expiresIn: 900 });
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

export async function deleteObjectKey(key) {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export async function uploadBufferToKey(key, buffer, contentType) {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ...getS3Metadata(),
    }),
  );
}

export async function getObjectBuffer(key) {
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const chunks = [];
  for await (const chunk of res.Body) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function listObjects(prefix) {
  const objects = [];
  let ContinuationToken;
  try {
    do {
      const res = await s3.send(
        new ListObjectsV2Command({
          Bucket: BUCKET,
          Prefix: prefix,
          ContinuationToken,
        }),
      );
      objects.push(...(res.Contents || []));
      ContinuationToken = res.IsTruncated
        ? res.NextContinuationToken
        : undefined;
    } while (ContinuationToken);
  } catch (error) {
    if (error?.name === "NoSuchKey" || error?.Code === "NoSuchKey") {
      return [];
    }
    throw error;
  }
  return objects;
}

export async function findExistingByHash(hash) {
  const key = `dedup/${hash}`;
  try {
    const head = await s3.send(
      new HeadObjectCommand({ Bucket: BUCKET, Key: key }),
    );
    const realKey = head.Metadata?.["original-key"];
    if (realKey) return buildPublicUrl(realKey);
    return null;
  } catch {
    return null;
  }
}

export async function writeDedupMarker(hash, key) {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: `dedup/${hash}`,
      Body: "",
      Metadata: { "original-key": key },
    }),
  );
}
