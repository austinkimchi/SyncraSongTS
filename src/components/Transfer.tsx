import React from "react";
import arrowRight from "../assets/images/arrow_right.svg";
import PlaylistCollection from "./PlaylistCollection";
import { DEMO_PLAYLISTS_APPLE, DEMO_PLAYLISTS_SPOTIFY, DEMO_PLAYLISTS_SOUNDCLOUD } from "../data/demoPlaylists";
import Platform, { getPlatformDisplayName, getPlatformLogo } from "../types/platform";
import { Playlist } from "../types/playlist";
import { state } from "../types/status";
import { loadTransferPlatforms, storeTransferPlatforms, TransferPlatforms } from "../hooks/useTransferPlatforms";

const DEFAULT_PLATFORMS: TransferPlatforms = {
    source: Platform.APPLE_MUSIC,
    target: Platform.SPOTIFY,
};

const platformAccentBackground: Record<Platform, string> = {
    [Platform.APPLE_MUSIC]: "bg-[#EAFBD3]",
    [Platform.SPOTIFY]: "bg-[#E7F0FF]",
    [Platform.SOUNDCLOUD]: "bg-bg5/60",
};

const Transfer: React.FC = () => {
    const [platforms, setPlatforms] = React.useState<TransferPlatforms>(() =>
        loadTransferPlatforms(DEFAULT_PLATFORMS)
    );

    React.useEffect(() => {
        setPlatforms(loadTransferPlatforms(DEFAULT_PLATFORMS));
    }, []);

    const libraries = React.useMemo(
        () => ({
            [Platform.APPLE_MUSIC]: DEMO_PLAYLISTS_APPLE,
            [Platform.SPOTIFY]: DEMO_PLAYLISTS_SPOTIFY,
            [Platform.SOUNDCLOUD]: DEMO_PLAYLISTS_SOUNDCLOUD,
        }),
        []
    );

    const [pendingPlaylists, setPendingPlaylists] = React.useState<Playlist[]>([]);

    const addPendingPlaylist = React.useCallback((playlist: Playlist) => {
        setPendingPlaylists((current) => {
            if (current.some((pl) => pl.id === playlist.id)) return current;

            const queuedPlaylist = { ...playlist, status: state.QUEUED };
            return [...current, queuedPlaylist];
        });
    }, []);

    const removePendingPlaylist = React.useCallback((playlist: Playlist) => {
        setPendingPlaylists((current) => current.filter((pl) => pl.id !== playlist.id));
    }, []);

    const selectAllFromPlatform = (platform: Platform) => {
        const candidates = libraries[platform] ?? [];
        candidates.forEach((pl) => addPendingPlaylist(pl));
    };

    const onCommit = () => {
        setPendingPlaylists((current) =>
            current.map((pl) => ({
                ...pl,
                status: state.PROCESSING,
            }))
        );
    };

    const onCancelAll = () => setPendingPlaylists([]);

    const arrowDirectionClass =
        platforms.source === DEFAULT_PLATFORMS.target && platforms.target === DEFAULT_PLATFORMS.source
            ? "rotate-180"
            : "";

    const pendingTitle =
        pendingPlaylists.length > 0
            ? `${pendingPlaylists.length} playlist ${pendingPlaylists.length === 1 ? "" : "S"} selected`
            : "Select or Drag playlists up here to transfer...";

    const buttonsDisabled = pendingPlaylists.length === 0;

    React.useEffect(() => {
        storeTransferPlatforms(platforms);
    }, [platforms]);

    const renderPlatformColumn = (platform: Platform) => (
        <div
            className={`rounded-md ${platformAccentBackground[platform] || "bg-bg5/30"} px-4 py-5 md:px-6 md:py-8 flex flex-col gap-4`}
        >
            <header className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                    <div className="rounded-full flex items-center justify-center">
                        <img src={getPlatformLogo(platform)} alt={`${platform} logo`} className="w-10 rounded-full" />
                    </div>
                    <p className="text-lg md:text-2xl font-bold text-thirdary font-extrabold">
                        {getPlatformDisplayName(platform)}
                    </p>
                </div>
                <button
                    className="text-secondary bg-bg3 font-bold w-[180px] h-[40px]"
                    onClick={() => selectAllFromPlatform(platform)}
                >
                    Select All
                </button>
            </header>

            <PlaylistCollection
                playlists={libraries[platform] ?? []}
                platform={platform}
                onAdd={addPendingPlaylist}
            />
        </div>
    );

    return (
        <>
            {/* Notch absolute container for the components of transfer */}
            <div className="bg-bg1 px-6 py-4 drop-shadow rounded-[50px] gap-3 justify-center mx-auto text-center w-[30%] absolute left-[50%] top-3 justify-items-center -translate-x-[50%] hidden md:flex">
                <p className="w-30 bg-bg5/30 rounded-lg py-2 text-secondary md:w-40 md:px-3">
                    {getPlatformDisplayName(platforms.source)}
                </p>
                <img
                    src={arrowRight}
                    alt="arrow"
                    className={`cursor-pointer ${arrowDirectionClass}`}
                    width={25}
                />
                <p className="w-30 bg-bg5/30 rounded-lg py-2 text-secondary md:w-40 md:px-3">
                    {getPlatformDisplayName(platforms.target)}
                </p>
            </div>

            <div className={`flex flex-col mb-12 mx-2 md:mx-16 gap-6 2xl:mx-32`}>
                <section className={`flex flex-col gap-5 bg-bg1 rounded-md justify-between py-5 drop-shadow px-[3%] md:py-8`}>
                    <div className="flex flex-col md:flex-row gap-3 justify-between md:items-center">
                        <p className="text-secondary text-lg text-pretty font-extrabold px-1 md:px-0 md:text-2xl md:text-nowrap">
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
                                disabled={buttonsDisabled}
                            >
                                Cancel All
                            </button>
                        </div>
                    </div>

                    <div className={`bg-[#2b2d33] rounded-3xl border border-bg5/30 px-4 md:px-6 py-6 overflow-hidden ${pendingPlaylists.length === 0 ? "hidden" : ""}`}>
                        <PlaylistCollection
                            playlists={pendingPlaylists}
                            platform={pendingPlaylists[0]?.platform}
                            onRemove={removePendingPlaylist}
                        />
                    </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pb-6">
                    {renderPlatformColumn(platforms.source)}
                    {renderPlatformColumn(platforms.target)}
                </section>
            </div>
        </>
    );
};

export default Transfer;
