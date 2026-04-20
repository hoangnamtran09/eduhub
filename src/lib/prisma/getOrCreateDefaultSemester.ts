// Helper: get or create default semester for a subject
import { prisma } from '@/lib/prisma/client';

export async function getOrCreateDefaultSemester(subjectId: string) {
  // Try to find existing semester
  let semester = await prisma.semester.findFirst({
    where: { subjectId },
    orderBy: { order: 'asc' },
  });
  if (!semester) {
    semester = await prisma.semester.create({
      data: {
        name: 'Học kỳ 1',
        subjectId,
        order: 1,
      },
    });
  }
  return semester;
}
