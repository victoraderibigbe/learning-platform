import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 })
    }

    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    const { lessonId, watchTime, completed } = await request.json()

    // Update or create progress
    const progress = await prisma.progress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId,
        },
      },
      update: {
        watchTime,
        completed,
        completedAt: completed ? new Date() : null,
      },
      create: {
        userId: user.id,
        lessonId,
        watchTime,
        completed,
        completedAt: completed ? new Date() : null,
      },
    })

    // Update enrollment progress
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { courseId: true },
    })

    if (lesson) {
      // Calculate course progress
      const totalLessons = await prisma.lesson.count({
        where: { courseId: lesson.courseId },
      })

      const completedLessons = await prisma.progress.count({
        where: {
          userId: user.id,
          completed: true,
          lesson: {
            courseId: lesson.courseId,
          },
        },
      })

      const courseProgress = Math.round((completedLessons / totalLessons) * 100)

      // Update enrollment
      await prisma.enrollment.update({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: lesson.courseId,
          },
        },
        data: {
          progress: courseProgress,
          lastAccessed: new Date(),
          completedAt: courseProgress === 100 ? new Date() : null,
        },
      })

      // Create achievement notification if lesson completed
      if (completed) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: "LESSON",
            title: "Lesson Completed!",
            description: "Great job! You have completed another lesson.",
          },
        })
      }
    }

    return NextResponse.json({ progress })
  } catch (error) {
    console.error("Update progress error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
