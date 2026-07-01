/* ==========================================================================
   Album Finder - Spotify Web API Client with PKCE OAuth2 & High-Fidelity Mocks
   ========================================================================== */

import { store } from '../state/store.js';

// Spotify authorization and API configuration values
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const API_BASE_URL = 'https://api.spotify.com/v1';

class SpotifyAPIClient {
  constructor() {
    this.redirectUri = `${window.location.origin}${window.location.pathname}`;
    this.activeSearchController = null;
    // Expose redirect URI back to settings form
    setTimeout(() => {
      const uriInput = document.getElementById('settings-redirect-uri');
      if (uriInput) uriInput.value = this.redirectUri;
    }, 100);
  }

  /**
   * Safe fetch request checking token expiry and handling token renewals
   */
  async _request(endpoint, options = {}) {
    if (store.get('mockMode') || !store.get('spotifyClientId')) {
      return this._mockFallback(endpoint);
    }

    let token = store.get('spotifyToken');
    if (!token) {
      this._triggerToast('Connect your Spotify account to query live music details.', 'warning');
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
        this._triggerToast('Spotify session expired. Please reconnect.', 'error');
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

  /**
   * Generate a random cryptographically secure crypt string
   */
  _generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(values).map((x) => possible[x % possible.length]).join('');
  }

  /**
   * Generate SHA-256 code challenge from verifier string
   */
  async _generateCodeChallenge(codeVerifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Initialize Spotify OAuth login redirect
   */
  async login() {
    const clientId = store.get('spotifyClientId');
    if (!clientId) {
      this._triggerToast('Please save your Spotify Client ID in settings first.', 'warning');
      return;
    }

    const codeVerifier = this._generateRandomString(64);
    window.sessionStorage.setItem('af_code_verifier', codeVerifier);

    const codeChallenge = await this._generateCodeChallenge(codeVerifier);
    const scope = 'user-read-private user-read-email';

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

  /**
   * Handle code redirect exchange and retrieve access credentials
   */
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
    this._triggerToast('Spotify connected successfully!', 'success');
  }

  /**
   * Silent Refresh Token routine
   */
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
      expiresAt: Date.now() + (data.expires_in * 1000)
    });
  }

  /* --- Core Search and Resource Fetch Methods --- */

  /**
   * Search Spotify resources (Artists, Albums, Tracks)
   */
  async search(query) {
    if (!query.trim()) return { artists: [], albums: [], tracks: [] };
    
    // Abort any active search requests
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
        // Return empty values silently on abort
        return { artists: [], albums: [], tracks: [] };
      }
      console.warn("API request error. Loading fallback search query.", e);
      return this._mockFallback(`/search?q=${query}`);
    }
  }

  /**
   * Retrieve single Artist data sheet
   */
  async getArtist(id) {
    return this._request(`/artists/${id}`);
  }

  /**
   * Retrieve top tracks for an Artist
   */
  async getArtistTopTracks(id) {
    const data = await this._request(`/artists/${id}/top-tracks?market=US`);
    return data.tracks || [];
  }

  /**
   * Retrieve list of albums/singles associated with Artist
   */
  async getArtistAlbums(id, filter = 'album,single') {
    const data = await this._request(`/artists/${id}/albums?include_groups=${filter}&limit=40`);
    return data.items || [];
  }

  /**
   * Retrieve full Album details & Tracks catalog
   */
  async getAlbum(id) {
    return this._request(`/albums/${id}`);
  }

  /**
   * Fetch Trending/Featured artists for home page
   */
  async getTrendingArtists() {
    if (store.get('mockMode') || !store.get('spotifyClientId')) {
      return this._mockFallback('/trending-artists');
    }
    // Live mode fallback: Search for top artists using a popular query wildcard
    try {
      const data = await this._request('/search?q=genre:electronic&type=artist&limit=6');
      return data.artists?.items || [];
    } catch (e) {
      return this._mockFallback('/trending-artists');
    }
  }

  /**
   * Fetch New Release albums
   */
  async getNewReleases() {
    if (store.get('mockMode') || !store.get('spotifyClientId')) {
      return this._mockFallback('/new-releases');
    }
    try {
      const data = await this._request('/browse/new-releases?limit=6');
      return data.albums?.items || [];
    } catch (e) {
      return this._mockFallback('/new-releases');
    }
  }

  /* --- Mock Sandbox Demo Data Fallbacks --- */

  _mockFallback(endpoint) {
    console.log(`[MOCK MODE] Intercepted endpoint: ${endpoint}`);

    // Return trending artists
    if (endpoint.includes('/trending-artists')) {
      return Promise.resolve(MOCK_ARTISTS);
    }
    
    // Return new releases
    if (endpoint.includes('/new-releases')) {
      return Promise.resolve(MOCK_ALBUMS);
    }

    // Artist detail sheet
    if (endpoint.startsWith('/artists/') && !endpoint.includes('/top-tracks') && !endpoint.includes('/albums')) {
      const id = endpoint.split('/')[2];
      const artist = MOCK_ARTISTS.find(a => a.id === id) || MOCK_ARTISTS[0];
      return Promise.resolve(artist);
    }

    // Artist top tracks
    if (endpoint.startsWith('/artists/') && endpoint.includes('/top-tracks')) {
      const id = endpoint.split('/')[2];
      return Promise.resolve(MOCK_TOP_TRACKS[id] || MOCK_TOP_TRACKS['tame_impala']);
    }

    // Artist albums
    if (endpoint.startsWith('/artists/') && endpoint.includes('/albums')) {
      const id = endpoint.split('/')[2];
      const albums = MOCK_ALBUMS.filter(a => a.artists[0].id === id);
      return Promise.resolve(albums.length > 0 ? albums : MOCK_ALBUMS);
    }

    // Album details
    if (endpoint.startsWith('/albums/')) {
      const id = endpoint.split('/')[2];
      const album = MOCK_ALBUM_DETAILS[id] || MOCK_ALBUM_DETAILS['random_access_memories'];
      return Promise.resolve(album);
    }

    // Mock search matching
    if (endpoint.startsWith('/search')) {
      const urlParams = new URLSearchParams(endpoint.split('?')[1]);
      const query = urlParams.get('q').toLowerCase();
      
      const filteredArtists = MOCK_ARTISTS.filter(a => a.name.toLowerCase().includes(query) || a.genres.some(g => g.toLowerCase().includes(query)));
      const filteredAlbums = MOCK_ALBUMS.filter(a => a.name.toLowerCase().includes(query));
      
      return Promise.resolve({
        artists: filteredArtists,
        albums: filteredAlbums,
        tracks: MOCK_TOP_TRACKS['tame_impala'].filter(t => t.name.toLowerCase().includes(query))
      });
    }

    return Promise.reject(new Error(`Endpoint not mapped in mock data: ${endpoint}`));
  }

  /**
   * Push custom notification to system alerts
   */
  _triggerToast(text, type) {
    const dispatcher = document.getElementById('toast-container');
    if (!dispatcher) return;
    
    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    
    let icon = 'ri-information-line';
    if (type === 'success') icon = 'ri-checkbox-circle-line';
    if (type === 'warning') icon = 'ri-error-warning-line';
    if (type === 'error') icon = 'ri-close-circle-line';

    toast.innerHTML = `
      <i class="${icon}"></i>
      <span>${text}</span>
    `;

    dispatcher.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px) scale(0.95)';
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }
}

/* ==========================================================================
   Static Mock Sandbox Collections (Awwwards-Tier portfolio proofing)
   ========================================================================== */

const MOCK_ARTISTS = [
  {
    id: 'tame_impala',
    name: 'Tame Impala',
    images: [{ url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&h=400&q=80' }],
    followers: { total: 6420512 },
    popularity: 88,
    genres: ['psychedelic rock', 'indie pop', 'neo-psychedelia']
  },
  {
    id: 'daft_punk',
    name: 'Daft Punk',
    images: [{ url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&h=400&q=80' }],
    followers: { total: 9812543 },
    popularity: 92,
    genres: ['electronic', 'french house', 'synthpop']
  },
  {
    id: 'billie_eilish',
    name: 'Billie Eilish',
    images: [{ url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=400&h=400&q=80' }],
    followers: { total: 49208312 },
    popularity: 95,
    genres: ['dark pop', 'electro-pop', 'alternative']
  },
  {
    id: 'radiohead',
    name: 'Radiohead',
    images: [{ url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=400&h=400&q=80' }],
    followers: { total: 8203512 },
    popularity: 86,
    genres: ['alternative rock', 'art rock', 'experimental']
  }
];

const MOCK_ALBUMS = [
  {
    id: 'currents',
    name: 'Currents',
    images: [{ url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&h=400&q=80' }],
    release_date: '2015-07-17',
    album_type: 'album',
    total_tracks: 13,
    artists: [{ id: 'tame_impala', name: 'Tame Impala' }],
    label: 'Interscope Records',
    popularity: 85
  },
  {
    id: 'random_access_memories',
    name: 'Random Access Memories',
    images: [{ url: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=400&h=400&q=80' }],
    release_date: '2013-05-17',
    album_type: 'album',
    total_tracks: 13,
    artists: [{ id: 'daft_punk', name: 'Daft Punk' }],
    label: 'Columbia Records',
    popularity: 90
  },
  {
    id: 'hit_me_hard_and_soft',
    name: 'Hit Me Hard and Soft',
    images: [{ url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&w=400&h=400&q=80' }],
    release_date: '2024-05-17',
    album_type: 'album',
    total_tracks: 10,
    artists: [{ id: 'billie_eilish', name: 'Billie Eilish' }],
    label: 'Darkroom/Interscope',
    popularity: 94
  },
  {
    id: 'kid_a',
    name: 'Kid A',
    images: [{ url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=400&h=400&q=80' }],
    release_date: '2000-10-02',
    album_type: 'album',
    total_tracks: 10,
    artists: [{ id: 'radiohead', name: 'Radiohead' }],
    label: 'Parlophone Records',
    popularity: 81
  }
];

// Open-source royalty-free MP3 test items for preview audio streams (SoundHelix)
const PREVIEW_MP3_1 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
const PREVIEW_MP3_2 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3';
const PREVIEW_MP3_3 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3';

const MOCK_TOP_TRACKS = {
  tame_impala: [
    { id: 'let_it_happen', name: 'Let It Happen', duration_ms: 467000, explicit: false, preview_url: PREVIEW_MP3_1, popularity: 82 },
    { id: 'the_less_i_know', name: 'The Less I Know the Better', duration_ms: 217000, explicit: true, preview_url: PREVIEW_MP3_2, popularity: 89 },
    { id: 'borderline', name: 'Borderline', duration_ms: 237000, explicit: false, preview_url: PREVIEW_MP3_3, popularity: 78 }
  ],
  daft_punk: [
    { id: 'get_lucky', name: 'Get Lucky (feat. Pharrell Williams)', duration_ms: 249000, explicit: false, preview_url: PREVIEW_MP3_1, popularity: 87 },
    { id: 'instant_crush', name: 'Instant Crush (feat. Julian Casablancas)', duration_ms: 337000, explicit: false, preview_url: PREVIEW_MP3_2, popularity: 84 },
    { id: 'one_more_time', name: 'One More Time', duration_ms: 320000, explicit: false, preview_url: PREVIEW_MP3_3, popularity: 80 }
  ],
  billie_eilish: [
    { id: 'lunch', name: 'LUNCH', duration_ms: 180000, explicit: true, preview_url: PREVIEW_MP3_1, popularity: 93 },
    { id: 'chihiro', name: 'CHIHIRO', duration_ms: 303000, explicit: false, preview_url: PREVIEW_MP3_2, popularity: 91 },
    { id: 'birds_of_a_feather', name: 'BIRDS OF A FEATHER', duration_ms: 210000, explicit: false, preview_url: PREVIEW_MP3_3, popularity: 95 }
  ],
  radiohead: [
    { id: 'creep', name: 'Creep', duration_ms: 238000, explicit: true, preview_url: PREVIEW_MP3_1, popularity: 86 },
    { id: 'karma_police', name: 'Karma Police', duration_ms: 261000, explicit: false, preview_url: PREVIEW_MP3_2, popularity: 78 },
    { id: 'weird_fishes', name: 'Weird Fishes/Arpeggi', duration_ms: 318000, explicit: false, preview_url: PREVIEW_MP3_3, popularity: 75 }
  ]
};

const MOCK_ALBUM_DETAILS = {
  currents: {
    id: 'currents',
    name: 'Currents',
    images: [{ url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&h=400&q=80' }],
    release_date: '2015-07-17',
    artists: [{ id: 'tame_impala', name: 'Tame Impala' }],
    label: 'Interscope Records',
    copyrights: [{ text: '© 2015 Tame Impala, under exclusive license to Interscope Records' }],
    external_urls: { spotify: 'https://open.spotify.com/album/79dfqiaQJ7nN71991aTf3t' },
    tracks: {
      items: [
        { id: 'let_it_happen', name: 'Let It Happen', duration_ms: 467000, explicit: false, preview_url: PREVIEW_MP3_1, track_number: 1 },
        { id: 'nangs', name: 'Nangs', duration_ms: 107000, explicit: false, preview_url: PREVIEW_MP3_2, track_number: 2 },
        { id: 'the_moment', name: 'The Moment', duration_ms: 255000, explicit: false, preview_url: PREVIEW_MP3_3, track_number: 3 },
        { id: 'the_less_i_know', name: 'The Less I Know the Better', duration_ms: 217000, explicit: true, preview_url: PREVIEW_MP3_1, track_number: 4 },
        { id: 'disciples', name: 'Disciples', duration_ms: 108000, explicit: false, preview_url: PREVIEW_MP3_2, track_number: 5 }
      ]
    }
  },
  random_access_memories: {
    id: 'random_access_memories',
    name: 'Random Access Memories',
    images: [{ url: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=400&h=400&q=80' }],
    release_date: '2013-05-17',
    artists: [{ id: 'daft_punk', name: 'Daft Punk' }],
    label: 'Columbia Records',
    copyrights: [{ text: '© 2013 Columbia Records, a division of Sony Music' }],
    external_urls: { spotify: 'https://open.spotify.com/album/4m28wb762qXJ8pu6765tZ2' },
    tracks: {
      items: [
        { id: 'give_life_back_to_music', name: 'Give Life Back to Music', duration_ms: 274000, explicit: false, preview_url: PREVIEW_MP3_1, track_number: 1 },
        { id: 'game_of_love', name: 'The Game of Love', duration_ms: 322000, explicit: false, preview_url: PREVIEW_MP3_2, track_number: 2 },
        { id: 'giorgio_by_moroder', name: 'Giorgio by Moroder', duration_ms: 544000, explicit: false, preview_url: PREVIEW_MP3_3, track_number: 3 },
        { id: 'instant_crush', name: 'Instant Crush (feat. Julian Casablancas)', duration_ms: 337000, explicit: false, preview_url: PREVIEW_MP3_1, track_number: 4 },
        { id: 'get_lucky', name: 'Get Lucky (feat. Pharrell Williams)', duration_ms: 249000, explicit: false, preview_url: PREVIEW_MP3_2, track_number: 5 }
      ]
    }
  },
  hit_me_hard_and_soft: {
    id: 'hit_me_hard_and_soft',
    name: 'Hit Me Hard and Soft',
    images: [{ url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&w=400&h=400&q=80' }],
    release_date: '2024-05-17',
    artists: [{ id: 'billie_eilish', name: 'Billie Eilish' }],
    label: 'Darkroom/Interscope Records',
    copyrights: [{ text: '© 2024 Billie Eilish, under exclusive license to Interscope Records' }],
    external_urls: { spotify: 'https://open.spotify.com/album/7aJuG46RsnH748cIhK1j2t' },
    tracks: {
      items: [
        { id: 'skinny', name: 'SKINNY', duration_ms: 219000, explicit: false, preview_url: PREVIEW_MP3_1, track_number: 1 },
        { id: 'lunch', name: 'LUNCH', duration_ms: 180000, explicit: true, preview_url: PREVIEW_MP3_2, track_number: 2 },
        { id: 'chihiro', name: 'CHIHIRO', duration_ms: 303000, explicit: false, preview_url: PREVIEW_MP3_3, track_number: 3 },
        { id: 'birds_of_a_feather', name: 'BIRDS OF A FEATHER', duration_ms: 210000, explicit: false, preview_url: PREVIEW_MP3_1, track_number: 4 },
        { id: 'wildflower', name: 'WILDFLOWER', duration_ms: 261000, explicit: false, preview_url: PREVIEW_MP3_2, track_number: 5 }
      ]
    }
  },
  kid_a: {
    id: 'kid_a',
    name: 'Kid A',
    images: [{ url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=400&h=400&q=80' }],
    release_date: '2000-10-02',
    artists: [{ id: 'radiohead', name: 'Radiohead' }],
    label: 'XL Recordings',
    copyrights: [{ text: '© 2000 XL Recordings, under exclusive license from Parlophone' }],
    external_urls: { spotify: 'https://open.spotify.com/album/19SSvyq05i794w997zeq2j' },
    tracks: {
      items: [
        { id: 'everything_in_its_right_place', name: 'Everything In Its Right Place', duration_ms: 251000, explicit: false, preview_url: PREVIEW_MP3_1, track_number: 1 },
        { id: 'kid_a_track', name: 'Kid A', duration_ms: 284000, explicit: false, preview_url: PREVIEW_MP3_2, track_number: 2 },
        { id: 'the_national_anthem', name: 'The National Anthem', duration_ms: 351000, explicit: false, preview_url: PREVIEW_MP3_3, track_number: 3 },
        { id: 'how_to_disappear_completely', name: 'How to Disappear Completely', duration_ms: 356000, explicit: false, preview_url: PREVIEW_MP3_1, track_number: 4 },
        { id: 'optimistic', name: 'Optimistic', duration_ms: 315000, explicit: false, preview_url: PREVIEW_MP3_2, track_number: 5 }
      ]
    }
  }
};

export const spotify = new SpotifyAPIClient();
