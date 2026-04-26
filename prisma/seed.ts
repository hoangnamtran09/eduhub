import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function main() {
  console.log("Seeding database...");

  const adminEmail = "admin@eduself.local";
  const adminPassword = "Admin@123456";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      fullName: "EduSelf Admin",
      role: "ADMIN",
      passwordHash: await hashPassword(adminPassword),
    },
    create: {
      email: adminEmail,
      fullName: "EduSelf Admin",
      role: "ADMIN",
      passwordHash: await hashPassword(adminPassword),
    },
  });

  console.log(`Seeded admin account: ${admin.email} / ${adminPassword}`);

  const seedId = Date.now();
  const defaultGradeLevel = 6;
  
  // Create subjects
  const mathSubject = await prisma.subject.create({
    data: {
      name: "Toán học",
      slug: `toan-hoc-${seedId}`,
      description: "Môn Toán học cho học sinh Việt Nam",
      icon: "📐",
      color: "blue",
    },
  });

  const physicsSubject = await prisma.subject.create({
    data: {
      name: "Vật lý",
      slug: `vat-ly-${seedId}`,
      description: "Môn Vật lý cho học sinh Việt Nam",
      icon: "⚡",
      color: "amber",
    },
  });

  const englishSubject = await prisma.subject.create({
    data: {
      name: "Tiếng Anh",
      slug: `tieng-anh-${seedId}`,
      description: "Môn Tiếng Anh cho học sinh Việt Nam",
      icon: "🌍",
      color: "emerald",
    },
  });

  console.log("Created subjects:", mathSubject.name, physicsSubject.name, englishSubject.name);

  const mathCourse = await prisma.course.create({
    data: {
      title: "Toán học lớp 6",
      slug: `toan-hoc-lop-6-${seedId}`,
      subjectId: mathSubject.id,
      description: "Khóa học nền tảng môn Toán lớp 6",
      gradeLevel: defaultGradeLevel,
      isPublished: true,
    },
  });

  const physicsCourse = await prisma.course.create({
    data: {
      title: "Vật lý lớp 6",
      slug: `vat-ly-lop-6-${seedId}`,
      subjectId: physicsSubject.id,
      description: "Khóa học nền tảng môn Vật lý lớp 6",
      gradeLevel: defaultGradeLevel,
      isPublished: true,
    },
  });

  const englishCourse = await prisma.course.create({
    data: {
      title: "Tiếng Anh lớp 6",
      slug: `tieng-anh-lop-6-${seedId}`,
      subjectId: englishSubject.id,
      description: "Khóa học nền tảng môn Tiếng Anh lớp 6",
      gradeLevel: defaultGradeLevel,
      isPublished: true,
    },
  });

  const mathChapter1 = await prisma.chapter.create({
    data: {
      courseId: mathCourse.id,
      title: "Học kỳ 1",
      order: 1,
    },
  });

  const mathChapter2 = await prisma.chapter.create({
    data: {
      courseId: mathCourse.id,
      title: "Học kỳ 2",
      order: 2,
    },
  });

  const physicsChapter1 = await prisma.chapter.create({
    data: {
      courseId: physicsCourse.id,
      title: "Học kỳ 1",
      order: 1,
    },
  });

  const englishChapter1 = await prisma.chapter.create({
    data: {
      courseId: englishCourse.id,
      title: "Học kỳ 1",
      order: 1,
    },
  });

  console.log("Created courses and chapters for all subjects");

  // Create lessons for Math Chapter 1
  const mathLessons = [
    {
      title: "Chương 1 - Ôn tập và bổ túc về số tự nhiên",
      type: "theory",
      duration: 45,
      content: "Trong chương này, chúng ta sẽ ôn tập và bổ túc về số tự nhiên, bao gồm các phép toán cộng, trừ, nhân, chia và các tính chất của chúng.",
      order: 1,
    },
    {
      title: "Bài 1 - Tập hợp. Phần tử của tập hợp",
      type: "theory",
      duration: 30,
      content: "Tập hợp là một khái niệm cơ bản của toán học. Mỗi phần tử có thể thuộc hoặc không thuộc một tập hợp.",
      order: 2,
    },
    {
      title: "Bài 2 - Tập hợp các số tự nhiên",
      type: "exercise",
      duration: 45,
      content: "Tập hợp các số tự nhiên được ký hiệu là N = {0, 1, 2, 3, ...}. Chúng ta sẽ làm quen với các phép toán trên tập hợp này.",
      order: 3,
    },
    {
      title: "Bài 3 - Ghi số tự nhiên",
      type: "theory",
      duration: 30,
      content: "Cách ghi số tự nhiên trong hệ thập phân và các hệ đếm khác.",
      order: 4,
    },
  ];

  for (const lesson of mathLessons) {
    await prisma.lesson.create({
        data: {
          ...lesson,
          subjectId: mathSubject.id,
          chapterId: mathChapter1.id,
        },
      });
  }

  // Create lessons for Math Chapter 2
  const mathLessons2 = [
    {
      title: "Chương 1 - Số nguyên",
      type: "theory",
      duration: 45,
      content: "Số nguyên bao gồm số nguyên dương, số nguyên âm và số 0.",
      order: 1,
    },
    {
      title: "Bài 1 - Làm quen với số nguyên âm",
      type: "theory",
      duration: 30,
      content: "Số nguyên âm được sử dụng để biểu diễn các đại lượng nhỏ hơn 0.",
      order: 2,
    },
  ];

  for (const lesson of mathLessons2) {
    await prisma.lesson.create({
        data: {
          ...lesson,
          subjectId: mathSubject.id,
          chapterId: mathChapter2.id,
        },
      });
  }

  // Create lessons for Physics Chapter 1
  const physicsLessons = [
    {
      title: "Chương 1 - Cơ học",
      type: "theory",
      duration: 45,
      content: "Chương này giới thiệu về các khái niệm cơ bản của cơ học.",
      order: 1,
    },
    {
      title: "Bài 1 - Đo độ dài",
      type: "exercise",
      duration: 45,
      content: "Học cách đo độ dài bằng các dụng cụ đo phù hợp.",
      order: 2,
    },
    {
      title: "Bài 2 - Đo thể tích chất lỏng",
      type: "theory",
      duration: 30,
      content: "Tìm hiểu các dụng cụ đo thể tích chất lỏng.",
      order: 3,
    },
  ];

  for (const lesson of physicsLessons) {
    await prisma.lesson.create({
        data: {
          ...lesson,
          subjectId: physicsSubject.id,
          chapterId: physicsChapter1.id,
        },
      });
  }

  // Create lessons for English Chapter 1
  const englishLessons = [
    {
      title: "Unit 1 - Greetings",
      type: "theory",
      duration: 45,
      content: "Học cách chào hỏi và giới thiệu bản thân bằng tiếng Anh.",
      order: 1,
    },
    {
      title: "Unit 2 - My House",
      type: "exercise",
      duration: 45,
      content: "Từ vựng và mẫu câu về nhà cửa.",
      order: 2,
    },
    {
      title: "Unit 3 - At School",
      type: "quiz",
      duration: 30,
      content: "Ôn tập các đơn vị bài học.",
      order: 3,
    },
  ];

  for (const lesson of englishLessons) {
    await prisma.lesson.create({
        data: {
          ...lesson,
          subjectId: englishSubject.id,
          chapterId: englishChapter1.id,
        },
      });
  }

  console.log("Created lessons for all subjects");
  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
