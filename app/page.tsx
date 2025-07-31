import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Trophy, Users } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold text-gray-900">Nexora</span>
        </div>
        <Link href="/auth/signin">
          <Button variant="outline">Sign In</Button>
        </Link>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Learn with{" "}
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">Motion</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Interactive learning platform with personalized progress tracking and engaging content
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="text-lg px-8 py-4">
              Start Learning Today →
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <Card className="p-8 text-center border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Interactive Courses</h3>
              <p className="text-gray-600">
                Engage with hands-on projects and interactive lessons designed to reinforce learning.
              </p>
            </CardContent>
          </Card>

          <Card className="p-8 text-center border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Progress Tracking</h3>
              <p className="text-gray-600">
                Monitor your learning journey with detailed analytics and achievement milestones.
              </p>
            </CardContent>
          </Card>

          <Card className="p-8 text-center border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Community Learning</h3>
              <p className="text-gray-600">
                Connect with fellow learners and get personalized feedback from instructors.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
