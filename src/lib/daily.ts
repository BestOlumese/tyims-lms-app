const DAILY_BASE = "https://api.daily.co/v1";
const DAILY_API_KEY = process.env.DAILY_API_KEY!;

async function dailyFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${DAILY_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(
      `Daily.co API error [${res.status}]: ${error.error ?? "Unknown error"}`
    );
  }

  return res.json() as Promise<T>;
}

export type DailyRoom = {
  id: string;
  name: string;
  url: string;
  created_at: string;
};

export type DailyMeetingToken = {
  token: string;
};

export const daily = {
  /** Create a Daily.co room for a live class session. */
  async createRoom(params: {
    name: string;
    scheduledAt: Date;
    maxParticipants?: number;
  }): Promise<DailyRoom> {
    const expiryBuffer = 2 * 60 * 60; // room auto-closes 2h after start
    const notBefore = Math.floor(params.scheduledAt.getTime() / 1000) - 900; // opens 15min before
    const exp = Math.floor(params.scheduledAt.getTime() / 1000) + expiryBuffer;

    return dailyFetch<DailyRoom>("/rooms", {
      method: "POST",
      body: JSON.stringify({
        name: params.name,
        properties: {
          nbf: notBefore,
          exp,
          max_participants: params.maxParticipants ?? 100,
          enable_recording: "cloud",
          enable_chat: true,
          enable_knocking: false,
        },
      }),
    });
  },

  /**
   * Generate a meeting token for a participant.
   * Instructors get is_owner: true so they can manage the room.
   */
  async createMeetingToken(params: {
    roomName: string;
    userId: string;
    userName: string;
    isOwner?: boolean;
    expiresAt?: Date;
  }): Promise<string> {
    const exp = params.expiresAt
      ? Math.floor(params.expiresAt.getTime() / 1000)
      : Math.floor(Date.now() / 1000) + 4 * 60 * 60; // 4h default

    const data = await dailyFetch<DailyMeetingToken>("/meeting-tokens", {
      method: "POST",
      body: JSON.stringify({
        properties: {
          room_name: params.roomName,
          user_id: params.userId,
          user_name: params.userName,
          is_owner: params.isOwner ?? false,
          exp,
          start_cloud_recording: params.isOwner ?? false,
        },
      }),
    });

    return data.token;
  },

  /** Delete a Daily.co room when a class is cancelled or ends. */
  async deleteRoom(roomName: string): Promise<void> {
    await dailyFetch(`/rooms/${roomName}`, { method: "DELETE" });
  },
};
