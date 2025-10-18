import Platform from "../../types/platform";
import { state } from "../../types/status";
import type { IPlatformClient } from "./IPlatformClient";
import type { Playlist } from "../../types/playlist";
import type { Track } from "../../types/track";

export class AppleMusicClient implements IPlatformClient {
    readonly platform = Platform.APPLE_MUSIC;
    private token: string = "";

    setToken(token: string) { this.token = token; };
    private get headers() {
        return {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json"
        };
    };

    async getCurrentUser() {
        // TODO: Implement Apple Music user retrieval
        return { id: "apple_user", name: "Apple Music User" };
    }

    async getUserPlaylists(opts?: { offset?: string; limit?: number }) {
        // TODO: Implement Apple Music playlist retrieval
        return { items: [], next: false };
    }

    async createPlaylist(name: string, opts?: { description?: string; public?: boolean }) {
        //TODO: Implement Apple Music playlist creation
        const playlist: Playlist = {
            id: "new_apple_playlist",
            platform: Platform.APPLE_MUSIC,
            name: name,
            owner: "Apple Music User",
            trackCount: 0,
            isPublic: opts?.public ?? false,
            href: "",
            status: state.SUCCESS
        };
        return playlist;
    }

    async addTracksToPlaylist(playlistId: string, tracks: Track[]) {
        // TODO: Implement Apple Music add tracks to playlist
        return;
    }

    async getPlaylistTracks(playlistId: string, opts?: { cursor?: string; limit?: number }) {
        // TODO: Implement Apple Music playlist tracks retrieval
        return { items: [], next: false };
    }

    async searchTrackByISRC(isrc: string, opts: { limit?: number; }) {
        return [];
    }





};