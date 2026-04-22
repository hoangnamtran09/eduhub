import { prisma } from "@/lib/prisma/client";

export async function getOrCreateDefaultCourse(subjectId: string) {
  let course = await prisma.course.findFirst({
    where: { subjectId },
    orderBy: { createdAt: "asc" },
  });

  if (!course) {
    course = await prisma.course.create({
      data: {
        subjectId,
        title: "Khóa học mặc định",
        slug: `khoa-hoc-${subjectId}-${Date.now()}`,
        gradeLevel: 6,
        isPublished: true,
      },
    });
  }

  return course;
}
