import Platform from "../../types/platform";
import type { Playlist } from "../../types/playlist";
import type { Track } from "../../types/track";

export interface PlaylistQueryOptions {
  offset?: string;
  limit?: number;
}

export interface PlaylistTracksQueryOptions {
  cursor?: string;
  limit?: number;
}

export interface PlaylistCreationOptions {
  description?: string;
  isPublic?: boolean;
  image?: string;
}

export interface PlatformProfile {
  id: string;
  displayName?: string;
}

export abstract class PlatformClient {
  abstract readonly platform: Platform;
  abstract playlists?: Playlist[] | [];
  abstract lastFetched?: Date | null;
  abstract profile?: PlatformProfile;

  setToken?(token: string): void;

  getRefreshToken?(): Promise<string>;

  abstract isLoggedIn(): Promise<boolean>;
  abstract login(): Promise<void>;

  abstract getDisplayName(): Promise<PlatformProfile>;
  abstract getUserPlaylists(): Playlist[];


  abstract fetchUserPlaylists(
    opts?: PlaylistQueryOptions,
  ): Promise<{
    items: Playlist[];
    next?: boolean;
  }>;

  abstract fetchPlaylistTracks(
    playlistId: string,
    opts?: PlaylistTracksQueryOptions,
  ): Promise<{
    items: Track[];
    next?: boolean;
  }>;

  abstract createPlaylist(
    name: string,
    opts?: PlaylistCreationOptions,
  ): Promise<Playlist>;

  abstract searchTrackByISRC(
    isrc: string,
    opts?: { limit?: number },
  ): Promise<Track[]>;
}

export type IPlatformClient = PlatformClient;
