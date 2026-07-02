/* ==========================================================================
   Album Finder - Settings Modal Component
   ========================================================================== */

import { store } from '../state/store.js';
import { spotify } from '../api/spotify.js';
import { toast } from './toast.js';

class SettingsModalController {
  constructor() {
    // Elements will be initialized dynamically upon opening to ensure DOM availability
    this.modalOverlay = null;
    this.settingsModal = null;
    this.clientIdInput = null;
    this.redirectUriInput = null;
    this.saveBtn = null;
    this.connectBtn = null;
    this.copyBtn = null;
    this.closeBtn = null;
  }

  _initElements() {
    this.modalOverlay = document.getElementById('modal-overlay');
    this.settingsModal = document.getElementById('settings-modal');
    this.clientIdInput = document.getElementById('settings-client-id');
    this.redirectUriInput = document.getElementById('settings-redirect-uri');
    this.saveBtn = document.getElementById('settings-save-btn');
    this.connectBtn = document.getElementById('settings-connect-btn');
    this.copyBtn = document.getElementById('copy-redirect-btn');
    this.closeBtn = document.getElementById('settings-close-btn');
  }

  _bindEvents() {
    if (this._eventsBound) return;

    if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.close());
    if (this.saveBtn) this.saveBtn.addEventListener('click', () => this.save());
    if (this.connectBtn) this.connectBtn.addEventListener('click', () => this.connectSpotify());
    if (this.copyBtn) this.copyBtn.addEventListener('click', () => this.copyRedirectURI());

    this._eventsBound = true;
  }

  open() {
    this._initElements();
    this._bindEvents();

    if (this.clientIdInput) {
      this.clientIdInput.value = store.get('spotifyClientId') || '';
    }
    if (this.redirectUriInput) {
      this.redirectUriInput.value = spotify.redirectUri || '';
    }

    if (this.modalOverlay) this.modalOverlay.style.display = 'block';
    if (this.settingsModal) this.settingsModal.style.display = 'block';
  }

  close() {
    this._initElements();
    if (this.modalOverlay) this.modalOverlay.style.display = 'none';
    if (this.settingsModal) this.settingsModal.style.display = 'none';
  }

  save() {
    if (!this.clientIdInput) return;
    const clientId = this.clientIdInput.value.trim();
    store.set('spotifyClientId', clientId);
    store.set('mockMode', false);

    this.close();
    toast.show('Settings saved successfully.', 'success');

    const token = store.get('spotifyToken');
    if (clientId && !token) {
      if (confirm('A Spotify Client ID was configured. Connect Spotify directly?')) {
        this.connectSpotify();
      }
    }
  }

  connectSpotify() {
    if (!this.clientIdInput) return;
    const clientId = this.clientIdInput.value.trim();
    if (!clientId) {
      toast.show('Please enter your Spotify Client ID first.', 'warning');
      return;
    }
    store.set('spotifyClientId', clientId);
    store.set('mockMode', false);
    store.set('spotifyToken', null);
    
    this.close();
    toast.show('Redirecting to Spotify...', 'info');
    spotify.login().catch(err => {
      console.error("Login redirect failure:", err);
      toast.show(err.message || 'OAuth initiation failed.', 'error');
    });
  }

  copyRedirectURI() {
    if (!this.redirectUriInput) return;
    navigator.clipboard.writeText(this.redirectUriInput.value)
      .then(() => toast.show('Redirect URI copied!', 'success'))
      .catch(() => toast.show('Failed to copy URI.', 'error'));
  }
}

export const settingsModal = new SettingsModalController();
