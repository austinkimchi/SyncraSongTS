import Platform from "../types/platform";
import type { IPlatformClient } from "../data/clients/IPlatformClient";
import { SpotifyClient } from "../data/clients/SpotifyClient";
import { AppleMusicClient } from "../data/clients/AppleMusicClient";

class PlatformClientRegistry {
  private readonly clients = new Map<Platform, IPlatformClient>();

  get(platform: Platform): IPlatformClient {
    if (!this.clients.has(platform)) {
      this.clients.set(platform, this.createClient(platform));
    }
    return this.clients.get(platform)!;
  }

  private createClient(platform: Platform): IPlatformClient {
    switch (platform) {
      case Platform.SPOTIFY:
        return new SpotifyClient();
      case Platform.APPLE_MUSIC:
        return new AppleMusicClient();
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }
}

export const platformClientRegistry = new PlatformClientRegistry();

export function getClient(platform: Platform) {
  return platformClientRegistry.get(platform);
}
