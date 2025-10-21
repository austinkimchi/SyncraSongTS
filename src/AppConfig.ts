import { RateLimitRule } from "./types/RateLimitRule";

const env = import.meta.env;

const BASE_DOMAIN = env.APP_BASE_DOMAIN;
const SUB_DOMAIN = env.APP_SUB_DOMAIN;

if (!BASE_DOMAIN || !SUB_DOMAIN) {
    throw new Error("Missing API configuration in environment variables");
}
export const APP_FULL_URL = `https://${SUB_DOMAIN}.${BASE_DOMAIN}`;

const API_SUB_DOMAIN = env.APP_API_SUB_DOMAIN;
const API_BASE_DOMAIN = env.APP_API_BASE_DOMAIN;
if (!API_BASE_DOMAIN || !API_SUB_DOMAIN) {
    throw new Error("Missing API configuration in environment variables");
}
export const API_FULL_URL = `https://${API_SUB_DOMAIN}.${API_BASE_DOMAIN}`;

// Spotify OAuth configuration
const SPOTIFY_CLIENT_ID = env.APP_SPOTIFY_CLIENT_ID;
const SPOTIFY_SCOPES = env.APP_SPOTIFY_SCOPES?.split(" ") || [];

if (!SPOTIFY_CLIENT_ID || SPOTIFY_SCOPES.length === 0) {
    throw new Error("Missing Spotify configuration in environment variables");
}

// Apple Music OAuth configuration
const APPLE_MUSIC_CLIENT_ID = env.APP_APPLE_MUSIC_CLIENT_ID;
const APPLE_MUSIC_SCOPES = env.APP_APPLE_MUSIC_SCOPES?.split(" ") || [];

if (!APPLE_MUSIC_CLIENT_ID || APPLE_MUSIC_SCOPES.length === 0) {
    // throw new Error("Missing Apple Music configuration in environment variables");
}

export { SPOTIFY_CLIENT_ID, SPOTIFY_SCOPES, APPLE_MUSIC_CLIENT_ID, APPLE_MUSIC_SCOPES };

export class AppConfig {
    apiBase: string;
    redirectUris: Record<string, string>;
    scopes: Record<string, string[]>;
    rateLimits?: Record<string, RateLimitRule>;

    constructor(
        apiBase: string,
        redirectUris: Record<string, string>,
        scopes: Record<string, string[]>,
        rateLimits?: Record<string, RateLimitRule>
    ) {
        this.apiBase = apiBase;
        this.redirectUris = redirectUris;
        this.scopes = scopes;
        this.rateLimits = rateLimits;
    }
}

// Load primitives into AppConfig
export const appConfig = new AppConfig(
    API_FULL_URL,
    {
        spotify: `${APP_FULL_URL}/callback/spotify`,
        appleMusic: `${APP_FULL_URL}/callback/applemusic`,
    },
    {
        spotify: SPOTIFY_SCOPES,
        appleMusic: APPLE_MUSIC_SCOPES,
    },
    {
        spotify: { requests: 100, perMs: 60000, burst: 20 },
        appleMusic: { requests: 50, perMs: 60000 },
    }
);
