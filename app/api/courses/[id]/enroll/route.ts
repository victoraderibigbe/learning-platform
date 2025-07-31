import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromToken } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 })
    }

    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: params.id },
      select: { id: true, title: true },
    })

    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 })
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: params.id,
        },
      },
    })

    if (existingEnrollment) {
      return NextResponse.json({ message: "Already enrolled in this course" }, { status: 409 })
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId: params.id,
      },
    })

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "COURSE_UPDATE",
        title: "Successfully Enrolled!",
        description: `You have been enrolled in "${course.title}". Start learning now!`,
      },
    })

    return NextResponse.json(
      {
        message: "Successfully enrolled in course",
        enrollment,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Enroll course error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
