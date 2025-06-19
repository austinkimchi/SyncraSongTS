import React from "react";
import { Button } from "react-bootstrap";
import { launchAppleMusicAuthorization, launchSpotifyAuthorization } from "../handler/authorize";

interface ReauthorizeProps {
    provider: string;
    setStatus: React.Dispatch<React.SetStateAction<{ apple: number; spotify: number }>>;
}

const Reauthorize: React.FC<ReauthorizeProps> = ({ provider, setStatus }) => {
    const handleReauthorize = async () => {
        let success = false;
        
        if (provider === "apple") {
            success = (await launchAppleMusicAuthorization());
        } else {
            success = (await launchSpotifyAuthorization());
        }

        setStatus(prev => ({
            ...prev,
            [provider]: success ? 200 : 500
        }));
    };

    return (
        <div className="reauthorize">
            <h2>Reauthorize {provider === "apple" ? "Apple Music" : "Spotify"}</h2>
            <Button onClick={handleReauthorize}>Reauthorize</Button>
        </div>
    );
};


export default Reauthorize;