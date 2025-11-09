import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import DarkLogo from "./assets/logo/logo-dark.svg";

// Components
import PlaylistSection from "./components/PlaylistSection";
import PendingSection from "./components/PendingSection";
import Account from "./components/Account";
import CreateAccountModal from "./components/CreateAccountModal";

// Types & helpers
import type { Playlist } from "./types/playlist";
import Platform, { getPlatformOAuthFunction } from "./types/platform";
import { state } from "./types/status";
import { } from "./handler/callback"; // runs on import
import { } from "./auth/providerStorage"; // runs on import

import { DEMO_PLAYLISTS_APPLE, DEMO_PLAYLISTS_SPOTIFY, DEMO_PLAYLISTS_SOUNDCLOUD } from "./data/demoPlaylists";
import { getClient } from "./handler/getClient";
import { commitPendingPlaylists } from "./handler/playlistTransfer";
import { getTransferStatus, normalizeStatus } from "./handler/transferStatus";

import { useLinkedStatus } from "./auth/useLinkedStatus";
import { emitAuthChanged } from "./auth/emitAuthChanged";
import {
  PendingAccountInfo,
  getPendingAccount,
  subscribeToPendingAccount,
} from "./handler/pendingAccount";

import "./css/App.css";

interface TransferJob {
  id: string;
  playlist: Playlist;
  destination: Platform;
  status: state;
  pollable: boolean;
}

const App: React.FC = () => {
  // Platform left/right panels
  const [leftPanelPlatform, setLeftPanelPlatform] = useState<Platform>(Platform.APPLE_MUSIC);
  const [rightPanelPlatform, setRightPanelPlatform] = useState<Platform>(Platform.SPOTIFY);

  // Playlists keyed by platform
  const [playlists, setPlaylists] = useState<Partial<Record<Platform, Playlist[]>>>({});
  const [lastUpdated, setLastUpdated] = useState<Partial<Record<Platform, Date>>>({});

  // Pending playlists
  const [pendingTarget, setPendingTarget] = useState<{ side: "left" | "right"; platform: Platform } | null>(null);
  const [pendingPlaylists, setPendingPlaylists] = useState<Playlist[]>([]);
  const [transferJobs, setTransferJobs] = useState<TransferJob[]>([]);
  const transferJobsRef = useRef<TransferJob[]>([]);

  // Account creation modal state
  const [pendingAccount, setPendingAccount] = useState<PendingAccountInfo | null>(() => getPendingAccount());
  const [showCreateAccount, setShowCreateAccount] = useState<boolean>(() => getPendingAccount() !== null);

  // Derived auth state
  const [hasToken, setHasToken] = useState<boolean>(() => !!localStorage.getItem("token"));
  const isDemoMode = !hasToken;

  // --- Auth + pending account events ---
  useEffect(() => {
    const handlePendingAccountChange = () => {
      const info = getPendingAccount();
      setPendingAccount(info);
      setShowCreateAccount(!!info);
    };

    const unsubscribe = subscribeToPendingAccount(handlePendingAccountChange);
    window.addEventListener("auth-changed", handlePendingAccountChange);
    handlePendingAccountChange();

    return () => {
      unsubscribe();
      window.removeEventListener("auth-changed", handlePendingAccountChange);
    };
  }, []);

  // Fetch playlists
  const fetchPlaylists = useCallback(async (platform: Platform, options?: { force?: boolean }) => {
    try {
      const client = getClient(platform);
      if (!client) return;

      const loggedIn = await client.isLoggedIn().catch(() => false);
      if (!loggedIn) return;

      const res = await client.getUserPlaylists({ fetch: !!options?.force });
      setPlaylists((prev) => ({ ...prev, [platform]: res.playlists }));
      setLastUpdated((prev) => ({ ...prev, [platform]: res.updatedAt.toLocaleString('en-US') }));
    } catch (err) {
      console.error(`Failed to fetch playlists for ${platform}`, err);
    }
  }, []);

  useEffect(() => {
    transferJobsRef.current = transferJobs;
  }, [transferJobs]);

  // Demo mode/real data toggle
  useEffect(() => {
    if (isDemoMode) {
      setPlaylists({
        [Platform.APPLE_MUSIC]: DEMO_PLAYLISTS_APPLE,
        [Platform.SPOTIFY]: DEMO_PLAYLISTS_SPOTIFY,
        [Platform.SOUNDCLOUD]: DEMO_PLAYLISTS_SOUNDCLOUD
      });
      setLastUpdated({});
      setPendingTarget(null);
      setPendingPlaylists([]);
      return;
    }

    // Real data
    setPlaylists({});
    setPendingTarget(null);
    const platformsToFetch = new Set<Platform>([leftPanelPlatform, rightPanelPlatform]);
    platformsToFetch.forEach((platform) => {
      fetchPlaylists(platform)
    });
  }, [isDemoMode, fetchPlaylists, leftPanelPlatform, rightPanelPlatform]);

  // Pending helpers
  const addToPending = useCallback((pl: Playlist, destination: { side: "left" | "right"; platform: Platform }) => {
    setPendingPlaylists((prev) => { return (prev.some((p) => p.id === pl.id) ? prev : [...prev, { ...pl, status: state.QUEUED }]) });
    setPendingTarget(destination);
  }, []);

  const removeFromPending = useCallback((pl: Playlist) => {
    setPendingPlaylists((prev) => {
      const next = prev.filter((p) => p.id !== pl.id);
      if (next.length === 0) {
        setPendingTarget(null);
      }
      return next;
    });
  }, []);

  const cancelPending = useCallback(() => {
    setPendingPlaylists([]);
    setPendingTarget(null);
  }, []);

  const commitPendingTransfers = useCallback(async () => {
    if (!pendingTarget || pendingPlaylists.length === 0) {
      return;
    }

    const refreshPlatforms = new Set<Platform>([pendingTarget.platform]);
    pendingPlaylists.forEach((playlist) => {
      refreshPlatforms.add(playlist.platform);
    });

    try {
      const response = await commitPendingPlaylists(pendingPlaylists, pendingTarget.platform);

      const failedSet = new Set(response?.failed_ids ?? []);
      const queuedIds = response?.ids ?? [];
      let queuedIndex = 0;

      const newJobs = pendingPlaylists.map<TransferJob>((playlist) => {
        const destinationPlaylist: Playlist = {
          ...playlist,
          platform: pendingTarget.platform,
          status: failedSet.has(playlist.id) ? state.ERROR : state.PROCESSING,
        };

        if (failedSet.has(playlist.id)) {
          return {
            id: `${playlist.id}-failed-${Date.now()}`,
            playlist: destinationPlaylist,
            destination: pendingTarget.platform,
            status: state.ERROR,
            pollable: false,
          };
        }

        const jobId = queuedIds[queuedIndex];
        const hasTransferId = typeof jobId === "string" && jobId.length > 0;
        if (hasTransferId) {
          queuedIndex += 1;
        }

        return {
          id: hasTransferId ? jobId : `${playlist.id}-${Date.now()}`,
          playlist: destinationPlaylist,
          destination: pendingTarget.platform,
          status: state.PROCESSING,
          pollable: hasTransferId,
        };
      });

      setTransferJobs((prev) => [...prev, ...newJobs]);
      cancelPending();
      refreshPlatforms.forEach((platform) => {
        fetchPlaylists(platform, { force: true });
      });
    } catch (error) {
      console.error("Failed to commit pending playlists", error);
    }
  }, [pendingTarget, pendingPlaylists, cancelPending, fetchPlaylists]);

  const getPlaylistsForPlatform = useCallback((platform: Platform) => {
    const platformPlaylists = playlists[platform] ?? [];
    const transfersForPlatform = transferJobs
      .filter((job) => job.destination === platform)
      .map((job) => job.playlist);

    if (transfersForPlatform.length === 0) {
      return platformPlaylists;
    }

    const transferIds = new Set(transfersForPlatform.map((pl) => pl.id));
    const filteredPlaylists = platformPlaylists.filter((pl) => !transferIds.has(pl.id));
    return [...transfersForPlatform, ...filteredPlaylists];
  }, [playlists, transferJobs]);

  const leftPlaylists = useMemo(() => getPlaylistsForPlatform(leftPanelPlatform), [getPlaylistsForPlatform, leftPanelPlatform]);
  const rightPlaylists = useMemo(() => getPlaylistsForPlatform(rightPanelPlatform), [getPlaylistsForPlatform, rightPanelPlatform]);

  // Render helpers
  const pendingIsOnLeft = pendingTarget?.side === "left";
  const pendingIsOnRight = pendingTarget?.side === "right";

  const leftLink = useLinkedStatus(leftPanelPlatform);
  const rightLink = useLinkedStatus(rightPanelPlatform);

  const handleConnect = useCallback(async (platform: Platform) => {
    const client = getClient(platform);
    try {
      await getPlatformOAuthFunction(client.platform)();
      emitAuthChanged(platform);
      await fetchPlaylists(platform, { force: true });
    } catch (e) {
      console.error("connect failed", e);
    }
  }, [fetchPlaylists]);

  const handleReauthorize = useCallback(async (platform: Platform) => {
    const client = getClient(platform) as any;
    try {
      if (typeof client?.reauthorize === "function") {
        await client.reauthorize(); // optionally pass stronger scopes here
      } else {
        await client?.login(); // fallback
      }
      emitAuthChanged(platform);
      await fetchPlaylists(platform, { force: true });
    } catch (e) {
      console.error("reauthorize failed", e);
    }
  }, [fetchPlaylists]);

  useEffect(() => {
    const handleAuthChanged = (event: Event) => {
      console.log(event)
      const detail = (event as CustomEvent<{ platform?: Platform }>).detail;
      const tokenPresent = !!localStorage.getItem("token");
      setHasToken(tokenPresent);
      console.log("Auth changed, token present:", tokenPresent, "detail:", detail);
      if (!tokenPresent) {
        setPlaylists({});
        setLastUpdated({});
        setPendingPlaylists([]);
        setPendingTarget(null);
        return;
      }

      const platformsToRefresh = detail?.platform
        ? [detail.platform]
        : Array.from(new Set<Platform>([leftPanelPlatform, rightPanelPlatform]));

      platformsToRefresh.forEach((platform) => {
        fetchPlaylists(platform, { force: true }); // on login, force refresh.
      });
    };

    window.addEventListener("auth-changed", handleAuthChanged);
    return () => window.removeEventListener("auth-changed", handleAuthChanged);
  }, [fetchPlaylists, leftPanelPlatform, rightPanelPlatform]);

  useEffect(() => {
    setPendingTarget((prev) => (prev?.side === "left" ? { side: "left", platform: leftPanelPlatform } : prev));
  }, [leftPanelPlatform]);

  useEffect(() => {
    setPendingTarget((prev) => (prev?.side === "right" ? { side: "right", platform: rightPanelPlatform } : prev));
  }, [rightPanelPlatform]);

  useEffect(() => {
    if (!transferJobs.some((job) => job.pollable && job.status !== state.SUCCESS && job.status !== state.ERROR)) {
      return;
    }

    let cancelled = false;

    const pollTransfers = async () => {
      if (cancelled) {
        return;
      }

      const jobsToPoll = transferJobsRef.current.filter(
        (job) => job.pollable && job.status !== state.SUCCESS && job.status !== state.ERROR,
      );

      if (jobsToPoll.length === 0) {
        return;
      }

      const results = await Promise.all(
        jobsToPoll.map(async (job) => {
          try {
            const statusResponse = await getTransferStatus(job.id);
            const normalisedStatus = normalizeStatus(statusResponse.status);
            return {
              job,
              status: normalisedStatus ?? job.status,
            };
          } catch (pollError) {
            console.error(`Failed to poll transfer ${job.id}`, pollError);
            return {
              job,
              status: state.ERROR,
            };
          }
        }),
      );

      if (cancelled) {
        return;
      }

      const jobsWithStatusChanges = results.filter(({ job, status }) => job.status !== status);
      if (jobsWithStatusChanges.length === 0) {
        return;
      }

      setTransferJobs((prev) =>
        prev.map((job) => {
          const update = results.find((result) => result.job.id === job.id);
          if (!update) {
            return job;
          }

          const nextStatus = update.status;
          const nextPollable = nextStatus === state.PROCESSING || nextStatus === state.QUEUED;

          return {
            ...job,
            status: nextStatus,
            pollable: nextPollable,
            playlist: {
              ...job.playlist,
              status: nextStatus,
            },
          };
        }),
      );

      results.forEach(({ job, status }) => {
        if (status === state.SUCCESS) {
          fetchPlaylists(job.destination, { force: true });
          window.setTimeout(() => {
            setTransferJobs((prev) => prev.filter((existing) => existing.id !== job.id));
          }, 4000);
        }
      });
    };

    pollTransfers();
    const intervalId = window.setInterval(pollTransfers, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [transferJobs, fetchPlaylists]);

  // When a panel switches platform, proactively refresh its auth status
  useEffect(() => { leftLink.check(); }, [leftPanelPlatform]);
  useEffect(() => { rightLink.check(); }, [rightPanelPlatform]);
  return (
    <div data-testid="app-container">
      {isDemoMode && (
        <div className="demo-mode-banner p-2">
          <strong>Demo Mode:</strong> You are viewing demo playlists.
        </div>
      )}
      <nav className="navbar">
        <div className="flex-1" />
        <a href="#" className="flex-1 text-center m-0! place-items-center">
          <img src={DarkLogo} alt="logo" id="logo" className="w-32 h-i padding-0 align-center" />
        </a>
        <div className="flex flex-1 justify-end gap-[0.5rem]">
          <Account />
        </div>
      </nav>

      <div className="flex flex-row">
        <PlaylistSection
          platform={leftPanelPlatform}
          side="left"
          playlists={pendingIsOnLeft ? [] : leftPlaylists}
          lastUpdated={lastUpdated[leftPanelPlatform]}
          onRefresh={() => fetchPlaylists(leftPanelPlatform, { force: true })}
          onAddToPending={addToPending}
          onChangePlatform={(p) => {
            if (p === rightPanelPlatform) setRightPanelPlatform(leftPanelPlatform);
            setLeftPanelPlatform(p);
            setPendingPlaylists([]);
            setPendingTarget(null);
          }}
          linked={isDemoMode ? true : leftLink.status.linked}
          needsScopeUpdate={!!leftLink.status.needsScopeUpgrade}
          onConnect={() => handleConnect(leftPanelPlatform)}
          onReauthorize={() => handleReauthorize(leftPanelPlatform)}
        >
          {pendingIsOnLeft && (
            <PendingSection
              playlists={pendingPlaylists}
              onCommit={commitPendingTransfers}
              onRemoveAll={cancelPending}
              onRemove={removeFromPending}
            />
          )}
        </PlaylistSection>

        <PlaylistSection
          platform={rightPanelPlatform}
          side="right"
          playlists={pendingIsOnRight ? [] : rightPlaylists}
          lastUpdated={lastUpdated[rightPanelPlatform]}
          onRefresh={() => fetchPlaylists(rightPanelPlatform, { force: true })}
          onAddToPending={addToPending}
          onChangePlatform={(p) => {
            if (p === leftPanelPlatform) setLeftPanelPlatform(rightPanelPlatform);
            setRightPanelPlatform(p);
            setPendingPlaylists([]);
            setPendingTarget(null);
          }}
          linked={isDemoMode ? true : rightLink.status.linked}
          needsScopeUpdate={!!rightLink.status.needsScopeUpgrade}
          onConnect={() => handleConnect(rightPanelPlatform)}
          onReauthorize={() => handleReauthorize(rightPanelPlatform)}
        >
          {pendingIsOnRight && (
            <PendingSection
              playlists={pendingPlaylists}
              onCommit={commitPendingTransfers}
              onRemoveAll={cancelPending}
              onRemove={removeFromPending}
            />
          )}
        </PlaylistSection>
      </div>

      {showCreateAccount && pendingAccount && (
        <CreateAccountModal pendingAccount={pendingAccount} />
      )}
    </div>
  );
};

export default App;