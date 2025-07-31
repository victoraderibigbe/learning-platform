import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await getUserFromToken(token);

    if (!user || user.role !== "INSTRUCTOR") {
      return NextResponse.json(
        { message: "Only instructors can access this endpoint" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const course = await prisma.course.findUnique({
      where: {
        id,
        instructorId: user.id, // Ensure instructor can only access their own courses
      },
      include: {
        instructor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
        lessons: {
          orderBy: { order: "asc" },
          include: {
            progress: {
              select: {
                id: true,
                completed: true,
                userId: true,
                user: {
                  select: {
                    fullName: true,
                  },
                },
              },
            },
          },
        },
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: { enrolledAt: "desc" },
        },
        quizzes: {
          orderBy: { order: "asc" },
          include: {
            questions: {
              orderBy: { order: "asc" },
            },
            attempts: {
              include: {
                user: {
                  select: {
                    fullName: true,
                  },
                },
              },
            },
          },
        },
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

    // Calculate course statistics
    const totalEnrollments = course.enrollments.length;
    const averageProgress =
      totalEnrollments > 0
        ? Math.round(
            course.enrollments.reduce((sum, e) => sum + e.progress, 0) /
              totalEnrollments
          )
        : 0;

    // Calculate completion rate
    const completedEnrollments = course.enrollments.filter(
      (e) => e.progress >= 100
    ).length;
    const completionRate =
      totalEnrollments > 0
        ? Math.round((completedEnrollments / totalEnrollments) * 100)
        : 0;

    // Get recent activity
    const recentActivity = course.enrollments
      .sort(
        (a, b) =>
          new Date(b.lastAccessed).getTime() -
          new Date(a.lastAccessed).getTime()
      )
      .slice(0, 10);

    // Calculate lesson completion stats
    const lessonStats = course.lessons.map((lesson) => {
      const totalProgress = lesson.progress.length;
      const completedProgress = lesson.progress.filter(
        (p) => p.completed
      ).length;
      return {
        lessonId: lesson.id,
        title: lesson.title,
        completionRate:
          totalProgress > 0
            ? Math.round((completedProgress / totalProgress) * 100)
            : 0,
        totalStudents: totalProgress,
        completedStudents: completedProgress,
      };
    });

    const courseWithStats = {
      ...course,
      stats: {
        totalEnrollments,
        averageProgress,
        completionRate,
        totalLessons: course.lessons.length,
      },
      recentActivity,
      lessonStats,
    };

    return NextResponse.json({ course: courseWithStats });
  } catch (error) {
    console.error("Get instructor course error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await getUserFromToken(token);

    if (!user || user.role !== "INSTRUCTOR") {
      return NextResponse.json(
        { message: "Only instructors can edit courses" },
        { status: 403 }
      );
    }

    const { title, description, category, thumbnail, isPublished, lessons } =
      await request.json();

    const { id } = await params;

    // Verify course ownership
    const existingCourse = await prisma.course.findUnique({
      where: {
        id,
        instructorId: user.id,
      },
    });

    if (!existingCourse) {
      return NextResponse.json(
        { message: "Course not found or access denied" },
        { status: 404 }
      );
    }

    // Update course
    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        title,
        description,
        category,
        thumbnail,
        isPublished,
      },
    });

    // Update lessons if provided
    if (lessons && Array.isArray(lessons)) {
      // Delete existing lessons
      await prisma.lesson.deleteMany({
        where: { courseId: id },
      });

      // Create new lessons
      if (lessons.length > 0) {
        await prisma.lesson.createMany({
          data: lessons.map((lesson: any, index: number) => ({
            ...lesson,
            courseId: id,
            order: index + 1,
          })),
        });
      }
    }

    // Create notification for course update
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "COURSE_UPDATE",
        title: "Course Updated Successfully!",
        description: `Your course "${title}" has been updated.`,
      },
    });

    return NextResponse.json({
      message: "Course updated successfully",
      course: updatedCourse,
    });
  } catch (error) {
    console.error("Update course error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
