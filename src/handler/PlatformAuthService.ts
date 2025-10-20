export interface PlatformAuthService {
  redirectToOAuth(): Promise<void>;
  handleCallback(): Promise<void>;
  isLoggedIn(): Promise<boolean>;
}
