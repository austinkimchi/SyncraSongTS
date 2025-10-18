import { Platform } from "./platform";
import { state as PlaylistStatus } from "./status";

export interface Playlist {
  id: string;
  name: string;
  image?: string;
  trackCount: number;
  description?: string;
  isPublic: boolean;
  href: string;
  platform: string;
  owner: string;
  status: PlaylistStatus;
}

export interface PlaylistCollectionProps {
  playlists: Playlist[];
  provider?: Platform;
  status?: PlaylistStatus;
  onAdd?: (playlist: Playlist) => void;
  onRemove?: (playlist: Playlist) => void;
}
