import Platform from "../../types/platform";
import { state } from "../../types/status";
import type { Playlist } from "../../types/playlist";
import type { Track } from "../../types/track";
import { appleMusicAuthService } from "../../handler/appleAPI";
import { PlatformClient } from "./IPlatformClient";

export class AppleMusicClient extends PlatformClient {
  readonly platform = Platform.APPLE_MUSIC;

  constructor() {
    super();
    this.profile = undefined;
  }

  async isLoggedIn(): Promise<boolean> {
    return appleMusicAuthService.isLoggedIn();
  }

  async getDisplayName() {
    return { id: "apple_user", displayName: "Apple Music User" };
  }

  async getUserPlaylists(_opts?: { fetch?: boolean }) {
    return { items: []};
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

  async getPlaylistTracks(_playlistId: string, _opts?: { cursor?: string; limit?: number }) {
    return { items: [], next: false };
  }

  async searchTrackByISRC(_isrc: string, _opts: { limit?: number } = {}) {
    return [];
  }
}
