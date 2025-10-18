import React from "react";
import { Playlist } from "../types/playlist";
import PlaceholderNoImage from "../assets/placeholders/300x300-noimage.png";
import { useDrag, DragSourceMonitor } from "react-dnd";
import { Platform } from "../types/platform";
import "../css/PlaylistComponent.css";
import { state } from "../types/status";

interface PlaylistComponentProps extends Playlist {
  onAdd?: (pl: Playlist) => void;
  onRemove?: (pl: Playlist) => void;
}

const PlaylistComponent: React.FC<PlaylistComponentProps> = ({
  id,
  name,
  image,
  trackCount,
  description,
  isPublic,
  href,
  platform,
  status,
  onAdd,
  onRemove,
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: status === state.PENDING ? "DRAG_FROM_PENDING" : "DRAG_FROM_PROVIDER",
    item: { id, name, image, trackCount, status, platform, description },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const handleClick = () => {
    if (status === state.PENDING && onRemove)
      onRemove({ id, name, image, trackCount, description, isPublic, href, platform, owner: "", status });
    // if (status !== state.PENDING && onAdd)
    //   onAdd({ id, name, image, trackCount, description, isPublic, href, platform, owner: "", status });
  };

  return (
    <div
      ref={drag}
      className={`playlist-component whitespace-nowrap ${platform === Platform.SPOTIFY ? "spotify-gradient" : "apple-gradient"}`}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: "pointer",
      }}
      onClick={handleClick}
    // onClick will show detailed view of playlist in future update
    >
      <div>
        <img
          src={image || PlaceholderNoImage}
          alt={name}
          className="playlist-image aspect-square object-cover"
        />


        <h3 className="whitespace-break-spaces text-pretty text-sm font-medium max-w-full text-black line-clamp-2">
          {name}{'\n\n'}
        </h3>
      </div>

      <p className="playlist-song-count">{trackCount} songs</p>
    </div>


  );
};

export default PlaylistComponent;
