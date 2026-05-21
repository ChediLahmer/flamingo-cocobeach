import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@flamingo-cocobeach.com";
  const password = await bcrypt.hash("admin123", 10);

  await prisma.admin.upsert({
    where: { email },
    update: {},
    create: { email, password },
  });

  console.log(`Admin seeded: ${email} / admin123`);

  // Seed default config
  const defaults = [
    ["name", "Flamingo Coco Beach"],
    ["tagline", "Le paradis tropical qui prend vie"],
    ["description", "Restaurant & Beach Bar"],
    ["phone", "+216 00 000 000"],
    ["email", "contact@flamingo-cocobeach.com"],
    ["address", "Coco Beach, Tunisie"],
    ["hours", "10:00 - 02:00"],
  ];

  for (const [key, value] of defaults) {
    await prisma.siteConfig.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }

  console.log("Default site config seeded");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
