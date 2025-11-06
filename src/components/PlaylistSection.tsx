import React, { useState, useMemo } from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import PlaylistCollection from "./PlaylistCollection";
import { Playlist } from "../types/playlist";
import { useDrop } from "react-dnd";
import "../css/PlaylistSection.css";

import Platform, { getPlatformLogo, getPlatformDisplayName } from "../types/platform";
import { state } from "../types/status";

interface PlaylistSectionProps {
  playlists: Playlist[];
  platform: Platform;
  side: "left" | "right";
  lastUpdated?: Date | null;
  onRefresh: () => void;
  onAddToPending: (p: Playlist, destination: { platform: Platform; side: "left" | "right" }) => void;
  onChangePlatform: (p: Platform) => void;
  linked: boolean;
  needsScopeUpdate?: boolean;
  onConnect: () => void;
  onReauthorize: () => void;
  children?: React.ReactNode;
}

const PlaylistSection: React.FC<PlaylistSectionProps> = ({
  platform,
  side,
  playlists,
  lastUpdated,
  onRefresh,
  onAddToPending,
  onChangePlatform,
  children,
  linked,
  needsScopeUpdate,
  onConnect,
  onReauthorize,
}) => {
  const [{ isOver, canDrop }, drop] = useDrop<Playlist, void, any>(
    () => ({
      accept: ["DRAG_FROM_PROVIDER"],
      canDrop: (pl) => pl.platform !== platform,
      drop: (pl) => onAddToPending(pl, { platform, side }),
      collect: (m) => ({ isOver: m.isOver(), canDrop: m.canDrop() }),
    }),
    [platform, side, onAddToPending],
  );

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const platforms = useMemo(() => Object.values(Platform), []);

  return (
    <div ref={drop} className={`playlist-section ${isOver && canDrop ? "over" : ""} p-4`}>
      <header className="provider-header">
        <div
          className="flex items-center gap-2 border-2 rounded-[8px] border-gray-300 pb-1 p-2 w-[100%] lg:w-[40%] justify-between cursor-pointer"
          onClick={handleOpen}
        >
          <div className="flex items-center gap-2">
            <img
              src={getPlatformLogo(platform)}
              alt={`${platform} logo`}
              className="w-[50px] aspect-square p-0"
            />
            <h2 className="font-bold text-base lg:text-l text-nowrap">
              {getPlatformDisplayName(platform)}
            </h2>
          </div>
          <div className="border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8" />
        </div>

        <Menu
          id="platform-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
        >
          {platforms
            .filter((p) => p !== platform)
            .map((p) => (
              <MenuItem
                key={p}
                onClick={() => {
                  onChangePlatform(p as Platform);
                  handleClose();
                }}
              >
                <ListItemIcon>
                  <img src={getPlatformLogo(p as Platform)} alt={`${p} logo`} className="w-6 h-6" />
                </ListItemIcon>
                <ListItemText>{getPlatformDisplayName(p as Platform)}</ListItemText>
              </MenuItem>
            ))}
        </Menu>

        <div className="flex flex-column ml-auto gap-1 items-end">
          {lastUpdated && (
            <small className="align-center text-left ml-auto">
              Last updated:<br />
              {lastUpdated.toLocaleString()}
            </small>
          )}

          {!linked ? (
            <Button variant="contained" size="small" onClick={onConnect}>
              Connect {getPlatformDisplayName(platform)}
            </Button>
          ) : needsScopeUpdate ? (
            <Button variant="contained" size="small" onClick={onReauthorize}>
              Reauthorize {getPlatformDisplayName(platform)}
            </Button>
          ) : (
            <Button variant="outlined" size="small" onClick={onRefresh}>
              Refresh
            </Button>
          )}
        </div>
      </header>

      <PlaylistCollection
        playlists={playlists}
        platform={platform}
        status={state.PENDING}
        onAdd={(pl) => onAddToPending(pl, { platform, side })}
        onRemove={() => { }}
      />

      {children}
    </div>
  );
};

export default PlaylistSection;