import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Check current state
  const cats = await prisma.menuCategory.findMany({ include: { items: true } });
  console.log("=== CURRENT DB STATE ===");
  for (const c of cats) {
    console.log(
      `Cat [${c.id}]: fr="${c.name.fr}" en="${c.name.en}" ar="${c.name.ar || "MISSING"}"`,
    );
    for (const it of c.items) {
      console.log(
        `  Item [${it.id}]: fr="${it.name.fr}" en="${it.name.en}" ar="${it.name.ar || "MISSING"}"`,
      );
    }
  }

  const spaces = await prisma.space.findMany();
  console.log("\n=== SPACES ===");
  for (const s of spaces) {
    console.log(
      `Space [${s.id}]: fr="${s.name.fr}" en="${s.name.en}" ar="${s.name.ar || "MISSING"}"`,
    );
  }

  const configs = await prisma.siteConfig.findMany();
  console.log("\n=== CONFIG ===");
  for (const c of configs) {
    console.log(`${c.key}: ${c.value.substring(0, 60)}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
