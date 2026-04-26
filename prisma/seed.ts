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
  const demoStudentEmail = "student.demo@eduself.local";
  const demoStudentPassword = "Student@123456";
  const demoParentEmail = "parent.demo@eduself.local";
  const demoParentPassword = "Parent@123456";

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

  const demoParent = await prisma.user.upsert({
    where: { email: demoParentEmail },
    update: {
      fullName: "Phụ huynh Demo",
      role: "PARENT",
      passwordHash: await hashPassword(demoParentPassword),
      gradeLevel: null,
    },
    create: {
      email: demoParentEmail,
      fullName: "Phụ huynh Demo",
      role: "PARENT",
      passwordHash: await hashPassword(demoParentPassword),
    },
  });

  const demoStudent = await prisma.user.upsert({
    where: { email: demoStudentEmail },
    update: {
      fullName: "Nguyễn Minh Anh Demo",
      role: "STUDENT",
      gradeLevel: 6,
      diamonds: 42,
      parentId: demoParent.id,
      passwordHash: await hashPassword(demoStudentPassword),
      profile: {
        upsert: {
          create: {
            goals: ["Nắm chắc kiến thức Toán lớp 6", "Hoàn thành bài tập đúng hạn", "Duy trì học đều mỗi ngày"],
            strengths: ["Tính toán nhanh", "Chăm chỉ làm bài luyện tập"],
            weaknesses: ["Tập hợp và phần tử", "Ghi số tự nhiên", "Từ vựng tiếng Anh về trường học"],
            streakDays: 5,
            lastActive: new Date(),
          },
          update: {
            goals: ["Nắm chắc kiến thức Toán lớp 6", "Hoàn thành bài tập đúng hạn", "Duy trì học đều mỗi ngày"],
            strengths: ["Tính toán nhanh", "Chăm chỉ làm bài luyện tập"],
            weaknesses: ["Tập hợp và phần tử", "Ghi số tự nhiên", "Từ vựng tiếng Anh về trường học"],
            streakDays: 5,
            lastActive: new Date(),
          },
        },
      },
    },
    create: {
      email: demoStudentEmail,
      fullName: "Nguyễn Minh Anh Demo",
      role: "STUDENT",
      gradeLevel: 6,
      diamonds: 42,
      parentId: demoParent.id,
      passwordHash: await hashPassword(demoStudentPassword),
      profile: {
        create: {
          goals: ["Nắm chắc kiến thức Toán lớp 6", "Hoàn thành bài tập đúng hạn", "Duy trì học đều mỗi ngày"],
          strengths: ["Tính toán nhanh", "Chăm chỉ làm bài luyện tập"],
          weaknesses: ["Tập hợp và phần tử", "Ghi số tự nhiên", "Từ vựng tiếng Anh về trường học"],
          streakDays: 5,
          lastActive: new Date(),
        },
      },
    },
  });

  console.log(`Seeded demo student account: ${demoStudent.email} / ${demoStudentPassword}`);
  console.log(`Seeded demo parent account: ${demoParent.email} / ${demoParentPassword}`);

  const achievements = [
    {
      title: "Khởi động bền bỉ",
      description: "Duy trì chuỗi học tập ít nhất 3 ngày liên tiếp.",
      icon: "🔥",
      ruleType: "streak_days",
      ruleValue: 3,
    },
    {
      title: "Một tuần chăm chỉ",
      description: "Học tổng cộng ít nhất 4 giờ trong tuần.",
      icon: "⏱️",
      ruleType: "weekly_study_hours",
      ruleValue: 4,
    },
    {
      title: "Nhà luyện tập AI",
      description: "Hoàn thành ít nhất 3 bài luyện tập AI với điểm từ 80 trở lên.",
      icon: "📝",
      ruleType: "completed_exercises",
      ruleValue: 3,
    },
    {
      title: "Học lực ổn định",
      description: "Đạt điểm quiz trung bình từ 8 trở lên.",
      icon: "🎯",
      ruleType: "avg_quiz_score",
      ruleValue: 8,
    },
    {
      title: "Thợ săn kim cương",
      description: "Tích lũy ít nhất 40 kim cương học tập.",
      icon: "💎",
      ruleType: "diamonds",
      ruleValue: 40,
    },
    {
      title: "Người học bền bỉ",
      description: "Tổng thời gian học đạt ít nhất 8 giờ.",
      icon: "🏆",
      ruleType: "total_study_hours",
      ruleValue: 8,
    },
  ];

  for (const achievement of achievements) {
    const existingAchievement = await prisma.achievement.findFirst({
      where: { title: achievement.title },
      select: { id: true },
    });

    if (existingAchievement) {
      await prisma.achievement.update({
        where: { id: existingAchievement.id },
        data: {
          description: achievement.description,
          icon: achievement.icon,
          ruleType: achievement.ruleType,
          ruleValue: achievement.ruleValue,
          isActive: true,
        },
      });
    } else {
      await prisma.achievement.create({
        data: {
          ...achievement,
          isActive: true,
        },
      });
    }
  }

  console.log(`Seeded ${achievements.length} achievements`);

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

  const createdMathLessons = [];

  for (const lesson of mathLessons) {
    const createdLesson = await prisma.lesson.create({
        data: {
          ...lesson,
          subjectId: mathSubject.id,
          chapterId: mathChapter1.id,
        },
      });
    createdMathLessons.push(createdLesson);
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

  const createdMathLessons2 = [];

  for (const lesson of mathLessons2) {
    const createdLesson = await prisma.lesson.create({
        data: {
          ...lesson,
          subjectId: mathSubject.id,
          chapterId: mathChapter2.id,
        },
      });
    createdMathLessons2.push(createdLesson);
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

  const createdPhysicsLessons = [];

  for (const lesson of physicsLessons) {
    const createdLesson = await prisma.lesson.create({
        data: {
          ...lesson,
          subjectId: physicsSubject.id,
          chapterId: physicsChapter1.id,
        },
      });
    createdPhysicsLessons.push(createdLesson);
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

  const createdEnglishLessons = [];

  for (const lesson of englishLessons) {
    const createdLesson = await prisma.lesson.create({
        data: {
          ...lesson,
          subjectId: englishSubject.id,
          chapterId: englishChapter1.id,
        },
      });
    createdEnglishLessons.push(createdLesson);
  }

  console.log("Created lessons for all subjects");

  await prisma.enrollment.createMany({
    data: [mathCourse.id, physicsCourse.id, englishCourse.id].map((courseId) => ({
      courseId,
      userId: demoStudent.id,
    })),
    skipDuplicates: true,
  });

  const allDemoLessons = [
    ...createdMathLessons,
    ...createdMathLessons2,
    ...createdPhysicsLessons,
    ...createdEnglishLessons,
  ];
  const now = new Date();

  for (const [index, lesson] of allDemoLessons.slice(0, 7).entries()) {
    const startedAt = new Date(now);
    startedAt.setDate(now.getDate() - (6 - index));
    startedAt.setHours(19, 30, 0, 0);

    await prisma.studySession.create({
      data: {
        userId: demoStudent.id,
        lessonId: lesson.id,
        startedAt,
        endedAt: new Date(startedAt.getTime() + (35 + index * 5) * 60 * 1000),
        durationSec: (35 + index * 5) * 60,
        lastPingAt: new Date(startedAt.getTime() + (35 + index * 5) * 60 * 1000),
      },
    });

    await prisma.lessonProgress.upsert({
      where: {
        lessonId_userId: {
          lessonId: lesson.id,
          userId: demoStudent.id,
        },
      },
      update: {
        completed: index < 5,
        completedAt: index < 5 ? new Date(startedAt.getTime() + (35 + index * 5) * 60 * 1000) : null,
        startedAt,
        lastStudiedAt: startedAt,
        lastPage: Math.max(1, index + 1),
        totalStudySec: (35 + index * 5) * 60,
        status: index < 5 ? "COMPLETED" : "IN_PROGRESS",
      },
      create: {
        lessonId: lesson.id,
        userId: demoStudent.id,
        completed: index < 5,
        completedAt: index < 5 ? new Date(startedAt.getTime() + (35 + index * 5) * 60 * 1000) : null,
        startedAt,
        lastStudiedAt: startedAt,
        lastPage: Math.max(1, index + 1),
        totalStudySec: (35 + index * 5) * 60,
        status: index < 5 ? "COMPLETED" : "IN_PROGRESS",
      },
    });
  }

  const quizLesson = createdMathLessons[1];
  const quiz = await prisma.quiz.create({
    data: {
      lessonId: quizLesson.id,
      title: "Kiểm tra nhanh: Tập hợp",
      questions: {
        create: [
          {
            question: "Kí hiệu nào dùng để biểu diễn phần tử thuộc tập hợp?",
            options: [
              { id: "A", text: "∈" },
              { id: "B", text: "∉" },
              { id: "C", text: "⊂" },
              { id: "D", text: "=" },
            ],
            explanation: "Kí hiệu ∈ nghĩa là thuộc tập hợp.",
            order: 1,
          },
          {
            question: "Tập hợp A = {1, 2, 3} có bao nhiêu phần tử?",
            options: [
              { id: "A", text: "1" },
              { id: "B", text: "2" },
              { id: "C", text: "3" },
              { id: "D", text: "4" },
            ],
            explanation: "A có ba phần tử là 1, 2 và 3.",
            order: 2,
          },
        ],
      },
    },
  });

  await prisma.quizAttempt.createMany({
    data: [
      {
        quizId: quiz.id,
        userId: demoStudent.id,
        score: 9,
        totalQuestions: 10,
        answers: { correct: 9, total: 10 },
        completedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        quizId: quiz.id,
        userId: demoStudent.id,
        score: 8,
        totalQuestions: 10,
        answers: { correct: 8, total: 10 },
        completedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      },
    ],
  });

  await prisma.exerciseAttempt.createMany({
    data: [
      {
        userId: demoStudent.id,
        lessonId: createdMathLessons[1].id,
        exerciseTitle: "Luyện tập tập hợp",
        question: "Viết tập hợp các số tự nhiên nhỏ hơn 5.",
        userAnswer: "{0, 1, 2, 3, 4}",
        aiFeedback: "Câu trả lời đúng. Em đã nhớ rằng số tự nhiên bắt đầu từ 0.",
        score: 95,
        diamondsEarned: 4,
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        userId: demoStudent.id,
        lessonId: createdMathLessons[2].id,
        exerciseTitle: "Luyện tập số tự nhiên",
        question: "Sắp xếp các số 12, 5, 20 theo thứ tự tăng dần.",
        userAnswer: "5, 12, 20",
        aiFeedback: "Chính xác. Em đã so sánh số tự nhiên đúng.",
        score: 90,
        diamondsEarned: 3,
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        userId: demoStudent.id,
        lessonId: createdEnglishLessons[2].id,
        exerciseTitle: "Vocabulary: At School",
        question: "Translate: classroom, teacher, notebook.",
        userAnswer: "lớp học, giáo viên, vở ghi",
        aiFeedback: "Tốt. Cần luyện thêm cách dùng từ trong câu hoàn chỉnh.",
        score: 82,
        diamondsEarned: 2,
        createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      },
    ],
  });

  const assignment = await prisma.assignment.create({
    data: {
      title: "Bài tập demo: Tập hợp và số tự nhiên",
      description: "Hoàn thành các câu hỏi về tập hợp, phần tử của tập hợp và tập hợp số tự nhiên.",
      lessonId: createdMathLessons[1].id,
      createdById: admin.id,
      dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      maxScore: 10,
      rubric: {
        criteria: ["Xác định đúng phần tử", "Trình bày rõ ràng", "Giải thích được kí hiệu"],
      },
      targetGradeLevel: 6,
      isPublished: true,
    },
  });

  await prisma.assignmentRecipient.create({
    data: {
      assignmentId: assignment.id,
      studentId: demoStudent.id,
      status: "SUBMITTED",
      submissionText: "Em đã hoàn thành bài tập về tập hợp và số tự nhiên. Các câu trả lời được trình bày trong phần nội dung nộp bài.",
      score: 8,
      aiScore: 8,
      feedback: "Bài làm tốt, cần chú ý giải thích rõ hơn ý nghĩa của kí hiệu thuộc và không thuộc.",
      rubricScores: {
        accuracy: 8,
        presentation: 8,
        explanation: 7,
      },
      submittedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      attemptCount: 1,
    },
  });

  const activeWeakness = await prisma.lessonWeakness.upsert({
    where: {
      userId_lessonId_topic: {
        userId: demoStudent.id,
        lessonId: createdMathLessons[1].id,
        topic: "Kí hiệu thuộc và không thuộc tập hợp",
      },
    },
    update: {
      source: "AI_CHAT",
      status: "ACTIVE",
      question: "Khi nào dùng kí hiệu ∈ và khi nào dùng ∉?",
      reason: "Học sinh còn nhầm lẫn giữa phần tử thuộc và không thuộc tập hợp.",
      aiFeedback: "Cần luyện thêm các ví dụ xác định phần tử thuộc hoặc không thuộc một tập hợp cho trước.",
      reviewExercises: [
        { question: "Cho A = {2, 4, 6}. Điền đúng: 4 ... A", answer: "∈" },
        { question: "Cho A = {2, 4, 6}. Điền đúng: 5 ... A", answer: "∉" },
      ],
      score: 65,
      lastResult: false,
      evidenceCount: 2,
      initialScore: 60,
      bestScore: 75,
      remediationCount: 1,
    },
    create: {
      userId: demoStudent.id,
      lessonId: createdMathLessons[1].id,
      topic: "Kí hiệu thuộc và không thuộc tập hợp",
      source: "AI_CHAT",
      status: "ACTIVE",
      question: "Khi nào dùng kí hiệu ∈ và khi nào dùng ∉?",
      reason: "Học sinh còn nhầm lẫn giữa phần tử thuộc và không thuộc tập hợp.",
      aiFeedback: "Cần luyện thêm các ví dụ xác định phần tử thuộc hoặc không thuộc một tập hợp cho trước.",
      reviewExercises: [
        { question: "Cho A = {2, 4, 6}. Điền đúng: 4 ... A", answer: "∈" },
        { question: "Cho A = {2, 4, 6}. Điền đúng: 5 ... A", answer: "∉" },
      ],
      score: 65,
      lastResult: false,
      evidenceCount: 2,
      initialScore: 60,
      bestScore: 75,
      remediationCount: 1,
    },
  });

  await prisma.remediationAttempt.create({
    data: {
      weaknessId: activeWeakness.id,
      userId: demoStudent.id,
      quizData: {
        title: "Ôn tập kí hiệu tập hợp",
        questions: [
          { question: "3 có thuộc {1, 2, 3} không?", answer: "Có" },
          { question: "7 có thuộc {2, 4, 6} không?", answer: "Không" },
        ],
      },
      answers: { q1: "Có", q2: "Có" },
      score: 50,
      totalQuestions: 2,
      passed: false,
      completedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
  });

  await prisma.aICo.create({
    data: {
      userId: demoStudent.id,
      lessonId: createdMathLessons[1].id,
      title: "Hỏi đáp demo về tập hợp",
      messages: {
        create: [
          {
            role: "user",
            content: "Em chưa hiểu kí hiệu thuộc tập hợp là gì?",
          },
          {
            role: "assistant",
            content: "Kí hiệu ∈ nghĩa là một phần tử thuộc một tập hợp. Ví dụ 2 ∈ {1, 2, 3} vì 2 nằm trong tập hợp đó.",
          },
        ],
      },
    },
  });

  console.log("Seeded demo learning data for student dashboard");
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
