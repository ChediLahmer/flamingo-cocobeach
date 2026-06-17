import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const missing = {
  "Eau Minérale": { name: "مياه معدنية", desc: "مياه معدنية طبيعية" },
  "Burger Beach": {
    name: "برغر بيتش",
    desc: "لحم بقري مشوي مع خضروات طازجة وصلصة خاصة",
  },
  "Pizza Margherita": {
    name: "بيتزا مارغريتا",
    desc: "صلصة طماطم، موزاريلا، ريحان طازج",
  },
  "Sorbet Mangue-Passion": {
    name: "سوربيه مانجو-باشن",
    desc: "سوربيه منعش بالمانجو وفاكهة العاطفة",
  },
};

async function main() {
  const items = await prisma.menuItem.findMany();
  for (const item of items) {
    const fr = item.name.fr;
    if (missing[fr]) {
      const m = missing[fr];
      await prisma.menuItem.update({
        where: { id: item.id },
        data: {
          name: { ...item.name, ar: m.name },
          description: item.description
            ? { ...item.description, ar: m.desc }
            : null,
        },
      });
      console.log(fr, "->", m.name);
    }
  }
  await prisma.$disconnect();
  console.log("Done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
