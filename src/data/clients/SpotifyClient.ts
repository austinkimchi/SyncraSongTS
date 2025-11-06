import Platform from "../../types/platform";
import type { Playlist } from "../../types/playlist";
import { spotifyAuthService } from "../../handler/spotifyAPI";
import { PlatformClient } from "./IPlatformClient";
import { API_FULL_URL } from "../../config";
import { emitAuthChanged } from "../../auth/emitAuthChanged";

interface SpotifyPlaylistResponse {
  items: Array<{
    id: string;
    name: string;
    description?: string;
    tracksCount: number;
    href: string;
    images: string;
    public: boolean;
    ownerName?: string;
  }>;
  next?: string | null;
}

export class SpotifyClient extends PlatformClient {
  readonly platform = Platform.SPOTIFY;

  private get headers(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    headers.Authorization = `Bearer ${localStorage.getItem("token")}`;

    return headers;
  }

  async isLoggedIn(): Promise<boolean> {
    const response = await fetch(`${API_FULL_URL}/auth/info`, { headers: this.headers });
    if (!response.ok) return false;
    const data = await response.json();
    const spotifyOauth = data.oauth.find((o: any) => o.provider === "spotify");

    return !!spotifyOauth === true;
  }

  async getDisplayName() {
    const response = await fetch("https://api.spotify.com/v1/me", { headers: this.headers });
    const data = await response.json();
    return { id: data.id as string, displayName: data.display_name as string };
  }

  async getUserPlaylists(opts?: { fetch?: boolean }) {
    const res = await fetch(`${API_FULL_URL}/api/spotify/fetchPlaylist?fetch=${opts?.fetch ? 'true' : 'false'}`, {
      headers: this.headers,
    });
    if (!res.ok) return { items: [] };
    const data = await res.json() as { playlists: Playlist[] };

    return { items: data.playlists };
  }

  async requestWithAuth<T>(platform: Platform, input: RequestInfo, init?: RequestInit): Promise<T> {
    const res = await fetch(input, init);
    if (res.status === 401 || res.status === 403) {
      // Token might be expired or invalid, emit auth-changed event
      emitAuthChanged(platform);
    }

    if (!res.ok) { console.error(`Request failed with status ${res.status}`); }
    return res.json() as Promise<T>;
  }
}
