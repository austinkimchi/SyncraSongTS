import Platform from "./platform";

export interface Session {
  userId: string;
  displayName?: string;
  providers: Platform[];
}
export interface AuthState {
  status: 'authenticated' | 'unauthenticated';
  session?: Session;
}