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

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
}

export async function authenticate(request, reply) {
  const header = request.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
  try {
    request.admin = verifyToken(header.slice(7));
  } catch {
    return reply.status(401).send({ error: "Invalid token" });
  }
}

export async function optionalAuth(request) {
  const header = request.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return;
  try {
    request.admin = verifyToken(header.slice(7));
  } catch {
    // invalid token — treat as public request
  }
}
