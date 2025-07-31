// YouTube API integration
export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  publishedAt: string;
  url: string;
  viewCount: string;
  order: number;
}

export async function extractPlaylistVideos(
  playlistUrl: string
): Promise<YouTubeVideo[]> {
  try {
    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      throw new Error(
        "Invalid YouTube playlist URL. Please provide a valid playlist URL."
      );
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      console.warn(
        "YouTube API key not found. Using mock data for development."
      );
      return getMockPlaylistVideos();
    }

    const allPlaylistItems = await fetchAllPlaylistItems(playlistId, apiKey);
    if (allPlaylistItems.length === 0) {
      throw new Error(
        "No videos found in this playlist or playlist is private/unavailable."
      );
    }

    const videoIds = allPlaylistItems
      .map((item) => item.snippet?.resourceId?.videoId)
      .filter(Boolean)
      .join(",");
    console.log("Video IDs:", videoIds);

    if (!videoIds || !/^[A-Za-z0-9_-]+(,[A-Za-z0-9_-]+)*$/.test(videoIds)) {
      throw new Error("Invalid video IDs format: " + videoIds);
    }

    const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    videosUrl.searchParams.append("part", "contentDetails,statistics,status");
    videosUrl.searchParams.append("id", videoIds);
    videosUrl.searchParams.append("key", apiKey);
    console.log("Fetching videos URL:", videosUrl.toString());

    const videosResponse = await fetch(videosUrl);
    if (!videosResponse.ok) {
      const errorData = await videosResponse.json();
      console.error(
        "Videos API error response:",
        JSON.stringify(errorData, null, 2)
      );
      throw new Error(
        `YouTube API Error: ${
          errorData.error?.message || "Failed to fetch video details"
        }`
      );
    }

    const videosData = await videosResponse.json();
    console.log("Videos API response items:", videosData.items?.length || 0);

    const videos: YouTubeVideo[] = allPlaylistItems
      .map((item, index) => {
        const videoDetails = videosData.items?.find(
          (video: any) => video.id === item.snippet?.resourceId?.videoId
        );

        if (!videoDetails || videoDetails.status?.privacyStatus === "private") {
          console.warn(
            `Skipping video ID ${item.snippet?.resourceId?.videoId}: private or unavailable`
          );
          return null;
        }

        return {
          id: item.snippet.resourceId.videoId,
          title: item.snippet.title || "Untitled Video",
          description: item.snippet.description || "",
          thumbnail: getBestThumbnail(item.snippet.thumbnails),
          duration: formatDuration(
            videoDetails.contentDetails?.duration || "PT0S"
          ),
          publishedAt: formatPublishedDate(item.snippet.publishedAt),
          url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
          viewCount: formatViewCount(videoDetails.statistics?.viewCount || "0"),
          order: index + 1,
        };
      })
      .filter(Boolean) as YouTubeVideo[];

    if (videos.length === 0) {
      throw new Error("No accessible videos found in this playlist.");
    }

    return videos;
  } catch (error) {
    console.error("Error extracting playlist:", error);
    if (error instanceof Error) {
      if (error.message.includes("quota")) {
        throw new Error(
          "YouTube API quota exceeded. Please try again later or contact support."
        );
      }
      if (error.message.includes("API key")) {
        throw new Error(
          "Invalid YouTube API key. Please check your configuration."
        );
      }
      throw error;
    }
    throw new Error(
      "Failed to extract playlist. Please check the URL and try again."
    );
  }
}

// Helper function to extract playlist ID from various URL formats
function extractPlaylistId(url: string): string | null {
  const patterns = [
    /[?&]list=([^&]+)/, // Standard playlist URL
    /youtube\.com\/playlist\?list=([^&]+)/, // Direct playlist URL
    /youtu\.be\/.*[?&]list=([^&]+)/, // Shortened URL with playlist
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// Helper function to fetch all playlist items (handles pagination)
async function fetchAllPlaylistItems(
  playlistId: string,
  apiKey: string
): Promise<any[]> {
  let allItems: any[] = [];
  let nextPageToken = "";
  let previousPageToken = "";
  const maxResults = 50;

  do {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.append("part", "snippet");
    url.searchParams.append("maxResults", maxResults.toString());
    url.searchParams.append("playlistId", playlistId);
    url.searchParams.append("key", apiKey);
    if (nextPageToken) {
      if (!/^[A-Za-z0-9_-]+$/.test(nextPageToken)) {
        console.warn("Invalid pageToken format:", nextPageToken);
        break;
      }
      url.searchParams.append("pageToken", nextPageToken);
    }

    console.log("Next page token:", nextPageToken);
    console.log("Fetching URL:", url.toString());

    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        "Full API error response:",
        JSON.stringify(errorData, null, 2)
      );
      if (response.status === 404) {
        throw new Error(
          "Playlist not found. Please check if the playlist exists and is public."
        );
      }
      if (response.status === 403) {
        throw new Error(
          "Access denied. The playlist might be private or your API key is invalid."
        );
      }
      if (response.status === 400) {
        throw new Error(
          `Invalid request: ${
            errorData.error?.message || "Invalid filter parameter"
          }`
        );
      }
      throw new Error(
        `YouTube API Error: ${errorData.error?.message || "Unknown error"}`
      );
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      console.warn("No items returned, stopping pagination.");
      break;
    }
    allItems = allItems.concat(data.items);

    nextPageToken = data.nextPageToken || "";
    if (nextPageToken === previousPageToken) {
      console.warn(
        "Same pageToken detected, stopping pagination to prevent loop."
      );
      break;
    }
    previousPageToken = nextPageToken;

    if (allItems.length > 500) {
      console.warn("Playlist has more than 500 videos. Limiting to first 500.");
      break;
    }
  } while (nextPageToken);

  return allItems;
}

// Helper function to get the best available thumbnail
function getBestThumbnail(thumbnails: any): string {
  if (!thumbnails) return "/placeholder.svg?height=90&width=160";

  // Prefer higher quality thumbnails
  return (
    thumbnails.maxres?.url ||
    thumbnails.high?.url ||
    thumbnails.medium?.url ||
    thumbnails.default?.url ||
    "/placeholder.svg?height=90&width=160"
  );
}

// Helper function to format view count
function formatViewCount(viewCount: string): string {
  const count = Number.parseInt(viewCount);
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M views`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K views`;
  }
  return `${count} views`;
}

// Helper function to format published date
function formatPublishedDate(publishedAt: string): string {
  const date = new Date(publishedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
  return `${Math.ceil(diffDays / 365)} years ago`;
}

function formatDuration(duration: string): string {
  // Convert ISO 8601 duration to readable format
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return "0:00";

  const hours = Number.parseInt(match[1]?.replace("H", "") || "0");
  const minutes = Number.parseInt(match[2]?.replace("M", "") || "0");
  const seconds = Number.parseInt(match[3]?.replace("S", "") || "0");

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getMockPlaylistVideos(): YouTubeVideo[] {
  return [
    {
      id: "1",
      title: "Introduction to React - Getting Started with Components",
      description: "Learn the basics of React components and JSX syntax",
      thumbnail: "/placeholder.svg?height=90&width=160",
      duration: "12:45",
      publishedAt: "2 weeks ago",
      url: "https://youtube.com/watch?v=1",
      viewCount: "1000",
      order: 1,
    },
    {
      id: "2",
      title: "State Management with useState Hook",
      description: "Master React state management with the useState hook",
      thumbnail: "/placeholder.svg?height=90&width=160",
      duration: "18:30",
      publishedAt: "1 week ago",
      url: "https://youtube.com/watch?v=2",
      viewCount: "1000",
      order: 2,
    },
    {
      id: "3",
      title: "Props and Component Communication",
      description: "Learn how to pass data between React components",
      thumbnail: "/placeholder.svg?height=90&width=160",
      duration: "15:20",
      publishedAt: "5 days ago",
      url: "https://youtube.com/watch?v=3",
      viewCount: "1000",
      order: 3,
    },
    {
      id: "4",
      title: "useEffect Hook and Side Effects",
      description: "Handle side effects in React with the useEffect hook",
      thumbnail: "/placeholder.svg?height=90&width=160",
      duration: "22:15",
      publishedAt: "3 days ago",
      url: "https://youtube.com/watch?v=4",
      viewCount: "1000",
      order: 4,
    },
  ];
}
