import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const seedId = Date.now();
  
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

  // Create semesters for Math
  const mathSemester1 = await prisma.semester.create({
    data: {
      name: "Học kỳ 1",
      description: "Học kỳ 1 - Toán 6",
      order: 1,
      subjectId: mathSubject.id,
    },
  });

  const mathSemester2 = await prisma.semester.create({
    data: {
      name: "Học kỳ 2",
      description: "Học kỳ 2 - Toán 6",
      order: 2,
      subjectId: mathSubject.id,
    },
  });

  // Create semesters for Physics
  const physicsSemester1 = await prisma.semester.create({
    data: {
      name: "Học kỳ 1",
      description: "Học kỳ 1 - Vật lý 6",
      order: 1,
      subjectId: physicsSubject.id,
    },
  });

  // Create semesters for English
  const englishSemester1 = await prisma.semester.create({
    data: {
      name: "Học kỳ 1",
      description: "Học kỳ 1 - Tiếng Anh 6",
      order: 1,
      subjectId: englishSubject.id,
    },
  });

  console.log("Created semesters for all subjects");

  // Create lessons for Math Semester 1
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
        semesterId: mathSemester1.id,
      },
    });
  }

  // Create lessons for Math Semester 2
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
        semesterId: mathSemester2.id,
      },
    });
  }

  // Create lessons for Physics Semester 1
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
        semesterId: physicsSemester1.id,
      },
    });
  }

  // Create lessons for English Semester 1
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
        semesterId: englishSemester1.id,
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