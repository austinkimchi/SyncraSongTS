import { API_FULL_URL } from "../config";
import Platform from "../types/platform";
import { OAuthCallbackResponse, PlatformAuthService } from "./PlatformAuthService";
import { storePendingAccount, clearPendingAccount } from "./pendingAccount";
import { addStoredProvider, waitForProviders } from "../auth/providerStorage";

const PROFILE_STORAGE_KEY = "soundcloud-profile";
const STATE_STORAGE_KEY = "soundcloud-oauth-state";

class SoundCloudAuthService implements PlatformAuthService {
    async redirectToOAuth(): Promise<void> {
        const hasToken = !!localStorage.getItem("token");
        const payload = { provider: Platform.SOUNDCLOUD, intent: hasToken ? "connect" : "login" };

        const response = await this.requestOAuthLink(payload);
        if (!response?.authorizeUrl || !response.state) {
            throw new Error("SoundCloud authorization link was not provided by the server");
        }

        sessionStorage.setItem(STATE_STORAGE_KEY, response.state);
        window.location.href = response.authorizeUrl;
    }

    async handleCallback(): Promise<void> {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const state = params.get("state");
        if (!code || !state) return;

        const storedState = sessionStorage.getItem(STATE_STORAGE_KEY);
        sessionStorage.removeItem(STATE_STORAGE_KEY);
        if (storedState && storedState !== state) {
            console.error("SoundCloud OAuth state mismatch");
            window.history.replaceState({}, document.title, "/");
            return;
        }

        const callbackUrl = new URL(`${API_FULL_URL}/api/oauth/callback/soundcloud`);
        callbackUrl.searchParams.set("code", code);
        callbackUrl.searchParams.set("state", state);

        let callbackResponse: Response;
        try {
            callbackResponse = await fetch(callbackUrl.toString(), { method: "GET" });
        } catch (error) {
            console.error("Error during SoundCloud OAuth callback request:", error);
            return;
        }

        if (!callbackResponse.ok) {
            console.error("SoundCloud OAuth callback failed:", callbackResponse.statusText);
            return;
        }
        let data: OAuthCallbackResponse = {};
        try {
            data = await callbackResponse.json();
        } catch (error) {
            console.error("Failed to parse SoundCloud callback response", error);
            window.history.replaceState({}, document.title, "/");
            return;
        }

        if (data.jwt) {
            localStorage.setItem("token", data.jwt);
        }

        if (data.info === "complete-signup" && data.state) {
            storePendingAccount({ provider: Platform.SPOTIFY, state: data.state });
        } else if (data.info === "signin" || data.info === "connected") {
            clearPendingAccount();
            addStoredProvider(Platform.SOUNDCLOUD);
            window.dispatchEvent(new Event("auth-changed"));
        }
        window.history.replaceState({}, document.title, "/");
    }

    async isLoggedIn(): Promise<boolean> {
        const providers = await waitForProviders();
        return providers.includes(Platform.SOUNDCLOUD);
    }

    getStoredProfile(): any | null {
        const profileJson = localStorage.getItem(PROFILE_STORAGE_KEY);
        if (profileJson) {
            try {
                return JSON.parse(profileJson);
            } catch {
                return null;
            }
        }
        return null;
    }

    setStoredProfile(profile: any): void {
        if (profile) {
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
        } else {
            localStorage.removeItem(PROFILE_STORAGE_KEY);
        }
    }

    private async requestOAuthLink(payload: { provider: Platform; intent: string; }): Promise<{ authorizeUrl: string; state: string; } | null> {
        try {
            const token = localStorage.getItem("token");
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
            };
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_FULL_URL}/api/oauth/link`, {
                method: "POST",
                headers,
                body: JSON.stringify({ provider: payload.provider, intent: payload.intent, redirectUri: `${window.location.origin}/callback/soundcloud` }),
            });

            if (!response.ok) {
                console.error("Failed to get SoundCloud OAuth link:", response.statusText);
                return null;
            }

            const data = await response.json();
            return {
                authorizeUrl: data.authorizeUrl,
                state: data.state,
            };
        } catch (error) {
            console.error("Error requesting SoundCloud OAuth link:", error);
            return null;
        }
    }
}

export const soundCloudAuthService = new SoundCloudAuthService();

export const redirectToSoundCloudOAuth = () => soundCloudAuthService.redirectToOAuth();
export const handleSoundCloudCallback = () => soundCloudAuthService.handleCallback();
export const isSoundCloudLoggedIn = () => soundCloudAuthService.isLoggedIn();