import Platform from "../types/platform";

const STORAGE_KEY = "pending-account";
const PENDING_ACCOUNT_EVENT = "pending-account-updated";

const notifyUpdate = () => {
  window.dispatchEvent(new Event(PENDING_ACCOUNT_EVENT));
};

export interface PendingAccountInfo {
  provider: Platform;
  state: string;
}

export const storePendingAccount = (info: PendingAccountInfo): void => {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(info));
  notifyUpdate();
};

export const getPendingAccount = (): PendingAccountInfo | null => {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as PendingAccountInfo;
    return parsed;
  } catch (error) {
    console.error("Failed to parse pending account info", error);
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const clearPendingAccount = (): void => {
  sessionStorage.removeItem(STORAGE_KEY);
  notifyUpdate();
};

export const subscribeToPendingAccount = (listener: () => void): (() => void) => {
  window.addEventListener(PENDING_ACCOUNT_EVENT, listener);
  return () => {
    window.removeEventListener(PENDING_ACCOUNT_EVENT, listener);
  };
};

export const pendingAccountEventName = PENDING_ACCOUNT_EVENT;
