import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { generateSlug } from "@/lib/slug";
import { z } from "zod";
import { requireAdminOrTeacher } from "@/lib/auth/require-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const subjectMutationSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(140).optional(),
  description: z.string().max(500).optional().nullable(),
  icon: z.string().trim().max(20).optional().nullable(),
  color: z.string().trim().max(40).optional().nullable(),
  gradeLevel: z.coerce.number().int().min(1).max(12).optional().nullable(),
});

export async function GET() {
  const authorization = await requireAdminOrTeacher();
  if (authorization instanceof NextResponse) return authorization;

  try {
    const prismaAny = prisma as any;
    const subjects = await prismaAny.subject.findMany({
      include: {
        lessons: true,
        courses: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authorization = await requireAdminOrTeacher();
  if (authorization instanceof NextResponse) return authorization;

  try {
    const parsed = subjectMutationSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid subject payload",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { name, slug, description, icon, color, gradeLevel } = parsed.data;

    const baseSlug = slug || generateSlug(name);
    // Ensure slug is unique by appending timestamp if it already exists
    const prismaAny = prisma as any;
    const existingSubject = await prismaAny.subject.findUnique({
      where: { slug: baseSlug },
    });
    
    const finalSlug = existingSubject ? `${baseSlug}-${Date.now()}` : baseSlug;

    const subject = await prismaAny.subject.create({
      data: {
        name,
        slug: finalSlug,
        description: description || null,
        icon: icon || "📚",
        color: color || "blue",
        courses: gradeLevel
          ? {
              create: {
                title: `${name} - Lớp ${gradeLevel}`,
                slug: `${finalSlug}-lop-${gradeLevel}`,
                gradeLevel,
                isPublished: true,
              },
            }
          : undefined,
      },
      include: {
        lessons: true,
        courses: true,
      },
    });

    return NextResponse.json(subject);
  } catch (error) {
    console.error("Error creating subject:", error);
    return NextResponse.json(
      { 
        error: "Failed to create subject",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const authorization = await requireAdminOrTeacher();
  if (authorization instanceof NextResponse) return authorization;

  try {
    const parsed = subjectMutationSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid subject payload",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { id, name, slug, description, icon, color, gradeLevel } = parsed.data;

    if (!id) {
      return NextResponse.json(
        { error: "Subject ID is required" },
        { status: 400 }
      );
    }

    const prismaAny = prisma as any;
    const subject = await prismaAny.$transaction(async (tx: any) => {
      const updatedSubject = await tx.subject.update({
        where: { id },
        data: {
          name,
          slug: slug || (name ? generateSlug(name) : undefined),
          description,
          icon,
          color,
        },
      });

      if (gradeLevel) {
        const existingCourse = await tx.course.findFirst({
          where: { subjectId: id },
          orderBy: { createdAt: "asc" },
        });

        if (existingCourse) {
          await tx.course.update({
            where: { id: existingCourse.id },
            data: {
              title: `${name} - Lớp ${gradeLevel}`,
              gradeLevel,
              isPublished: true,
            },
          });
        } else {
          await tx.course.create({
            data: {
              subjectId: id,
              title: `${name} - Lớp ${gradeLevel}`,
              slug: `${updatedSubject.slug}-lop-${gradeLevel}`,
              gradeLevel,
              isPublished: true,
            },
          });
        }
      }

      return tx.subject.findUnique({
        where: { id },
        include: {
          lessons: true,
          courses: true,
        },
      });
    });

    return NextResponse.json(subject);
  } catch (error) {
    console.error("Error updating subject:", error);
    return NextResponse.json(
      { error: "Failed to update subject" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const authorization = await requireAdminOrTeacher();
  if (authorization instanceof NextResponse) return authorization;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Subject ID is required" },
        { status: 400 }
      );
    }

    // Related courses and lessons will be deleted by Cascade if defined in schema,
    // but let's be explicit if needed or just rely on onDelete: Cascade
    const prismaAny = prisma as any;
    await prismaAny.subject.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting subject:", error);
    return NextResponse.json(
      { error: "Failed to delete subject" },
      { status: 500 }
    );
  }
}
