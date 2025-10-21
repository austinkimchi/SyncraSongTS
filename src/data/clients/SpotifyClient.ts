import Platform from "../../types/platform";
import { state } from "../../types/status";
import type { Playlist } from "../../types/playlist";
import type { Track } from "../../types/track";
import { spotifyAuthService } from "../../handler/spotifyAPI";
import { PlatformClient, PlatformProfile } from "./IPlatformClient";

interface SpotifyPlaylistResponse {
  items: Array<{
    id: string;
    name: string;
    images: Array<{ url: string }>;
    tracks: { total: number };
    description?: string;
    public: boolean;
    external_urls: { spotify: string };
    owner: { display_name?: string };
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
  private token?: string;
  profile?: PlatformProfile | undefined;
  lastFetched: Date | null = null;
  playlists?: Playlist[] | [];

  setToken(token: string): void {
    this.token = token;
  }

  private get headers(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  async getRefreshToken(): Promise<string> {
    if (!this.profile?.id || !this.token) {
      return Promise.reject("No refresh token available");
    }
    const token = await spotifyAuthService.getRefreshToken(this.profile.id, this.token);
    if (!token) {
      return Promise.reject("No refresh token available");
    }
    return token;
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

  async login(): Promise<void> {
    await spotifyAuthService.redirectToOAuth();
  }

  async getDisplayName() {
    return this.profile ?? { id: "spotify_user", displayName: "Spotify User" };
  }

  getUserPlaylists(): Playlist[] {
    return this.playlists ?? [];
  }

  async fetchUserPlaylists(opts?: { offset?: string; limit?: number }) {
    const params = new URLSearchParams();
    if (opts?.limit) params.set("limit", String(opts.limit));
    if (opts?.offset) params.set("offset", String(opts.offset));

    const response = await fetch(`https://api.spotify.com/v1/me/playlists?${params.toString()}`, {
      headers: this.headers,
    });
    const data: SpotifyPlaylistResponse = await response.json();
    const playlists: Playlist[] = data.items.map((item) => ({
      id: item.id,
      name: item.name,
      image: item.images[0]?.url,
      trackCount: item.tracks.total,
      description: item.description,
      isPublic: item.public,
      href: item.external_urls.spotify,
      platform: Platform.SPOTIFY,
      owner: item.owner.display_name ?? undefined,
      status: state.SUCCESS,
    }));

    this.lastFetched = new Date();

    return { items: playlists, next: data.next ? true : false };
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
      status: state.SUCCESS,
    };
    return playlist;
  }

  async fetchPlaylistTracks(playlistId: string, opts?: { cursor?: string; limit?: number }) {
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
}
