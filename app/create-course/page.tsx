"use client";

import type React from "react";

import { useState, useEffect } from "react";
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
import {
  ArrowLeft,
  BookOpen,
  Youtube,
  Upload,
  GripVertical,
  ExternalLink,
  Edit,
  Trash2,
  Play,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
  publishedAt: string;
  url: string;
}

export default function CreateCoursePage() {
  const [user, setUser] = useState<any>(null);
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    category: "",
    thumbnail: null as File | null,
  });
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [extractedVideos, setExtractedVideos] = useState<Video[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [totalDuration, setTotalDuration] = useState("0h 0m");
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      if (parsedUser.role !== "INSTRUCTOR") {
        router.push("/dashboard");
        return;
      }
    } else {
      router.push("/auth/signin");
      return;
    }
  }, [router]);

  const extractPlaylist = async () => {
    if (!playlistUrl) {
      toast({
        title: "Error",
        description: "Please enter a YouTube playlist URL",
        variant: "destructive",
      });
      return;
    }

    // Basic URL validation
    if (
      !playlistUrl.includes("youtube.com") &&
      !playlistUrl.includes("youtu.be")
    ) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube playlist URL",
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
        setExtractedVideos(data.videos);
        setTotalDuration(data.totalDuration);

        toast({
          title: "Success!",
          description:
            data.message ||
            `Extracted ${data.videos.length} videos from the playlist`,
        });
      } else {
        // Handle different error types with specific messages
        let errorTitle = "Extraction Failed";

        if (response.status === 404) {
          errorTitle = "Playlist Not Found";
        } else if (response.status === 429) {
          errorTitle = "API Limit Reached";
        } else if (response.status === 400) {
          errorTitle = "Invalid URL";
        }

        toast({
          title: errorTitle,
          description:
            data.message || "Failed to extract playlist. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Extract playlist error:", error);
      toast({
        title: "Network Error",
        description:
          "Unable to connect to YouTube API. Please check your internet connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCourseData({ ...courseData, thumbnail: file });
    }
  };

  const createCourse = async () => {
    if (
      !courseData.title ||
      !courseData.description ||
      extractedVideos.length === 0
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and extract videos",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // Prepare lessons data from extracted videos
      const lessons = extractedVideos.map((video, index) => ({
        title: video.title,
        description: video.title,
        videoUrl: video.url,
        thumbnail: video.thumbnail,
        duration: video.duration,
        order: index + 1,
      }));

      const response = await fetch("/api/courses", {
        method: "POST",
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
        toast({
          title: "Course created successfully!",
          description:
            "Your course has been published and is now available to students.",
        });
        router.push("/dashboard");
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to create course");
      }
    } catch (error) {
      console.error("Create course error:", error);
      toast({
        title: "Error",
        description: "Failed to create course. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4 max-w-7xl mx-auto">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create New Course
            </h1>
            <p className="text-gray-600">
              Build a course from your YouTube playlist
            </p>
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
                    onChange={(e) =>
                      setCourseData({ ...courseData, title: e.target.value })
                    }
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
                      setCourseData({
                        ...courseData,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={courseData.category}
                    onValueChange={(value) =>
                      setCourseData({ ...courseData, category: value })
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
              </CardContent>
            </Card>

            {/* YouTube Playlist */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Youtube className="h-5 w-5 text-red-600" />
                  YouTube Playlist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="playlist">Playlist URL *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="playlist"
                      placeholder="https://www.youtube.com/playlist?list=PLbpi6ZahtOH72Y0Kp"
                      value={playlistUrl}
                      onChange={(e) => setPlaylistUrl(e.target.value)}
                    />
                    <Button onClick={extractPlaylist} disabled={isExtracting}>
                      {isExtracting ? "Extracting..." : "Extract"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Thumbnail */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-purple-600" />
                  Course Thumbnail
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="thumbnail">Upload Thumbnail (Optional)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">PNG, JPG up to 2MB</p>
                    <input
                      type="file"
                      id="thumbnail"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      className="mt-4 bg-transparent"
                      onClick={() =>
                        document.getElementById("thumbnail")?.click()
                      }
                    >
                      Choose File
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Extracted Videos & Preview */}
          <div className="space-y-8">
            {/* Extracted Videos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-red-600" />
                    Extracted Videos
                  </div>
                  {extractedVideos.length > 0 && (
                    <Badge variant="secondary">
                      {extractedVideos.length} videos
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {extractedVideos.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Youtube className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No videos extracted yet</p>
                    <p className="text-sm">
                      Enter a playlist URL and click Extract
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {extractedVideos.map((video, index) => (
                      <div
                        key={video.id}
                        className="flex gap-3 p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          <GripVertical className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-500 ml-2 w-4">
                            {index + 1}
                          </span>
                        </div>
                        <div className="relative">
                          <img
                            src={video.thumbnail || "/placeholder.svg"}
                            alt={video.title}
                            className="w-20 h-12 object-cover rounded"
                          />
                          <Badge className="absolute bottom-1 right-1 text-xs px-1 py-0">
                            {video.duration}
                          </Badge>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                            {video.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{video.views}</span>
                            <span>•</span>
                            <span>{video.publishedAt}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-red-600"
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
                <div className="flex justify-between">
                  <span>Total Duration:</span>
                  <span className="font-bold">{totalDuration}</span>
                </div>
                <Button
                  className="w-full mt-4 bg-white text-blue-600 hover:bg-gray-100"
                  onClick={createCourse}
                  disabled={
                    !courseData.title ||
                    !courseData.description ||
                    extractedVideos.length === 0
                  }
                >
                  Create Course
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
