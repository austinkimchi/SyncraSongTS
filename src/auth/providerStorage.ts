import { API_FULL_URL } from "../config";
import { Platform } from "../types/enums/platform.enum";

const PROVIDERS_STORAGE_KEY = "providers";
const PROVIDERS_UPDATED_EVENT = "providers-updated";

const API_PATH = "/auth/info";

type ProviderEventDetail = {
  providers: Platform[];
};

const validProviders = new Set<Platform>(Object.values(Platform));

const parseProviders = (raw: string | null): Platform[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is Platform => typeof value === "string" && validProviders.has(value as Platform));
  } catch (error) {
    console.error("Failed to parse stored providers", error);
    localStorage.removeItem(PROVIDERS_STORAGE_KEY);
    return [];
  }
};

const emitProvidersUpdated = (providers: Platform[]) => {
  const event = new CustomEvent<ProviderEventDetail>(PROVIDERS_UPDATED_EVENT, {
    detail: { providers },
  });
  window.dispatchEvent(event);
};

export const getStoredProviders = (): Platform[] => {
  return parseProviders(localStorage.getItem(PROVIDERS_STORAGE_KEY));
};

export const hasStoredProviders = (): boolean => localStorage.getItem(PROVIDERS_STORAGE_KEY) !== null && getStoredProviders().length > 0;

const writeProviders = (providers: Platform[]) => {
  localStorage.setItem(PROVIDERS_STORAGE_KEY, JSON.stringify(providers));
  emitProvidersUpdated(providers);
};

export const setStoredProviders = (providers: Platform[]) => {
  writeProviders(providers);
};

export const addStoredProvider = (provider: Platform) => {
  const providers = new Set(getStoredProviders());
  providers.add(provider);
  writeProviders(Array.from(providers));
};

export const removeStoredProvider = (provider: Platform) => {
  const providers = new Set(getStoredProviders());
  providers.delete(provider);
  writeProviders(Array.from(providers));
};

export const clearStoredProviders = () => {
  writeProviders([]);
};

export const providersUpdatedEventName = PROVIDERS_UPDATED_EVENT;

interface InfoPayload {
  jwt: { expiresAt: EpochTimeStamp; expiresIn: number };
  userId: string;
  oauth: Array<{ provider: Platform; providerId: string }>;
}

export const waitForProviders = async (): Promise<Platform[]> => {
  if (!localStorage.getItem("token"))
    return [];

  const response = await fetch(`${API_FULL_URL}${API_PATH}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`,
    },
  });

  if (!response.ok) {
    console.error("Failed to fetch providers from API");
    return [];
  }

  const data = await response.json() as InfoPayload;
  const { oauth } = data;
  const providers: Platform[] = [];

  for (const entry of oauth) {
    const plat = entry.provider;
    if (validProviders.has(plat)) {
      providers.push(plat);
    }
  }
  setStoredProviders(providers);

  return providers;
};