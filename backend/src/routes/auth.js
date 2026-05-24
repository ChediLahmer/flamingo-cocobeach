import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/auth.js";

export async function authRoutes(app) {
  app.post(
    "/login",
    {
      config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
      schema: {
        body: {
          type: "object",
          required: ["email", "password"],
          additionalProperties: false,
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 1, maxLength: 128 },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;
      const admin = await prisma.admin.findUnique({ where: { email } });
      const hash =
        admin?.password ||
        "$2b$10$invalidhashpaddingtoconsumetime00000000000000000000";
      const valid = await bcrypt.compare(password, hash);
      if (!admin || !valid) {
        return reply
          .status(401)
          .send({ error: "AUTH_ERROR", message: "Identifiants invalides" });
      }
      const token = signToken({ id: admin.id, email: admin.email });
      return { token };
    },
  );
}
