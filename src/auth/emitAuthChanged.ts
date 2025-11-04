import Platform from "../types/platform";

export function emitAuthChanged(platform?: Platform) {
    window.dispatchEvent(new CustomEvent("auth-changed", { detail: { platform } }));
}
