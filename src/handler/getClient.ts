import Platform from "../types/platform";
import { SpotifyClient } from "../data/clients/SpotifyClient";
import { AppleMusicClient } from "../data/clients/AppleMusicClient";

export function getClient(platform: Platform) {
    const client =
        platform === Platform.SPOTIFY ? new SpotifyClient() :
            platform === Platform.APPLE_MUSIC ? new AppleMusicClient() /* new AppleMusicClient() */ :
                (() => { throw new Error(`Unsupported platform: ${platform}`); })();

    return client;
}