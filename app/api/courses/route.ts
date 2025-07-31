import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const user = token ? await getUserFromToken(token) : null

    const courses = await prisma.course.findMany({
      where: { isPublished: true },
      include: {
        instructor: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
        lessons: {
          select: {
            id: true,
            title: true,
            duration: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ courses })
  } catch (error) {
    console.error("Get courses error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 })
    }

    const user = await getUserFromToken(token)

    if (!user || user.role !== "INSTRUCTOR") {
      return NextResponse.json({ message: "Only instructors can create courses" }, { status: 403 })
    }

    const { title, description, category, thumbnail, playlistUrl, lessons } = await request.json()

    // Validate input
    if (!title || !description || !category) {
      return NextResponse.json({ message: "Title, description, and category are required" }, { status: 400 })
    }

    // Create course
    const course = await prisma.course.create({
      data: {
        title,
        description,
        category,
        thumbnail,
        playlistUrl,
        instructorId: user.id,
        isPublished: true,
      },
    })

    // Create lessons if provided
    if (lessons && lessons.length > 0) {
      await prisma.lesson.createMany({
        data: lessons.map((lesson: any, index: number) => ({
          ...lesson,
          courseId: course.id,
          order: index + 1,
        })),
      })
    }

    // Create notification for course creation
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "COURSE_UPDATE",
        title: "Course Created Successfully!",
        description: `Your course "${title}" has been published and is now available to students.`,
      },
    })

    return NextResponse.json(
      {
        message: "Course created successfully",
        course,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create course error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
