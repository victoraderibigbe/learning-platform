"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  BookOpen,
  Youtube,
  GripVertical,
  ExternalLink,
  Trash2,
  Play,
  Save,
  Eye,
  Upload,
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
  playlistUrl: string;
  lessons: any[];
}

export default function EditCoursePage() {
  const [course, setCourse] = useState<Course | null>(null);
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    category: "",
    thumbnail: "",
    isPublished: false,
  });
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [extractedVideos, setExtractedVideos] = useState<any[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
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
        setCourseData({
          title: data.course.title,
          description: data.course.description,
          category: data.course.category,
          thumbnail: data.course.thumbnail || "",
          isPublished: data.course.isPublished,
        });
        setPlaylistUrl(data.course.playlistUrl || "");
        setExtractedVideos(data.course.lessons || []);
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

  const extractPlaylist = async () => {
    if (!playlistUrl) {
      toast({
        title: "Error",
        description: "Please enter a YouTube playlist URL",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);

    try {
      const response = await fetch("/api/youtube/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistUrl }),
      });

      const data = await response.json();

      if (response.ok) {
        const newLessons = data.videos.map((video: any, index: number) => ({
          id: `new-${index}`,
          title: video.title,
          description: video.title,
          videoUrl: video.url,
          thumbnail: video.thumbnail,
          duration: video.duration,
          order: index + 1,
          isPublished: true,
        }));

        setExtractedVideos(newLessons);
        setHasChanges(true);

        toast({
          title: "Success!",
          description: `Extracted ${data.videos.length} videos from the playlist`,
        });
      } else {
        toast({
          title: "Extraction Failed",
          description:
            data.message || "Failed to extract playlist. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description:
          "Unable to connect to YouTube API. Please check your internet connection.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setCourseData({ ...courseData, [field]: value });
    setHasChanges(true);
  };

  const saveCourse = async () => {
    if (!courseData.title || !courseData.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const token = localStorage.getItem("token");

      const lessons = extractedVideos.map((video, index) => ({
        title: video.title,
        description: video.description || video.title,
        videoUrl: video.videoUrl,
        thumbnail: video.thumbnail,
        duration: video.duration,
        order: index + 1,
        isPublished: true,
      }));

      const response = await fetch(`/api/courses/${params.id}/instructor`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...courseData,
          playlistUrl,
          lessons,
        }),
      });

      if (response.ok) {
        setHasChanges(false);
        toast({
          title: "Course updated successfully!",
          description: "Your changes have been saved.",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to update course");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const removeLesson = (index: number) => {
    const newLessons = extractedVideos.filter((_, i) => i !== index);
    setExtractedVideos(newLessons);
    setHasChanges(true);
  };

  const moveLesson = (fromIndex: number, toIndex: number) => {
    const newLessons = [...extractedVideos];
    const [movedLesson] = newLessons.splice(fromIndex, 1);
    newLessons.splice(toIndex, 0, movedLesson);
    setExtractedVideos(
      newLessons.map((lesson, index) => ({ ...lesson, order: index + 1 }))
    );
    setHasChanges(true);
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 2MB",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (PNG, JPG, etc.)",
          variant: "destructive",
        });
        return;
      }

      // Create a preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        handleInputChange("thumbnail", imageUrl);
        toast({
          title: "Thumbnail uploaded",
          description: "Your course thumbnail has been updated",
        });
      };
      reader.readAsDataURL(file);
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
              href={`/instructor/course/${course.id}`}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Course
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Course</h1>
              <p className="text-gray-600">
                Make changes to your course content and settings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasChanges && (
              <Badge
                variant="outline"
                className="text-orange-600 border-orange-600"
              >
                Unsaved Changes
              </Badge>
            )}
            <Link href={`/course/${course.id}`}>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </Link>
            <Button onClick={saveCourse} disabled={isSaving || !hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Course Information */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  Course Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter your course title"
                    value={courseData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Course Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what students will learn in this course..."
                    rows={4}
                    value={courseData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={courseData.category}
                    onValueChange={(value) =>
                      handleInputChange("category", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="programming">Programming</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="data-science">Data Science</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thumbnail">Course Thumbnail</Label>
                  <div className="space-y-3">
                    {courseData.thumbnail && (
                      <div className="relative inline-block">
                        <img
                          src={courseData.thumbnail || "/placeholder.svg"}
                          alt="Course thumbnail"
                          className="w-32 h-20 object-cover rounded border"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                          onClick={() => handleInputChange("thumbnail", "")}
                        >
                          ×
                        </Button>
                      </div>
                    )}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <div className="space-y-2">
                        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Upload className="h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG up to 2MB
                          </p>
                        </div>
                        <input
                          type="file"
                          id="thumbnail-upload"
                          accept="image/*"
                          onChange={handleThumbnailUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            document.getElementById("thumbnail-upload")?.click()
                          }
                        >
                          Choose File
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="published"
                    checked={courseData.isPublished}
                    onCheckedChange={(checked) =>
                      handleInputChange("isPublished", checked)
                    }
                  />
                  <Label htmlFor="published">
                    Publish course (make visible to students)
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* YouTube Playlist */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Youtube className="h-5 w-5 text-red-600" />
                  Update YouTube Playlist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="playlist">Playlist URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="playlist"
                      placeholder="https://www.youtube.com/playlist?list=PLbpi6ZahtOH72Y0Kp"
                      value={playlistUrl}
                      onChange={(e) => setPlaylistUrl(e.target.value)}
                    />
                    <Button onClick={extractPlaylist} disabled={isExtracting}>
                      {isExtracting ? "Extracting..." : "Re-extract"}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Re-extracting will replace all current lessons with new ones
                    from the playlist
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Lessons & Preview */}
          <div className="space-y-8">
            {/* Course Lessons */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-red-600" />
                    Course Lessons
                  </div>
                  {extractedVideos.length > 0 && (
                    <Badge variant="secondary">
                      {extractedVideos.length} lessons
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {extractedVideos.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Youtube className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No lessons found</p>
                    <p className="text-sm">
                      Extract from a playlist to add lessons
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {extractedVideos.map((lesson, index) => (
                      <div
                        key={lesson.id || index}
                        className="flex gap-3 p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                          <span className="text-sm font-medium text-gray-500 ml-2 w-4">
                            {index + 1}
                          </span>
                        </div>
                        <div className="relative">
                          <img
                            src={lesson.thumbnail || "/placeholder.svg"}
                            alt={lesson.title}
                            className="w-16 h-10 object-cover rounded"
                          />
                          <Badge className="absolute bottom-0 right-0 text-xs px-1 py-0">
                            {lesson.duration}
                          </Badge>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                            {lesson.title}
                          </h4>
                          <p className="text-xs text-gray-500">
                            Lesson {index + 1}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() =>
                              window.open(lesson.videoUrl, "_blank")
                            }
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-red-600"
                            onClick={() => removeLesson(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Course Preview */}
            <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <CardHeader>
                <CardTitle>Course Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge
                    variant={courseData.isPublished ? "default" : "outline"}
                    className="text-white"
                  >
                    {courseData.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Total Lessons:</span>
                  <span className="font-bold">{extractedVideos.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Category:</span>
                  <span className="font-bold">
                    {courseData.category
                      ? courseData.category.charAt(0).toUpperCase() +
                        courseData.category.slice(1)
                      : "Not selected"}
                  </span>
                </div>
                <Link href={`/course/${course.id}`}>
                  <Button className="w-full mt-4 bg-white text-blue-600 hover:bg-gray-100">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Course
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
