"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BookOpen,
  Trophy,
  CheckCircle,
  Bell,
  Plus,
  LogOut,
  Clock,
  Play,
  Users,
  TrendingUp,
  Eye,
  Edit,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface StudentCourse {
  id: string;
  title: string;
  thumbnail: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  level: string;
  lastAccessed: string;
  instructor: string;
  category: string;
}

interface InstructorCourse {
  id: string;
  title: string;
  thumbnail: string;
  totalLessons: number;
  totalEnrollments: number;
  averageProgress: number;
  category: string;
  isPublished: boolean;
  createdAt: string;
  recentActivity: any[];
}

interface Notification {
  id: string;
  type: "ASSIGNMENT" | "LESSON" | "ACHIEVEMENT" | "COURSE_UPDATE";
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
}

interface DashboardData {
  userType: "student" | "instructor";
  courses: StudentCourse[] | InstructorCourse[];
  notifications: Notification[];
  stats: any;
  recentEnrollments?: any[];
}

export default function DashboardPage() {
  const [user, setUser] = useState<any | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchDashboardData = async () => {
      const userData = localStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        if (!parsedUser) {
          router.push("/auth/signin");
          return;
        }

        try {
          const token = localStorage.getItem("token");

          const response = await fetch("/api/dashboard", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setDashboardData(data);
          } else {
            throw new Error("Failed to fetch dashboard data");
          }
        } catch (error) {
          console.error("Dashboard fetch error:", error);
          toast({
            title: "Error",
            description: "Failed to load dashboard data",
            variant: "destructive",
          });
        }
      } else {
        router.push("/auth/signin");
        return;
      }
      setLoading(false);
    };

    fetchDashboardData();
  }, [router, toast]);

  const handleSignOut = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    toast({
      title: "Signed out successfully",
      description: "You have been signed out of your account.",
    });
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user || !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Error loading dashboard
      </div>
    );
  }

  const isInstructor = dashboardData.userType === "instructor";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src="/placeholder.svg?height=40&width=40" />
              <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user.fullName}! 👋
              </h1>
              <p className="text-gray-600">
                {isInstructor
                  ? "Manage your courses and track student progress"
                  : "Ready to continue your learning journey?"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isInstructor && (
              <Link href="/courses">
                <Button variant="outline">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse Courses
                </Button>
              </Link>
            )}
            {isInstructor && (
              <Link href="/create-course">
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
                </Button>
              </Link>
            )}
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Stats Cards */}
            {isInstructor ? (
              <div className="grid md:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 mb-1">Total Courses</p>
                        <p className="text-3xl font-bold">
                          {dashboardData.stats.totalCourses}
                        </p>
                      </div>
                      <BookOpen className="h-12 w-12 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 mb-1">Total Students</p>
                        <p className="text-3xl font-bold">
                          {dashboardData.stats.totalStudents}
                        </p>
                      </div>
                      <Users className="h-12 w-12 text-green-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 mb-1">Total Lessons</p>
                        <p className="text-3xl font-bold">
                          {dashboardData.stats.totalLessons}
                        </p>
                      </div>
                      <Play className="h-12 w-12 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 mb-1">Avg. Completion</p>
                        <p className="text-3xl font-bold">
                          {dashboardData.stats.averageCompletion}%
                        </p>
                      </div>
                      <TrendingUp className="h-12 w-12 text-orange-200" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 mb-1">Overall Progress</p>
                        <p className="text-3xl font-bold">
                          {dashboardData.stats.overallProgress}%
                        </p>
                      </div>
                      <Trophy className="h-12 w-12 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 mb-1">Lessons Completed</p>
                        <p className="text-3xl font-bold">
                          {dashboardData.stats.lessonsCompleted}
                        </p>
                      </div>
                      <CheckCircle className="h-12 w-12 text-green-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 mb-1">Active Courses</p>
                        <p className="text-3xl font-bold">
                          {dashboardData.stats.activeCourses}
                        </p>
                      </div>
                      <BookOpen className="h-12 w-12 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Courses Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  {isInstructor ? "My Courses" : "My Learning"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {dashboardData.courses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">
                      {isInstructor
                        ? "No courses created yet"
                        : "No courses enrolled yet"}
                    </p>
                    <p className="text-sm mb-4">
                      {isInstructor
                        ? "Create your first course to start teaching"
                        : "Browse and enroll in courses to start learning"}
                    </p>
                    <Link href={isInstructor ? "/create-course" : "/courses"}>
                      <Button>
                        {isInstructor ? "Create Course" : "Browse Courses"}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  dashboardData.courses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <img
                        src={
                          course.thumbnail ||
                          "/placeholder.svg?height=100&width=150"
                        }
                        alt={course.title}
                        className="w-20 h-14 object-cover rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {course.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {isInstructor
                                ? (course as InstructorCourse).category
                                : (course as StudentCourse).level || "Beginner"}
                            </Badge>
                            {isInstructor && (
                              <Badge
                                variant={
                                  (course as InstructorCourse).isPublished
                                    ? "default"
                                    : "outline"
                                }
                              >
                                {(course as InstructorCourse).isPublished
                                  ? "Published"
                                  : "Draft"}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {isInstructor ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Play className="h-3 w-3" />
                                {(course as InstructorCourse).totalLessons}{" "}
                                lessons
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {
                                  (course as InstructorCourse).totalEnrollments
                                }{" "}
                                students
                              </div>
                              <div className="flex items-center gap-1">
                                <BarChart3 className="h-3 w-3" />
                                {(course as InstructorCourse).averageProgress}%
                                avg completion
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">
                                Created{" "}
                                {new Date(
                                  (course as InstructorCourse).createdAt
                                ).toLocaleDateString()}
                              </span>
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline">
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600 mb-2">
                              {(course as StudentCourse).completedLessons}/
                              {(course as StudentCourse).totalLessons} lessons •
                              by {(course as StudentCourse).instructor}
                            </p>
                            <Progress
                              value={(course as StudentCourse).progress || 0}
                              className="h-2"
                            />
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Clock className="h-3 w-3" />
                                {(course as StudentCourse).lastAccessed
                                  ? new Date(
                                      (course as StudentCourse).lastAccessed
                                    ).toLocaleDateString()
                                  : "Never"}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {Math.round(
                                    (course as StudentCourse).progress || 0
                                  )}
                                  %
                                </span>
                                <Link href={`/course/${course.id}`}>
                                  <Button size="sm">
                                    <Play className="h-3 w-3 mr-1" />
                                    Continue
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notifications Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-orange-600" />
                    Notifications
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {dashboardData.notifications.filter((n) => !n.read).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboardData.notifications.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  dashboardData.notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border ${
                        notification.read
                          ? "bg-gray-50"
                          : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-1 rounded-full ${
                            notification.type === "ASSIGNMENT"
                              ? "bg-green-100"
                              : notification.type === "LESSON"
                              ? "bg-blue-100"
                              : notification.type === "ACHIEVEMENT"
                              ? "bg-yellow-100"
                              : "bg-purple-100"
                          }`}
                        >
                          {notification.type === "ASSIGNMENT" ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : notification.type === "LESSON" ? (
                            <BookOpen className="h-4 w-4 text-blue-600" />
                          ) : notification.type === "ACHIEVEMENT" ? (
                            <Trophy className="h-4 w-4 text-yellow-600" />
                          ) : (
                            <BookOpen className="h-4 w-4 text-purple-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900 mb-1">
                            {notification.title}
                          </h4>
                          <p className="text-xs text-gray-600 mb-2">
                            {notification.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(
                              notification.createdAt
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <Button variant="ghost" className="w-full text-blue-600">
                  View All Notifications
                </Button>
              </CardContent>
            </Card>

            {/* Recent Enrollments for Instructors */}
            {isInstructor &&
              dashboardData.recentEnrollments &&
              dashboardData.recentEnrollments.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-600" />
                      Recent Enrollments
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dashboardData.recentEnrollments.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        className="flex items-center gap-3 p-2 bg-green-50 rounded-lg"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {enrollment.user.fullName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {enrollment.user.fullName}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {enrollment.course.title}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
