import Platform from "../../types/platform";
import { PlatformClient, PlaylistCreationOptions } from "./IPlatformClient";
import { soundCloudAuthService } from "../../handler/soundAPI";
import { Playlist } from "../../types/playlist";
import { state } from "../../types/status";


export class SoundCloudClient extends PlatformClient {
    readonly platform = Platform.SOUNDCLOUD;
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
        return soundCloudAuthService.isLoggedIn();
    }

    async getDisplayName() {
        const profile = soundCloudAuthService.getStoredProfile();
        if (profile) {
            this.profile = {
                id: profile.id,
                displayName: profile.username ?? undefined,
            };
            return this.profile;
        }
        throw new Error("SoundCloud profile not found");
    }

    async getUserPlaylists(opts?: { fetch?: boolean }) {
        // Implementation for fetching user playlists from SoundCloud
        return { items: [] };
    }

    async createPlaylist(name: string, opts?: PlaylistCreationOptions): Promise<Playlist> {
        // Implementation for creating a playlist on SoundCloud
        const playlist: Playlist = {
            id: "new_soundcloud_playlist",
            platform: Platform.SOUNDCLOUD,
            name,
            owner: this.profile?.displayName || "SoundCloud User",
            trackCount: 0,
            isPublic: opts?.isPublic ?? false,
            href: "",
            status: state.SUCCESS,
        };
        return playlist;
    }

    async addTracksToPlaylist(playlistId: string, tracks: any[]) {
        // Implementation for adding tracks to a SoundCloud playlist
        return;
    }

    async getPlaylistTracks(playlistId: string, opts?: { cursor?: string; limit?: number }) {
        // Implementation for fetching tracks from a SoundCloud playlist
        return { items: [], next: false };
    }

    async searchTrackByISRC(isrc: string, opts: { limit?: number } = {}) {
        // Implementation for searching tracks by ISRC on SoundCloud
        return [];
    }

    async requestWithAuth<T>(platform: Platform, input: RequestInfo, init?: RequestInit): Promise<T> {
        const headers = {
            ...(init?.headers || {}),
            ...this.headers,
        };

        const response = await fetch(input, {
            ...init,
            headers,
        });

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        return response.json() as Promise<T>;
    }

}