import Platform from "../../types/platform";
import { state } from "../../types/status";
import type { IPlatformClient } from "./IPlatformClient";
import type { Playlist } from "../../types/playlist";
import type { Track } from "../../types/track";

export class AppleMusicClient implements IPlatformClient {
    readonly platform = Platform.APPLE_MUSIC;

    setToken(_token: string) { /* Apple Music client token handling pending implementation */ };

    async getCurrentUser() {
        // TODO: Implement Apple Music user retrieval
        return { id: "apple_user", name: "Apple Music User" };
    }

    async getUserPlaylists(_opts?: { offset?: string; limit?: number }) {
        // TODO: Implement Apple Music playlist retrieval
        return { items: [], next: false };
    }

    async createPlaylist(name: string, opts?: { description?: string; isPublic?: boolean; image?: string }) {
        //TODO: Implement Apple Music playlist creation
        const playlist: Playlist = {
            id: "new_apple_playlist",
            platform: Platform.APPLE_MUSIC,
            name: name,
            owner: "Apple Music User",
            trackCount: 0,
            isPublic: opts?.isPublic ?? false,
            href: "",
            status: state.SUCCESS
        };
        return playlist;
    }

    async addTracksToPlaylist(_playlistId: string, _tracks: Track[]) {
        // TODO: Implement Apple Music add tracks to playlist
        return;
    }

    async getPlaylistTracks(_playlistId: string, _opts?: { cursor?: string; limit?: number }) {
        // TODO: Implement Apple Music playlist tracks retrieval
        return { items: [], next: false };
    }

    async searchTrackByISRC(_isrc: string, _opts: { limit?: number; } = {}) {
        return [];
    }





};