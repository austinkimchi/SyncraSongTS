import Platform from "../types/platform";

export type TransferPlatforms = {
  source: Platform;
  target: Platform;
};

const TRANSFER_PLATFORMS_KEY = "transfer-platforms";

const validPlatforms = new Set<Platform>(Object.values(Platform));

const isValidTransferPlatforms = (value: unknown): value is TransferPlatforms => {
  if (!value || typeof value !== "object") return false;

  const candidate = value as TransferPlatforms;
  return validPlatforms.has(candidate.source) && validPlatforms.has(candidate.target);
};

export const storeTransferPlatforms = (platforms: TransferPlatforms) => {
  localStorage.setItem(TRANSFER_PLATFORMS_KEY, JSON.stringify(platforms));
};

export const loadTransferPlatforms = (fallback: TransferPlatforms): TransferPlatforms => {
  const raw = localStorage.getItem(TRANSFER_PLATFORMS_KEY);

  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    if (isValidTransferPlatforms(parsed)) return parsed;

    return fallback;
  } catch (error) {
    console.error("Failed to parse stored transfer platforms", error);
    localStorage.removeItem(TRANSFER_PLATFORMS_KEY);
    return fallback;
  }
};
