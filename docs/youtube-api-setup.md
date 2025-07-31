# YouTube API Setup Guide

## Getting Your YouTube API Key

1. **Go to Google Cloud Console**

   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create or Select a Project**

   - Click on the project dropdown at the top
   - Create a new project or select an existing one

3. **Enable YouTube Data API v3**

   - Go to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click on it and press "Enable"

4. **Create API Credentials**

   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key

5. **Configure API Key (Optional but Recommended)**

   - Click on your API key to edit it
   - Under "API restrictions", select "Restrict key"
   - Choose "YouTube Data API v3"
   - Under "Application restrictions", you can restrict by HTTP referrers or IP addresses

6. **Add to Environment Variables**
   \`\`\`bash
   YOUTUBE_API_KEY="your-api-key-here"
   \`\`\`

## API Quotas and Limits

- **Daily Quota**: 10,000 units per day (default)
- **Playlist Items**: 1 unit per request (50 items max)
- **Video Details**: 1 unit per request (50 videos max)
- **Rate Limiting**: 100 requests per 100 seconds per user

## Supported Playlist URL Formats

The system supports these YouTube playlist URL formats:

\`\`\`
https://www.youtube.com/playlist?list=PLbpi6ZahtOH72Y0Kp
https://www.youtube.com/watch?v=VIDEO_ID&list=PLbpi6ZahtOH72Y0Kp
https://youtu.be/VIDEO_ID?list=PLbpi6ZahtOH72Y0Kp
\`\`\`

## Error Handling

The system handles various error scenarios:

- **Invalid URL**: Malformed or non-YouTube URLs
- **Private Playlist**: Playlists that are not public
- **Deleted Videos**: Videos that are no longer available
- **API Quota Exceeded**: When daily limits are reached
- **Network Issues**: Connection problems

## Testing

You can test with these public playlists:

- **Programming**: `https://www.youtube.com/playlist?list=PLbpi6ZahtOH72Y0Kp`
- **Design**: `https://www.youtube.com/playlist?list=PLbpi6ZahtOH72Y0Kp`

## Troubleshooting

### Common Issues:

1. **"API key not valid"**

   - Check if YouTube Data API v3 is enabled
   - Verify the API key is correct
   - Check API key restrictions

2. **"Playlist not found"**

   - Ensure the playlist is public
   - Verify the playlist ID is correct
   - Check if the playlist exists

3. **"Quota exceeded"**

   - Wait for quota reset (daily)
   - Consider requesting quota increase
   - Implement caching to reduce API calls

4. **"Access denied"**
   - Check API key permissions
   - Verify billing is enabled (if required)
   - Ensure proper authentication

### Development Mode

If no API key is provided, the system will use mock data for development purposes.
