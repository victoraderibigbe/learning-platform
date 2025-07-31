import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const user = token ? await getUserFromToken(token) : null;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        instructor: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
        lessons: {
          orderBy: { order: "asc" },
          include: {
            progress: user
              ? {
                  where: { userId: user.id },
                  select: {
                    completed: true,
                    watchTime: true,
                  },
                }
              : false,
          },
        },
        quizzes: {
          orderBy: { order: "asc" },
          include: {
            questions: {
              orderBy: { order: "asc" },
            },
          },
        },
        enrollments: user
          ? {
              where: { userId: user.id },
              select: {
                id: true,
                progress: true,
                enrolledAt: true,
                lastAccessed: true,
              },
            }
          : false,
        _count: {
          select: {
            enrollments: true,
            lessons: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { message: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error("Get course error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
