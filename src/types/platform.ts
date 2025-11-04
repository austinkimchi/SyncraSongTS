import AppleLogo from "../assets/provider/applemusic.svg";
import SpotifyLogo from "../assets/provider/spotify.png";
import SoundCloudLogo from "../assets/provider/SoundCloud.png";
import { handleSpotifyCallback, redirectToSpotifyOAuth } from "../handler/spotifyAPI";
import { handleAppleCallback, redirectToAppleOAuth } from "../handler/appleAPI";
import { IPlatformClient } from "../data/clients/IPlatformClient";
import { SpotifyClient } from "../data/clients/SpotifyClient";
import { AppleMusicClient } from "../data/clients/AppleMusicClient";

enum Platform {
    SPOTIFY = "spotify",
    APPLE_MUSIC = "apple_music",
    SOUNDCLOUD = "soundcloud"
}

interface PlatformInfo {
    displayName: string;
    loginLabel: string;
    logo: string;
    OAuthFunction: () => Promise<void>;
    CallbackFunction?: () => Promise<void>;
    scopes?: string[];
    client?: new () => IPlatformClient;
}

const PLATFORMS: Record<Platform, PlatformInfo> = {
    [Platform.SPOTIFY]: {
        displayName: "Spotify",
        loginLabel: "Sign in with Spotify",
        logo: SpotifyLogo,
        OAuthFunction: redirectToSpotifyOAuth,
        CallbackFunction: handleSpotifyCallback,
        scopes: [
            "user-read-private",
            "user-read-email"
        ],
        client: SpotifyClient  
    },
    [Platform.APPLE_MUSIC]: {
        displayName: "Apple Music",
        loginLabel: "Sign in with Apple",
        logo: AppleLogo,
        OAuthFunction: redirectToAppleOAuth,
        CallbackFunction: handleAppleCallback,
        client: AppleMusicClient
    },
    [Platform.SOUNDCLOUD]: {
        displayName: "SoundCloud",
        loginLabel: "Sign in with SoundCloud",
        logo: SoundCloudLogo,
        OAuthFunction: async () => {},
    },
};

const getPlatformInfo = (p: Platform): PlatformInfo => PLATFORMS[p];
const getPlatformLogo = (p: Platform): string => PLATFORMS[p].logo;
const getPlatformDisplayName = (p: Platform): string => PLATFORMS[p].displayName;
const getPlatformOAuthFunction = (p: Platform): (() => Promise<void>) => PLATFORMS[p].OAuthFunction;
const getPlatformCallbackFunction = (p: Platform): (() => Promise<void>) | undefined => PLATFORMS[p].CallbackFunction;

export default Platform;
export {
    getPlatformInfo,
    getPlatformLogo,
    getPlatformDisplayName,
    getPlatformOAuthFunction,
    getPlatformCallbackFunction,
    PLATFORMS
}