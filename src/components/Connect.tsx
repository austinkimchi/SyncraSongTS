import React from "react";
import arrow from "../assets/images/arrow1.svg";
import Platform, { getPlatformDisplayName, getPlatformLogo } from "../types/platform";
import { ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { waitForProviders } from "../auth/providerStorage";

const Connect: React.FC = () => {
    const DEFAULT_LEFT_PLATFORM = Platform.APPLE_MUSIC;
    const DEFAULT_RIGHT_PLATFORM = Platform.SPOTIFY;

    const [leftPlatform, setLeftPlatform] = React.useState<Platform>(DEFAULT_LEFT_PLATFORM);
    const [rightPlatform, setRightPlatform] = React.useState<Platform>(DEFAULT_RIGHT_PLATFORM);

    const swapPlatform = () => () => {
        const temp = leftPlatform;
        setLeftPlatform(rightPlatform);
        setRightPlatform(temp);
    }

    const navigate = useNavigate();

    const [storedProviders, setStoredProviders] = React.useState<Platform[]>([]);
    React.useEffect(() => {
        (async () => {
            const providers = await waitForProviders();

            if (providers.length !== storedProviders.length)
                setStoredProviders(providers);
            if (providers.length > 0) {
                if (!providers.includes(leftPlatform)) {
                    setLeftPlatform(providers[0]);
                }
                if (!providers.includes(rightPlatform)) {
                    setRightPlatform(providers.length > 1 ? providers[1] : providers[0]);
                }

            }
        })();
    }, [storedProviders]);

    return (
        <div className={`flex flex-col mb-8 mx-2 md:mx-16`}>
            {/* First section; Ask user for transfer playlist selection */}
            <section className={`flex flex-col gap-5 bg-bg1 rounded-md justify-between py-5 drop-shadow`}>
                <div className="grid gap-10 grid-cols-1 justify-between px-[3%] md:grid-cols-2 md:py-5">
                    <p className="order-1 text-secondary text-lg text-pretty  font-extrabold px-4 md:px-0 md:text-2xl md:text-nowrap">
                        Select 2 music platform <br className="md:hidden" />to transfer playlists
                    </p>
                    <button
                        className={`order-3 md:order-2 max-w-[200px] min-w-[170px] h-[40px] text-nowrap 3 text-secondary justify-center md:justify-self-end scale-95 justify-self-center md:scale-none bg-bg3 ${(storedProviders.length >= 2) ? "hover:bg-accent/90" : (storedProviders.length == 0) ? "" : "opacity-50 cursor-not-allowed"}`}
                        onClick={() => {
                            if (storedProviders.length < 2)
                                navigate('/link');
                            else
                                navigate('/transfer')
                        }}
                        disabled={storedProviders.length != 0 && storedProviders.length < 2}
                    >
                        {storedProviders.length < 2 ? "Confirm Selection" : "Continue"}
                    </button>

                    <div className="bg-bg1 px-6 py-6 order-2 md:order-3 flex drop-shadow rounded-[50px] gap-3 justify-center mx-auto text-center md:scale-none  md:mb-6 md:mb-12 md:col-span-2">
                        {menuPlatform({
                            side: "left",
                            platform: leftPlatform,
                            otherPlatform: rightPlatform,
                        })}

                        <img onClick={swapPlatform()}
                            src={arrow}
                            alt="arrow"
                            className="cursor-pointer"
                            width={25} />
                        {menuPlatform({
                            side: "right",
                            platform: rightPlatform,
                            otherPlatform: leftPlatform,
                        })}
                    </div>
                </div>
            </section >
        </div >
    );

    function menuPlatform({
        side,
        platform,
        otherPlatform,
    }: {
        side: 'left' | 'right';
        platform: Platform;
        otherPlatform: Platform;
    }) {
        const setPlatform = (next: Platform) => {
            if (next === otherPlatform) {
                if (side === "left") {
                    setLeftPlatform(next);
                    setRightPlatform(platform);
                } else {
                    setRightPlatform(next);
                    setLeftPlatform(platform);
                }
                return;
            }

            if (side === "left") {
                setLeftPlatform(next);
            } else {
                setRightPlatform(next);
            }
        };

        const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
        const open = Boolean(anchorEl);
        const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
        const handleClose = () => setAnchorEl(null);
        const platforms = React.useMemo(() => Object.values(Platform), []);
        console.log("Stored Providers in Connect:", storedProviders);

        if (storedProviders.length > 0)
            platforms.splice(0, platforms.length, ...storedProviders);

        return (
            <>
                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                    transformOrigin={{ vertical: "top", horizontal: "left" }}
                    slotProps={
                        {
                            root: { className: "mt-2 text-sm" },
                        }
                    }
                >
                    {platforms
                        .filter((p) => p !== platform)
                        .map((p) => (
                            <MenuItem
                                key={p}
                                onClick={() => {
                                    setPlatform(p as Platform);
                                    handleClose();
                                }}
                            >
                                <ListItemIcon>
                                    <img src={getPlatformLogo(p as Platform)} alt={`${p} logo`} className="w-6 h-6 rounded-full" />
                                </ListItemIcon>
                                <ListItemText>{getPlatformDisplayName(p as Platform)}</ListItemText>
                            </MenuItem>
                        ))}
                </Menu>
                <div
                    className="cursor-pointer"
                    onClick={handleOpen}>
                    <p className="w-30 bg-bg5/30 rounded-lg py-2 text-secondary md:w-40 md:px-3">
                        {getPlatformDisplayName(platform)}
                    </p>
                </div>
            </>
        );
    }
};

export default Connect;
