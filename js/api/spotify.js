/* ==========================================================================
   Album Finder - Spotify Web API Client with PKCE OAuth2
   ========================================================================== */

import { store } from '../state/store.js';

const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const API_BASE_URL = 'https://api.spotify.com/v1';

class SpotifyAPIClient {
  constructor() {
    this.redirectUri = `${window.location.origin}${window.location.pathname}`;
    this.activeSearchController = null;
  }

  /**
   * Safe fetch request checking token expiry and handling token renewals
   */
  async _request(endpoint, options = {}) {
    let token = store.get('spotifyToken');
    if (!token) {
      throw new Error('No Spotify authentication token available.');
    }

    // Refresh if expired (with 10-second margin of safety)
    const isExpired = Date.now() > (token.expiresAt - 10000);
    if (isExpired) {
      try {
        token = await this.refreshAccessToken();
      } catch (err) {
        console.error('Failed to renew expired access token:', err);
        store.set('spotifyToken', null);
        throw err;
      }
    }

    const headers = {
      'Authorization': `Bearer ${token.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    
    if (response.status === 401) {
      // Emergency refresh retry if unauthorized
      token = await this.refreshAccessToken();
      headers['Authorization'] = `Bearer ${token.accessToken}`;
      const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
      if (!retryResponse.ok) throw new Error(`Spotify API error: ${retryResponse.statusText}`);
      return retryResponse.json();
    }

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /* --- OAuth 2.0 PKCE Flow Methods --- */

  _generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(values).map((x) => possible[x % possible.length]).join('');
  }

  async _generateCodeChallenge(codeVerifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  async login() {
    const clientId = store.get('spotifyClientId');
    if (!clientId) {
      throw new Error('Spotify Client ID is required for authentication.');
    }

    const codeVerifier = this._generateRandomString(64);
    window.sessionStorage.setItem('af_code_verifier', codeVerifier);

    const codeChallenge = await this._generateCodeChallenge(codeVerifier);
    const scope = 'user-read-private user-read-email user-top-read';

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      scope: scope
    });

    window.location.href = `${AUTH_ENDPOINT}?${params.toString()}`;
  }

  async handleCallback(code) {
    const clientId = store.get('spotifyClientId');
    const codeVerifier = window.sessionStorage.getItem('af_code_verifier');
    
    if (!clientId || !codeVerifier) {
      throw new Error('Authorization state mismatched or missing Client ID.');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.redirectUri,
      code_verifier: codeVerifier
    });

    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange code: ${response.statusText}`);
    }

    const data = await response.json();
    this._saveTokenData(data);
    
    // Clean URL params
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  async refreshAccessToken() {
    const clientId = store.get('spotifyClientId');
    const token = store.get('spotifyToken');

    if (!clientId || !token?.refreshToken) {
      throw new Error('Refresh token parameters missing.');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: token.refreshToken
    });

    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    const data = await response.json();
    this._saveTokenData(data);
    return store.get('spotifyToken');
  }

  _saveTokenData(data) {
    store.set('spotifyToken', {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || store.get('spotifyToken')?.refreshToken,
      expiresAt: Date.now() + (data.access_in || data.expires_in * 1000)
    });
  }

  /* --- Core Search and Resource Fetch Methods --- */

  async search(query) {
    if (!query.trim()) return { artists: [], albums: [], tracks: [] };
    
    if (this.activeSearchController) {
      this.activeSearchController.abort();
    }
    this.activeSearchController = new AbortController();

    try {
      const data = await this._request(
        `/search?q=${encodeURIComponent(query)}&type=artist,album,track&limit=12`,
        { signal: this.activeSearchController.signal }
      );
      return {
        artists: data.artists?.items || [],
        albums: data.albums?.items || [],
        tracks: data.tracks?.items || []
      };
    } catch (e) {
      if (e.name === 'AbortError') {
        return { artists: [], albums: [], tracks: [] };
      }
      console.error("API search request error:", e);
      throw e;
    }
  }

  async getArtist(id) {
    return this._request(`/artists/${id}`);
  }

  async getArtistTopTracks(id) {
    const data = await this._request(`/artists/${id}/top-tracks?market=US`);
    return data.tracks || [];
  }

  async getArtistAlbums(id, filter = 'album,single') {
    const data = await this._request(`/artists/${id}/albums?include_groups=${filter}&limit=40`);
    return data.items || [];
  }

  async getAlbum(id) {
    return this._request(`/albums/${id}`);
  }

  async getUserTopArtists() {
    const data = await this._request('/me/top/artists?limit=12&time_range=medium_term');
    return data.items || [];
  }

  async getUserTopTracks() {
    const data = await this._request('/me/top/tracks?limit=15&time_range=medium_term');
    return data.items || [];
  }
}

export const spotify = new SpotifyAPIClient();
