import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { useDrop } from "react-dnd";

import PlaylistCollection from "./PlaylistCollection";
import type { Playlist } from "../types/playlist";
import Platform, { getPlatformLogo, getPlatformDisplayName } from "../types/platform";
import { state } from "../types/status";
import type { IPlatformClient } from "../data/clients/IPlatformClient";

import "../css/PlaylistSection.css";

const providerKey = (p: Platform): "apple" | "spotify" =>
  p === Platform.APPLE_MUSIC ? "apple" : "spotify";

interface Props {
  platform: Platform;
  client: IPlatformClient | null;
  demoPlaylists: Playlist[];
  isDemoMode: boolean;
  status: number;
  onStatusChange: (status: number) => void;
  onAddToPending: (playlist: Playlist, destination: Platform) => void;
  hidePlaylists?: boolean;
  children?: React.ReactNode;
}

const PlaylistSection: React.FC<Props> = ({
  platform,
  client,
  demoPlaylists,
  isDemoMode,
  status,
  onStatusChange,
  onAddToPending,
  hidePlaylists = false,
  children,
}) => {
  const [{ isOver, canDrop }, drop] = useDrop<Playlist, void, any>(() => ({
    accept: ["DRAG_FROM_PROVIDER"],
    canDrop: (pl) => pl.platform !== platform,
    drop: (pl) => onAddToPending(pl, platform),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const platforms = useMemo(() => Object.values(Platform), []);

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasBootstrappedRef = useRef(false);
  const previousStatusRef = useRef(status);
  const cacheKey = useMemo(() => `${providerKey(platform)}-playlists`, [platform]);

  const isLoggedIn = !!localStorage.getItem("token");

  const loadFromCache = useCallback(() => {
    const cache = localStorage.getItem(cacheKey);
    if (!cache) return false;

    try {
      const { items, lastUpdated: cachedLastUpdated } = JSON.parse(cache);
      if (!cachedLastUpdated) return false;

      const lastUpdatedDate = new Date(cachedLastUpdated);
      const oneHourAgo = Date.now() - 1000 * 60 * 60;
      if (lastUpdatedDate.getTime() < oneHourAgo) return false;

      setPlaylists(items);
      setLastUpdated(lastUpdatedDate);
      return true;
    } catch {
      return false;
    }
  }, [cacheKey]);

  const deriveStatusCode = (err: unknown): number => {
    if (typeof err === "number") return err;
    if (typeof err === "object" && err && "status" in err) {
      const statusCode = Number((err as { status?: number }).status);
      return Number.isFinite(statusCode) ? statusCode : 500;
    }
    if (err instanceof Error) {
      const match = err.message.match(/\b(4\d{2}|5\d{2})\b/);
      if (match) return Number(match[0]);
      if (/401/.test(err.message)) return 401;
    }
    return 500;
  };

  const fetchPlaylists = useCallback(async () => {
    if (!client) return;
    setIsRefreshing(true);
    try {
      const { items } = await client.getUserPlaylists({ limit: 50 });
      setPlaylists(items);
      const now = new Date();
      setLastUpdated(now);
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ items, lastUpdated: now.toISOString() })
      );
      onStatusChange(200);
    } catch (err) {
      const statusCode = deriveStatusCode(err);
      onStatusChange(statusCode);
      console.error(`Failed to fetch playlists for ${platform}:`, err);
    } finally {
      setIsRefreshing(false);
    }
  }, [cacheKey, client, onStatusChange, platform]);

  useEffect(() => {
    hasBootstrappedRef.current = false;
  }, [client, isDemoMode, cacheKey]);

  useEffect(() => {
    if (!isDemoMode) return;
    setPlaylists(demoPlaylists.map((pl) => ({ ...pl })));
    setLastUpdated(null);
    onStatusChange(200);
  }, [demoPlaylists, isDemoMode, onStatusChange]);

  useEffect(() => {
    if (isDemoMode || !client || hasBootstrappedRef.current) return;

    const bootstrapped = loadFromCache();
    hasBootstrappedRef.current = true;
    if (!bootstrapped && status === 200) {
      fetchPlaylists();
    }
  }, [client, fetchPlaylists, isDemoMode, loadFromCache, status]);

  useEffect(() => {
    if (isDemoMode || !client) return;
    if (status === 200 && previousStatusRef.current !== 200) {
      fetchPlaylists();
    }
    previousStatusRef.current = status;
  }, [client, fetchPlaylists, isDemoMode, status]);

  const displayPlaylists = hidePlaylists ? [] : playlists;

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
          {platforms.map(
            (p) =>
              p !== platform && (
                <MenuItem key={p} onClick={handleClose}>
                  <ListItemIcon>
                    <img
                      src={getPlatformLogo(p as Platform)}
                      alt={`${p} logo`}
                      className="w-6 h-6"
                    />
                  </ListItemIcon>
                  <ListItemText>{getPlatformDisplayName(p as Platform)}</ListItemText>
                </MenuItem>
              )
          )}
        </Menu>

        <div className="flex flex-column ml-auto text-right">
          {lastUpdated && (
            <small className="align-center text-left ml-auto">
              Last updated: <br />
              {lastUpdated.toLocaleString()}
            </small>
          )}

          {isLoggedIn && !isDemoMode && (
            <Button
              variant="outlined"
              size="small"
              fullWidth={false}
              onClick={fetchPlaylists}
              disabled={isRefreshing}
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          )}
        </div>
      </header>

      <PlaylistCollection
        playlists={displayPlaylists}
        status={state.PENDING}
        onAdd={(pl) => onAddToPending(pl, platform)}
        onRemove={() => undefined}
      />
      {children}
    </div>
  );
};

export default PlaylistSection;

