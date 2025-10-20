import Platform from "../../types/platform";
import { state as playlistState } from "../../types/status";
import type { IPlatformClient } from "./IPlatformClient";
import type { Playlist } from "../../types/playlist";
import type { Track } from "../../types/track";

interface SpotifyPagingResponse<T> {
  items: T[];
  next?: string | null;
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  images?: { url: string }[];
  tracks: { total: number };
  description?: string;
  public: boolean;
  owner?: { display_name?: string };
  external_urls: { spotify: string };
}

interface SpotifyTrackItem {
  track: {
    id: string;
    name: string;
    duration_ms: number;
    external_urls?: { spotify?: string };
    artists?: { name?: string }[];
    external_ids?: { isrc?: string };
  } | null;
}

export class SpotifyClient implements IPlatformClient {
  readonly platform = Platform.SPOTIFY;
  private token = "";

  setToken(token: string) {
    this.token = token;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.token}`,
    };
  }

  private async fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
    const response = await fetch(input, {
      ...init,
      headers: { ...this.headers, ...(init?.headers ?? {}) },
    });
    if (!response.ok) {
      const error = new Error(`Spotify API error ${response.status}`);
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }
    return response.json();
  }

  async getCurrentUser() {
    const data = await this.fetchJson<{ id: string; display_name: string }>(
      "https://api.spotify.com/v1/me"
    );
    return { id: data.id, name: data.display_name };
  }

  async getUserPlaylists(opts?: { offset?: string; limit?: number }) {
    const params = new URLSearchParams();
    if (opts?.limit) params.set("limit", String(opts.limit));
    if (opts?.offset) params.set("offset", String(opts.offset));

    const data = await this.fetchJson<SpotifyPagingResponse<SpotifyPlaylist>>(
      `https://api.spotify.com/v1/me/playlists?${params.toString()}`
    );

    const playlists: Playlist[] = data.items.map((item) => ({
      id: item.id,
      name: item.name,
      image: item.images?.[0]?.url,
      trackCount: item.tracks.total,
      description: item.description ?? undefined,
      isPublic: item.public,
      href: item.external_urls.spotify,
      platform: Platform.SPOTIFY,
      owner: item.owner?.display_name,
      status: playlistState.SUCCESS,
    }));

    return { items: playlists, next: !!data.next };
  }

  async createPlaylist(name: string, opts?: { description?: string; isPublic?: boolean; image?: string }) {
    const me = await this.getCurrentUser();
    const body = {
      name,
      description: opts?.description ?? "",
      public: opts?.isPublic ?? false,
    };

    const data = await this.fetchJson<SpotifyPlaylist>(
      `https://api.spotify.com/v1/users/${me.id}/playlists`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const playlist: Playlist = {
      id: data.id,
      platform: Platform.SPOTIFY,
      name: data.name,
      owner: me.name,
      trackCount: 0,
      isPublic: data.public,
      href: data.external_urls.spotify,
      status: playlistState.SUCCESS,
    };

    return playlist;
  }

  async getPlaylistTracks(playlistId: string, opts?: { cursor?: string; limit?: number }) {
    const params = new URLSearchParams();
    if (opts?.limit) params.set("limit", String(opts.limit));
    if (opts?.cursor) params.set("offset", String(opts.cursor));

    const data = await this.fetchJson<SpotifyPagingResponse<SpotifyTrackItem>>(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?${params.toString()}`
    );

    const items: Track[] = (data.items ?? [])
      .map((item) => item.track)
      .filter((track): track is NonNullable<SpotifyTrackItem["track"]> => !!track)
      .map((track) => ({
        id: track.id,
        title: track.name,
        artist: track.artists?.[0]?.name ?? "",
        durationMs: track.duration_ms,
        href: track.external_urls?.spotify ?? "",
        isrc: track.external_ids?.isrc,
      }));

    return { items, next: !!data.next };
  }

  async searchTrackByISRC(isrc: string, opts: { limit?: number } = {}) {
    const params = new URLSearchParams();
    params.set("q", `isrc:${encodeURIComponent(isrc)}`);
    params.set("type", "track");
    params.set("limit", String(opts.limit ?? 5));

    const data = await this.fetchJson<{ tracks?: SpotifyPagingResponse<{ id: string; name: string; duration_ms: number; artists?: { name?: string }[]; external_urls?: { spotify?: string }; external_ids?: { isrc?: string } }> }>(
      `https://api.spotify.com/v1/search?${params.toString()}`
    );

    const tracks = data.tracks?.items ?? [];
    return tracks.map((track) => ({
      id: track.id,
      title: track.name,
      artist: track.artists?.[0]?.name ?? "",
      durationMs: track.duration_ms,
      href: track.external_urls?.spotify ?? "",
      isrc: track.external_ids?.isrc,
    }));
  }
}

