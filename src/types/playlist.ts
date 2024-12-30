export interface Playlist {
  id: string;
  name: string;
  image?: string;
  trackLength: number;
  description?: string;
  isPublic: boolean;
  href: string;
  source: string;
  status: "provider" | "pending";
}

export interface PlaylistCollectionProps {
  playlists: Playlist[];
  provider?: string;
  status: "provider" | "pending";
  onRemove?: (id: string) => void;
}
