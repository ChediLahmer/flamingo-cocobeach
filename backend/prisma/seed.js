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
    [
      "seo_title",
      JSON.stringify({
        fr: "Flamingo Coco Beach — Restaurant & Beach Bar en Tunisie",
        en: "Flamingo Coco Beach — Beach Bar & Restaurant in Tunisia",
        ar: "فلامينغو كوكو بيتش — مطعم وبار شاطئي في تونس",
      }),
    ],
    [
      "seo_description",
      JSON.stringify({
        fr: "Cocktails tropicaux, cuisine savoureuse et ambiance de plage à Flamingo Coco Beach. Réservez votre espace et vivez le paradis tropical.",
        en: "Tropical cocktails, delicious food and a vibrant beach atmosphere at Flamingo Coco Beach. Book your space and live the tropical paradise.",
        ar: "كوكتيلات استوائية وأطباق شهية وأجواء شاطئية في فلامينغو كوكو بيتش. احجز مكانك وعش الجنة الاستوائية.",
      }),
    ],
    [
      "seo_keywords",
      "beach bar, restaurant, plage, cocktails, Tunisie, Coco Beach, tropical, événements",
    ],
    ["og_image", ""],
    ["popup_enabled", "true"],
    [
      "popup_title",
      JSON.stringify({
        fr: "Rejoignez la tribu Flamingo 🦩",
        en: "Join the Flamingo tribe 🦩",
        ar: "انضم إلى قبيلة فلامينغو 🦩",
      }),
    ],
    [
      "popup_text",
      JSON.stringify({
        fr: "Créez votre compte pour enregistrer vos plats préférés et recevoir nos offres exclusives.",
        en: "Create your account to save your favorite dishes and receive our exclusive offers.",
        ar: "أنشئ حسابك لحفظ أطباقك المفضلة وتلقّي عروضنا الحصرية.",
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

  // Sample flash sales (only seeded when the table is empty)
  const flashCount = await prisma.flashSale.count();
  if (flashCount === 0) {
    const day = 24 * 60 * 60 * 1000;
    await prisma.flashSale.createMany({
      data: [
        {
          title: {
            fr: "Happy Hour Cocktails",
            en: "Happy Hour Cocktails",
            ar: "ساعة سعيدة للكوكتيلات",
          },
          description: {
            fr: "-30% sur tous les cocktails tropicaux de 17h à 19h.",
            en: "-30% on all tropical cocktails from 5pm to 7pm.",
            ar: "خصم 30% على جميع الكوكتيلات الاستوائية من 5 إلى 7 مساءً.",
          },
          discountPercent: 30,
          originalPrice: 18,
          startsAt: new Date(),
          endsAt: new Date(Date.now() + 7 * day),
          order: 0,
        },
        {
          title: {
            fr: "Brunch du week-end",
            en: "Weekend Brunch",
            ar: "برانش نهاية الأسبوع",
          },
          description: {
            fr: "Formule brunch à volonté les samedis et dimanches.",
            en: "All-you-can-eat brunch every Saturday and Sunday.",
            ar: "برانش مفتوح كل سبت وأحد.",
          },
          discountPercent: 20,
          originalPrice: 45,
          startsAt: new Date(),
          endsAt: new Date(Date.now() + 14 * day),
          order: 1,
        },
      ],
    });
    console.log("Sample flash sales seeded");
  }

  // Sample testimonials (only seeded when the table is empty)
  const testimonialCount = await prisma.testimonial.count();
  if (testimonialCount === 0) {
    await prisma.testimonial.createMany({
      data: [
        {
          name: "Sarah B.",
          role: {
            fr: "Habituée du week-end",
            en: "Weekend regular",
            ar: "زائرة دائمة",
          },
          comment: {
            fr: "Un cadre de rêve, des cocktails incroyables et une ambiance de feu. On se croirait à des milliers de kilomètres !",
            en: "A dreamy setting, amazing cocktails and an electric vibe. It feels like being thousands of miles away!",
            ar: "أجواء حالمة وكوكتيلات رائعة. تشعر وكأنك على بعد آلاف الأميال!",
          },
          rating: 5,
          order: 0,
        },
        {
          name: "Mehdi K.",
          role: {
            fr: "Foodie tunisien",
            en: "Tunisian foodie",
            ar: "عاشق للطعام",
          },
          comment: {
            fr: "La meilleure adresse pour un coucher de soleil les pieds dans le sable. Le service est aux petits soins.",
            en: "The best spot for a sunset with your feet in the sand. The service is impeccable.",
            ar: "أفضل مكان لمشاهدة الغروب والأقدام في الرمال. الخدمة ممتازة.",
          },
          rating: 5,
          order: 1,
        },
        {
          name: "Lina & Amir",
          role: {
            fr: "Événement privé",
            en: "Private event",
            ar: "مناسبة خاصة",
          },
          comment: {
            fr: "Nous avons privatisé un espace pour un anniversaire, tout était parfait. Une équipe au top !",
            en: "We booked a private space for a birthday and everything was perfect. Amazing team!",
            ar: "حجزنا مساحة خاصة لعيد ميلاد وكان كل شيء مثالياً. فريق رائع!",
          },
          rating: 5,
          order: 2,
        },
        {
          name: "Yosr T.",
          role: {
            fr: "Amoureuse des couchers de soleil",
            en: "Sunset lover",
            ar: "محبة للغروب",
          },
          comment: {
            fr: "Les cocktails signature valent à eux seuls le détour. Mention spéciale au coucher de soleil sur la mer.",
            en: "The signature cocktails alone are worth the trip. Special mention for the sunset over the sea.",
            ar: "الكوكتيلات المميزة تستحق الزيارة وحدها. ومنظر الغروب على البحر رائع.",
          },
          rating: 5,
          order: 3,
        },
      ],
    });
    console.log("Sample testimonials seeded");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
