import AppleLogo from "../assets/provider/applemusic.svg";
import SpotifyLogo from "../assets/provider/spotify.png";
import SoundCloudLogo from "../assets/provider/SoundCloud.png";

enum Platform {
    SPOTIFY = "spotify",
    APPLE_MUSIC = "apple",
    SOUNDCLOUD = "soundcloud"
}

function getPlatformDisplayName(platform: Platform): string {
    switch (platform) {
        case Platform.SPOTIFY:
            return "Spotify";
        case Platform.APPLE_MUSIC:
            return "Apple Music";
        case Platform.SOUNDCLOUD:
            return "SoundCloud";
        default:
            return "unknown";
    }
};


function getPlatformLogo(platform: Platform): string {
    switch (platform) {
        case Platform.SPOTIFY:
            return SpotifyLogo;
        case Platform.APPLE_MUSIC:
            return AppleLogo;
        case Platform.SOUNDCLOUD:
            return SoundCloudLogo;
        default:
            return "default_logo.png";
    }
}

export { Platform, getPlatformDisplayName, getPlatformLogo };
