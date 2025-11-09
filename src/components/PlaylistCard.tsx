import React from "react";
import { Playlist } from "../types/playlist";
import PlaceholderNoImage from "../assets/placeholders/300x300-noimage.png";
import { useDrag, DragSourceMonitor } from "react-dnd";
import { state } from "../types/status";

import "../css/PlaylistCard.css";

interface PlaylistComponentProps {
  data: Playlist;
  onAdd?: (pl: Playlist) => void;
  onRemove?: (pl: Playlist) => void;
}

const PlaylistCard: React.FC<PlaylistComponentProps> = ({
  data: { id, name, image, trackCount, platform, status, description, isPublic, href },
  onAdd,
  onRemove,
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: status === state.QUEUED ? "DRAG_FROM_PENDING" : "DRAG_FROM_PROVIDER",
    item: { id, name, image, trackCount, status, platform, description },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const handleClick = () => {
    if (status === state.QUEUED && onRemove)
      onRemove({ id, name, image, trackCount, description, isPublic, href, platform, owner: "", status });
  };

  return (
    <div
      ref={drag}
      className={`playlist-component ${platform}-gradient ${isDragging ? "opacity-50" : "opacity-100"}`}
      onClick={handleClick} // On click will opened detailed view, future feature
      data-testid={`playlist-card-${id}`}
    >
      {(status === state.PROCESSING || status === state.QUEUED) && (
        <div className="playlist-status-badge playlist-status-badge--processing">
          <span className="playlist-status-spinner" aria-hidden="true" />
          <span>Transferring…</span>
        </div>
      )}
      {status === state.SUCCESS && (
        <div className="playlist-status-badge playlist-status-badge--success">Transfer complete</div>
      )}
      {status === state.ERROR && (
        <div className="playlist-status-badge playlist-status-badge--error">Transfer failed</div>
      )}
      <div>
        <img
          src={image || PlaceholderNoImage}
          alt={name}
          className="playlist-image aspect-square object-cover"
        />


        <h3 className={`h-10 wrap-break-word text-pretty text-sm font-medium max-w-full text-black line-clamp-2`}>
          {name}
        </h3>
      </div>

      <p className="playlist-song-count">{trackCount} songs</p>
    </div>


  );
};

export default PlaylistCard;
