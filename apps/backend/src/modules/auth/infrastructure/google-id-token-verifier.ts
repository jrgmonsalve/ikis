import { createRemoteJWKSet, jwtVerify } from "jose";
import type { GoogleIdTokenVerifier, GoogleProfile } from "../domain/google-id-token-verifier";

const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export class JoseGoogleIdTokenVerifier implements GoogleIdTokenVerifier {
  constructor(private readonly clientId: string) {}

  async verify(idToken: string): Promise<GoogleProfile> {
    const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: this.clientId,
    });

    return {
      googleId: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
    };
  }
}
