import React from "react";
import { Button } from "react-bootstrap";
import { launchAppleMusicAuthorization, launchSpotifyAuthorization } from "../handler/authorize";

interface ReauthorizeProps {
    provider: string;
}

const Reauthorize: React.FC<ReauthorizeProps> = ({ provider }) => {
    const handleReauthorize = async () => {
        if (provider === "apple") {
            await launchAppleMusicAuthorization();
        } else {
            await launchSpotifyAuthorization();
        }
    };

    return (
        <div className="reauthorize">
            <h2>Reauthorize {provider === "apple" ? "Apple Music" : "Spotify"}</h2>
            <Button onClick={handleReauthorize}>Reauthorize</Button>
        </div>
    );
};


export default Reauthorize;