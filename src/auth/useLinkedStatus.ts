// src/auth/useLinkedStatus.ts
import { useEffect, useState, useCallback } from "react";
import Platform from "../types/platform";
import { getClient } from "../handler/getClient";

export type LinkedState = {
  linked: boolean;           // true if usable tokens exist
  needsScopeUpgrade?: boolean; // optional: true if scopes are insufficient
  expiresAt?: number;        // optional: ms since epoch
  checkedAt: number;         // timestamp of last check
};

export function useLinkedStatus(platform: Platform) {
  const [status, setStatus] = useState<LinkedState>({
    linked: false,
    checkedAt: Date.now(),
  });

  const check = useCallback(async () => {
    const client = getClient(platform);
    if (!client) {
      setStatus((s) => ({ ...s, linked: false, checkedAt: Date.now() }));
      return false;
    }
    try {
      // Prefer a richer API if your clients expose it; fall back to isLoggedIn()
      const info =
        typeof (client as any).getAuthState === "function"
          ? await (client as any).getAuthState()
          : { linked: await client.isLoggedIn() };

      setStatus({
        linked: !!info.linked,
        needsScopeUpgrade: !!info.needsScopeUpgrade,
        expiresAt: info.expiresAt,
        checkedAt: Date.now(),
      });
      return !!info.linked;
    } catch {
      setStatus({ linked: false, checkedAt: Date.now() });
      return false;
    }
  }, [platform]);

  useEffect(() => {
    check();
  }, [check]);

  useEffect(() => {
    // React to global auth changes fired elsewhere
    const onAuthChanged = (e: Event) => {
      const evt = e as CustomEvent<{ platform?: Platform }>;
      if (!evt.detail?.platform || evt.detail.platform === platform) check();
    };
    window.addEventListener("auth-changed", onAuthChanged as EventListener);
    return () => window.removeEventListener("auth-changed", onAuthChanged as EventListener);
  }, [platform, check]);

  return { status, check };
}
