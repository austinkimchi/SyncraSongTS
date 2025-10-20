import { APP_FULL_URL, API_FULL_URL, SPOTIFY_CLIENT_ID, SPOTIFY_SCOPES } from "../config";
interface SpotifyProfile {
    country: string;
    display_name: string | null;
    email: string; // unverified
    explicit_content: {
        filter_enabled: boolean;
        filter_locked: boolean;
    };
    external_urls: {
        spotify: string;
    };
    followers: {
        href: string | null;
        total: number;
    };
    href: string;
    id: string;
    images: Array<{
        width: number | null;
        height: number | null;
        url: string;
    }>;
    product: "premium" | "free" | "open" | null; // open and free are free accounts
    type: "user";
    uri: string;
}

async function redirectToOAuth(): Promise<void> {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

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

function generateCodeVerifier(length: number) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

async function generateCodeChallenge(codeVerifier: string) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

async function handleCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
        const token = await getAccessToken(SPOTIFY_CLIENT_ID, code);
        const profile: SpotifyProfile = await fetchProfile(token);

        await setAccessToken(token, profile.id);

        localStorage.setItem("spotify-profile", JSON.stringify(profile));
        window.history.replaceState({}, document.title, "/");
    }
}

async function getAccessToken(clientId: string, code: string): Promise<string> {
    const verifier = sessionStorage.getItem("spotify_verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", `${APP_FULL_URL}/callback/spotify`);
    params.append("code_verifier", verifier!);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token } = await result.json();
    return access_token;
}


async function fetchProfile(token: string): Promise<SpotifyProfile> {
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    const data: SpotifyProfile = await result.json();
    return data;
}

async function isLoggedIn(): Promise<SpotifyProfile | null> {
    const profile = localStorage.getItem("spotify-profile");
    if (profile) {
        return JSON.parse(profile) as SpotifyProfile;
    }
    return null;
}

async function setAccessToken(token: string, userID: string): Promise<string> {
    const client_token = await fetch(`${API_FULL_URL}/api/spotify/setToken`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: token, userID })
    }).catch(() => {
        return null;
    });

    if (!client_token) return "";

    const data = await client_token.json();

    return data.client_token;
}

async function getRefreshToken(userID: string, token: string): Promise<string | undefined> {
    const response = await fetch(`${API_FULL_URL}/api/spotify/refreshToken`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ userID })
    });
    if (!response.ok) return undefined;

    const data = await response.json();
    return data.accessToken;
}


export {
    fetchProfile as fetchSpotifyProfile,
    redirectToOAuth as redirectToSpotifyOAuth,
    handleCallback as handleSpotifyCallback,
    isLoggedIn as isSpotifyLoggedIn,
    getRefreshToken as getSpotifyRefreshToken,
};