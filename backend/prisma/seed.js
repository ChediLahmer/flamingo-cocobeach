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
    [
      "name",
      JSON.stringify({
        fr: "Flamingo Coco Beach",
        en: "Flamingo Coco Beach",
        ar: "فلامينغو كوكو بيتش",
      }),
    ],
    [
      "tagline",
      JSON.stringify({
        fr: "Le paradis tropical qui prend vie",
        en: "The tropical paradise that comes alive",
        ar: "الجنة الاستوائية التي تنبض بالحياة",
      }),
    ],
    [
      "description",
      JSON.stringify({
        fr: "Restaurant & Beach Bar",
        en: "Restaurant & Beach Bar",
        ar: "مطعم وبار شاطئي",
      }),
    ],
    ["phone", "+216 00 000 000"],
    ["email", "contact@flamingo-cocobeach.com"],
    [
      "address",
      JSON.stringify({
        fr: "Coco Beach, Tunisie",
        en: "Coco Beach, Tunisia",
        ar: "كوكو بيتش، تونس",
      }),
    ],
    [
      "hours",
      JSON.stringify({
        fr: "10:00 - 02:00",
        en: "10:00 AM - 2:00 AM",
        ar: "10:00 - 02:00",
      }),
    ],
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
