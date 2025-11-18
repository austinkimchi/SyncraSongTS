import React from "react";
import PlaylistCard from "./PlaylistCard";
import { PlaylistCollectionProps } from "../types/playlist";

const PlaylistCollection: React.FC<PlaylistCollectionProps> = ({
  playlists,
  platform,
  onAdd,
  onRemove,
  isPending,
}) => {
  return (
    <>
      {playlists?.map((pl) => (
        <div
          key={pl.id}
          className={`${isPending?.(pl) ? "opacity-50 drag-none!" : ""
            }`}>
          <PlaylistCard
            key={pl.id}
            data={{ ...pl, platform: platform ?? pl.platform }}
            onAdd={onAdd}
            onRemove={onRemove}
          /></div>
      ))}
    </>
  );
};

export default PlaylistCollection;