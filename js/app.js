/* ==========================================================================
   Album Finder - Core Application Orchestrator & Bootstrapper
   ========================================================================== */

import { store } from './state/store.js';
import { spotify } from './api/spotify.js';
import { router } from './router.js';
import { toast } from './components/toast.js';
import { settingsModal } from './components/settingsModal.js';
import { albumModal } from './components/albumModal.js';
import { audioPlayer } from './components/audioPlayer.js';

// Views
import { HomeView } from './views/homeView.js';
import { SearchView } from './views/searchView.js';
import { ArtistView } from './views/artistView.js';
import { LibraryView } from './views/libraryView.js';

class AppOrchestrator {
  constructor() {
    this.viewport = document.getElementById('main-viewport');
  }

  /**
   * Bootstrap the application, registers routes, and checks OAuth callbacks
   */
  async init() {
    // 1. Register View Controllers
    router.register('home', new HomeView(this.viewport));
    router.register('search', new SearchView(this.viewport));
    router.register('artist', new ArtistView(this.viewport));
    router.register('library', new LibraryView(this.viewport));

    // 2. Bind DOM and Store events
    this._bindDOMEvents();
    this._setupStateSubscriptions();
    this._updateSpotifyPillState();
    
    // 3. Handle OAuth login callback if present in URI
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');
    const authError = urlParams.get('error');

    if (authCode) {
      toast.show('Exchanging Spotify authorization credentials...', 'info');
      try {
        await spotify.handleCallback(authCode);
        toast.show('Spotify connected successfully!', 'success');
      } catch (err) {
        console.error('OAuth Callback exchange failure:', err);
        toast.show('Spotify connection failed. Reverting to Mock Sandbox.', 'error');
        window.history.replaceState({}, document.title, window.location.pathname);
        store.set('mockMode', true);
      }
    } else if (authError) {
      toast.show(`Spotify Access Refused: ${authError}`, 'error');
      window.history.replaceState({}, document.title, window.location.pathname);
      store.set('mockMode', true);
    }

    // 4. Initial route navigation
    router.navigateToView('home');
  }

  /**
   * Bind global DOM buttons (Sidebar, theme togglers, back buttons)
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

    // Settings modal opening
    const settingsBtns = [
      document.getElementById('header-settings-btn'), 
      document.getElementById('mobile-settings-btn')
    ];
    settingsBtns.forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => settingsModal.open());
      }
    });

    // Spotify status pill connectivity toggle
    const spotifyBtn = document.getElementById('spotify-connect-btn');
    if (spotifyBtn) {
      spotifyBtn.addEventListener('click', () => {
        const token = store.get('spotifyToken');
        if (token) {
          if (confirm('Disconnect Spotify credentials? Replayify will return to Developer Mock Mode.')) {
            store.set('spotifyToken', null);
            store.set('spotifyClientId', '');
            this._updateSpotifyPillState();
            toast.show('Spotify connection disconnected.', 'info');
            router.navigateToView('home');
          }
        } else {
          settingsModal.open();
        }
      });
    }

    // Share link copying
    const shareBtns = [
      document.getElementById('header-share-btn'), 
      document.getElementById('header-share-btn-mobile')
    ];
    shareBtns.forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => {
          const shareUrl = window.location.origin + window.location.pathname;
          navigator.clipboard.writeText(shareUrl)
            .then(() => toast.show("Replayify shareable link copied!", "success"))
            .catch(() => toast.show("Clipboard write permission blocked.", "error"));
        });
      }
    });

    // History Nav Back Button
    const backBtn = document.getElementById('header-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => router.navigateBack());
    }

    // Sidebar & Mobile bottom nav links
    const navButtons = document.querySelectorAll('.sidebar-link-btn, .mobile-nav-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetView = btn.dataset.view;
        if (targetView) {
          router.navigateToView(targetView);
        }
      });
    });

    // Overlay clicks to close open modals
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', () => {
        settingsModal.close();
        albumModal.close();
      });
    }

    // Global keyboard Escape modal dismissal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        settingsModal.close();
        albumModal.close();
      }
    });
  }

  /**
   * Bind subscriptions to change application layouts dynamically on state updates
   */
  _setupStateSubscriptions() {
    // Re-mount active view without showing skeleton to prevent screen flickering
    store.subscribe('activeMonth', () => {
      router.mountView(store.get('currentView'), store.get('viewData'), true);
    });

    store.subscribe('favorites', () => {
      router.mountView(store.get('currentView'), store.get('viewData'), true);
    });

    store.subscribe('spotifyToken', () => {
      this._updateSpotifyPillState();
      router.mountView(store.get('currentView'), store.get('viewData'), true);
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
}

export const orchestrator = new AppOrchestrator();
window.orchestrator = orchestrator; // Exposed for backcompat references if needed

// Boot application
window.addEventListener('DOMContentLoaded', () => orchestrator.init());
