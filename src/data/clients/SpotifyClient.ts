import Platform from "../../types/platform";
import { state } from "../../types/status";
import type { Playlist } from "../../types/playlist";
import type { Track } from "../../types/track";
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

interface SpotifyPlaylistTracksResponse {
  items: Array<{
    track: {
      id: string;
      name: string;
      artists: Array<{ name: string }>;
      duration_ms: number;
      external_urls: { spotify: string };
      album?: { name?: string };
      external_ids?: { isrc?: string };
    };
  }>;
  next?: string | null;
}

interface SpotifyTrackSearchResponse {
  tracks?: {
    items?: Array<{
      id: string;
      name: string;
      artists: Array<{ name: string }>;
      duration_ms: number;
      external_urls: { spotify: string };
      external_ids?: { isrc?: string };
    }>;
  };
}

export class SpotifyClient extends PlatformClient {
  readonly platform = Platform.SPOTIFY;

  private get headers(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    headers.Authorization = `Bearer ${localStorage.getItem("token")}`;
    return headers;
  }

  async isLoggedIn(): Promise<boolean> {
    const profile = spotifyAuthService.getStoredProfile();
    if (profile) {
      this.profile = {
        id: profile.id,
        displayName: profile.display_name ?? undefined,
      };
      return true;
    }

    return false;
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

  async createPlaylist(name: string, opts?: { description?: string; isPublic?: boolean; image?: string }) {
    const me = await this.getDisplayName();
    const response = await fetch(`https://api.spotify.com/v1/users/${me.id}/playlists`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: opts?.description ?? "", public: !!opts?.isPublic }),
    });
    const playlistData = await response.json();
    const playlist: Playlist = {
      id: playlistData.id,
      platform: Platform.SPOTIFY,
      name: playlistData.name,
      owner: me.displayName,
      trackCount: 0,
      isPublic: playlistData.public,
      href: playlistData.external_urls.spotify,
      status: state.SUCCESS
    };
    return playlist;
  }

  async getPlaylistTracks(playlistId: string, opts?: { cursor?: string; limit?: number }) {
    const params = new URLSearchParams();
    if (opts?.limit) params.set("limit", String(opts.limit));
    if (opts?.cursor) params.set("offset", String(opts.cursor));

    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?${params.toString()}`, {
      headers: this.headers,
    });
    const data: SpotifyPlaylistTracksResponse = await response.json();

    const items: Track[] = (data.items ?? []).map(({ track }) => ({
      id: track.id,
      title: track.name,
      artist: track.artists.map((artist) => artist.name).join(", "),
      durationMs: track.duration_ms,
      href: track.external_urls.spotify,
      isrc: track.external_ids?.isrc,
    }));
    return { items, next: data.next ? true : false };
  }

  async addTracks(playlistId: string, trackIds: string[]) {
    const uris = trackIds.map((id) => `spotify:track:${id}`);
    for (let i = 0; i < uris.length; i += 100) {
      const chunk = uris.slice(i, i + 100);
      await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ uris: chunk }),
      });
    }
  }

  async searchTrackByISRC(isrc: string, opts: { limit?: number } = {}) {
    const limit = opts.limit ?? 5;
    const url = `https://api.spotify.com/v1/search?q=isrc:${encodeURIComponent(isrc)}&type=track&limit=${limit}`;
    const response = await fetch(url, { headers: this.headers });
    const data: SpotifyTrackSearchResponse = await response.json();
    const tracks: Track[] = (data.tracks?.items ?? []).map((track) => ({
      id: track.id,
      title: track.name,
      artist: track.artists.map((artist) => artist.name).join(", "),
      durationMs: track.duration_ms,
      href: track.external_urls.spotify,
      isrc: track.external_ids?.isrc,
    }));
    return tracks;
  }

  async requestWithAuth<T>(platform: Platform, input: RequestInfo, init?: RequestInit): Promise<T> {
    const res = await fetch(input, init);
    if (res.status === 401 || res.status === 403) {
      // Token might be expired or invalid, emit auth-changed event
      emitAuthChanged(platform);
    }
    
    if (!res.ok) {console.error(`Request failed with status ${res.status}`);}
    return res.json() as Promise<T>;
  }
}
