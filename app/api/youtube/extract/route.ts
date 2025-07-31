import { type NextRequest, NextResponse } from "next/server";
import { extractPlaylistVideos } from "@/lib/youtube";

export async function POST(request: NextRequest) {
  try {
    const { playlistUrl } = await request.json();

    if (!playlistUrl) {
      return NextResponse.json(
        { message: "Playlist URL is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    if (
      !playlistUrl.includes("youtube.com") &&
      !playlistUrl.includes("youtu.be")
    ) {
      return NextResponse.json(
        { message: "Please provide a valid YouTube playlist URL" },
        { status: 400 }
      );
    }

    const videos = await extractPlaylistVideos(playlistUrl);

    // Calculate total duration
    const totalMinutes = videos.reduce((total, video) => {
      const duration = video.duration;
      const parts = duration.split(":");

      if (parts.length === 2) {
        // MM:SS format
        return (
          total + Number.parseInt(parts[0]) + Number.parseInt(parts[1]) / 60
        );
      } else if (parts.length === 3) {
        // HH:MM:SS format
        return (
          total +
          Number.parseInt(parts[0]) * 60 +
          Number.parseInt(parts[1]) +
          Number.parseInt(parts[2]) / 60
        );
      }

      return total;
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    const totalDuration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    return NextResponse.json({
      videos,
      totalDuration,
      totalVideos: videos.length,
      message: `Successfully extracted ${videos.length} videos from playlist`,
    });
  } catch (error) {
    console.error("Extract playlist error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to extract playlist";

    // Return appropriate status codes based on error type
    let statusCode = 500;
    if (errorMessage.includes("Invalid") || errorMessage.includes("format")) {
      statusCode = 400;
    } else if (
      errorMessage.includes("not found") ||
      errorMessage.includes("private")
    ) {
      statusCode = 404;
    } else if (
      errorMessage.includes("quota") ||
      errorMessage.includes("API key")
    ) {
      statusCode = 429;
    }

    return NextResponse.json(
      {
        message: errorMessage,
        error: true,
      },
      { status: statusCode }
    );
  }
}
