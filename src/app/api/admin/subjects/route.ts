import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { generateSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
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
  try {
    const body = await request.json();
    const { name, slug, description, icon, color } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Subject name is required" },
        { status: 400 }
      );
    }

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
  try {
    const body = await request.json();
    const { id, name, slug, description, icon, color } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Subject ID is required" },
        { status: 400 }
      );
    }

    const prismaAny = prisma as any;
    const subject = await prismaAny.subject.update({
      where: { id },
      data: {
        name,
        slug: slug || (name ? generateSlug(name) : undefined),
        description,
        icon,
        color,
      },
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
