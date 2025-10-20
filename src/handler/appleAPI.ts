import { API_FULL_URL, APP_FULL_URL } from "../config";
import type { IPlatformOAuthClient } from "./IPlatformOAuthClient";

declare const MusicKit: any;

interface AppleMusicConfig {
  developerToken: string;
  app: {
    name: string;
    build: string;
  };
}

export class AppleMusicOAuthClient implements IPlatformOAuthClient {
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
      const musicKitConfig: AppleMusicConfig = {
        developerToken,
        app: {
          name: "SyncraSong",
          build: "0.0.2",
        },
      };

      await MusicKit.configure(musicKitConfig);
      const musicInstance = MusicKit.getInstance();
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
}

export const appleMusicOAuthClient = new AppleMusicOAuthClient();

export const redirectToAppleOAuth = (): Promise<void> =>
  appleMusicOAuthClient.redirectToOAuth();
export const handleAppleCallback = (): Promise<void> =>
  appleMusicOAuthClient.handleCallback();

