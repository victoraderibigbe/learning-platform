import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    if (user.role === "INSTRUCTOR") {
      // Instructor Dashboard Data
      const createdCourses = await prisma.course.findMany({
        where: { instructorId: user.id },
        include: {
          lessons: {
            select: {
              id: true,
              title: true,
              duration: true,
            },
          },
          enrollments: {
            select: {
              id: true,
              userId: true,
              progress: true,
              enrolledAt: true,
              lastAccessed: true,
            },
          },
          _count: {
            select: {
              lessons: true,
              enrollments: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Calculate instructor statistics
      const totalStudents = createdCourses.reduce(
        (total, course) => total + course._count.enrollments,
        0
      );
      const totalLessons = createdCourses.reduce(
        (total, course) => total + course._count.lessons,
        0
      );
      const totalCourses = createdCourses.length;

      // Calculate average course completion rate
      const completionRates = createdCourses.map((course) => {
        if (course.enrollments.length === 0) return 0;
        const avgProgress =
          course.enrollments.reduce(
            (sum, enrollment) => sum + enrollment.progress,
            0
          ) / course.enrollments.length;
        return avgProgress;
      });
      const averageCompletion =
        completionRates.length > 0
          ? Math.round(
              completionRates.reduce((sum, rate) => sum + rate, 0) /
                completionRates.length
            )
          : 0;

      // Get recent enrollments for notifications
      const recentEnrollments = await prisma.enrollment.findMany({
        where: {
          course: {
            instructorId: user.id,
          },
        },
        include: {
          user: {
            select: {
              fullName: true,
            },
          },
          course: {
            select: {
              title: true,
            },
          },
        },
        orderBy: { enrolledAt: "desc" },
        take: 5,
      });

      // Get instructor notifications
      const notifications = await prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      // Format courses data for instructor
      const courses = createdCourses.map((course) => ({
        id: course.id,
        title: course.title,
        thumbnail: course.thumbnail,
        totalLessons: course._count.lessons,
        totalEnrollments: course._count.enrollments,
        averageProgress:
          course.enrollments.length > 0
            ? Math.round(
                course.enrollments.reduce((sum, e) => sum + e.progress, 0) /
                  course.enrollments.length
              )
            : 0,
        category: course.category,
        isPublished: course.isPublished,
        createdAt: course.createdAt,
        recentActivity: course.enrollments
          .sort(
            (a, b) =>
              new Date(b.lastAccessed).getTime() -
              new Date(a.lastAccessed).getTime()
          )
          .slice(0, 3),
      }));

      const stats = {
        totalCourses,
        totalStudents,
        totalLessons,
        averageCompletion,
      };

      return NextResponse.json({
        userType: "instructor",
        courses,
        notifications,
        stats,
        recentEnrollments,
      });
    } else {
      // Student Dashboard Data (existing logic)
      const enrollments = await prisma.enrollment.findMany({
        where: { userId: user.id },
        include: {
          course: {
            include: {
              lessons: {
                select: {
                  id: true,
                  title: true,
                  duration: true,
                },
              },
              instructor: {
                select: {
                  fullName: true,
                },
              },
              _count: {
                select: {
                  lessons: true,
                },
              },
            },
          },
        },
        orderBy: { lastAccessed: "desc" },
      });

      // Get user's progress
      const totalProgress = await prisma.progress.findMany({
        where: { userId: user.id },
      });

      const completedLessons = totalProgress.filter((p) => p.completed).length;
      const totalLessons = totalProgress.length;

      // Calculate overall progress
      const overallProgress =
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

      // Get notifications
      const notifications = await prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      // Format courses data for student
      const courses = enrollments.map((enrollment) => ({
        id: enrollment.course.id,
        title: enrollment.course.title,
        thumbnail: enrollment.course.thumbnail,
        progress: enrollment.progress,
        totalLessons: enrollment.course._count.lessons,
        completedLessons: Math.round(
          (enrollment.progress / 100) * enrollment.course._count.lessons
        ),
        level: "Beginner", // You can add this to the course model
        lastAccessed: enrollment.lastAccessed,
        instructor: enrollment.course.instructor.fullName,
        category: enrollment.course.category,
      }));

      const stats = {
        overallProgress,
        lessonsCompleted: completedLessons,
        activeCourses: enrollments.length,
      };

      return NextResponse.json({
        userType: "student",
        courses,
        notifications,
        stats,
      });
    }
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
