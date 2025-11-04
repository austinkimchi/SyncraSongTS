export interface OAuthCallbackResponse {
  info?: string;
  jwt?: string;
  userId?: { _id: string } | string;
  state?: string;
}

export interface PlatformAuthService {
  redirectToOAuth(): Promise<void>;
  handleCallback(): Promise<void>;
  isLoggedIn(): Promise<boolean>;
}
