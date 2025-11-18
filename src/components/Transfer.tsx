import React from "react";
import { useDrop } from "react-dnd";
import { useNavigate } from "react-router-dom";
import arrowBidirection from "../assets/images/arrow1.svg";
import arrowRight from "../assets/images/arrow_right.svg";
import refreshIcon from "../assets/icons/refresh.svg";
import { waitForProviders } from "../auth/providerStorage";
import PlaylistCollection from "./PlaylistCollection";
import { commitPendingPlaylists } from "../handler/playlistTransfer";
import { getTransferStatus } from "../handler/transferStatus";
import { usePlatformClient } from "../hooks/usePlatformClient";
import { loadTransferPlatforms, storeTransferPlatforms, TransferPlatforms } from "../hooks/useTransferPlatforms";
import Platform, { getPlatformDisplayName, getPlatformLogo } from "../types/platform";
import { Playlist } from "../types/playlist";
import { state } from "../types/status";
import PlaylistCard from "./PlaylistCard";

const DEFAULT_PLATFORMS: TransferPlatforms = {
    source: Platform.APPLE_MUSIC,
    target: Platform.SPOTIFY,
};

const platformAccentBackground: Record<Platform, string> = {
    [Platform.APPLE_MUSIC]: "bg-spotify",
    [Platform.SPOTIFY]: "bg-spotify",
    [Platform.SOUNDCLOUD]: "bg-spotify",
};

const normalisePlaylists = (playlists: Playlist[]): Playlist[] =>
    playlists.map((playlist) => ({
        ...playlist,
        status: playlist.status ?? state.NONE,
    }));

const Transfer: React.FC = () => {
    const navigate = useNavigate();
    const [platforms, setPlatforms] = React.useState<TransferPlatforms>(() =>
        loadTransferPlatforms(DEFAULT_PLATFORMS)
    );

    React.useEffect(() => {
        setPlatforms(loadTransferPlatforms(DEFAULT_PLATFORMS));
    }, []);

    const sourceClient = usePlatformClient(platforms.source);
    const targetClient = usePlatformClient(platforms.target);

    const [storedProviders, setStoredProviders] = React.useState<Platform[]>([]);
    const [libraryPlaylists, setLibraryPlaylists] =
        React.useState<Record<Platform, Playlist[]>>(
            {} as Record<Platform, Playlist[]>
        );
    const [loadingPlatforms, setLoadingPlatforms] =
        React.useState<Record<Platform, boolean>>(
            {} as Record<Platform, boolean>
        );
    const [pendingPlaylists, setPendingPlaylists] = React.useState<Playlist[]>([]);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    React.useEffect(() => {
        if (pendingPlaylists.length <= 0) { setArrowDirectionClass(""); }
    }, [pendingPlaylists]); // reset arrow direction when no pending playlists

    React.useEffect(() => {
        let isMounted = true;

        (async () => {
            const providers = await waitForProviders();
            if (isMounted) {
                setStoredProviders(providers);
            }
        })();

        return () => {
            isMounted = false;
        };
    }, []);

    const fetchPlaylists = React.useCallback(
        async (platform: Platform, client: ReturnType<typeof usePlatformClient>, fetch: boolean = false) => {
            if (!storedProviders.includes(platform)) {
                setLibraryPlaylists((current) => ({ ...current, [platform]: [] }));
                return;
            }

            setLoadingPlatforms((current) => ({ ...current, [platform]: true }));

            try {
                const { playlists } = await client.getUserPlaylists({ fetch });
                setLibraryPlaylists((current) => ({
                    ...current,
                    [platform]: normalisePlaylists(playlists),
                }));
            } catch (error) {
                console.error(`Failed to load playlists for ${platform}`, error);
                setLibraryPlaylists((current) => ({ ...current, [platform]: [] }));
            } finally {
                setLoadingPlatforms((current) => ({
                    ...current,
                    [platform]: false,
                }));
            }
        },
        [storedProviders]
    );

    React.useEffect(() => {
        fetchPlaylists(platforms.source, sourceClient);
        if (platforms.target !== platforms.source) {
            fetchPlaylists(platforms.target, targetClient);
        }
    }, [fetchPlaylists, platforms.source, platforms.target, sourceClient, targetClient]);

    const isMountedRef = React.useRef(true);

    React.useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Allow adding from either platform now
    const addPendingPlaylist = React.useCallback((playlist: Playlist) => {
        // set arrow direction based on source and target
        if (playlist.platform !== platforms.source)
            setArrowDirectionClass("rotate-180");
        else setArrowDirectionClass("rotate-0");

        setPendingPlaylists((current) => {
            if (current.some((pl) => pl.id === playlist.id)) return current;

            const queuedPlaylist = { ...playlist, status: state.PENDING };
            return [...current, queuedPlaylist];
        });
    }, []);

    const removePendingPlaylist = React.useCallback((playlist: Playlist) => {
        setPendingPlaylists((current) =>
            current.filter((pl) => pl.id !== playlist.id)
        );
    }, []);

    // Allow "Select All" from either platform
    const selectAllFromPlatform = (platform: Platform) => {
        const candidates = libraryPlaylists[platform] ?? [];
        candidates.forEach((pl) => {
            pl.platform = platform;
            addPendingPlaylist(pl);
        });
    };

    const pollTransferStatuses = React.useCallback(
        async (
            transferIds: string[] | undefined,
            transferPlaylists: Playlist[],
            targetPlatform: Platform,
            failedPlaylistIds: string[] | undefined
        ) => {
            if (!transferIds?.length) return;

            const POLL_INTERVAL_MS = 2000;

            const resolvePlaylist = (index: number): Playlist | undefined =>
                transferPlaylists[index];

            const updateSuccess = (playlist: Playlist) => {
                setPendingPlaylists((current) =>
                    current.filter((pl) => pl.id !== playlist.id)
                );

                setLibraryPlaylists((current) => {
                    const targetList = current[targetPlatform] ?? [];
                    const withoutPlaylist = targetList.filter(
                        (pl) => pl.id !== playlist.id
                    );
                    const updated = [
                        {
                            ...playlist,
                            platform: targetPlatform,
                            status: state.SUCCESS,
                        },
                        ...withoutPlaylist,
                    ];

                    return { ...current, [targetPlatform]: updated };
                });
            };

            const updateFailure = (playlist: Playlist) => {
                setPendingPlaylists((current) =>
                    current.map((pl) =>
                        pl.id === playlist.id
                            ? { ...pl, status: state.ERROR }
                            : pl
                    )
                );
            };

            await Promise.all(
                transferIds.map(async (transferId, index) => {
                    const playlist = resolvePlaylist(index);

                    if (!playlist) return;
                    if (failedPlaylistIds?.includes(playlist.id)) return;

                    while (true) {
                        try {
                            const statusResponse = await getTransferStatus(transferId);

                            if (statusResponse.status === state.SUCCESS) {
                                updateSuccess(playlist);
                                return;
                            }

                            if (statusResponse.status === state.ERROR) {
                                updateFailure(playlist);
                                return;
                            }
                        } catch (error) {
                            console.error(
                                `Failed to poll transfer status for ${transferId}`,
                                error
                            );
                        }

                        await new Promise((resolve) =>
                            setTimeout(resolve, POLL_INTERVAL_MS)
                        );
                    }
                })
            );
        },
        []
    );

    const onCommit = React.useCallback(async () => {
        if (pendingPlaylists.length === 0) return;

        const toCommit = pendingPlaylists;
        setIsSubmitting(true);
        setPendingPlaylists((current) =>
            current.map((pl) => ({
                ...pl,
                status: state.PROCESSING,
            }))
        );

        try {
            const targetPlatform =
                pendingPlaylists[0].platform === platforms.source
                    ? platforms.target
                    : platforms.source;
            const response = await commitPendingPlaylists(
                toCommit,
                targetPlatform
            );

            if (response?.failed_ids?.length) {
                setPendingPlaylists((current) =>
                    current.map((pl) =>
                        response.failed_ids.includes(pl.id)
                            ? { ...pl, status: state.ERROR }
                            : pl
                    )
                );
            }

            await pollTransferStatuses(
                response?.ids,
                toCommit,
                targetPlatform,
                response?.failed_ids
            );
        } catch (error) {
            console.error("Failed to commit pending playlists", error);
            setPendingPlaylists((current) =>
                current.map((pl) => ({
                    ...pl,
                    status: state.ERROR,
                }))
            );
        } finally {
            setIsSubmitting(false);
        }
    }, [pendingPlaylists, platforms.source, platforms.target, pollTransferStatuses]);

    const onCancelAll = () => {
        setIsSubmitting(false);
        setPendingPlaylists([]);
    };

    // Always show arrow from left to right; source name is on the left, target name on the right
    const [arrowDirectionClass, setArrowDirectionClass] = React.useState("");

    const pendingTitle =
        pendingPlaylists.length > 0
            ? `${pendingPlaylists.length} playlist${pendingPlaylists.length === 1 ? "" : "s"
            } selected`
            : "Drag playlists from either platform to the transfer area";

    const buttonsDisabled = pendingPlaylists.length === 0 || isSubmitting;

    React.useEffect(() => {
        storeTransferPlatforms(platforms);
    }, [platforms]);

    type DropCollect = {
        isOver: boolean;
        canDrop: boolean;
    };

    // Drop zone accepts playlists from either provider
    const [{ isOver, canDrop }, drop] = useDrop<Playlist, void, DropCollect>(
        () => ({
            accept: ["DRAG_FROM_PROVIDER"],
            canDrop: () => true,
            drop: (pl) => addPendingPlaylist(pl),
            collect: (monitor) => ({
                isOver: monitor.isOver(),
                canDrop: monitor.canDrop(),
            }),
        }),
        [addPendingPlaylist]
    );

    const renderPlatformColumn = (platform: Platform) => {
        const playlists = libraryPlaylists[platform] ?? [];
        const isLoading = loadingPlatforms[platform];
        const isConnected = storedProviders.includes(platform);
        const multiplier = (pendingPlaylists.length > 0) ? 2 : 1;
        const gridColsWhenIdle =
            "grid-cols-2 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5";
        const gridColsWhenDense =
            "grid-cols-2 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8 3xl:grid-cols-10";
        const gridColsClass =
            multiplier === 2 ? gridColsWhenDense : gridColsWhenIdle;

        return (
            <div
                className={`rounded-md ${platformAccentBackground[platform] || "bg-bg5/30"
                    } px-4 py-5 md:px-6 md:py-8 flex flex-col gap-4`}
            >
                <header className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full flex items-center justify-center">
                            <img
                                src={getPlatformLogo(platform)}
                                alt={`${platform} logo`}
                                className="w-10 rounded-full"
                            />
                        </div>
                        <p className="text-sm lg:text-2xl font-bold text-thirdary font-extrabold text-nowrap">
                            {getPlatformDisplayName(platform)}
                        </p>
                        <img src={refreshIcon} alt="refresh" className="w-6 h-6 cursor-pointer" onClick={() => fetchPlaylists(platform, platform === platforms.source ? sourceClient : targetClient, true)} />
                    </div>


                    <button
                        className={`text-secondary bg-bg3 font-bold w-[180px] h-[40px] ${playlists.length === 0
                            ? "opacity-40 cursor-not-allowed"
                            : ""
                            }`}
                        onClick={() => selectAllFromPlatform(platform)}
                        disabled={playlists.length === 0}
                    >
                        Select All
                    </button>

                </header>

                {!isConnected && (
                    <p className="text-sm text-secondary/70">
                        Sign in to load playlists for this platform.
                    </p>
                )}

                {isLoading ? (
                    <p className="text-black">Loading playlists…</p>
                ) : (
                    <div className={`grid ${gridColsClass} gap-4`}>
                        <PlaylistCollection
                            playlists={playlists}
                            platform={platform}
                            onAdd={addPendingPlaylist}
                            isPending={(pl) => pendingPlaylists.some(p => p.id === pl.id)}
                        />
                    </div>
                )}
            </div>
        );
    };


    return (
        <>
            {/* Notch absolute container for the components of transfer */}
            <div
                className="bg-bg1 px-6 py-4 drop-shadow rounded-[50px] gap-1 lg:gap-3 justify-center mx-auto text-center w-[30%] absolute left-[50%] top-3 justify-items-center -translate-x-[50%] hidden md:flex cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => navigate("/link")}
            >
                <p className="text-sm md:text-base w-30 bg-bg5/30 rounded-lg py-1 lg:py-2 text-secondary md:w-40 md:px-3 text-nowrap">
                    {getPlatformDisplayName(platforms.source)}
                </p>
                <img
                    src={arrowDirectionClass ? arrowRight : arrowBidirection}
                    alt="arrow"
                    className={`cursor-pointer ${arrowDirectionClass}`}
                    width={arrowDirectionClass ? 25 : 30}
                />
                <p className="text-sm md:text-base w-30 bg-bg5/30 rounded-lg py-1 lg:py-2 text-secondary md:w-40 md:px-3 text-nowrap">
                    {getPlatformDisplayName(platforms.target)}
                </p>
            </div>

            <div className={`flex flex-col mb-12 mx-2 md:mx-16 gap-6 2xl:mx-32`}>

                <section
                    ref={drop}
                    className={`flex flex-col gap-5 bg-bg1 rounded-md justify-between py-5 drop-shadow px-[3%] md:py-8
                    ${pendingPlaylists.length > 0 ? "justify-start" : ""}
                    ${isOver && canDrop ? "outline-bg3 outline-4" : "border-bg5/30"}
                 `}
                >
                    <div className="flex flex-col md:flex-row gap-3 justify-between md:items-center">
                        <p className="text-secondary text-lg text-pretty font-extrabold px-1 md:px-0 md:text-2xl xl:text-nowrap">
                            {pendingTitle}
                        </p>
                        <div className="flex gap-2 font-bold self-start md:self-auto">
                            <button
                                className={`max-w-[200px] min-w-[170px] h-[40px] text-nowrap bg-bg3 text-secondary justify-center md:justify-self-end scale-95 justify-self-center md:scale-none ${buttonsDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                                onClick={onCommit}
                                disabled={buttonsDisabled}
                            >
                                Confirm Transfer
                            </button>
                            <button
                                className={`max-w-[200px] min-w-[170px] h-[40px] text-nowrap bg-bg5 text-bg1 justify-center md:justify-self-end scale-95 justify-self-center md:scale-none ${buttonsDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                                onClick={onCancelAll}
                                disabled={pendingPlaylists.length === 0}
                            >
                                Cancel All
                            </button>
                        </div>
                    </div>

                    <div
                        className={`rounded-3xl py-6 overflow-hidden min-h-[220px] flex items-center ${pendingPlaylists.length > 0 ? "justify-start" : "hidden"}`}
                    >
                        <div className={`grid display-grid grid-cols-4 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8 3xl:grid-cols-10 gap-4`}>
                            {pendingPlaylists.length === 0 ? (
                                <></>
                            ) : (
                                pendingPlaylists.map((pl) =>
                                    <PlaylistCard
                                        key={pl.id}
                                        data={{ ...pl, platform: pl.platform }}
                                        onRemove={removePendingPlaylist}
                                    />)
                            )
                            }
                        </div>
                    </div>
                </section>


                <section className={`grid grid-cols-1 gap-6
                ${pendingPlaylists.length <= 0 ? "md:grid-cols-2"
                        : "md:grid-cols-1"}
                    `}>
                    {pendingPlaylists.length <= 0 ? renderPlatformColumn(platforms.source)
                        : pendingPlaylists[0].platform == platforms.source
                            ? renderPlatformColumn(platforms.source) : null}
                    {pendingPlaylists.length <= 0 ? renderPlatformColumn(platforms.target)
                        : pendingPlaylists[0].platform == platforms.target
                            ? renderPlatformColumn(platforms.target) : null}
                </section>

            </div>
        </>
    );
};

export default Transfer;
