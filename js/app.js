/* ==========================================================================
   Album Finder - Core Application Orchestrator & Router
   ========================================================================== */

import { store } from './state/store.js';
import { spotify } from './api/spotify.js';
import { uiRenderer, audioPlayer } from './utils/ui.js';

// Search debounce buffer
const SEARCH_DEBOUNCE_MS = 350;

class AppOrchestrator {
  constructor() {
    this.viewport = document.getElementById('main-viewport');
    
    // Back navigation stack
    this.navigationHistory = [];
    this.isBackNavigating = false;
    
    // Modals & Overlays
    this.modalOverlay = document.getElementById('modal-overlay');
    this.albumModal = document.getElementById('album-details-modal');
    this.settingsModal = document.getElementById('settings-modal');
    
    this.searchTimeout = null;
    this.suggestionFocusIdx = -1;
  }

  /**
   * Bootstrap the application and check auth queries
   */
  async init() {
    this._bindDOMEvents();
    this._setupStateSubscriptions();
    this._updateSpotifyPillState();
    
    // Check URL parameters for Spotify login credentials
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');
    const authError = urlParams.get('error');

    if (authCode) {
      uiRenderer.showToast('Exchanging Spotify authorization credentials...', 'info');
      try {
        await spotify.handleCallback(authCode);
      } catch (err) {
        console.error('OAuth Callback exchange failure:', err);
        uiRenderer.showToast('Spotify link failed. Loading Sandbox Demo Mode.', 'error');
      }
    } else if (authError) {
      uiRenderer.showToast(`Spotify Access Refused: ${authError}`, 'error');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Direct initial route
    this.navigateToView('home');
  }

  /**
   * Bind DOM triggers
   */
  _bindDOMEvents() {
    // Theme switching
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const currentTheme = store.get('theme');
        store.set('theme', currentTheme === 'dark' ? 'light' : 'dark');
      });
    }

    // Settings opening
    const settingsBtns = [
      document.getElementById('header-settings-btn'), 
      document.getElementById('mobile-settings-btn')
    ];
    settingsBtns.forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => this.openSettingsModal());
      }
    });

    // Spotify connection action
    const spotifyBtn = document.getElementById('spotify-connect-btn');
    if (spotifyBtn) {
      spotifyBtn.addEventListener('click', () => {
        const token = store.get('spotifyToken');
        if (token) {
          if (confirm('Disconnect Spotify credentials? Replayify will return to Developer Mock Mode.')) {
            store.set('spotifyToken', null);
            store.set('spotifyClientId', '');
            this._updateSpotifyPillState();
            uiRenderer.showToast('Spotify connection disconnected.', 'info');
            this.navigateToView('home');
          }
        } else {
          this.openSettingsModal();
        }
      });
    }

    // Share button clipboard copy
    const shareBtns = [
      document.getElementById('header-share-btn'), 
      document.getElementById('header-share-btn-mobile')
    ];
    shareBtns.forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => {
          const shareUrl = window.location.origin + window.location.pathname;
          navigator.clipboard.writeText(shareUrl)
            .then(() => uiRenderer.showToast("Replayify shareable link copied!", "success"))
            .catch(() => uiRenderer.showToast("Clipboard write permission block.", "error"));
        });
      }
    });

    // Back History navigation
    const backBtn = document.getElementById('header-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.navigateBack());
    }

    // Sidebar & Mobile Nav clicks routing
    const navButtons = document.querySelectorAll('.sidebar-link-btn, .mobile-nav-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetView = btn.dataset.view;
        if (targetView) {
          this.navigateToView(targetView);
        }
      });
    });

    // Event delegation for dynamically rendered Search Input
    document.addEventListener('input', (e) => {
      if (e.target.id === 'search-page-input') {
        this._handleSearchPageInput(e.target);
      }
    });

    document.addEventListener('click', (e) => {
      const clearBtn = e.target.closest('#search-page-clear-btn');
      if (clearBtn) {
        this._clearSearchPageInput();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.target.id === 'search-page-input') {
        this._handleSearchPageKeydown(e);
      }
    });

    // Modal closing triggers
    this.modalOverlay.addEventListener('click', () => this.closeActiveModals());
    document.getElementById('settings-close-btn').addEventListener('click', () => this.closeActiveModals());
    document.getElementById('modal-close-btn').addEventListener('click', () => this.closeActiveModals());
    
    // Save settings
    document.getElementById('settings-save-btn').addEventListener('click', () => this._saveSettingsForm());
    document.getElementById('copy-redirect-btn').addEventListener('click', () => this._copyRedirectURI());
    
    const mockToggle = document.getElementById('mock-mode-toggle');
    mockToggle.addEventListener('click', () => {
      const active = mockToggle.getAttribute('aria-checked') === 'true';
      mockToggle.setAttribute('aria-checked', (!active).toString());
      store.set('mockMode', !active);
    });

    // Global Key Esc handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeActiveModals();
    });

    // Event Delegation (Handles dynamic months lists, cards, song tables)
    this.viewport.addEventListener('click', (e) => this._delegateViewportClicks(e));
    this.albumModal.addEventListener('click', (e) => this._delegateViewportClicks(e));
  }

  /**
   * Bind Reactive Subscriptions to state store updates
   */
  _setupStateSubscriptions() {
    store.subscribe('currentView', (view) => {
      this._syncNavigationUI(view);
      this._renderView(view);
    });
    
    store.subscribe('viewData', () => this._renderView(store.get('currentView')));
    
    // Month updates
    store.subscribe('activeMonth', () => {
      this._renderView(store.get('currentView'), true); // true = bypass skeletons to prevent flash
    });

    store.subscribe('theme', (theme) => {
      const themeBtn = document.getElementById('theme-toggle-btn');
      if (!themeBtn) return;
      const sun = themeBtn.querySelector('.theme-icon-light');
      const moon = themeBtn.querySelector('.theme-icon-dark');
      if (sun && moon) {
        if (theme === 'light') {
          sun.style.display = 'none';
          moon.style.display = 'block';
        } else {
          sun.style.display = 'block';
          moon.style.display = 'none';
        }
      }
    });

    store.subscribe('favorites', () => {
      this._renderView(store.get('currentView'), true);
    });
    
    store.subscribe('spotifyToken', () => {
      this._updateSpotifyPillState();
    });
  }

  /**
   * Router View Manager with Back Navigation Stack
   */
  navigateToView(viewName, data = null) {
    this._hideSearchPageSuggestions();

    const currentView = store.get('currentView');
    const currentData = store.get('viewData');

    if (!this.isBackNavigating && currentView) {
      this.navigationHistory.push({ view: currentView, data: currentData });
      
      const backBtn = document.getElementById('header-back-btn');
      if (backBtn) backBtn.style.opacity = '1';
    }

    this.isBackNavigating = false;
    store.set('viewData', data);
    store.set('currentView', viewName);
  }

  navigateBack() {
    if (this.navigationHistory.length === 0) {
      uiRenderer.showToast("No navigation history.", "info");
      return;
    }

    const previousRoute = this.navigationHistory.pop();
    
    if (this.navigationHistory.length === 0) {
      const backBtn = document.getElementById('header-back-btn');
      if (backBtn) backBtn.style.opacity = '0.4';
    }

    this.isBackNavigating = true;
    
    this._syncNavigationUI(previousRoute.view);

    store.set('viewData', previousRoute.data);
    store.set('currentView', previousRoute.view);
  }

  _syncNavigationUI(viewName) {
    const navButtons = document.querySelectorAll('.sidebar-link-btn, .mobile-nav-btn');
    navButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });
  }

  async _renderView(viewName, bypassSkeleton = false) {
    if (!this.viewport) return;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (!bypassSkeleton) {
      this.viewport.innerHTML = uiRenderer.renderGridSkeleton(6);
    }

    try {
      switch(viewName) {
        case 'home':
          const trending = await spotify.getTrendingArtists();
          const releases = await spotify.getNewReleases();
          this.viewport.innerHTML = uiRenderer.renderHomeView(trending, releases);
          break;

        case 'search':
          const query = store.get('searchQuery');
          const results = await spotify.search(query);
          this.viewport.innerHTML = uiRenderer.renderSearchView(results, query, true);
          break;

        case 'artist':
          const artistId = store.get('viewData')?.artistId;
          if (!artistId) return this.navigateToView('home');
          
          const artist = await spotify.getArtist(artistId);
          const topTracks = await spotify.getArtistTopTracks(artistId);
          const albums = await spotify.getArtistAlbums(artistId);
          
          this.viewport.innerHTML = uiRenderer.renderArtistProfileView(artist, topTracks, albums);
          break;

        case 'library':
          const favs = store.get('favorites');
          const history = store.get('history');
          this.viewport.innerHTML = uiRenderer.renderLibraryView(favs, history);
          break;
      }
    } catch (e) {
      console.error(`Render view failure "${viewName}":`, e);
      this.viewport.innerHTML = `
        <div style="text-align: center; padding: 80px 20px;">
          <i class="ri-error-warning-line" style="font-size: 3.5rem; color: var(--explicit-red); margin-bottom: 20px; display: inline-block;"></i>
          <h2 style="font-size: 1.3rem; font-weight: 800; margin-bottom: 8px;">Network lost or resource block</h2>
          <p style="color: var(--text-secondary); font-size: 0.85rem; max-width: 360px; margin: 0 auto 20px auto;">
            We couldn't connect to Spotify servers. Connect your app configs or check connections.
          </p>
          <button class="pill-btn active" style="margin: 0 auto;" onclick="location.reload()">Retry Connection</button>
        </div>
      `;
    }
  }

  /* --- Inline Search view input handlers --- */

  _handleSearchPageInput(input) {
    const val = input.value.trim();
    const clearBtn = document.getElementById('search-page-clear-btn');
    if (clearBtn) clearBtn.style.display = val ? 'flex' : 'none';

    if (!val) {
      this._hideSearchPageSuggestions();
      return;
    }

    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(async () => {
      try {
        const results = await spotify.search(val);
        this._showSearchPageSuggestions(results);
      } catch (err) {
        console.warn("Failed suggestions fetch:", err);
      }
    }, SEARCH_DEBOUNCE_MS);
  }

  _showSearchPageSuggestions(results) {
    const suggestionsDropdown = document.getElementById('search-page-suggestions');
    if (!suggestionsDropdown) return;

    const list = [
      ...(results.artists || []).slice(0, 3).map(a => ({ type: 'artist', id: a.id, name: a.name, image: a.images?.[0]?.url, subtitle: 'Artist' })),
      ...(results.albums || []).slice(0, 3).map(al => ({ type: 'album', id: al.id, name: al.name, image: al.images?.[0]?.url, subtitle: `${al.artists?.[0]?.name} &bull; Album` }))
    ];

    if (list.length === 0) {
      this._hideSearchPageSuggestions();
      return;
    }

    this.suggestionFocusIdx = -1;
    suggestionsDropdown.innerHTML = list.map(item => `
      <div class="suggestion-item" data-type="${item.type}" data-id="${item.id}" data-name="${item.name.replace(/"/g, '&quot;')}" data-image="${item.image || ''}">
        <img src="${item.image || 'https://placehold.co/100x100/161616/eaeaea?text=Art'}" alt="" class="suggestion-art ${item.type === 'artist' ? 'artist-art' : ''}">
        <div class="suggestion-meta">
          <div class="suggestion-title">${item.name}</div>
          <div class="suggestion-subtitle">${item.subtitle}</div>
        </div>
      </div>
    `).join('');
    
    suggestionsDropdown.style.display = 'block';
  }

  _hideSearchPageSuggestions() {
    const suggestionsDropdown = document.getElementById('search-page-suggestions');
    if (suggestionsDropdown) suggestionsDropdown.style.display = 'none';
    this.suggestionFocusIdx = -1;
  }

  _clearSearchPageInput() {
    const input = document.getElementById('search-page-input');
    if (input) {
      input.value = '';
      input.focus();
    }
    const clearBtn = document.getElementById('search-page-clear-btn');
    if (clearBtn) clearBtn.style.display = 'none';
    this._hideSearchPageSuggestions();
  }

  _handleSearchPageKeydown(e) {
    const suggestionsDropdown = document.getElementById('search-page-suggestions');
    if (!suggestionsDropdown) return;
    const items = suggestionsDropdown.querySelectorAll('.suggestion-item');
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (items.length === 0) return;
      this.suggestionFocusIdx = (this.suggestionFocusIdx + 1) % items.length;
      this._focusSuggestionItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length === 0) return;
      this.suggestionFocusIdx = (this.suggestionFocusIdx - 1 + items.length) % items.length;
      this._focusSuggestionItem(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.suggestionFocusIdx > -1 && items[this.suggestionFocusIdx]) {
        items[this.suggestionFocusIdx].click();
      } else {
        const query = e.target.value.trim();
        if (query) {
          this._hideSearchPageSuggestions();
          store.set('searchQuery', query);
          store.addToHistory({ type: 'search', id: query, name: `Search: "${query}"`, image: '', subtitle: 'Query Search' });
          this._renderView('search', true);
        }
      }
    }
  }

  _focusSuggestionItem(items) {
    items.forEach((item, idx) => {
      if (idx === this.suggestionFocusIdx) {
        item.classList.add('focused');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('focused');
      }
    });
  }

  /* --- Clicks Delegation & Routings --- */

  _delegateViewportClicks(e) {
    // Hide search suggestions on click outside
    if (!e.target.closest('.input-bezel-wrapper') && !e.target.closest('#search-page-suggestions')) {
      this._hideSearchPageSuggestions();
    }

    // 1. Click Month Slider Navigation Tab
    const monthTab = e.target.closest('.month-tab-btn');
    if (monthTab) {
      const month = monthTab.dataset.month;
      store.set('activeMonth', month);
      uiRenderer.showToast(`Updated statistics calculations for ${month}.`, 'success');
      return;
    }

    // 2. Click Artist Card (Standard or Ranked cards)
    const artistCard = e.target.closest('.artist-card') || e.target.closest('.ranked-artist-card') || e.target.closest('#modal-artist-link') || e.target.closest('.history-pill-card[data-artist-id]');
    if (artistCard) {
      const artistId = artistCard.dataset.artistId;
      const artistName = artistCard.dataset.artistName || artistCard.querySelector('.card-title')?.textContent || artistCard.querySelector('.ranked-card-title')?.textContent || 'Artist Details';
      const artistImg = artistCard.dataset.artistImage || artistCard.querySelector('.artist-card-art')?.src || artistCard.querySelector('.ranked-artist-img')?.src || '';
      
      store.addToHistory({ type: 'artist', id: artistId, name: artistName, image: artistImg, subtitle: 'Artist Page' });
      this.closeActiveModals();
      this.navigateToView('artist', { artistId });
      return;
    }

    // 3. Click Album Card
    const albumCard = e.target.closest('.album-card') || e.target.closest('.history-pill-card[data-album-id]');
    if (albumCard) {
      const albumId = albumCard.dataset.albumId;
      const albumName = albumCard.dataset.albumName || albumCard.querySelector('.card-title')?.textContent || 'Album Detail';
      const albumImg = albumCard.dataset.albumImage || albumCard.querySelector('.album-card-art')?.src || '';
      const artistName = albumCard.dataset.albumArtist || albumCard.querySelector('.card-subtitle')?.textContent || 'Artist Name';
      
      store.addToHistory({ type: 'album', id: albumId, name: albumName, image: albumImg, subtitle: artistName });
      this.openAlbumDetailsModal(albumId);
      return;
    }

    // 4. Click Suggestion Row
    const suggestionItem = e.target.closest('.suggestion-item');
    if (suggestionItem) {
      const { type, id, name, image } = suggestionItem.dataset;
      this._clearSearchPageInput();
      
      if (type === 'artist') {
        store.addToHistory({ type: 'artist', id, name, image, subtitle: 'Artist Page' });
        this.navigateToView('artist', { artistId: id });
      } else {
        store.addToHistory({ type: 'album', id, name, image, subtitle: 'Album Details' });
        this.openAlbumDetailsModal(id);
      }
      return;
    }

    // 5. Favorite Album Toggle
    const favAlbumBtn = e.target.closest('.fav-album-btn') || e.target.closest('.toggle-modal-fav-btn');
    if (favAlbumBtn) {
      const { albumId, albumName, albumImage, albumArtist, albumYear } = favAlbumBtn.dataset;
      const added = store.toggleFavorite('albums', { id: albumId, name: albumName, image: albumImage, artists: [{ name: albumArtist }], release_date: albumYear });
      
      favAlbumBtn.classList.toggle('active', added);
      const icon = favAlbumBtn.querySelector('i');
      if (icon) icon.className = added ? 'ri-heart-3-fill' : 'ri-heart-3-line';
      
      uiRenderer.showToast(added ? `Saved "${albumName}" to library.` : `Removed "${albumName}" from library.`, 'success');
      return;
    }

    // 6. Favorite Artist Toggle
    const favArtistBtn = e.target.closest('.fav-artist-btn');
    if (favArtistBtn) {
      const { artistId, artistName, artistImage, artistFollowers } = favArtistBtn.dataset;
      const added = store.toggleFavorite('artists', { id: artistId, name: artistName, image: artistImage, followers: { total: parseInt(artistFollowers?.replace(/,/g, '')) || 0 } });
      
      favArtistBtn.classList.toggle('active', added);
      const icon = favArtistBtn.querySelector('i');
      if (icon) icon.className = added ? 'ri-heart-3-fill' : 'ri-heart-3-line';
      
      uiRenderer.showToast(added ? `Followed artist "${artistName}".` : `Unfollowed artist "${artistName}".`, 'success');
      return;
    }

    // 7. Click Song Row Preview Play
    const trackRow = e.target.closest('.track-row-item');
    if (trackRow) {
      const { trackId, trackName, trackArtist, trackImage, previewUrl } = trackRow.dataset;
      if (previewUrl) {
        audioPlayer.play({ id: trackId, name: trackName, artist: trackArtist, image: trackImage, previewUrl });
      } else {
        uiRenderer.showToast("Spotify preview streams unavailable for this track.", "warning");
      }
      return;
    }

    // 8. Grid/List togglers
    const gridToggle = e.target.closest('#search-grid-toggle');
    if (gridToggle) {
      this._toggleSearchLayout(true);
      return;
    }

    const listToggle = e.target.closest('#search-list-toggle');
    if (listToggle) {
      this._toggleSearchLayout(false);
      return;
    }

    // 9. Copy album link
    const copyLinkBtn = e.target.closest('.copy-album-link-btn');
    if (copyLinkBtn) {
      navigator.clipboard.writeText(copyLinkBtn.dataset.url)
        .then(() => uiRenderer.showToast("Album share link copied!", "success"))
        .catch(() => uiRenderer.showToast("Failed to copy link.", "error"));
      return;
    }

    // 10. Reset library data
    const clearLibHistory = e.target.closest('#clear-lib-history-btn');
    if (clearLibHistory) {
      if (confirm('Are you sure you want to reset all saved library data, history and favorites?')) {
        store.clearHistory();
        store.set('favorites', { artists: [], albums: [] });
        uiRenderer.showToast('Library data reset complete.', 'info');
      }
      return;
    }
  }

  /* --- Modal triggers --- */

  async openAlbumDetailsModal(albumId) {
    this.modalOverlay.style.display = 'block';
    this.albumModal.querySelector('.modal-body-scroller').innerHTML = `
      <div style="padding: 40px; text-align: center;">
        <div class="skeleton-box" style="width: 70px; height: 70px; border-radius: 50%; margin: 0 auto 16px auto;"></div>
        <div class="skeleton-box" style="width: 180px; height: 20px; margin: 0 auto 10px auto;"></div>
        <div class="skeleton-box" style="width: 100px; height: 14px; margin: 0 auto;"></div>
      </div>
    `;
    this.albumModal.style.display = 'block';

    try {
      const album = await spotify.getAlbum(albumId);
      this.albumModal.querySelector('.modal-body-scroller').innerHTML = uiRenderer.renderAlbumDetailModalContent(album);
    } catch (err) {
      this.albumModal.querySelector('.modal-body-scroller').innerHTML = `
        <div style="padding: 40px; text-align: center;">
          <i class="ri-error-warning-line" style="font-size: 3rem; color: var(--explicit-red); margin-bottom: 16px; display: inline-block;"></i>
          <h3>Failed to load Album</h3>
          <p style="color: var(--text-secondary); margin-bottom: 20px;">Resource request timed out.</p>
          <button class="pill-btn active" style="margin: 0 auto;" onclick="orchestrator.closeActiveModals()">Close</button>
        </div>
      `;
    }
  }

  openSettingsModal() {
    document.getElementById('settings-client-id').value = store.get('spotifyClientId');
    
    const isMock = store.get('mockMode');
    const mockSwitch = document.getElementById('mock-mode-toggle');
    mockSwitch.setAttribute('aria-checked', isMock.toString());

    this.modalOverlay.style.display = 'block';
    this.settingsModal.style.display = 'block';
  }

  closeActiveModals() {
    this.modalOverlay.style.display = 'none';
    this.albumModal.style.display = 'none';
    this.settingsModal.style.display = 'none';
    this._hideSuggestions();
  }

  _saveSettingsForm() {
    const clientId = document.getElementById('settings-client-id').value.trim();
    store.set('spotifyClientId', clientId);
    
    const mockSwitch = document.getElementById('mock-mode-toggle');
    const isMock = mockSwitch.getAttribute('aria-checked') === 'true';
    store.set('mockMode', isMock);

    this.closeActiveModals();
    uiRenderer.showToast('Settings saved successfully.', 'success');

    const token = store.get('spotifyToken');
    if (clientId && !isMock && !token) {
      if (confirm('A Spotify Client ID was configured. Connect Spotify directly?')) {
        spotify.login();
      }
    } else {
      this._renderView(store.get('currentView'));
    }
  }

  _copyRedirectURI() {
    const redirectInput = document.getElementById('settings-redirect-uri');
    navigator.clipboard.writeText(redirectInput.value)
      .then(() => uiRenderer.showToast('Redirect URI copied!', 'success'))
      .catch(() => uiRenderer.showToast('Failed to copy URI.', 'error'));
  }

  _updateSpotifyPillState() {
    const token = store.get('spotifyToken');
    const spotifyConnectBtn = document.getElementById('spotify-connect-btn');
    if (!spotifyConnectBtn) return;
    const label = spotifyConnectBtn.querySelector('.btn-text');
    if (!label) return;

    if (token) {
      spotifyConnectBtn.className = 'spotify-status-pill connection-active';
      label.textContent = 'Connected';
    } else {
      spotifyConnectBtn.className = 'spotify-status-pill connection-inactive';
      label.textContent = 'Connect Spotify';
    }
  }

  _toggleSearchLayout(gridMode) {
    const currentQuery = store.get('searchQuery');
    this.viewport.innerHTML = uiRenderer.renderGridSkeleton(6);
    spotify.search(currentQuery).then(results => {
      this.viewport.innerHTML = uiRenderer.renderSearchView(results, currentQuery, gridMode);
    });
  }
}

export const orchestrator = new AppOrchestrator();

// Bootstrap application on content load
window.addEventListener('DOMContentLoaded', () => orchestrator.init());
