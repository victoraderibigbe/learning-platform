"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BookOpen,
  ArrowLeft,
  Play,
  CheckCircle,
  Lock,
  Trophy,
  Star,
  Clock,
  Users,
  Award,
  Target,
  Flame,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "next/navigation";

interface Lesson {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  duration: string;
  order: number;
  progress?: {
    completed: boolean;
    watchTime: number;
  }[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  instructor: {
    id: string;
    fullName: string;
    avatar: string;
  };
  lessons: Lesson[];
  enrollments: any[];
  _count: {
    enrollments: number;
    lessons: number;
  };
}

export default function CourseDetailPage() {
  const [user, setUser] = useState<any>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [userStats, setUserStats] = useState({
    streak: 7,
    points: 1250,
    level: 5,
    achievements: 8,
  });

  const router = useRouter();
  const { toast } = useToast();
  const params = useParams();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
      fetchCourse();
    } else {
      router.push("/auth/signin");
    }
  }, [params.id]);

  const fetchCourse = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/courses/${params.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setCourse(data.course);
        setIsEnrolled(data.course.enrollments?.length > 0);
        if (data.course.lessons.length > 0) {
          setCurrentLesson(data.course.lessons[0]);
        }
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

  const enrollInCourse = async () => {
    setEnrolling(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/courses/${params.id}/enroll`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setIsEnrolled(true);
        toast({
          title: "Enrolled successfully!",
          description: "You can now start learning this course.",
        });
        fetchCourse(); // Refresh course data
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      toast({
        title: "Enrollment failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setEnrolling(false);
    }
  };

  const markLessonComplete = async (lessonId: string) => {
    try {
      const token = localStorage.getItem("token");
      await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lessonId,
          completed: true,
          watchTime: 100, // Simulate watch time
        }),
      });

      // Update local state
      setCourse((prev) =>
        prev
          ? {
              ...prev,
              lessons: prev.lessons.map((lesson) =>
                lesson.id === lessonId
                  ? {
                      ...lesson,
                      progress: [{ completed: true, watchTime: 100 }],
                    }
                  : lesson
              ),
            }
          : null
      );

      // Gamification: Award points and show achievement
      setUserStats((prev) => ({
        ...prev,
        points: prev.points + 50,
        achievements: prev.achievements + 1,
      }));

      toast({
        title: "Lesson completed! 🎉",
        description: "You earned 50 XP points!",
      });
    } catch (error) {
      console.error("Error marking lesson complete:", error);
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

  const completedLessons = course.lessons.filter(
    (lesson) => lesson.progress && lesson.progress[0]?.completed
  ).length;
  const progressPercentage =
    course.lessons.length > 0
      ? Math.round((completedLessons / course.lessons.length) * 100)
      : 0;

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
              <h1 className="text-2xl font-bold text-gray-900">
                {course.title}
              </h1>
              <p className="text-gray-600">by {course.instructor.fullName}</p>
            </div>
          </div>

          {/* Gamification Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-orange-100 px-3 py-1 rounded-full">
              <Flame className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-600">
                {userStats.streak} day streak
              </span>
            </div>
            <div className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full">
              <Star className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">
                {userStats.points} XP
              </span>
            </div>
            <div className="flex items-center gap-2 bg-purple-100 px-3 py-1 rounded-full">
              <Trophy className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">
                Level {userStats.level}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Video Player */}
          <div className="lg:col-span-2 space-y-6">
            {isEnrolled ? (
              <>
                {/* Video Player */}
                <Card>
                  <CardContent className="p-0">
                    <div className="aspect-video bg-black rounded-t-lg relative">
                      {currentLesson ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${
                            currentLesson.videoUrl.split("v=")[1]
                          }`}
                          className="w-full h-full rounded-t-lg"
                          allowFullScreen
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-white">
                          <Play className="h-16 w-16" />
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">
                          {currentLesson?.title}
                        </h2>
                        <Button
                          onClick={() =>
                            currentLesson &&
                            markLessonComplete(currentLesson.id)
                          }
                          disabled={currentLesson?.progress?.[0]?.completed}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {currentLesson?.progress?.[0]?.completed ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Completed
                            </>
                          ) : (
                            <>
                              <Target className="h-4 w-4 mr-2" />
                              Mark Complete
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-gray-600">
                        {currentLesson?.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Course Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Course Progress</span>
                      <Badge variant="secondary">
                        {progressPercentage}% Complete
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={progressPercentage} className="h-3 mb-2" />
                    <p className="text-sm text-gray-600">
                      {completedLessons} of {course.lessons.length} lessons
                      completed
                    </p>
                  </CardContent>
                </Card>
              </>
            ) : (
              /* Enrollment Card */
              <Card className="p-8 text-center">
                <div className="mb-6">
                  <img
                    src={
                      course.thumbnail ||
                      "/placeholder.svg?height=200&width=300"
                    }
                    alt={course.title}
                    className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                  />
                </div>
                <h2 className="text-2xl font-bold mb-4">{course.title}</h2>
                <p className="text-gray-600 mb-6">{course.description}</p>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="font-semibold">{course._count.lessons}</p>
                    <p className="text-sm text-gray-600">Lessons</p>
                  </div>
                  <div className="text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="font-semibold">{course._count.enrollments}</p>
                    <p className="text-sm text-gray-600">Students</p>
                  </div>
                  <div className="text-center">
                    <Award className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <p className="font-semibold">Certificate</p>
                    <p className="text-sm text-gray-600">On completion</p>
                  </div>
                </div>

                <Button
                  onClick={enrollInCourse}
                  disabled={enrolling}
                  size="lg"
                  className="w-full max-w-sm"
                >
                  {enrolling ? "Enrolling..." : "Enroll Now - Free"}
                </Button>
              </Card>
            )}
          </div>

          {/* Sidebar - Lessons List */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {course.lessons.map((lesson, index) => {
                  const isCompleted = lesson.progress?.[0]?.completed;
                  const isCurrent = currentLesson?.id === lesson.id;
                  const isLocked = !isEnrolled && index > 0;

                  return (
                    <div
                      key={lesson.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isCurrent
                          ? "bg-blue-50 border-blue-200"
                          : "hover:bg-gray-50"
                      } ${isLocked ? "opacity-50" : ""}`}
                      onClick={() => {
                        if (!isLocked) {
                          setCurrentLesson(lesson);
                        }
                      }}
                    >
                      <div className="flex-shrink-0">
                        {isLocked ? (
                          <Lock className="h-4 w-4 text-gray-400" />
                        ) : isCompleted ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Play className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {index + 1}. {lesson.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {lesson.duration}
                          </span>
                          {isCompleted && (
                            <Badge
                              variant="outline"
                              className="text-xs px-1 py-0"
                            >
                              +50 XP
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Instructor Info */}
            <Card>
              <CardHeader>
                <CardTitle>Instructor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      src={
                        course.instructor.avatar ||
                        "/placeholder.svg?height=40&width=40"
                      }
                    />
                    <AvatarFallback>
                      {course.instructor.fullName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">
                      {course.instructor.fullName}
                    </h4>
                    <p className="text-sm text-gray-600">Course Instructor</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            {isEnrolled && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-2 bg-yellow-50 rounded-lg">
                    <Trophy className="h-6 w-6 text-yellow-600" />
                    <div>
                      <p className="font-medium text-sm">First Lesson</p>
                      <p className="text-xs text-gray-600">
                        Complete your first lesson
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg opacity-60">
                    <Award className="h-6 w-6 text-gray-400" />
                    <div>
                      <p className="font-medium text-sm">Course Completer</p>
                      <p className="text-xs text-gray-600">
                        Finish all lessons
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg opacity-60">
                    <Flame className="h-6 w-6 text-gray-400" />
                    <div>
                      <p className="font-medium text-sm">Week Warrior</p>
                      <p className="text-xs text-gray-600">
                        7-day learning streak
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
