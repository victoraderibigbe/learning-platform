import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, generateToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { fullName, email, password, role } = await request.json()

    // Validate input
    if (!fullName || !email || !password || !role) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters long" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        role: role.toUpperCase(),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    // Generate token
    const token = generateToken(user.id)

    // Create welcome notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "COURSE_UPDATE",
        title: "Welcome to Nexora!",
        description: "Start your learning journey today by exploring our courses.",
      },
    })

    return NextResponse.json(
      {
        message: "User created successfully",
        user,
        token,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
