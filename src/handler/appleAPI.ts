import { emitAuthChanged } from "../auth/emitAuthChanged";
import { API_FULL_URL, APP_FULL_URL } from "../config";
import Platform from "../types/platform";
import type { PlatformAuthService } from "./PlatformAuthService";

declare const MusicKit: any;

interface AppleMusicConfig {
  developerToken: string;
  app: {
    name: string;
    build: string;
  };
}

class AppleMusicAuthService implements PlatformAuthService {
  private config: AppleMusicConfig = {
    developerToken: "",
    app: {
      name: "SyncraSong",
      build: "0.0.2",
    },
  };

  async redirectToOAuth(): Promise<void> {
    try {
      const authToken = localStorage.getItem("token");
      const headers: Record<string, string> = {};
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const fetchDevToken = await fetch(`${API_FULL_URL}/api/apple_music/devToken`, {
        method: "GET",
        mode: "cors",
        headers: Object.keys(headers).length > 0 ? headers : undefined,
      });

      if (!fetchDevToken.ok) {
        console.error("Failed to get developer token");
        return;
      }

      const { developerToken } = await fetchDevToken.json();
      this.config.developerToken = developerToken;
      const musicInstance = await this.getMusicInstance();
      await musicInstance.authorize();
      const musicUserToken = await musicInstance.musicUserToken;
      if (!musicUserToken) {
        console.error("Failed to authorize with Apple Music");
        return;
      }

      window.location.href = `${APP_FULL_URL}/callback/apple_music?musicUserToken=${musicUserToken}`;
    } catch (error) {
      console.error("Error during Apple Music authorization:", error);
    }
  }

  async handleCallback(): Promise<void> {
    // get musicUserToken from localstorage includes media-user-token
    let musicUserToken;
    for (const [key, value] of Object.entries(localStorage)) {
      if (key.includes("media-user-token")) {
        musicUserToken = value;
        break;
      }
    }
    if (!musicUserToken) console.error("No musicUserToken found");

    // POST to backend to link account
    const authToken = localStorage.getItem("token");

    await fetch(`${API_FULL_URL}/api/oauth/callback/apple_music`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify({
        token: musicUserToken,
        provider: Platform.APPLE_MUSIC,
        intent: "connect"
      }),
    });

    window.history.replaceState({}, document.title, "/");
    emitAuthChanged(Platform.APPLE_MUSIC);
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      const providers = localStorage.getItem("providers");
      if (!providers) return false;

      const parsedProviders: Platform[] = JSON.parse(providers);
      if (!parsedProviders.includes(Platform.APPLE_MUSIC)) return false;
      
      return true;
    } catch (error) {
      return false;
    }
  }

  private async getMusicInstance(): Promise<any> {
    await MusicKit.configure(this.config);
    return MusicKit.getInstance();
  }
}

export const appleMusicAuthService = new AppleMusicAuthService();

export const redirectToAppleOAuth = () => appleMusicAuthService.redirectToOAuth();
export const handleAppleCallback = () => appleMusicAuthService.handleCallback();
export const isAppleMusicLoggedIn = () => appleMusicAuthService.isLoggedIn();

function base64Encode(str: string): string {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function toSolidBytes(_match, p1) {
    return String.fromCharCode(parseInt(p1, 16));
  }));
}
