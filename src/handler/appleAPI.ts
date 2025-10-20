import { API_FULL_URL, APP_FULL_URL } from "../config";
declare const MusicKit: any;

interface AppleMusicConfig {
    developerToken: string;
    app: {
        name: string;
        build: string;
    };
}

const musicKitConfig: AppleMusicConfig = {
    developerToken: "",
    app: {
        name: "SyncraSong",
        build: "0.0.2"
    },
};

async function redirectToOAuth(): Promise<void> {
    try {
        const fetchDevToken = await fetch(`${API_FULL_URL}/api/apple/devToken`, {
            method: "GET",
            mode: "cors",
        });

        if (!fetchDevToken.ok)
            return console.error("Failed to get developer token");

        const { developerToken } = await fetchDevToken.json();
        musicKitConfig.developerToken = developerToken;
        await MusicKit.configure(musicKitConfig);
        const musicInstance = MusicKit.getInstance();
        await musicInstance.authorize();
        const musicUserToken = await musicInstance.musicUserToken;
        if (!musicUserToken)
            return console.error("Failed to authorize with Apple Music");

        window.location.href = `${APP_FULL_URL}/callback/apple?musicUserToken=${musicUserToken}`;
    }
    catch (error) {
        console.error("Error during Apple Music authorization:", error);
    }
}

async function handleCallback(): Promise<void> {
    window.history.replaceState({}, document.title, "/");
    return;
}

async function isLoggedIn(): Promise<boolean> {
    try {
        await MusicKit.configure(musicKitConfig);
        const musicInstance = MusicKit.getInstance();
        return musicInstance.isAuthorized;
    } catch (error) {
        return false;
    }
}

export {
    redirectToOAuth as redirectToAppleOAuth,
    handleCallback as handleAppleCallback,
    isLoggedIn as isAppleMusicLoggedIn
}