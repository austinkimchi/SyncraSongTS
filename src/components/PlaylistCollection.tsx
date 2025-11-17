import React from "react";
import PlaylistCard from "./PlaylistCard";
import { PlaylistCollectionProps } from "../types/playlist";

const PlaylistCollection: React.FC<PlaylistCollectionProps> = ({
  playlists,
  platform,
  onRemove,
  onAdd,
}) => {
  return (
    <div className="grid playlist-collection display-grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-4">
      {playlists?.map((pl) => (
        <PlaylistCard
          key={pl.id}
          data={{ ...pl, platform: platform ?? pl.platform }}
          onAdd={onAdd}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

export default PlaylistCollection;