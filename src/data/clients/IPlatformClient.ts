/**
 * @abstract Abstract interface for platform clients such as Spotify, Apple Music, etc.
 * @interface IPlatformClient
 */

import Platform from "../../types/platform";
import type { Playlist } from "../../types/playlist";
import type { Track } from "../../types/track";

export interface IPlatformClient {
    readonly platform: Platform;

    /* Sets OAuth Token */
    setToken(token: string): void;

    /* Fetch music platform username/id */
    getCurrentUser(
    ): Promise<{ id: string; name: string }>;

    /* Fetch user playlists */
    getUserPlaylists(
        opts?: { offset?: string; limit?: number }
    ): Promise<
        {
            items: Playlist[];
            next?: boolean;
        }
    >;

    /* Fetch tracks in a playlist */
    getPlaylistTracks(
        playlistId: string,
        opts?: { cursor?: string; limit?: number }
    ): Promise<
        {
            items: Track[];
            next?: boolean;
        }
    >;

    /* Create a new playlist */
    createPlaylist(
        name: string,
        opts?: { description?: string; isPublic?: boolean; image?: string }
    ): Promise<Playlist>;

    searchTrackByISRC(
        isrc: string,
        opts: { limit?: number }
    ): Promise<Track[]>;
}