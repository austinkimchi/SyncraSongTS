import { Providers } from "./provider";

const statusValues = ["pending", "processing", "success", "error"] as const;
type PlaylistStatus = typeof statusValues[number];

export interface Playlist {
  id: string;
  name: string;
  image?: string;
  trackLength: number;
  description?: string;
  isPublic: boolean;
  href: string;
  source: string;
  status: PlaylistStatus;
}

export interface PlaylistCollectionProps {
  playlists: Playlist[];
  provider?: Providers;
  status?: PlaylistStatus;
  onAdd?: (playlist: Playlist) => void;
  onRemove?: (id: string) => void;
}
