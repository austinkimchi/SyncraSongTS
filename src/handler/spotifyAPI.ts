import { APP_FULL_URL, SPOTIFY_CLIENT_ID, SPOTIFY_SCOPES } from "../config";
import type { IPlatformOAuthClient } from "./IPlatformOAuthClient";

export class SpotifyOAuthClient implements IPlatformOAuthClient {
  async redirectToOAuth(): Promise<void> {
    const verifier = this.generateCodeVerifier(128);
    const challenge = await this.generateCodeChallenge(verifier);

    sessionStorage.setItem("spotify_verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", SPOTIFY_CLIENT_ID);
    params.append("response_type", "code");
    params.append("redirect_uri", `${APP_FULL_URL}/callback/spotify`);
    params.append("scope", SPOTIFY_SCOPES.join(" "));
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async handleCallback(): Promise<void> {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;

    const token = await this.getAccessToken(SPOTIFY_CLIENT_ID, code);
    const profile = await this.fetchProfile(token);
    localStorage.setItem("spotify-profile", JSON.stringify(profile));
    window.history.replaceState({}, document.title, "/");
  }

  private generateCodeVerifier(length: number): string {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let text = "";

    for (let i = 0; i < length; i += 1) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  }

  private async generateCodeChallenge(codeVerifier: string): Promise<string> {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest("SHA-256", data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  private async getAccessToken(clientId: string, code: string): Promise<string> {
    const verifier = sessionStorage.getItem("spotify_verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", `${APP_FULL_URL}/callback/spotify`);
    params.append("code_verifier", verifier ?? "");

    const result = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });

    const { access_token: accessToken } = await result.json();
    return accessToken;
  }

  private async fetchProfile(token: string): Promise<any> {
    const result = await fetch("https://api.spotify.com/v1/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    return result.json();
  }
}

export const spotifyOAuthClient = new SpotifyOAuthClient();

export const redirectToSpotifyOAuth = (): Promise<void> =>
  spotifyOAuthClient.redirectToOAuth();
export const handleSpotifyCallback = (): Promise<void> =>
  spotifyOAuthClient.handleCallback();

