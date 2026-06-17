import Fastify from "fastify";
import cors from "@fastify/cors";
import compress from "@fastify/compress";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import helmet from "@fastify/helmet";
import { prisma } from "./lib/prisma.js";
import { menuRoutes } from "./routes/menu.js";
import { spacesRoutes } from "./routes/spaces.js";
import { galleryRoutes } from "./routes/gallery.js";
import { authRoutes } from "./routes/auth.js";
import { configRoutes } from "./routes/config.js";
import { uploadRoutes } from "./routes/upload.js";
import { mediaRoutes } from "./routes/media.js";
import { passwordResetRoutes } from "./routes/password-reset.js";
import { userRoutes } from "./routes/users.js";
import { flashSaleRoutes } from "./routes/flash-sales.js";
import { testimonialRoutes } from "./routes/testimonials.js";

if (process.env.NODE_ENV === "production") {
  const required = [
    "DATABASE_URL",
    "JWT_SECRET",
    "CORS_ORIGIN",
    "S3_ENDPOINT",
    "S3_ACCESS_KEY",
    "S3_SECRET_KEY",
    "S3_PUBLIC_URL",
    "ADMIN_URL",
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing required env vars: ${missing.join(", ")}`);
    process.exit(1);
  }
}

const app = Fastify({
  logger: true,
  trustProxy: process.env.TRUST_PROXY || 1,
  requestTimeout: Number(process.env.REQUEST_TIMEOUT_MS) || 600000,
  connectionTimeout: Number(process.env.CONNECTION_TIMEOUT_MS) || 600000,
});

await app.register(helmet, {
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
});
await app.register(cors, {
  origin: (
    process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:5174"
  ).split(","),
  credentials: true,
});
await app.register(rateLimit, { max: 200, timeWindow: "1 minute" });
await app.register(compress, { global: true });
await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } });

app.setErrorHandler((error, request, reply) => {
  if (error.code === "P2025")
    return reply.status(404).send({ error: "Record not found" });
  if (error.code === "P2002")
    return reply.status(409).send({ error: "Duplicate record" });
  if (error.code === "P2003")
    return reply
      .status(400)
      .send({ error: "Referenced record does not exist" });
  if (error.validation) {
    const details = error.validation.map((v) => v.message).join("; ");
    return reply.status(400).send({ error: `Validation failed: ${details}` });
  }
  const statusCode = error.statusCode || 500;
  const message = statusCode < 500 ? error.message : "Internal Server Error";
  request.log.error(error);
  reply.status(statusCode).send({ error: message });
});

app.addHook("onSend", (request, reply, payload, done) => {
  if (
    request.method === "GET" &&
    !request.headers.authorization &&
    reply.statusCode === 200
  ) {
    reply.header(
      "Cache-Control",
      "public, no-cache, max-age=0, must-revalidate",
    );
  }
  done();
});

app.get("/api/health", () => ({ status: "ok" }));

await app.register(authRoutes, { prefix: "/api/auth" });
await app.register(passwordResetRoutes, { prefix: "/api/auth" });
await app.register(menuRoutes, { prefix: "/api/menu" });
await app.register(spacesRoutes, { prefix: "/api/spaces" });
await app.register(galleryRoutes, { prefix: "/api/gallery" });
await app.register(configRoutes, { prefix: "/api/config" });
await app.register(uploadRoutes, { prefix: "/api/upload" });
await app.register(mediaRoutes, { prefix: "/api/media" });
await app.register(userRoutes, { prefix: "/api/users" });
await app.register(flashSaleRoutes, { prefix: "/api/flash-sales" });
await app.register(testimonialRoutes, { prefix: "/api/testimonials" });

const port = process.env.PORT || 3000;

try {
  await app.listen({ port, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

async function shutdown(signal) {
  app.log.info(`${signal} received, shutting down...`);
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
