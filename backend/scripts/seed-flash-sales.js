import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Injects a large batch of flash sales to stress-test the UI grid/layout.
const COUNT = Number(process.argv[2]) || 24;

const TITLES = [
  { fr: "Mojito Tropical", en: "Tropical Mojito", ar: "موهيتو استوائي" },
  {
    fr: "Plateau Fruits de Mer",
    en: "Seafood Platter",
    ar: "طبق مأكولات بحرية",
  },
  { fr: "Cocktail Sunset", en: "Sunset Cocktail", ar: "كوكتيل الغروب" },
  { fr: "Pizza Flamingo", en: "Flamingo Pizza", ar: "بيتزا فلامينغو" },
  { fr: "Burger Coucou", en: "Coucou Burger", ar: "برغر كوكو" },
  { fr: "Salade Tropicale", en: "Tropical Salad", ar: "سلطة استوائية" },
  { fr: "Glace Maison", en: "Homemade Ice Cream", ar: "آيس كريم منزلي" },
  { fr: "Smoothie Mangue", en: "Mango Smoothie", ar: "سموذي المانجو" },
];

const DESCRIPTIONS = [
  {
    fr: "Offre limitée, profitez-en vite avant la fin !",
    en: "Limited offer, grab it before it's gone!",
    ar: "عرض محدود، احصل عليه قبل نفاده!",
  },
  {
    fr: "Le préféré de l'été à prix mini.",
    en: "Summer favourite at a mini price.",
    ar: "المفضل في الصيف بسعر مصغّر.",
  },
  {
    fr: "Saveurs tropicales, plaisir garanti.",
    en: "Tropical flavours, guaranteed delight.",
    ar: "نكهات استوائية، متعة مضمونة.",
  },
];

function pick(arr, i) {
  return arr[i % arr.length];
}

async function main() {
  const now = Date.now();
  const data = Array.from({ length: COUNT }, (_, i) => {
    const title = pick(TITLES, i);
    return {
      title: { ...title, fr: `${title.fr} #${i + 1}` },
      description: pick(DESCRIPTIONS, i),
      discountPercent: 10 + ((i * 7) % 80),
      originalPrice: Number((12 + (i % 10) * 3.5).toFixed(2)),
      // Spread end dates from ~6h to ~30 days out so countdowns vary.
      endsAt: new Date(now + (6 + i * 18) * 3600 * 1000),
      visible: true,
      order: i,
    };
  });

  await prisma.flashSale.createMany({ data });
  const total = await prisma.flashSale.count();
  console.log(`Inserted ${COUNT} flash sales. Total now: ${total}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
