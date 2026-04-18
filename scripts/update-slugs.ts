/**
 * Script to generate slugs for existing lessons
 * Run with: npx ts-node scripts/update-slugs.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Vietnamese to Latin character mapping
const vietnameseMap: Record<string, string> = {
  à: "a", á: "a", ã: "a", ả: "a", ạ: "a",
  ă: "a", ằ: "a", ắ: "a", ẵ: "a", ẳ: "a", ặ: "a",
  â: "a", ầ: "a", ấ: "a", ẫ: "a", ẩ: "a", ậ: "a",
  è: "e", é: "e", ẻ: "e", ẽ: "e", ẹ: "e",
  ê: "e", ề: "e", ế: "e", ễ: "e", ể: "e", ệ: "e",
  ì: "i", í: "i", ỉ: "i", ĩ: "i", ị: "i",
  ò: "o", ó: "o", ỏ: "o", õ: "o", ọ: "o",
  ô: "o", ồ: "o", ố: "o", ỗ: "o", ổ: "o", ộ: "o",
  ơ: "o", ờ: "o", ớ: "o", ở: "o", ỡ: "o", ợ: "o",
  ù: "u", ú: "u", ủ: "u", ũ: "u", ụ: "u",
  ư: "u", ừ: "u", ứ: "u", ử: "u", ữ: "u", ự: "u",
  ỳ: "y", ý: "y", ỷ: "y", ỹ: "y", ỵ: "y",
  đ: "d",
  À: "A", Á: "A", Ã: "A", Ả: "A", Ạ: "A",
  Ă: "A", Ằ: "A", Ắ: "A", Ẵ: "A", Ẳ: "A", Ặ: "A",
  Â: "A", Ầ: "A", Ấ: "A", Ẫ: "A", Ẩ: "A", Ậ: "A",
  È: "E", É: "E", Ẻ: "E", Ẽ: "E", Ẹ: "E",
  Ê: "E", Ề: "E", Ế: "E", Ễ: "E", Ể: "E", Ệ: "E",
  Ì: "I", Í: "I", Ỉ: "I", Ĩ: "I", Ị: "I",
  Ò: "O", Ó: "O", Ỏ: "O", Õ: "O", Ọ: "O",
  Ô: "O", Ồ: "O", Ố: "O", Ỗ: "O", Ổ: "O", Ộ: "O",
  Ơ: "O", Ờ: "O", Ớ: "O", Ở: "O", Ỡ: "O", Ợ: "O",
  Ù: "U", Ú: "U", Ủ: "U", Ũ: "U", Ụ: "U",
  Ư: "U", Ừ: "U", Ứ: "U", Ử: "U", Ữ: "U", Ự: "U",
  Ỳ: "Y", Ý: "Y", Ỷ: "Y", Ỹ: "Y", Ỵ: "Y",
  Đ: "D",
};

function generateSlug(title: string): string {
  let result = title.toLowerCase();

  // Replace Vietnamese characters
  for (const [viet, lat] of Object.entries(vietnameseMap)) {
    result = result.replace(new RegExp(viet, "g"), lat);
  }

  // Replace spaces and special characters with hyphens
  result = result.replace(/[^a-z0-9\s-]/g, "");
  result = result.replace(/\s+/g, "-");
  result = result.replace(/^-+|-+$/g, "");
  result = result.replace(/-+/g, "-");

  return result;
}

async function main() {
  console.log("🔄 Starting slug generation for lessons...\n");

  // Get all lessons without slugs
  const lessons = await prisma.lesson.findMany({
    where: {
      OR: [
        { slug: null },
        { slug: "" },
      ],
    },
  });

  console.log(`📚 Found ${lessons.length} lessons without slugs\n`);

  for (const lesson of lessons) {
    const baseSlug = generateSlug(lesson.title);
    let slug = baseSlug;
    let counter = 1;

    // Check for existing slugs and make unique
    while (true) {
      const existing = await prisma.lesson.findFirst({
        where: { slug },
      });

      if (!existing || existing.id === lesson.id) {
        break;
      }
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { slug },
    });

    console.log(`✅ Updated: "${lesson.title}" -> "${slug}"`);
  }

  console.log("\n✨ Done! All lessons now have slugs.");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });