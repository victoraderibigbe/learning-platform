import { type NextRequest, NextResponse } from "next/server"
import { getUserFromToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "No token provided" }, { status: 401 })
    }

    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Auth me error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
