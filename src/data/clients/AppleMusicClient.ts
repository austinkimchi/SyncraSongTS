import Platform from "../../types/platform";
import { state } from "../../types/status";
import type { Playlist } from "../../types/playlist";
import type { Track } from "../../types/track";
import { appleMusicAuthService } from "../../handler/appleAPI";
import { PlatformClient } from "./IPlatformClient";

export class AppleMusicClient extends PlatformClient {
  readonly platform = Platform.APPLE_MUSIC;
  profile?: { id: string; displayName?: string };
  playlists?: Playlist[] | [];
  lastFetched: Date | null = null;

  constructor() {
    super();
    this.profile = undefined;
    this.playlists = [];
  }

  async isLoggedIn(): Promise<boolean> {
    return appleMusicAuthService.isLoggedIn();
  }

  async login(): Promise<void> {
    await appleMusicAuthService.redirectToOAuth();
  }

  async getDisplayName() {
    return { id: "apple_user", displayName: "Apple Music User" };
  }

  getUserPlaylists(): Playlist[] {
    return this.playlists ?? [];
  }

  async fetchUserPlaylists(_opts?: { offset?: string; limit?: number }) {
    this.lastFetched = new Date();
    return { items: [], next: false };
  }

  async createPlaylist(name: string, opts?: { description?: string; isPublic?: boolean }) {
    const playlist: Playlist = {
      id: "new_apple_playlist",
      platform: Platform.APPLE_MUSIC,
      name,
      owner: "Apple Music User",
      trackCount: 0,
      isPublic: opts?.isPublic ?? false,
      href: "",
      status: state.SUCCESS,
    };
    return playlist;
  }

  async addTracksToPlaylist(_playlistId: string, _tracks: Track[]) {
    return;
  }

  async fetchPlaylistTracks(_playlistId: string, _opts?: { cursor?: string; limit?: number }) {
    return { items: [], next: false };
  }

  async searchTrackByISRC(_isrc: string, _opts: { limit?: number } = {}) {
    return [];
  }
}
