import React from "react";
import Platform, { getPlatformDisplayName, getPlatformLogo, getPlatformOAuthFunction } from "../types/platform";
import { waitForProviders } from "../auth/providerStorage";

const custom_order: Platform[] = [
    Platform.APPLE_MUSIC,
    Platform.SPOTIFY,
    Platform.SOUNDCLOUD,
];

const Link: React.FC = () => {
    const platforms = React.useMemo(() => Object.values(Platform), []);
    platforms.sort((a, b) => {
        const indexA = custom_order.indexOf(a);
        const indexB = custom_order.indexOf(b);
        if (indexA === -1 && indexB === -1) {
            return a.localeCompare(b);
        } else if (indexA === -1) {
            return 1;
        } else if (indexB === -1) {
            return -1;
        } else {
            return indexA - indexB;
        }
    })

    const [storedProviders, setStoredProviders] = React.useState<Platform[]>([]);
    React.useEffect(() => {
        (async () => {
            const providers = await waitForProviders();
            if (providers.length !== storedProviders.length)
                setStoredProviders(providers);
        })();
    }, [storedProviders]);

    return (
        <div className={`flex flex-col gap-2 mx-2 md:mx-16 2xl:mx-32`}>
            {platforms
                .map((platform) => (
                    <div key={platform} className="flex flex-col gap-2 md:flex-row bg-bg2 rounded-md py-8 justify-between px-12">
                        <div className="flex">
                            <img
                                src={getPlatformLogo(platform)} alt={`${platform} logo`} className="w-10 h-10 rounded-full mr-4 select-none user-select-none user-drag-none"
                                draggable={false}
                            />
                            <span className="text-thirdary text-2xl font-extrabold self-center">
                                {getPlatformDisplayName(platform)}
                            </span>
                        </div>
                        <div className="flex">
                            <p
                                className={`text-bg3 font-extrabold text-sm self-center mr-6 uppercase select-none user-select-none user-drag-none ${storedProviders.includes(platform) ? "text" : "hidden"}`}
                            >
                                Paired
                            </p>
                            <button
                                className={`w-[100%] md:w-[300px] h-9 bg-bg3 text-secondary font-bold ${storedProviders.includes(platform) ? "opacity-50 cursor-default!" : "hover:bg-accent/90"}`}
                                onClick={() => {
                                    localStorage.removeItem(`providers`);
                                    getPlatformOAuthFunction(platform)()
                                }}
                                disabled={storedProviders.includes(platform)}
                            >
                                {(storedProviders.length > 0 && !storedProviders.includes(platform)) ? `Link ${getPlatformDisplayName(platform)}` : `Sign in with ${getPlatformDisplayName(platform)}`}
                            </button>
                        </div>
                    </div>
                ))}
        </div>
    );
};

export default Link;