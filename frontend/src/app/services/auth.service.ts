import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

const accessTokenKey = 'expense_control_access_token';
const idTokenKey = 'expense_control_id_token';
const pkceVerifierKey = 'expense_control_pkce_verifier';
const oauthStateKey = 'expense_control_oauth_state';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  getAccessToken(): string | null {
    return sessionStorage.getItem(accessTokenKey);
  }

  setAccessToken(token: string): void {
    sessionStorage.setItem(accessTokenKey, token);
  }

  getIdToken(): string | null {
    return sessionStorage.getItem(idTokenKey);
  }

  isAuthenticated(): boolean {
    return Boolean(this.getAccessToken());
  }

  clearAccessToken(): void {
    sessionStorage.removeItem(accessTokenKey);
    sessionStorage.removeItem(idTokenKey);
    sessionStorage.removeItem(pkceVerifierKey);
    sessionStorage.removeItem(oauthStateKey);
  }

  async login(): Promise<void> {
    if (environment.authMode === 'local') {
      this.setAccessToken('local-dev-token');
      return;
    }

    if (!environment.cognitoHostedUiUrl) {
      return;
    }

    const verifier = createRandomString();
    const state = createRandomString();
    const challenge = await createCodeChallenge(verifier);

    sessionStorage.setItem(pkceVerifierKey, verifier);
    sessionStorage.setItem(oauthStateKey, state);

    const loginUrl = this.createHostedUiUrl('/login');
    loginUrl.searchParams.set('client_id', environment.cognitoAppClientId);
    loginUrl.searchParams.set('response_type', 'code');
    loginUrl.searchParams.set('scope', 'openid email profile');
    loginUrl.searchParams.set('redirect_uri', window.location.origin);
    loginUrl.searchParams.set('code_challenge', challenge);
    loginUrl.searchParams.set('code_challenge_method', 'S256');
    loginUrl.searchParams.set('state', state);

    window.location.assign(loginUrl.toString());
  }

  logout(): void {
    this.clearAccessToken();
  }

  async handleRedirectCallback(): Promise<boolean> {
    if (environment.authMode === 'local') {
      return false;
    }

    const currentUrl = new URL(window.location.href);
    const code = currentUrl.searchParams.get('code');
    const error = currentUrl.searchParams.get('error');

    if (error) {
      throw new Error(currentUrl.searchParams.get('error_description') ?? error);
    }

    if (!code) {
      return false;
    }

    const expectedState = sessionStorage.getItem(oauthStateKey);
    const returnedState = currentUrl.searchParams.get('state');
    if (expectedState && returnedState !== expectedState) {
      throw new Error('OAuth state did not match.');
    }

    const verifier = sessionStorage.getItem(pkceVerifierKey);
    if (!verifier) {
      throw new Error('PKCE verifier was not found. Start sign in again.');
    }

    const tokenUrl = this.createHostedUiUrl('/oauth2/token');
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: environment.cognitoAppClientId,
      code,
      redirect_uri: window.location.origin,
      code_verifier: verifier
    });

    const response = await fetch(tokenUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed with HTTP ${response.status}.`);
    }

    const tokens = (await response.json()) as CognitoTokenResponse;
    sessionStorage.setItem(accessTokenKey, tokens.access_token);

    if (tokens.id_token) {
      sessionStorage.setItem(idTokenKey, tokens.id_token);
    }

    sessionStorage.removeItem(pkceVerifierKey);
    sessionStorage.removeItem(oauthStateKey);
    window.history.replaceState({}, document.title, window.location.pathname);

    return true;
  }

  private createHostedUiUrl(pathname: '/login' | '/oauth2/token'): URL {
    const configuredUrl = new URL(environment.cognitoHostedUiUrl);
    const baseUrl = `${configuredUrl.protocol}//${configuredUrl.host}`;
    return new URL(pathname, baseUrl);
  }
}

interface CognitoTokenResponse {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

function createRandomString(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function createCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
