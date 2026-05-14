const BUNNY_API_BASE = "https://api.bunny.net";
const BUNNY_STREAM_BASE = "https://video.bunnycdn.com/library";
const API_KEY = process.env.BUNNY_API_KEY!;
const LIBRARY_ID = process.env.BUNNY_LIBRARY_ID!;
const CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME!; // e.g. yourzone.b-cdn.net

export type BunnyVideo = {
  guid: string;
  title: string;
  status: number; // 0=created, 1=uploading, 2=processing, 3=transcoding, 4=finished, 5=error
  length: number; // seconds
  thumbnailFileName: string;
};

export type BunnyUploadUrl = {
  videoId: string;
  uploadUrl: string;
};

export const bunny = {
  /**
   * Create a video entry and return a signed upload URL.
   * The client uploads directly to this URL — your server never handles the bytes.
   */
  async createVideoUploadUrl(title: string): Promise<BunnyUploadUrl> {
    // Step 1: Create video object in Bunny
    const createRes = await fetch(`${BUNNY_STREAM_BASE}/${LIBRARY_ID}/videos`, {
      method: "POST",
      headers: {
        AccessKey: API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    if (!createRes.ok) {
      throw new Error(`Bunny create video failed: ${createRes.statusText}`);
    }

    const video: BunnyVideo = await createRes.json();

    return {
      videoId: video.guid,
      uploadUrl: `${BUNNY_STREAM_BASE}/${LIBRARY_ID}/videos/${video.guid}`,
    };
  },

  /** Get video details (status, duration, etc.) */
  async getVideo(videoId: string): Promise<BunnyVideo> {
    const res = await fetch(
      `${BUNNY_STREAM_BASE}/${LIBRARY_ID}/videos/${videoId}`,
      {
        headers: { AccessKey: API_KEY },
      }
    );

    if (!res.ok) throw new Error(`Bunny get video failed: ${res.statusText}`);
    return res.json();
  },

  /** Delete a video from Bunny.net */
  async deleteVideo(videoId: string): Promise<void> {
    const res = await fetch(
      `${BUNNY_STREAM_BASE}/${LIBRARY_ID}/videos/${videoId}`,
      {
        method: "DELETE",
        headers: { AccessKey: API_KEY },
      }
    );
    if (!res.ok) throw new Error(`Bunny delete video failed: ${res.statusText}`);
  },

  /** Build the Bunny.net iframe embed URL for a video. */
  getEmbedUrl(videoId: string): string {
    return `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${videoId}`;
  },

  /** Build the direct HLS playback URL (for custom players). */
  getPlaybackUrl(videoId: string): string {
    return `https://${CDN_HOSTNAME}/${videoId}/playlist.m3u8`;
  },

  /** Upload a file (thumbnail, certificate PDF) to Bunny Storage. */
  async uploadToStorage(
    filePath: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<string> {
    const storageZone = process.env.BUNNY_STORAGE_ZONE!;
    const storageApiKey = process.env.BUNNY_STORAGE_API_KEY!;

    const res = await fetch(
      `https://storage.bunnycdn.com/${storageZone}/${filePath}`,
      {
        method: "PUT",
        headers: {
          AccessKey: storageApiKey,
          "Content-Type": contentType,
        },
        body: fileBuffer,
      }
    );

    if (!res.ok) {
      throw new Error(`Bunny storage upload failed: ${res.statusText}`);
    }

    return `https://${CDN_HOSTNAME}/${filePath}`;
  },
};
