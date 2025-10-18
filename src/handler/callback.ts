import Platform, { getPlatformCallbackFunction } from "../types/platform";

// Check for /callback in url
const url = new URL(window.location.href);
const pathname = url.pathname.toLowerCase();

if (pathname.startsWith("/callback/")) {
    const platformStr = pathname.split("/callback/")[1];
    const platform = platformStr as Platform;
    const callbackFunction = getPlatformCallbackFunction(platform);
    if (callbackFunction) {
        callbackFunction();
    }
}
