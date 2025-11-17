import { API_FULL_URL } from "../config";
import Platform from "../types/platform";
import type { OAuthCallbackResponse, PlatformAuthService } from "./PlatformAuthService";
import { storePendingAccount, clearPendingAccount } from "./pendingAccount";
import { addStoredProvider, waitForProviders } from "../auth/providerStorage";
import { navigateTo } from "./createNavigate";

interface OAuthLinkResponse {
  state: string;
  authorizeUrl: string;
}

interface SpotifyAccountProfile {
  id: string;
  display_name?: string | null;
}


const PROFILE_STORAGE_KEY = "spotify-profile";
const STATE_STORAGE_KEY = "spotify-oauth-state";

class SpotifyAuthService implements PlatformAuthService {
  async redirectToOAuth(): Promise<void> {
    const hasToken = !!localStorage.getItem("token");
    const payload = { provider: Platform.SPOTIFY, intent: hasToken ? "connect" : "login" };

    const response = await this.requestOAuthLink(payload);
    if (!response?.authorizeUrl || !response.state) {
      throw new Error("Spotify authorization link was not provided by the server");
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
      console.error("Spotify OAuth state mismatch");
      navigateTo('/link');
      return;
    }

    const callbackUrl = new URL(`${API_FULL_URL}/api/oauth/callback/spotify`);
    callbackUrl.searchParams.set("code", code);
    callbackUrl.searchParams.set("state", state);

    try {
      const callbackResponse = await fetch(callbackUrl.toString(), { method: "GET" });

      if (!callbackResponse.ok) {
        console.error("Spotify callback failed", callbackResponse.status);
        navigateTo('/link');
        return;
      }

      try {
        const data = await callbackResponse.json();
        if (data.jwt) {
          localStorage.setItem("token", data.jwt);
        }

        if (data.info === "complete-signup" && data.state) {
          storePendingAccount({ provider: Platform.SPOTIFY, state: data.state });
        } else if (data.info === "signin" || data.info === "connected") {
          clearPendingAccount();
          window.dispatchEvent(new Event("auth-changed"));
        }
        
        console.log(`[SpotifyAuthService] OAuth ${data.info} successful`);
        navigateTo('/link');
      } catch (error) {
        console.error("Failed to parse Spotify callback response", error);
        navigateTo('/link');
        return;
      }
    } catch (error) {
      console.error("Failed to reach Spotify callback endpoint", error);
      navigateTo('/link');
      return;
    }
  }

  async isLoggedIn(): Promise<boolean> {
    const providers = await waitForProviders();
    return providers.includes(Platform.SPOTIFY);
  }

  getStoredProfile(): SpotifyAccountProfile | null {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SpotifyAccountProfile;
    } catch (error) {
      console.error("Failed to parse stored Spotify profile", error);
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      return null;
    }
  }

  setStoredProfile(profile: SpotifyAccountProfile | null) {
    if (!profile) {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      return;
    }
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }

  private async requestOAuthLink(payload: { provider: Platform; intent: string }): Promise<OAuthLinkResponse | null> {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const requestBodies: Array<{ method: string; body?: BodyInit; url: string; headers?: Record<string, string> }> = [
      {
        method: "POST",
        url: `${API_FULL_URL}/api/oauth/link`,
        body: JSON.stringify({
          provider: payload.provider,
          intent: payload.intent,
          redirectUri: `${window.location.origin}/callback/spotify`,
          token: token
        }),
        headers,
      }
    ];
    console.log(`${window.location.origin}/callback/spotify`);

    for (const request of requestBodies) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body,
        });
        if (!response.ok) {
          continue;
        }
        return (await response.json()) as OAuthLinkResponse;
      } catch (error) {
        console.error(`Failed to request Spotify OAuth link via ${request.method}`, error);
      }
    }

    throw new Error("Unable to request Spotify OAuth link");
  }
}

export const spotifyAuthService = new SpotifyAuthService();

export const redirectToSpotifyOAuth = () => spotifyAuthService.redirectToOAuth();
export const handleSpotifyCallback = async () => spotifyAuthService.handleCallback();
export const isSpotifyLoggedIn = () => spotifyAuthService.getStoredProfile();
