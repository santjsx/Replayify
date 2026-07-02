/* ==========================================================================
   Album Finder - Event-driven Reactive State Store
   ========================================================================== */

class StateStore {
  constructor() {
    this.listeners = {};
    
    // Core application state variables synchronized with Local Storage
    this.state = {
      theme: localStorage.getItem('af_theme') || 'dark',
      spotifyClientId: localStorage.getItem('af_spotify_client_id') || '',
      spotifyToken: this._safeParseLocalStorage('af_spotify_token', null),
      mockMode: localStorage.getItem('af_mock_mode') === 'true' || false,
      favorites: this._safeParseLocalStorage('af_favorites', { artists: [], albums: [] }),
      history: this._safeParseLocalStorage('af_history', []),
      
      // Session-only states
      searchQuery: '',
      currentView: 'home', // 'home' | 'search' | 'artist' | 'library'
      viewData: null,      // Context parameters for active views (e.g. artistId)
      activePreview: null, // Current track playing in floating media bar
      activeMonth: 'March'
    };

    // Apply initialized theme to HTML document on boot
    document.documentElement.setAttribute('data-theme', this.state.theme);
  }

  /**
   * Retrieve simulated stats based on active month
   */
  getSimulatedStats() {
    const month = this.state.activeMonth || 'March';
    const db = {
      'January': { minutes: '1,840', plays: [32, 28, 24, 21, 19, 18, 14, 11] },
      'February': { minutes: '2,120', plays: [38, 30, 27, 24, 22, 19, 17, 12] },
      'March': { minutes: '2,410', plays: [45, 34, 31, 28, 25, 23, 21, 15] },
      'April': { minutes: '1,690', plays: [28, 25, 22, 19, 18, 15, 12, 10] },
      'May': { minutes: '2,950', plays: [52, 42, 38, 35, 30, 27, 24, 19] },
      'June': { minutes: '3,120', plays: [58, 48, 42, 38, 35, 31, 27, 22] }
    };
    return db[month] || db['March'];
  }

  /**
   * Safe parser for local storage items to prevent JSON syntax crash
   */
  _safeParseLocalStorage(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.warn(`Failed to parse local storage key "${key}". Resetting to default.`, e);
      return fallback;
    }
  }

  /**
   * Retrieve state property
   */
  get(key) {
    return this.state[key];
  }

  /**
   * Update state property, trigger listeners, and persist if necessary
   */
  set(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;

    // Synced storage keys
    switch(key) {
      case 'theme':
        localStorage.setItem('af_theme', value);
        document.documentElement.setAttribute('data-theme', value);
        break;
      case 'spotifyClientId':
        localStorage.setItem('af_spotify_client_id', value);
        break;
      case 'spotifyToken':
        if (value) {
          localStorage.setItem('af_spotify_token', JSON.stringify(value));
        } else {
          localStorage.removeItem('af_spotify_token');
        }
        break;
      case 'mockMode':
        localStorage.setItem('af_mock_mode', value.toString());
        break;
      case 'favorites':
        localStorage.setItem('af_favorites', JSON.stringify(value));
        break;
      case 'history':
        localStorage.setItem('af_history', JSON.stringify(value));
        break;
    }

    this.notify(key, value, oldValue);
  }

  /**
   * Add subscription callback for specified state property key
   * Returns unsubscribe cleanup method.
   */
  subscribe(key, callback) {
    if (!this.listeners[key]) {
      this.listeners[key] = [];
    }
    this.listeners[key].push(callback);
    return () => {
      this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
    };
  }

  /**
   * Execute callback list for property update
   */
  notify(key, newValue, oldValue) {
    if (this.listeners[key]) {
      this.listeners[key].forEach(callback => callback(newValue, oldValue));
    }
  }

  /* --- Helper Actions --- */

  /**
   * Toggle item in favorites list
   * @param {string} type - 'artists' or 'albums'
   * @param {object} item - Artist or album data object
   * @returns {boolean} - true if added, false if removed
   */
  toggleFavorite(type, item) {
    if (type !== 'artists' && type !== 'albums') return false;

    const favs = { ...this.state.favorites };
    const index = favs[type].findIndex(f => f.id === item.id);
    let isAdded = false;

    if (index > -1) {
      favs[type].splice(index, 1);
    } else {
      favs[type].push({
        id: item.id,
        name: item.name,
        image: item.image || item.images?.[0]?.url || 'https://placehold.co/300x300/161616/eaeaea?text=No+Art',
        genres: item.genres || null,
        releaseDate: item.release_date || null
      });
      isAdded = true;
    }

    this.set('favorites', favs);
    return isAdded;
  }

  /**
   * Check if item is in favorites list
   */
  isFavorite(type, id) {
    if (!this.state.favorites[type]) return false;
    return this.state.favorites[type].some(f => f.id === id);
  }

  /**
   * Push item to recently viewed history list (deduplicated)
   */
  addToHistory(item) {
    // Expected format: { type: 'artist' | 'album' | 'search', id, name, image, subtitle }
    let list = [...this.state.history];
    
    // Deduplicate existing match
    list = list.filter(h => !(h.type === item.type && (h.id === item.id || h.name === item.name)));
    
    list.unshift(item);

    // Enforce history capacity (max 20)
    if (list.length > 20) {
      list.pop();
    }

    this.set('history', list);
  }

  /**
   * Reset user search and navigation history
   */
  clearHistory() {
    this.set('history', []);
  }
}

export const store = new StateStore();
