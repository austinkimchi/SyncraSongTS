const statusValues = ["queued", "processing", "success", "error"] as const;
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
  provider?: string;
  status?: PlaylistStatus;
  onRemove?: (id: string) => void;
}
