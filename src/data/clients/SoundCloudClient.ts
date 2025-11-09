import Platform from "../../types/platform";
import { PlatformClient } from "./IPlatformClient";
import { soundCloudAuthService } from "../../handler/soundAPI";
import type { Playlist } from "../../types/playlist";
import { API_FULL_URL } from "../../config";
import { emitAuthChanged } from "../../auth/emitAuthChanged";


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
        const res = await fetch(`${API_FULL_URL}/api/soundcloud/fetchPlaylist?fetch=${opts?.fetch ? 'true' : 'false'}`, {
            headers: this.headers,
        });
        if (!res.ok) return { playlists: [], updatedAt: new Date(0) };
        const data = await res.json() as { playlists: Playlist[], updatedAt: string };
        const updatedAt = new Date(data.updatedAt);
        return { playlists: data.playlists, updatedAt };
    }

    async requestWithAuth<T>(platform: Platform, input: RequestInfo, init?: RequestInit): Promise<T> {
        const res = await fetch(input, init);
        if (res.status === 401 || res.status === 403) {
            // Token might be expired or invalid, emit auth-changed event
            emitAuthChanged(platform);
        }
        if (!res.ok) {
            throw new Error(`Request failed with status ${res.status}: ${res.statusText}`);
        }
        return res.json() as Promise<T>;
    }

}