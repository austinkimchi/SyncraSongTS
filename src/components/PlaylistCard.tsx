import React from "react";
import { Playlist } from "../types/playlist";
import PlaceholderNoImage from "../assets/placeholders/300x300-noimage.png";
import { useDrag, DragSourceMonitor } from "react-dnd";
import { state } from "../types/status";
import completeLogo from "../assets/images/synced_button.svg";
import removeButton from "../assets/images/remove_button.svg";

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
    type: status === state.PENDING ? "DRAG_FROM_PENDING" : "DRAG_FROM_PROVIDER",
    item: { id, name, image, trackCount, status, platform, description },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const handleClick = () => {
    if (status !== state.PENDING && onAdd) {
      onAdd({ id, name, image, trackCount, description, isPublic, href, platform, owner: "", status });
    }
    if (status === state.PENDING && onRemove) {
      onRemove({ id, name, image, trackCount, description, isPublic, href, platform, owner: "", status });
    }
  };

  const handleRemoveClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (onRemove) {
      onRemove({ id, name, image, trackCount, description, isPublic, href, platform, owner: "", status });
    }
  };

  return (
    <div
      ref={drag}
      className={`playlist-component flex flex-row lg:flex-col align-center text-center p-[8px] lg:p-[14px] rounded-md cursor-grab select-none ${platform}-gradient ${isDragging ? "opacity-50" : "opacity-100"}`}
      onClick={handleClick} // On click will opened detailed view, future feature
      data-testid={`playlist-card-${id}`}
    >
      {status === state.PENDING && (
        <button
          type="button"
          className="playlist-status-badge playlist-status-badge--remove"
          onClick={handleRemoveClick}
          aria-label={`Remove ${name} from transfer queue`}
        >
          <img src={removeButton} alt="Remove playlist from queue" className="w-[25px] h-[25px]" />
        </button>
      )}
      {status === state.PROCESSING && (
        <div className="playlist-status-badge playlist-status-badge--processing">
          <span className="playlist-status-spinner" aria-hidden="true" />
        </div>
      )}
      {status === state.SUCCESS && (
        <div className="playlist-status-badge">
          <img
            src={completeLogo}
            width="25px"
            alt="Transfer Complete"
            className="w-[12px] lg:w-[25px]"
          />
        </div>
      )}
      {status === state.ERROR && (
        <div className="playlist-status-badge">Transfer failed</div>
      )}

      <img
        src={image || PlaceholderNoImage}
        alt={name}
        className="w-12 h-12 lg:w-[100%] lg:h-auto rounded-md mb-[4px] aspect-square object-cover select-none drag-none"
      />

      <div className="self-center pl-1 text-left lg:text-center">
        <p className={`line-clamp-2 leading-none text-sm font-extrabold text-black overflow-hidden text-clip lg:mt-2 lg:line-clamp-1`}>
          {name}
        </p>
        <p className="playlist-song-count text-black text-sm">{trackCount} songs</p>
      </div>
    </div>


  );
};

export default PlaylistCard;
