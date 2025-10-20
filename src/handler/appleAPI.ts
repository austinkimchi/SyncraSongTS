import { API_FULL_URL, APP_FULL_URL } from "../config";
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
      const fetchDevToken = await fetch(`${API_FULL_URL}/api/apple/devToken`, {
        method: "GET",
        mode: "cors",
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

      window.location.href = `${APP_FULL_URL}/callback/apple?musicUserToken=${musicUserToken}`;
    } catch (error) {
      console.error("Error during Apple Music authorization:", error);
    }
  }

  async handleCallback(): Promise<void> {
    window.history.replaceState({}, document.title, "/");
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      const musicInstance = await this.getMusicInstance();
      return musicInstance.isAuthorized;
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
