import { TRANSFER_ENDPOINT, PlaylistTransferError } from "./playlistTransfer";
import { state } from "../types/status";

export interface TransferStatusResponse {
  id: string;
  status: state | string;
  srcPlaylistID?: string;
  destPlaylistID?: string;
  error?: string;
  [key: string]: unknown;
}

const normalizeStatus = (value: string | state | undefined): state | undefined => {
  if (!value) return undefined;
  const lowerValue = typeof value === "string" ? value.toLowerCase() : value;
  switch (lowerValue) {
    case state.QUEUED:
      return state.QUEUED;
    case state.PROCESSING:
      return state.PROCESSING;
    case state.SUCCESS:
      return state.SUCCESS;
    case state.ERROR:
      return state.ERROR;
    default:
      return undefined;
  }
};

export const getTransferStatus = async (transferId: string): Promise<TransferStatusResponse> => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new PlaylistTransferError("Missing authentication token");
  }

  const response = await fetch(`${TRANSFER_ENDPOINT}/${transferId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new PlaylistTransferError("Failed to fetch transfer status", {
      status: response.status,
    });
  }

  const data = (await response.json()) as TransferStatusResponse;
  const normalised = normalizeStatus(data.status);
  return {
    ...data,
    status: normalised ?? data.status,
  };
};

export { normalizeStatus };
