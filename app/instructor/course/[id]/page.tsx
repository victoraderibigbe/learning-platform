"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Users,
  BookOpen,
  TrendingUp,
  Edit,
  Eye,
  Play,
  Clock,
  BarChart3,
  Award,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "next/navigation";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  playlistUrl: string;
  instructor: {
    id: string;
    fullName: string;
    email: string;
    avatar: string;
  };
  lessons: any[];
  enrollments: any[];
  stats: {
    totalEnrollments: number;
    averageProgress: number;
    completionRate: number;
    totalLessons: number;
  };
  recentActivity: any[];
  lessonStats: any[];
}

export default function InstructorCourseViewPage() {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const params = useParams();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.push("/auth/signin");
      return;
    }

    const userData = JSON.parse(user);
    if (userData.role !== "INSTRUCTOR") {
      router.push("/dashboard");
      return;
    }

    fetchCourse();
  }, [params.id]);

  const fetchCourse = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/courses/${params.id}/instructor`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCourse(data.course);
      } else {
        throw new Error("Course not found");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load course",
        variant: "destructive",
      });
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const togglePublishStatus = async () => {
    if (!course) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/courses/${course.id}/instructor`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...course,
          isPublished: !course.isPublished,
        }),
      });

      if (response.ok) {
        setCourse({ ...course, isPublished: !course.isPublished });
        toast({
          title: course.isPublished ? "Course Unpublished" : "Course Published",
          description: course.isPublished
            ? "Course is now hidden from students"
            : "Course is now visible to students",
        });
      } else {
        throw new Error("Failed to update course");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update course status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Course not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {course.title}
                </h1>
                <Badge variant={course.isPublished ? "default" : "outline"}>
                  {course.isPublished ? "Published" : "Draft"}
                </Badge>
              </div>
              <p className="text-gray-600">Course Analytics & Management</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={togglePublishStatus}>
              {course.isPublished ? "Unpublish" : "Publish"}
            </Button>
            <Link href={`/instructor/course/${course.id}/edit`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit Course
              </Button>
            </Link>
            <Link href={`/course/${course.id}`}>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 mb-1">Total Students</p>
                  <p className="text-3xl font-bold">
                    {course.stats.totalEnrollments}
                  </p>
                </div>
                <Users className="h-12 w-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 mb-1">Avg. Progress</p>
                  <p className="text-3xl font-bold">
                    {course.stats.averageProgress}%
                  </p>
                </div>
                <TrendingUp className="h-12 w-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 mb-1">Completion Rate</p>
                  <p className="text-3xl font-bold">
                    {course.stats.completionRate}%
                  </p>
                </div>
                <Award className="h-12 w-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 mb-1">Total Lessons</p>
                  <p className="text-3xl font-bold">
                    {course.stats.totalLessons}
                  </p>
                </div>
                <BookOpen className="h-12 w-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Course Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Course Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-4">
                      <img
                        src={
                          course.thumbnail ||
                          "/placeholder.svg?height=120&width=200"
                        }
                        alt={course.title}
                        className="w-32 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">
                          {course.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">
                          {course.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <Badge variant="secondary">{course.category}</Badge>
                          <span>
                            Created{" "}
                            {new Date(course.createdAt).toLocaleDateString()}
                          </span>
                          <span>
                            Updated{" "}
                            {new Date(course.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Student Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {course.recentActivity.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No student activity yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {course.recentActivity.map((activity) => (
                          <div
                            key={activity.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <Avatar>
                              <AvatarImage
                                src={activity.user.avatar || "/placeholder.svg"}
                              />
                              <AvatarFallback>
                                {activity.user.fullName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {activity.user.fullName}
                              </p>
                              <p className="text-xs text-gray-600">
                                Progress: {activity.progress}% • Last active:{" "}
                                {new Date(
                                  activity.lastAccessed
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <Progress
                              value={activity.progress}
                              className="w-20 h-2"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href={`/instructor/course/${course.id}/edit`}>
                      <Button
                        className="w-full bg-transparent"
                        variant="outline"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Course
                      </Button>
                    </Link>
                    <Link href={`/course/${course.id}`}>
                      <Button
                        className="w-full bg-transparent"
                        variant="outline"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview Course
                      </Button>
                    </Link>
                    <Button className="w-full bg-transparent" variant="outline">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Export Analytics
                    </Button>
                    <Button className="w-full bg-transparent" variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Course Settings
                    </Button>
                  </CardContent>
                </Card>

                {/* Course Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Course Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Total Enrollments:
                      </span>
                      <span className="font-medium">
                        {course.stats.totalEnrollments}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Average Progress:
                      </span>
                      <span className="font-medium">
                        {course.stats.averageProgress}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Completion Rate:
                      </span>
                      <span className="font-medium">
                        {course.stats.completionRate}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Total Lessons:
                      </span>
                      <span className="font-medium">
                        {course.stats.totalLessons}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>
                  Enrolled Students ({course.enrollments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {course.enrollments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No students enrolled yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {course.enrollments.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        className="flex items-center gap-4 p-4 border rounded-lg"
                      >
                        <Avatar>
                          <AvatarImage
                            src={enrollment.user.avatar || "/placeholder.svg"}
                          />
                          <AvatarFallback>
                            {enrollment.user.fullName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {enrollment.user.fullName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {enrollment.user.email}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>
                              Enrolled:{" "}
                              {new Date(
                                enrollment.enrolledAt
                              ).toLocaleDateString()}
                            </span>
                            <span>
                              Last active:{" "}
                              {new Date(
                                enrollment.lastAccessed
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {enrollment.progress}%
                            </span>
                            <Progress
                              value={enrollment.progress}
                              className="w-20 h-2"
                            />
                          </div>
                          <Badge
                            variant={
                              enrollment.progress >= 100
                                ? "default"
                                : "secondary"
                            }
                          >
                            {enrollment.progress >= 100
                              ? "Completed"
                              : "In Progress"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lessons Tab */}
          <TabsContent value="lessons">
            <Card>
              <CardHeader>
                <CardTitle>Course Lessons ({course.lessons.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {course.lessons.map((lesson, index) => {
                    const lessonStat = course.lessonStats.find(
                      (stat) => stat.lessonId === lesson.id
                    );
                    return (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-4 p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-500 w-8">
                            {index + 1}
                          </span>
                          <img
                            src={
                              lesson.thumbnail ||
                              "/placeholder.svg?height=60&width=100"
                            }
                            alt={lesson.title}
                            className="w-16 h-10 object-cover rounded"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{lesson.title}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {lesson.duration}
                            </span>
                            <span className="flex items-center gap-1">
                              <Play className="h-3 w-3" />
                              {lessonStat?.totalStudents || 0} views
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {lessonStat?.completionRate || 0}%
                            </span>
                            <Progress
                              value={lessonStat?.completionRate || 0}
                              className="w-20 h-2"
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            {lessonStat?.completedStudents || 0}/
                            {lessonStat?.totalStudents || 0} completed
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Enrollment Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Analytics charts coming soon</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Completion Rates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Progress analytics coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
