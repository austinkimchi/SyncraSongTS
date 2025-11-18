import Platform from "./platform";
import { state as PlaylistStatus } from "./status";

export interface Playlist {
  id: string;
  name: string;
  trackCount: number;
  isPublic: boolean;
  description?: string;
  image?: string;
  href: string;
  platform: Platform;
  owner?: string;
  status: PlaylistStatus;
}

export interface PlaylistCollectionProps {
  playlists: Playlist[];
  platform?: Platform;
  status?: PlaylistStatus;
  onAdd?: (playlist: Playlist) => void;
  onRemove?: (playlist: Playlist) => void;
  isPending?: (playlist: Playlist) => boolean;
}
