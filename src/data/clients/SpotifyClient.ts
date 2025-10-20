import Platform from "../../types/platform";
import { state } from "../../types/status";
import type { IPlatformClient } from "./IPlatformClient";
import type { Playlist } from "../../types/playlist";
import type { Track } from "../../types/track";
import { isSpotifyLoggedIn, getSpotifyRefreshToken } from '../../handler/spotifyAPI';

export class SpotifyClient implements IPlatformClient {
    readonly platform = Platform.SPOTIFY;
    private token?: string;
    profile?: { id: string; displayName?: string } | undefined;

    constructor() {
        this.token = undefined;
        this.profile = undefined;
    }

    setToken(token: string): void {
        this.token = token;
    }


    async getRefreshToken(): Promise<string> {
        const token = await getSpotifyRefreshToken(this.profile?.id || "", this.token || "");
        if (!token) {
            return Promise.reject("No refresh token available");
        }
        return Promise.resolve(token);
    }

    //TODO update this correctly after login
    private headers = {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json"
    };

    async isLoggedIn(): Promise<boolean> {
        const profile = await isSpotifyLoggedIn();
        if (profile) {
            this.profile = {
                id: profile.id, 
                displayName: profile.display_name || undefined
            };
            return true;
        }

        return false;
    }

    async getDisplayName() {
        const r = await fetch('https://api.spotify.com/v1/me', { headers: this.headers });
        const data = await r.json();
        return { id: data.id, name: data.display_name };
    }

    async getUserPlaylists(opts?: { offset?: string; limit?: number }) {
        const params = new URLSearchParams();
        if (opts?.limit) params.set("limit", String(opts.limit));
        if (opts?.offset) params.set("offset", String(opts.offset));

        const r = await fetch(`https://api.spotify.com/v1/me/playlists?${params.toString()}`, { headers: this.headers });
        const data = await r.json();
        const playlists: Playlist[] =
            data.items.map((item: any) => ({
                id: item.id,
                name: item.name,
                image: item.images[0]?.url,
                trackLength: item.tracks.total,
                description: item.description,
                isPublic: item.public,
                href: item.external_urls.spotify,
                source: 'SPOTIFY',
                status: 'success'
            }));

        return { items: playlists, next: data.next ? true : false };
    };
    async createPlaylist(name: string, opts?: { description?: string; public?: boolean }) {
        // Need user id to create playlists
        const me = await this.getDisplayName();
        const r = await fetch(`https://api.spotify.com/v1/users/${me.id}/playlists`, {
            method: "POST",
            headers: { ...this.headers, "Content-Type": "application/json" },
            body: JSON.stringify({ name, description: opts?.description ?? "", public: !!opts?.public }),
        });
        const p = await r.json();
        const playlist: Playlist = {
            id: p.id,
            platform: Platform.SPOTIFY,
            name: p.name,
            owner: me.name,
            trackCount: 0,
            isPublic: p.public,
            href: p.external_urls.spotify,
            status: state.SUCCESS
        };
        return playlist;
    }

    async getPlaylistTracks(playlistId: string, opts?: { cursor?: string; limit?: number }) {
        const params = new URLSearchParams();
        if (opts?.limit) params.set("limit", String(opts.limit));
        if (opts?.cursor) params.set("cursor", String(opts.cursor));

        const r = await fetch(`/api/apple/playlists/${playlistId}/tracks?${params}`, { headers: this.headers });
        const j = await r.json();

        const items: Track[] = (j.items ?? []).map((t: any) => ({
            id: t.id,
            title: t.attributes?.name ?? "",
            artist: t.attributes?.artistName ?? "",
            album: t.attributes?.albumName ?? "",
            durationMs: t.attributes?.durationInMillis ?? 0,
            isrc: t.attributes?.isrc ?? "",
        }));
        return { items, next: j.next ?? undefined };
    }

    async addTracks(playlistId: string, trackIds: string[]) {
        // Spotify URIs must be "spotify:track:{id}"
        const uris = trackIds.map(id => `spotify:track:${id}`);
        // Batch by 100
        for (let i = 0; i < uris.length; i += 100) {
            const chunk = uris.slice(i, i + 100);
            await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
                method: "POST",
                headers: this.headers,
                body: JSON.stringify({ uris: chunk }),
            });
        }
    }

    async searchTrackByISRC(isrc: string) {
        const url = `https://api.spotify.com/v1/search?q=isrc:${encodeURIComponent(isrc)}&type=track&limit=1`;
        const r = await fetch(url, { headers: this.headers });
        const j = await r.json();
        return j?.tracks?.items?.[0]?.id ?? null;
    }
}