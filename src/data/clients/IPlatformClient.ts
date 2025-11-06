import Platform from "../../types/platform";
import type { Playlist } from "../../types/playlist";

export interface PlaylistQueryOptions {
  fetch?: boolean;
}

export interface PlatformProfile {
  id: string;
  displayName?: string;
}

export abstract class PlatformClient {
  abstract readonly platform: Platform;
  profile?: PlatformProfile;

  setToken?(token: string): void;

  getRefreshToken?(): Promise<string>;

  abstract isLoggedIn(): Promise<boolean>;

  abstract getDisplayName(): Promise<PlatformProfile>;

  abstract getUserPlaylists(
    opts?: PlaylistQueryOptions,
  ): Promise<{
    playlists: Playlist[];
    updatedAt: Date;
  }>;

  abstract requestWithAuth<T>(platform: Platform, input: RequestInfo, init?: RequestInit): Promise<T>;
}

export type IPlatformClient = PlatformClient;
