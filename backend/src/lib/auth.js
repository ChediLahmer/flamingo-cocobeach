import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV === "production"
    ? (() => {
        throw new Error("JWT_SECRET is required in production");
      })()
    : "dev-secret-change-in-production");

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

export function signUserToken(payload) {
  return jwt.sign({ ...payload, type: "user" }, JWT_SECRET, {
    expiresIn: "30d",
  });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
}

export async function authenticate(request, reply) {
  const header = request.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
  try {
    const payload = verifyToken(header.slice(7));
    // Customer tokens must never grant admin access.
    if (payload.type === "user") {
      return reply.status(401).send({ error: "Invalid token" });
    }
    request.admin = payload;
  } catch {
    return reply.status(401).send({ error: "Invalid token" });
  }
}

export async function optionalAuth(request) {
  const header = request.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return;
  try {
    const payload = verifyToken(header.slice(7));
    if (payload.type !== "user") request.admin = payload;
  } catch {
    // invalid token — treat as public request
  }
}

export async function authenticateUser(request, reply) {
  const header = request.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
  try {
    const payload = verifyToken(header.slice(7));
    if (payload.type !== "user") {
      return reply.status(401).send({ error: "Invalid token" });
    }
    request.user = payload;
  } catch {
    return reply.status(401).send({ error: "Invalid token" });
  }
}
