"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, Users, Search, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  instructor: {
    fullName: string;
    avatar: string;
  };
  lessons: any[];
  _count: {
    enrollments: number;
  };
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, selectedCategory]);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/courses", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (course) => course.category === selectedCategory
      );
    }

    setFilteredCourses(filtered);
  };

  const categories = [
    "all",
    "programming",
    "design",
    "business",
    "marketing",
    "data-science",
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading courses...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Explore Courses
              </h1>
              <p className="text-gray-600">
                Discover your next learning adventure
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.slice(1).map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() +
                      category.slice(1).replace("-", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Courses Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card
              key={course.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div onClick={() => router.push(`/course/${course.id}`)}>
                <div className="aspect-video relative overflow-hidden rounded-t-lg">
                  <img
                    src={
                      course.thumbnail ||
                      "/placeholder.svg?height=200&width=300"
                    }
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-2 right-2">
                    {course.category.charAt(0).toUpperCase() +
                      course.category.slice(1)}
                  </Badge>
                </div>

                <CardHeader className="pb-2">
                  <CardTitle className="text-lg line-clamp-1">
                    {course.title}
                  </CardTitle>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {course.description}
                  </p>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{course.lessons.length} lessons</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{course._count.enrollments} students</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                        {course.instructor.fullName.charAt(0)}
                      </div>
                      <span className="text-sm text-gray-600">
                        {course.instructor.fullName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-gray-600">4.8</span>
                    </div>
                  </div>

                  <Button className="w-full mt-4">View Course</Button>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No courses found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
