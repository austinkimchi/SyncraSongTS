import React from "react";
import PlaylistCard from "./PlaylistCard";
import { PlaylistCollectionProps } from "../types/playlist";

const PlaylistCollection: React.FC<PlaylistCollectionProps> = ({
  playlists,
  platform,
  onRemove,
}) => {
  return (
    <>
      {playlists?.map((pl) => (
        <PlaylistCard
          key={pl.id}
          data={{ ...pl, platform: platform ?? pl.platform }}
          onRemove={onRemove}
        />
      ))}
    </>
  );
};

export default PlaylistCollection;