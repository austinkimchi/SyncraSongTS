import React from "react";
import { Playlist } from "../types/playlist";
import PlaceholderNoImage from "../assets/placeholders/300x300-noimage.png";
import { useDrag, DragSourceMonitor } from "react-dnd";
import "../css/PlaylistComponent.css";

interface PlaylistComponentProps extends Playlist {
  onAdd?: (pl: Playlist) => void;
  onRemove?: (id: string) => void;
}

const PlaylistComponent: React.FC<PlaylistComponentProps> = ({
  id,
  name,
  image,
  trackLength,
  description,
  isPublic,
  href,
  source,
  status,
  onAdd,
  onRemove,
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: status === "pending" ? "DRAG_FROM_PENDING" : "DRAG_FROM_PROVIDER",
    item: { id, name, image, trackLength, status, source, description },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const handleClick = () => {
    if (status === "pending" && onRemove) onRemove(id);
    if (status !== "pending" && onAdd) onAdd({
      id,
      name,
      image,
      trackLength,
      description,
      href,
      isPublic,
      source,
      status,
    });
  };

  return (
    <div
      ref={drag}
      className={`playlist-component ${source === "spotify" ? "spotify-gradient" : "apple-gradient"
        }`}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: "pointer",
      }}
      onClick={handleClick}
    >
      <img
        src={image || PlaceholderNoImage}
        alt={name}
        className="playlist-image"
      />
      <div className="playlist-info">
        <h3 className="playlist-title">{name}</h3>
        <p className="playlist-song-count">{trackLength} songs</p>
      </div>
    </div>
  );
};

export default PlaylistComponent;
