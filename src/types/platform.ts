import AppleLogo from "../assets/provider/applemusic.svg";
import SpotifyLogo from "../assets/provider/spotify.png";
import SoundCloudLogo from "../assets/provider/SoundCloud.png";
import { redirectToSpotifyOAuth, handleSpotifyCallback, spotifyOAuthClient } from "../handler/spotifyAPI";
import { redirectToAppleOAuth, handleAppleCallback, appleMusicOAuthClient } from "../handler/appleAPI";
import type { IPlatformOAuthClient } from "../handler/IPlatformOAuthClient";

enum Platform {
    SPOTIFY = "spotify",
    APPLE_MUSIC = "apple",
    SOUNDCLOUD = "soundcloud"
}

interface PlatformInfo {
    id: Platform;
    displayName: string;
    loginLabel: string;
    logo: string;
    OAuthFunction?: () => Promise<void>;
    CallbackFunction?: () => Promise<void>;
    scopes?: string[];
    oauthClient?: IPlatformOAuthClient;
}

const PLATFORMS: Record<Platform, PlatformInfo> = {
    [Platform.SPOTIFY]: {
        id: Platform.SPOTIFY,
        displayName: "Spotify",
        loginLabel: "Sign in with Spotify",
        logo: SpotifyLogo,
        OAuthFunction: redirectToSpotifyOAuth,
        CallbackFunction: handleSpotifyCallback,
        oauthClient: spotifyOAuthClient,
        scopes: [
            "user-read-private",
            "user-read-email"
        ]
    },
    [Platform.APPLE_MUSIC]: {
        id: Platform.APPLE_MUSIC,
        displayName: "Apple Music",
        loginLabel: "Sign in with Apple",
        logo: AppleLogo,
        OAuthFunction: redirectToAppleOAuth,
        CallbackFunction: handleAppleCallback,
        oauthClient: appleMusicOAuthClient,
    },
    [Platform.SOUNDCLOUD]: {
        id: Platform.SOUNDCLOUD,
        displayName: "SoundCloud",
        loginLabel: "Sign in with SoundCloud",
        logo: SoundCloudLogo,
        OAuthFunction: undefined,
    },
};

const getPlatformInfo = (p: Platform): PlatformInfo => PLATFORMS[p];
const getPlatformLogo = (p: Platform): string => PLATFORMS[p].logo;
const getPlatformDisplayName = (p: Platform): string => PLATFORMS[p].displayName;
const getPlatformOAuthFunction = (p: Platform): (() => Promise<void>) | undefined => PLATFORMS[p].OAuthFunction;
const getPlatformCallbackFunction = (p: Platform): (() => Promise<void>) | undefined => PLATFORMS[p].CallbackFunction;
const getPlatformOAuthClient = (p: Platform): IPlatformOAuthClient | undefined => PLATFORMS[p].oauthClient;

export default Platform;
export {
    getPlatformInfo,
    getPlatformLogo,
    getPlatformDisplayName,
    getPlatformOAuthFunction,
    getPlatformCallbackFunction,
    getPlatformOAuthClient
}