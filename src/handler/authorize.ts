import config from "../../config.json";
const BASE_API_URL = `https://${config.subdomain}.${config.domain_name}/api`;
declare const MusicKit: any;

interface AppleMusicConfig {
  developerToken: string;
  app: {
    name: string;
    build: string;
  };
}

async function launchAppleMusicAuthorization(): Promise<boolean> {
  try {
    // Get MusicUserToken
    const fetchDevToken = await fetch(`${BASE_API_URL}/apple/devToken`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      mode: "cors",
    });

    if (!fetchDevToken.ok) {
      console.error("Failed to get developer token");
      return false;
    }

    const { developerToken } = await fetchDevToken.json();

    const musicKitKeys = Object.keys(localStorage).filter(key => key.startsWith("music"));
    if (musicKitKeys.length > 0) {
      console.warn("Local storage already contains MusicKit data, clearing it.");
      musicKitKeys.forEach(key => localStorage.removeItem(key));
    }

    const musicKitConfig: AppleMusicConfig = {
      developerToken,
      app: {
        name: "SyncraSong",
        build: "0.0.1"
      },
    };

    await MusicKit.configure(musicKitConfig);

    const musicInstance = MusicKit.getInstance();
    const musicUserToken = await musicInstance.authorize();
    if (!musicUserToken) {
      console.error("Failed to authorize with Apple Music");
      return false;
    }

    localStorage.setItem("musicUserToken", musicUserToken);

    const completeResponse = await fetch(
      `${BASE_API_URL}/oAuth/callback/apple`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ musicUserToken }),
        mode: "cors",
      }
    );

    return completeResponse.status === 200;
  } catch (error) {
    console.error("Authorization failed:", error);
    return false;
  }
}

async function launchSpotifyAuthorization(): Promise<boolean> {
  try {
    const linkResponse = await fetch(
      `${BASE_API_URL}/oAuth/authorize/spotify`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        mode: "cors",
      }
    );

    if (!linkResponse.ok) {
      return false;
    }

    const url = await linkResponse.json();
    if (!url || !url.authorizeURL) {
      console.error("Invalid response from Spotify authorization endpoint");
      return false;
    }


    window.open(url.authorizeURL, "_blank", "width=600,height=800");

    return new Promise((resolve) => {
      const focusHandler = () => {
        window.removeEventListener("focus", focusHandler);
        resolve(true);
      };

      window.addEventListener("focus", focusHandler);
    });
  } catch (error) {
    console.error("Spotify authorization failed:", error);
    return false;
  }
}

export { launchAppleMusicAuthorization, launchSpotifyAuthorization };
