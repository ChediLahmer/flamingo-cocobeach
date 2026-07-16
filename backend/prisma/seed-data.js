import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data (except admin)
  await prisma.galleryImage.deleteMany();
  await prisma.galleryCategory.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.space.deleteMany();
  await prisma.siteConfig.deleteMany();

  // --- Site Config ---
  const configs = {
    name: JSON.stringify({
      fr: "Flamingo Coco Beach",
      en: "Flamingo Coco Beach",
      ar: "فلامينغو كوكو بيتش",
    }),
    tagline: JSON.stringify({
      fr: "Le paradis tropical qui prend vie",
      en: "The tropical paradise that comes alive",
      ar: "الجنة الاستوائية التي تنبض بالحياة",
    }),
    description: JSON.stringify({
      fr: "Un lieu unique où la plage rencontre la fête. Des cocktails tropicaux, une cuisine savoureuse et une ambiance électrique qui vous transportera sous les tropiques.",
      en: "A unique place where the beach meets the party. Tropical cocktails, delicious cuisine and an electric atmosphere that will transport you to the tropics.",
      ar: "مكان فريد حيث يلتقي الشاطئ بالحفلة. كوكتيلات استوائية، مأكولات شهية وأجواء كهربائية تنقلك إلى المناطق الاستوائية.",
    }),
    email: "contact@flamingocoucoubeach.com",
    phone: "+216 71 123 456",
    whatsapp: "21671123456",
    address: JSON.stringify({
      fr: "Route de la Corniche, La Marsa, Tunisie",
      en: "Corniche Road, La Marsa, Tunisia",
      ar: "طريق الكورنيش، المرسى، تونس",
    }),
    instagram: "https://instagram.com/flamingo.cocobeach",
    facebook: "https://facebook.com/flamingococobeach",
    tiktok: "https://tiktok.com/@flamingococobeach",
    hours: JSON.stringify({
      fr: "Lun-Dim: 10h00 - 02h00",
      en: "Mon-Sun: 10:00 AM - 2:00 AM",
      ar: "الإثنين-الأحد: 10:00 - 02:00",
    }),
    lat: "36.8892",
    lng: "10.3228",
    hero_poster_url:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80",
    about_image_1:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
    about_image_2:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80",
  };

  for (const [key, value] of Object.entries(configs)) {
    await prisma.siteConfig.create({ data: { key, value } });
  }
  console.log("✓ Site config seeded");

  // --- Menu Categories ---
  const cocktails = await prisma.menuCategory.create({
    data: {
      name: { fr: "Cocktails", en: "Cocktails", ar: "كوكتيلات" },
      order: 1,
    },
  });
  const boissons = await prisma.menuCategory.create({
    data: { name: { fr: "Boissons", en: "Drinks", ar: "مشروبات" }, order: 2 },
  });
  const plats = await prisma.menuCategory.create({
    data: { name: { fr: "Plats", en: "Dishes", ar: "أطباق" }, order: 3 },
  });
  const desserts = await prisma.menuCategory.create({
    data: { name: { fr: "Desserts", en: "Desserts", ar: "حلويات" }, order: 4 },
  });
  const chicha = await prisma.menuCategory.create({
    data: { name: { fr: "Chicha", en: "Shisha", ar: "شيشة" }, order: 5 },
  });

  // --- Menu Items ---
  const menuItems = [
    // Cocktails
    {
      name: {
        fr: "Mojito Flamingo",
        en: "Flamingo Mojito",
        ar: "موخيتو فلامينغو",
      },
      description: {
        fr: "Rhum blanc, menthe fraîche, citron vert, sirop de grenadine",
        en: "White rum, fresh mint, lime, grenadine syrup",
        ar: "روم أبيض، نعناع طازج، ليمون أخضر، شراب الرمان",
      },
      image:
        "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=300&q=80",
      priceStandard: 28,
      categoryId: cocktails.id,
      order: 1,
    },
    {
      name: { fr: "Piña Colada", en: "Piña Colada", ar: "بينيا كولادا" },
      description: {
        fr: "Rhum, lait de coco, jus d'ananas frais",
        en: "Rum, coconut milk, fresh pineapple juice",
        ar: "روم، حليب جوز الهند، عصير أناناس طازج",
      },
      image:
        "https://images.unsplash.com/photo-1587223962930-cb7f31384c19?w=300&q=80",
      priceStandard: 30,
      categoryId: cocktails.id,
      order: 2,
    },
    {
      name: {
        fr: "Tropical Sunset",
        en: "Tropical Sunset",
        ar: "غروب استوائي",
      },
      description: {
        fr: "Vodka, jus de mangue, passion, grenadine",
        en: "Vodka, mango juice, passion fruit, grenadine",
        ar: "فودكا، عصير مانجو، فاكهة العاطفة، رمان",
      },
      image:
        "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=300&q=80",
      priceStandard: 32,
      categoryId: cocktails.id,
      order: 3,
    },
    {
      name: { fr: "Virgin Coco", en: "Virgin Coco", ar: "فيرجن كوكو" },
      description: {
        fr: "Lait de coco, ananas, sirop de vanille (sans alcool)",
        en: "Coconut milk, pineapple, vanilla syrup (non-alcoholic)",
        ar: "حليب جوز الهند، أناناس، شراب الفانيليا (بدون كحول)",
      },
      image:
        "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=300&q=80",
      priceStandard: 18,
      categoryId: cocktails.id,
      order: 4,
    },
    // Boissons
    {
      name: {
        fr: "Jus d'orange frais",
        en: "Fresh Orange Juice",
        ar: "عصير برتقال طازج",
      },
      description: {
        fr: "Oranges pressées à la minute",
        en: "Freshly squeezed oranges",
        ar: "برتقال معصور طازج",
      },
      priceStandard: 12,
      categoryId: boissons.id,
      order: 1,
    },
    {
      name: {
        fr: "Smoothie Tropical",
        en: "Tropical Smoothie",
        ar: "سموذي استوائي",
      },
      description: {
        fr: "Mangue, banane, ananas, lait de coco",
        en: "Mango, banana, pineapple, coconut milk",
        ar: "مانجو، موز، أناناس، حليب جوز الهند",
      },
      priceStandard: 16,
      categoryId: boissons.id,
      order: 2,
    },
    {
      name: {
        fr: "Limonade Maison",
        en: "Homemade Lemonade",
        ar: "ليمونادة منزلية",
      },
      description: {
        fr: "Citron frais, menthe, miel",
        en: "Fresh lemon, mint, honey",
        ar: "ليمون طازج، نعناع، عسل",
      },
      priceStandard: 10,
      categoryId: boissons.id,
      order: 3,
    },
    {
      name: { fr: "Eau Minérale", en: "Mineral Water", ar: "ماء معدني" },
      priceStandard: 5,
      categoryId: boissons.id,
      order: 4,
    },
    // Plats
    {
      name: { fr: "Tacos de Poisson", en: "Fish Tacos", ar: "تاكوس السمك" },
      description: {
        fr: "Filet de loup grillé, chou croquant, sauce mangue-habanero",
        en: "Grilled sea bass fillet, crunchy cabbage, mango-habanero sauce",
        ar: "فيليه سمك مشوي، ملفوف مقرمش، صلصة المانجو-هابانيرو",
      },
      image:
        "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=300&q=80",
      priceStandard: 35,
      categoryId: plats.id,
      order: 1,
    },
    {
      name: {
        fr: "Poke Bowl Saumon",
        en: "Salmon Poke Bowl",
        ar: "بوكي بول سلمون",
      },
      description: {
        fr: "Saumon frais, riz vinaigré, avocat, edamame, mangue",
        en: "Fresh salmon, vinegar rice, avocado, edamame, mango",
        ar: "سلمون طازج، أرز بالخل، أفوكادو، إدامامي، مانجو",
      },
      image:
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80",
      priceStandard: 38,
      categoryId: plats.id,
      order: 2,
    },
    {
      name: { fr: "Burger Beach", en: "Beach Burger", ar: "برجر الشاطئ" },
      description: {
        fr: "Angus 180g, cheddar, bacon croustillant, sauce secrète",
        en: "180g Angus, cheddar, crispy bacon, secret sauce",
        ar: "أنغوس 180غ، شيدر، لحم مقدد مقرمش، صلصة سرية",
      },
      image:
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80",
      priceStandard: 32,
      categoryId: plats.id,
      order: 3,
    },
    {
      name: {
        fr: "Salade César Crevettes",
        en: "Caesar Salad with Shrimp",
        ar: "سلطة سيزر بالقريدس",
      },
      description: {
        fr: "Romaine, crevettes grillées, parmesan, croûtons maison",
        en: "Romaine, grilled shrimp, parmesan, homemade croutons",
        ar: "خس روماني، قريدس مشوي، بارميزان، خبز محمص منزلي",
      },
      image:
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=80",
      priceStandard: 28,
      categoryId: plats.id,
      order: 4,
    },
    {
      name: {
        fr: "Pizza Margherita",
        en: "Margherita Pizza",
        ar: "بيتزا مارغريتا",
      },
      description: {
        fr: "Mozzarella di bufala, tomates fraîches, basilic",
        en: "Buffalo mozzarella, fresh tomatoes, basil",
        ar: "موزاريلا الجاموس، طماطم طازجة، ريحان",
      },
      priceStandard: 26,
      categoryId: plats.id,
      order: 5,
    },
    // Desserts
    {
      name: {
        fr: "Fondant au Chocolat",
        en: "Chocolate Fondant",
        ar: "فوندون الشوكولاتة",
      },
      description: {
        fr: "Cœur coulant, glace vanille",
        en: "Molten center, vanilla ice cream",
        ar: "قلب سائل، آيس كريم فانيليا",
      },
      image:
        "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300&q=80",
      priceStandard: 22,
      categoryId: desserts.id,
      order: 1,
    },
    {
      name: {
        fr: "Crème Brûlée Coco",
        en: "Coconut Crème Brûlée",
        ar: "كريم بروليه بجوز الهند",
      },
      description: {
        fr: "Infusée au lait de coco et vanille",
        en: "Infused with coconut milk and vanilla",
        ar: "منقوعة بحليب جوز الهند والفانيليا",
      },
      priceStandard: 18,
      categoryId: desserts.id,
      order: 2,
    },
    {
      name: {
        fr: "Sorbet Mangue-Passion",
        en: "Mango-Passion Sorbet",
        ar: "سوربيه مانجو-باشن",
      },
      description: {
        fr: "3 boules, coulis de fruits rouges",
        en: "3 scoops, red fruit coulis",
        ar: "3 كرات، صلصة الفواكه الحمراء",
      },
      priceStandard: 14,
      categoryId: desserts.id,
      order: 3,
    },
    // Chicha
    {
      name: {
        fr: "Chicha Classique",
        en: "Classic Shisha",
        ar: "شيشة كلاسيكية",
      },
      description: {
        fr: "Pomme, raisin, menthe, pastèque",
        en: "Apple, grape, mint, watermelon",
        ar: "تفاح، عنب، نعناع، بطيخ",
      },
      priceStandard: 25,
      categoryId: chicha.id,
      order: 1,
    },
    {
      name: { fr: "Chicha Premium", en: "Premium Shisha", ar: "شيشة بريميوم" },
      description: {
        fr: "Mélanges exotiques: mangue-glace, blueberry-mint",
        en: "Exotic mixes: mango-ice, blueberry-mint",
        ar: "خلطات غريبة: مانجو-ثلج، توت أزرق-نعناع",
      },
      priceStandard: 35,
      categoryId: chicha.id,
      order: 2,
    },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.create({ data: item });
  }
  console.log("✓ Menu items seeded (" + menuItems.length + " items)");

  // --- Spaces ---
  const spaces = [
    {
      name: { fr: "Cabane VIP", en: "VIP Cabin", ar: "كابينة VIP" },
      description: {
        fr: "Espace privatif en bord de plage avec service dédié, canapés et table basse",
        en: "Private beachside space with dedicated service, sofas and coffee table",
        ar: "مساحة خاصة على شاطئ البحر مع خدمة مخصصة، أرائك وطاولة قهوة",
      },
      image:
        "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=80",
      price: 150,
      capacity: 8,
      order: 1,
    },
    {
      name: { fr: "Lit Balinais", en: "Balinese Bed", ar: "سرير بالينيزي" },
      description: {
        fr: "Lit suspendu avec voilages, vue mer panoramique",
        en: "Hanging bed with curtains, panoramic sea view",
        ar: "سرير معلق مع ستائر، إطلالة بانورامية على البحر",
      },
      image:
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80",
      price: 100,
      capacity: 4,
      order: 2,
    },
    {
      name: { fr: "Zone Lounge", en: "Lounge Zone", ar: "منطقة الاسترخاء" },
      description: {
        fr: "Poufs géants et parasols, ambiance chill et musique live",
        en: "Giant bean bags and parasols, chill vibe and live music",
        ar: "وسائد عملاقة ومظلات، أجواء هادئة وموسيقى حية",
      },
      image:
        "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&q=80",
      price: 50,
      capacity: 6,
      order: 3,
    },
    {
      name: { fr: "Table Piscine", en: "Pool Table", ar: "طاولة المسبح" },
      description: {
        fr: "Table au bord de la piscine avec transats inclus",
        en: "Poolside table with included sun loungers",
        ar: "طاولة بجانب المسبح مع كراسي استلقاء",
      },
      image:
        "https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=600&q=80",
      price: 80,
      capacity: 4,
      order: 4,
    },
    {
      name: { fr: "Terrasse Sunset", en: "Sunset Terrace", ar: "تراس الغروب" },
      description: {
        fr: "Terrasse surélevée avec la meilleure vue sur le coucher de soleil",
        en: "Elevated terrace with the best sunset view",
        ar: "تراس مرتفع مع أفضل إطلالة على غروب الشمس",
      },
      image:
        "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&q=80",
      price: 120,
      capacity: 10,
      order: 5,
    },
  ];

  for (const space of spaces) {
    await prisma.space.create({ data: space });
  }
  console.log("✓ Spaces seeded (" + spaces.length + " spaces)");

  // --- Gallery ---
  const galleryCats = [
    { name: { fr: "Ambiance", en: "Vibes", ar: "أجواء" }, order: 1 },
    { name: { fr: "Plage", en: "Beach", ar: "شاطئ" }, order: 2 },
    {
      name: {
        fr: "Food & Drinks",
        en: "Food & Drinks",
        ar: "مأكولات ومشروبات",
      },
      order: 3,
    },
    { name: { fr: "Événements", en: "Events", ar: "فعاليات" }, order: 4 },
  ];

  const createdCats = [];
  for (const cat of galleryCats) {
    const c = await prisma.galleryCategory.create({ data: cat });
    createdCats.push(c);
  }

  const galleryImages = [
    // Ambiance
    {
      url: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&q=80",
      categoryId: createdCats[0].id,
      order: 1,
    },
    {
      url: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600&q=80",
      categoryId: createdCats[0].id,
      order: 2,
    },
    {
      url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
      categoryId: createdCats[0].id,
      order: 3,
    },
    {
      url: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=600&q=80",
      categoryId: createdCats[0].id,
      order: 4,
    },
    // Beach
    {
      url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
      categoryId: createdCats[1].id,
      order: 1,
    },
    {
      url: "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=600&q=80",
      categoryId: createdCats[1].id,
      order: 2,
    },
    {
      url: "https://images.unsplash.com/photo-1509233725247-49e657c54213?w=600&q=80",
      categoryId: createdCats[1].id,
      order: 3,
    },
    {
      url: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&q=80",
      categoryId: createdCats[1].id,
      order: 4,
    },
    {
      url: "https://images.unsplash.com/photo-1471922694854-ff1b63b20054?w=600&q=80",
      categoryId: createdCats[1].id,
      order: 5,
    },
    // Food & Drinks
    {
      url: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600&q=80",
      categoryId: createdCats[2].id,
      order: 1,
    },
    {
      url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80",
      categoryId: createdCats[2].id,
      order: 2,
    },
    {
      url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80",
      categoryId: createdCats[2].id,
      order: 3,
    },
    {
      url: "https://images.unsplash.com/photo-1482049016688-2d3f25f31f7f?w=600&q=80",
      categoryId: createdCats[2].id,
      order: 4,
    },
    // Events
    {
      url: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80",
      categoryId: createdCats[3].id,
      order: 1,
    },
    {
      url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80",
      categoryId: createdCats[3].id,
      order: 2,
    },
    {
      url: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&q=80",
      categoryId: createdCats[3].id,
      order: 3,
    },
    {
      url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80",
      categoryId: createdCats[3].id,
      order: 4,
    },
  ];

  for (const img of galleryImages) {
    await prisma.galleryImage.create({ data: img });
  }
  console.log("✓ Gallery seeded (" + galleryImages.length + " images)");

  console.log("\n🦩 Sample data injection complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
