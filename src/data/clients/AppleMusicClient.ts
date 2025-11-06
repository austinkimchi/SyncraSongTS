import Platform from "../../types/platform";
import type { Playlist } from "../../types/playlist";
import { appleMusicAuthService } from "../../handler/appleAPI";
import { PlatformClient } from "./IPlatformClient";
import { API_FULL_URL } from "../../config";

export class AppleMusicClient extends PlatformClient {
  readonly platform = Platform.APPLE_MUSIC;

  constructor() {
    super();
    this.profile = undefined;
  }

  private get headers(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    headers.Authorization = `Bearer ${localStorage.getItem("token")}`;
    return headers;
  }

  async isLoggedIn(): Promise<boolean> {
    return appleMusicAuthService.isLoggedIn();
  }

  async getDisplayName() {
    return { id: "apple_user", displayName: "Apple Music User" };
  }

  async getUserPlaylists(_opts?: { fetch?: boolean }) {
    const res = await fetch(`${API_FULL_URL}/api/apple_music/fetchPlaylist?fetch=${_opts?.fetch ? 'true' : 'false'}`, {
      headers: this.headers,
    });
    
    if (!res.ok) return { items: [] };

    const data = await res.json() as { playlists: Playlist[] };
    return { items: data.playlists }; 
  }

  // TODO
  async requestWithAuth<T>(platform: Platform, input: RequestInfo, init?: RequestInit): Promise<T> {
    return null as unknown as T;
  }
}
