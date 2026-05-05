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
  const demoTeacherEmail = "teacher.demo@eduself.local";
  const demoTeacherPassword = "Teacher@123456";
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

  const demoTeacher = await prisma.user.upsert({
    where: { email: demoTeacherEmail },
    update: {
      fullName: "Cô Nguyễn Thị Giáo Viên Demo",
      role: "TEACHER",
      passwordHash: await hashPassword(demoTeacherPassword),
      gradeLevel: null,
    },
    create: {
      email: demoTeacherEmail,
      fullName: "Cô Nguyễn Thị Giáo Viên Demo",
      role: "TEACHER",
      passwordHash: await hashPassword(demoTeacherPassword),
    },
  });

  console.log(`Seeded demo teacher account: ${demoTeacher.email} / ${demoTeacherPassword}`);

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
