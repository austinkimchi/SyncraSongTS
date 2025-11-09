import { API_FULL_URL } from "../config";
import type { Playlist } from "../types/playlist";
import Platform from "../types/platform";
import { state } from "../types/status";

export const TRANSFER_ENDPOINT = `${API_FULL_URL}/api/transfer`;

export interface TransferRequestItem {
  srcPlaylistID: string;
  srcPlatform: Platform;
  destPlatform: Platform;
}

export interface TransferQueueResponse {
  ids: string[];
  failed_ids: string[];
  status: state | string;
}

export class PlaylistTransferError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, options?: { status?: number; details?: unknown }) {
    super(message);
    this.name = "PlaylistTransferError";
    this.status = options?.status;
    this.details = options?.details;
  }
}

export const buildTransferPayload = (
  playlists: Playlist[],
  destination: Platform
): TransferRequestItem[] => {
  return playlists.map((playlist) => ({
    srcPlaylistID: playlist.id,
    srcPlatform: playlist.platform,
    destPlatform: destination
  }));
};

export const commitPendingPlaylists = async (
  playlists: Playlist[],
  destination: Platform
): Promise<TransferQueueResponse | void> => {
  if (playlists.length === 0) {
    return;
  }

  const token = localStorage.getItem("token");
  if (!token)
    throw new PlaylistTransferError("Missing authentication token");


  const payload = buildTransferPayload(playlists, destination);

  const response = await fetch(TRANSFER_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let details: unknown;
    try {
      details = await response.json();
    } catch (error) {
      details = undefined;
    }
    throw new PlaylistTransferError("Failed to commit playlist transfer", {
      status: response.status,
      details
    });
  }

  try {
    return await response.json();
  } catch (error) {
    return;
  }
};
