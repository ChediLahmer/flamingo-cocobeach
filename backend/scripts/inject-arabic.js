import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const catAr = {
  Cocktails: "كوكتيلات",
  Boissons: "مشروبات",
  Plats: "أطباق",
  Desserts: "حلويات",
  Chicha: "شيشة",
};

const itemAr = {
  "Piña Colada": {
    name: "بينيا كولادا",
    desc: "روم، حليب جوز الهند، عصير أناناس طازج",
  },
  "Tropical Sunset": {
    name: "تروبيكال صنسيت",
    desc: "فودكا، عصير مانجو، فاكهة العاطفة، غرينادين",
  },
  "Mojito Flamingo": {
    name: "موخيتو فلامينغو",
    desc: "روم أبيض، نعناع طازج، ليمون أخضر، شراب الرمان",
  },
  "Virgin Coco": {
    name: "فيرجين كوكو",
    desc: "حليب جوز الهند، أناناس، شراب الفانيليا (بدون كحول)",
  },
  "Jus d'orange frais": { name: "عصير برتقال طازج", desc: "برتقال معصور طازج" },
  "Smoothie Tropical": {
    name: "سموذي استوائي",
    desc: "مانجو، موز، أناناس، حليب جوز الهند",
  },
  "Limonade Maison": {
    name: "ليمونادة منزلية",
    desc: "ليمون، نعناع، ماء فوار",
  },
  "Thé Glacé Pêche": {
    name: "شاي مثلج بالخوخ",
    desc: "شاي منقوع بالخوخ الطازج",
  },
  "Tacos de Poisson": {
    name: "تاكو السمك",
    desc: "فيليه قاروص مشوي، كرنب مقرمش، صلصة مانجو-هابانيرو",
  },
  "Poke Bowl Saumon": {
    name: "بوكي بول سلمون",
    desc: "سلمون طازج، أرز بالخل، أفوكادو، إدامامي، مانجو",
  },
  "Burger Flamingo": {
    name: "برغر فلامينغو",
    desc: "لحم أنغوس، جبن شيدر، بصل مكرمل، صلصة سرية",
  },
  "Salade César Crevettes": {
    name: "سلطة سيزر بالقريدس",
    desc: "خس روماني، قريدس مشوي، بارميزان، خبز محمص",
  },
  "Risotto aux Fruits de Mer": {
    name: "ريزوتو بفواكه البحر",
    desc: "أرز أربوريو كريمي مع بلح البحر والقريدس والحبار",
  },
  "Fondant au Chocolat": {
    name: "فوندون شوكولاتة",
    desc: "قلب سائل، آيس كريم فانيليا",
  },
  "Crème Brûlée Coco": {
    name: "كريم بروليه بجوز الهند",
    desc: "منقوعة بحليب جوز الهند والفانيليا",
  },
  "Ananas Rôti": { name: "أناناس مشوي", desc: "مكرمل بالروم، شربة استوائية" },
  "Chicha Classique": { name: "شيشة كلاسيكية", desc: "تفاح، عنب، نعناع، بطيخ" },
  "Chicha Premium": {
    name: "شيشة بريميوم",
    desc: "خلطات غريبة: مانجو-ثلج، توت أزرق-نعناع",
  },
};

const spaceAr = {
  "Cabane VIP": {
    name: "كابينة VIP",
    desc: "مساحة خاصة على شاطئ البحر مع خدمة مخصصة وأرائك وطاولة قهوة",
  },
  "Lit Balinais": {
    name: "سرير بالي",
    desc: "سرير معلق مع ستائر، إطلالة بانورامية على البحر",
  },
  "Zone Lounge": {
    name: "منطقة لاونج",
    desc: "وسائد عملاقة ومظلات، أجواء هادئة وموسيقى حية",
  },
  "Table Piscine": {
    name: "طاولة المسبح",
    desc: "طاولة بجانب المسبح مع كراسي استلقاء مشمولة",
  },
  "Terrasse Sunset": {
    name: "تراس الغروب",
    desc: "تراس مرتفع مع أفضل إطلالة على غروب الشمس",
  },
};

async function main() {
  // Menu categories + items
  const cats = await prisma.menuCategory.findMany({ include: { items: true } });
  for (const cat of cats) {
    const frName = cat.name.fr;
    const arName = catAr[frName] || frName;
    await prisma.menuCategory.update({
      where: { id: cat.id },
      data: { name: { ...cat.name, ar: arName } },
    });
    console.log("Cat:", frName, "->", arName);
    for (const item of cat.items) {
      const frItemName = item.name.fr;
      const ar = itemAr[frItemName];
      if (ar) {
        const newName = { ...item.name, ar: ar.name };
        const newDesc = item.description
          ? { ...item.description, ar: ar.desc }
          : null;
        await prisma.menuItem.update({
          where: { id: item.id },
          data: { name: newName, description: newDesc },
        });
        console.log("  Item:", frItemName, "->", ar.name);
      } else {
        console.log("  Item:", frItemName, "-> NO AR MAPPING");
      }
    }
  }

  // Spaces
  const spaces = await prisma.space.findMany();
  for (const space of spaces) {
    const frName = space.name.fr;
    const ar = spaceAr[frName];
    if (ar) {
      const newName = { ...space.name, ar: ar.name };
      const newDesc = space.description
        ? { ...space.description, ar: ar.desc }
        : null;
      await prisma.space.update({
        where: { id: space.id },
        data: { name: newName, description: newDesc },
      });
      console.log("Space:", frName, "->", ar.name);
    }
  }

  await prisma.$disconnect();
  console.log("\nDone! Arabic translations injected.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
