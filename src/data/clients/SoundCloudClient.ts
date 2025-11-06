import Platform from "../../types/platform";
import { PlatformClient } from "./IPlatformClient";
import { soundCloudAuthService } from "../../handler/soundAPI";
import type { Playlist } from "../../types/playlist";


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
        return { items: [] as Playlist[] };
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