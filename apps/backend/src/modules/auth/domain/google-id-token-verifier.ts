export type GoogleProfile = {
  googleId: string;
  email: string;
  name: string;
};

export interface GoogleIdTokenVerifier {
  verify(idToken: string): Promise<GoogleProfile>;
}
