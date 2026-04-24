import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { requireAdmin } from "@/lib/auth/require-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const authorization = await requireAdmin();
  if (authorization instanceof NextResponse) return authorization;

  try {
    const prismaAny = prisma as any;
    if (!prismaAny.achievement) {
      return NextResponse.json(
        {
          error: "Achievement model is not available",
          detail: "Prisma Client chưa được cập nhật. Hãy chạy migrate/db push và prisma generate.",
        },
        { status: 503 },
      );
    }

    const achievements = await prismaAny.achievement.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(achievements);
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch achievements",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const authorization = await requireAdmin();
  if (authorization instanceof NextResponse) return authorization;

  try {
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const icon = typeof body.icon === "string" && body.icon.trim() ? body.icon.trim() : "🏆";
    const ruleType = typeof body.ruleType === "string" ? body.ruleType : "";
    const ruleValue = Number(body.ruleValue);

    if (!title || !description || !ruleType || !Number.isFinite(ruleValue) || ruleValue < 1) {
      return NextResponse.json({ error: "Invalid achievement payload" }, { status: 400 });
    }

    const prismaAny = prisma as any;
    if (!prismaAny.achievement) {
      return NextResponse.json(
        {
          error: "Achievement model is not available",
          detail: "Prisma Client chưa được cập nhật. Hãy chạy migrate/db push và prisma generate.",
        },
        { status: 503 },
      );
    }

    const achievement = await prismaAny.achievement.create({
      data: {
        title,
        description,
        icon,
        ruleType,
        ruleValue: Math.round(ruleValue),
        isActive: body.isActive !== false,
      },
    });

    return NextResponse.json(achievement, { status: 201 });
  } catch (error) {
    console.error("Error creating achievement:", error);
    return NextResponse.json(
      {
        error: "Failed to create achievement",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const authorization = await requireAdmin();
  if (authorization instanceof NextResponse) return authorization;

  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const icon = typeof body.icon === "string" && body.icon.trim() ? body.icon.trim() : "🏆";
    const ruleType = typeof body.ruleType === "string" ? body.ruleType : "";
    const ruleValue = Number(body.ruleValue);

    if (!id || !title || !description || !ruleType || !Number.isFinite(ruleValue) || ruleValue < 1) {
      return NextResponse.json({ error: "Invalid achievement payload" }, { status: 400 });
    }

    const prismaAny = prisma as any;
    if (!prismaAny.achievement) {
      return NextResponse.json(
        {
          error: "Achievement model is not available",
          detail: "Prisma Client chưa được cập nhật. Hãy chạy migrate/db push và prisma generate.",
        },
        { status: 503 },
      );
    }

    const achievement = await prismaAny.achievement.update({
      where: { id },
      data: {
        title,
        description,
        icon,
        ruleType,
        ruleValue: Math.round(ruleValue),
        isActive: body.isActive !== false,
      },
    });

    return NextResponse.json(achievement);
  } catch (error) {
    console.error("Error updating achievement:", error);
    return NextResponse.json(
      {
        error: "Failed to update achievement",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const authorization = await requireAdmin();
  if (authorization instanceof NextResponse) return authorization;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";

    if (!id) {
      return NextResponse.json({ error: "Missing achievement id" }, { status: 400 });
    }

    const prismaAny = prisma as any;
    if (!prismaAny.achievement) {
      return NextResponse.json(
        {
          error: "Achievement model is not available",
          detail: "Prisma Client chưa được cập nhật. Hãy chạy migrate/db push và prisma generate.",
        },
        { status: 503 },
      );
    }

    await prismaAny.achievement.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting achievement:", error);
    return NextResponse.json(
      {
        error: "Failed to delete achievement",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
