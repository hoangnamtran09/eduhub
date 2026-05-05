import { prisma } from "@/lib/prisma/client";
import { CoursesContent } from "@/components/courses/courses-content";

function getGradientFromColor(color: string): string {
  const gradients: Record<string, string> = {
    blue: "from-blue-500 to-cyan-400",
    amber: "from-amber-500 to-orange-400",
    emerald: "from-emerald-500 to-teal-400",
    violet: "from-violet-500 to-purple-400",
    red: "from-red-500 to-pink-400",
    pink: "from-pink-500 to-rose-400",
  };
  return gradients[color] || "from-blue-500 to-cyan-400";
}

export default async function CoursesPage() {
  const prismaAny = prisma as any;
  const subjects = await prismaAny.subject.findMany({
    include: {
      lessons: true,
      courses: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const subjectsData = subjects.map((subject: any) => ({
    id: subject.id,
    name: subject.name,
    icon: subject.icon,
    gradient: getGradientFromColor(subject.color || "blue"),
    description: subject.description,
    totalLessons: subject.lessons?.length || 0,
    coursesCount: subject.courses?.length || 0,
  }));

  return <CoursesContent subjects={subjectsData} />;
}
