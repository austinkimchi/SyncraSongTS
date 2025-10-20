export interface IPlatformOAuthClient {
  redirectToOAuth(): Promise<void>;
  handleCallback(): Promise<void>;
}

