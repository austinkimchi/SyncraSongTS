export interface AppleMusicConfig {
  developerToken: string;
  app: {
    name: string;
    build: string;
  };
}

export interface SpotifyAuthResponse {
  url: string;
}
