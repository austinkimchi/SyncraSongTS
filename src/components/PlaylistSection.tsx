import React, { useState } from "react";
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import PlaylistCollection from "./PlaylistCollection";
import { Playlist } from "../types/playlist";
import { useDrop } from "react-dnd";
import "../css/PlaylistSection.css";

import Platform, { getPlatformLogo, getPlatformDisplayName } from "../types/platform";
import { state } from "../types/status";

const loggedIn = !!localStorage.getItem("token");

interface PlaylistSectionProps {
  playlists: Playlist[];
  platform: Platform;
  lastUpdated?: Date | null;
  onRefresh: () => void;
  onAddToPending: (p: Playlist, destination: Platform) => void;
  children?: React.ReactNode; // For pending section
}

const PlaylistSection: React.FC<PlaylistSectionProps> = ({
  platform,
  playlists,
  lastUpdated,
  onRefresh,
  onAddToPending
}) => {
  const [{ isOver, canDrop }, drop] = useDrop<Playlist, void, any>(() => ({
    accept: ["DRAG_FROM_PROVIDER"],
    canDrop: (pl) => pl.platform !== platform,
    drop: (pl) => onAddToPending(pl, platform),
    collect: (m) => ({ isOver: m.isOver(), canDrop: m.canDrop() }),
  }));

  // Dropdown (MUI Menu) anchor + handlers
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const platforms = Object.values(Platform);

  return (
    <div ref={drop} className={`playlist-section ${isOver && canDrop ? "over" : ""} p-4`}>
      <header className="provider-header">
        <div className="flex items-center gap-2 border-2 rounded-[8px] border-gray-300 pb-1 p-2 w-[100%] lg:w-[40%] justify-between cursor-pointer" onClick={handleOpen}>
          <div className="flex items-center gap-2">
            <img src={getPlatformLogo(platform)}
              alt={`${platform} logo`}
              className="w-[50px] aspect-square p-0" />

            <h2 className="font-bold text-base lg:text-l text-nowrap">
              {getPlatformDisplayName(platform)}
            </h2>
          </div>

          {/* Down Arrow */}
          <div className="border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8">
          </div>
        </div>
        <Menu
          id="platform-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
        >
          {platforms.map((p) => (p !== platform) && (
            <MenuItem key={p} onClick={handleClose}>
              <ListItemIcon>
                <img src={getPlatformLogo(p as Platform)} alt={`${p} logo`} className="w-6 h-6" />
              </ListItemIcon>
              <ListItemText>{getPlatformDisplayName(p as Platform)}</ListItemText>
            </MenuItem>
          )
          )}
        </Menu>


        <div className="flex flex-column ml-auto">
          {lastUpdated && (
            <small className="align-center text-left ml-auto" >
              Last updated: {""} <br />
              {lastUpdated.toLocaleString()}
            </small>
          )}

          {loggedIn && (
            <Button variant="outlined" size="small" fullWidth={false} onClick={onRefresh}>
              Refresh
            </Button>
          )}
        </div>

      </header>

      <PlaylistCollection
        playlists={playlists}
        status={state.PENDING}
        onAdd={(pl) => onAddToPending(pl, platform)}
        onRemove={() => { }}
      />
    </div>
  );
};

export default PlaylistSection;
