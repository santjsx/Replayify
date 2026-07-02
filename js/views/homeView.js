/* ==========================================================================
   Album Finder - Home View Controller
   ========================================================================== */

import { BaseView } from './baseView.js';
import { store } from '../state/store.js';
import { musicService } from '../api/musicService.js';
import { settingsModal } from '../components/settingsModal.js';
import { audioPlayer } from '../components/audioPlayer.js';
import { albumModal } from '../components/albumModal.js';
import { toast } from '../components/toast.js';

export class HomeView extends BaseView {
  constructor(viewport) {
    super(viewport);
    this.topArtists = [];
    this.topTracks = [];
  }

  async init(data) {
    await super.init(data);
    const token = store.get('spotifyToken');
    const isMock = store.get('mockMode');

    if (token || isMock) {
      try {
        this.topArtists = await musicService.getUserTopArtists();
        this.topTracks = await musicService.getUserTopTracks();
      } catch (err) {
        console.error("Failed to load user data:", err);
      }
    }
  }

  render() {
    const token = store.get('spotifyToken');
    const isMock = store.get('mockMode');

    if (!token && !isMock) {
      this.viewport.innerHTML = this.renderSpotifyLandingView();
      return;
    }

    const activeMonth = store.get('activeMonth') || 'March';
    const stats = store.getSimulatedStats();
    
    const rawMinutes = parseInt(stats.minutes.replace(/,/g, '')) || 2410;
    const artistMinutes = [
      Math.round(rawMinutes * 0.44), 
      Math.round(rawMinutes * 0.22), 
      Math.round(rawMinutes * 0.14), 
      Math.round(rawMinutes * 0.10)
    ];

    const months = [
      { short: 'Jan', full: 'January' },
      { short: 'Feb', full: 'February' },
      { short: 'Mar', full: 'March' },
      { short: 'Apr', full: 'April' },
      { short: 'May', full: 'May' },
      { short: 'Jun', full: 'June' }
    ];

    const monthTabsHtml = months.map(m => `
      <button class="month-tab-btn ${m.full === activeMonth ? 'active' : ''}" data-month="${m.full}">
        ${m.short}
      </button>
    `).join('');

    const rankedArtistsHtml = this.topArtists.slice(0, 4).map((artist, idx) => {
      const image = artist.images?.[0]?.url || artist.image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=100&h=100&q=80';
      return `
        <div class="ranked-artist-card" data-artist-id="${artist.id}" data-artist-name="${artist.name.replace(/"/g, '&quot;')}" data-artist-image="${image}">
          <img src="${image}" alt="${artist.name}" class="ranked-artist-img" loading="lazy">
          <span class="ranked-number-badge">${idx + 1}</span>
          <div class="ranked-card-overlay">
            <h4 class="ranked-card-title">${artist.name}</h4>
            <p class="ranked-card-desc">${artistMinutes[idx] ? artistMinutes[idx].toLocaleString() : '0'} minutes</p>
          </div>
        </div>
      `;
    }).join('');

    const songsHtml = this.topTracks.slice(0, 8).map((t, idx) => {
      const image = t.album?.images?.[0]?.url || t.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&h=100&q=80';
      const artistName = t.artists?.[0]?.name || t.artist || 'Unknown Artist';
      const plays = 52 - (idx * 4);
      return `
        <div class="replay-song-row track-row-item" data-track-id="${t.id}" data-preview-url="${t.preview_url || ''}" 
             data-track-name="${t.name.replace(/"/g, '&quot;')}" 
             data-track-artist="${artistName.replace(/"/g, '&quot;')}"
             data-track-image="${image}">
          <div class="song-row-left">
            <span class="song-row-star"><i class="ri-star-fill" style="color: #ff2d55; font-size: 0.65rem;"></i></span>
            <span class="song-row-rank">${idx + 1}</span>
            <img src="${image}" alt="" class="song-row-thumb">
            <div class="song-row-meta">
              <div class="song-row-title">
                <span class="song-row-title-text">${t.name}</span>
                ${t.explicit ? '<span class="explicit-badge" style="background: var(--explicit-red); color: white; font-size: 0.58rem; padding: 0.5px 3.5px; border-radius: 2px; flex-shrink: 0;">E</span>' : ''}
              </div>
              <div class="song-row-subtitle">${artistName} &bull; ${plays} plays</div>
            </div>
          </div>
          <div class="song-row-right">
            <button class="song-row-circle-btn" aria-label="Song actions"><i class="ri-arrow-down-circle-line" style="color: var(--text-secondary); font-size: 1rem;"></i></button>
            <button class="song-row-action-btn" aria-label="Song options"><i class="ri-more-fill"></i></button>
          </div>
        </div>
      `;
    }).join('');

    const uniqueAlbums = [];
    const albumIds = new Set();
    this.topTracks.forEach(t => {
      if (t.album && !albumIds.has(t.album.id)) {
        albumIds.add(t.album.id);
        uniqueAlbums.push(t.album);
      }
    });

    const albumsHtml = uniqueAlbums.slice(0, 6).map(album => {
      const image = album.images?.[0]?.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80';
      const artistName = album.artists?.[0]?.name || 'Unknown Artist';
      return `
        <div class="album-art-only-card album-card" data-album-id="${album.id}" 
             data-album-name="${album.name.replace(/"/g, '&quot;')}" 
             data-album-image="${image}"
             data-album-artist="${artistName.replace(/"/g, '&quot;')}"
             style="cursor: pointer; flex: 0 0 170px; aspect-ratio: 1/1; border-radius: 8px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.5);">
          <img src="${image}" alt="${album.name}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s var(--physics-transition);" class="album-art-only-img">
        </div>
      `;
    }).join('');

    this.viewport.innerHTML = `
      <section style="margin-top: 10px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h1 style="font-family: 'Outfit', sans-serif; font-size: 3rem; font-weight: 900; tracking-tight; line-height: 1; letter-spacing: -0.04em;">Replay</h1>
          <div class="pill-btn active" style="font-size: 0.8rem; padding: 4px 12px; background: rgba(255, 255, 255, 0.08); color: var(--text-primary); border-color: rgba(255, 255, 255, 0.06);">
            2026 <i class="ri-arrow-down-s-line"></i>
          </div>
        </div>
        
        <div class="month-slider-container">
          ${monthTabsHtml}
        </div>
        
        <h2 style="font-size: 1.45rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 12px; font-family: 'Outfit', sans-serif;">
          You listened for <span style="color: var(--text-primary); font-weight: 800;">${stats.minutes} minutes</span> in ${activeMonth}.
        </h2>
      </section>

      <section style="margin-bottom: 36px;">
        <div class="section-headline-wrap" style="margin-bottom: 16px;">
          <h3 class="section-title" style="font-size: 1.25rem; font-weight: 800;">Your Top Artists <i class="ri-arrow-right-s-line" style="font-size: 1.1rem; color: var(--text-tertiary);"></i></h3>
        </div>
        <div class="ranked-artists-slider">
          ${rankedArtistsHtml || '<div style="color: var(--text-tertiary); padding: 20px 0;">No top artists recorded.</div>'}
        </div>
      </section>

      <section style="margin-bottom: 36px;">
        <div class="section-headline-wrap" style="margin-bottom: 16px;">
          <h3 class="section-title" style="font-size: 1.25rem; font-weight: 800;">Your Top Songs <i class="ri-arrow-right-s-line" style="font-size: 1.1rem; color: var(--text-tertiary);"></i></h3>
        </div>
        <div class="replay-songs-grid">
          ${songsHtml || '<div style="color: var(--text-tertiary); padding: 20px 0;">No top songs recorded.</div>'}
        </div>
      </section>

      <section style="margin-bottom: 20px;">
        <div class="section-headline-wrap" style="margin-bottom: 16px;">
          <h3 class="section-title" style="font-size: 1.25rem; font-weight: 800;">Your Top Albums <i class="ri-arrow-right-s-line" style="font-size: 1.1rem; color: var(--text-tertiary);"></i></h3>
        </div>
        <div class="ranked-artists-slider" style="padding-bottom: 8px;">
          ${albumsHtml || '<div style="color: var(--text-tertiary); padding: 20px 0;">No top albums recorded.</div>'}
        </div>
      </section>
    `;
  }

  bindEvents() {
    this.viewport.addEventListener('click', this._onViewportClick);
  }

  destroy() {
    this.viewport.removeEventListener('click', this._onViewportClick);
  }

  _onViewportClick = (e) => {
    // 1. Month Tab Clicks
    const monthTab = e.target.closest('.month-tab-btn');
    if (monthTab) {
      const month = monthTab.dataset.month;
      store.set('activeMonth', month);
      toast.show(`Updated statistics calculations for ${month}.`, 'success');
      return;
    }

    // 2. Connect Spotify Click (Landing View)
    const connectBtn = e.target.closest('#landing-connect-btn');
    if (connectBtn) {
      settingsModal.open();
      return;
    }

    // 3. Try Mock Mode Click (Landing View)
    const demoBtn = e.target.closest('#landing-demo-btn');
    if (demoBtn) {
      store.set('mockMode', true);
      toast.show('Demo sandbox mode activated.', 'success');
      if (window.router) {
        window.router.navigateToView('home');
      }
      return;
    }

    // 4. Click Ranked Artist Card -> Navigate
    const artistCard = e.target.closest('.ranked-artist-card');
    if (artistCard) {
      const { artistId, artistName, artistImage } = artistCard.dataset;
      store.addToHistory({ type: 'artist', id: artistId, name: artistName, image: artistImage, subtitle: 'Artist Page' });
      if (window.router) {
        window.router.navigateToView('artist', { artistId });
      }
      return;
    }

    // 5. Click Album Card -> Open Details Modal
    const albumCard = e.target.closest('.album-card');
    if (albumCard) {
      const { albumId, albumName, albumImage, albumArtist } = albumCard.dataset;
      store.addToHistory({ type: 'album', id: albumId, name: albumName, image: albumImage, subtitle: albumArtist || 'Album Details' });
      albumModal.open(albumId);
      return;
    }

    // 6. Click Song Row Play
    const trackRow = e.target.closest('.track-row-item');
    if (trackRow) {
      const { trackId, trackName, trackArtist, trackImage, previewUrl } = trackRow.dataset;
      if (previewUrl) {
        audioPlayer.play({ id: trackId, name: trackName, artist: trackArtist, image: trackImage, previewUrl });
      } else {
        toast.show("Spotify preview streams unavailable for this track.", "warning");
      }
      return;
    }
  }

  renderSpotifyLandingView() {
    return `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 65vh; text-align: center; padding: 40px 16px;">
        <div class="bezel-container" style="max-width: 500px; padding: 8px; margin-bottom: 24px; animation: modalEnter 0.5s cubic-bezier(0.16, 1, 0.3, 1);">
          <div class="inner-card" style="padding: 40px 24px; align-items: center; background: rgba(18, 18, 22, 0.4); backdrop-filter: blur(20px);">
            <i class="ri-spotify-fill" style="font-size: 5rem; color: #1db954; text-shadow: 0 0 40px rgba(29,185,84,0.3); margin-bottom: 20px;"></i>
            <h1 style="font-family: 'Outfit', sans-serif; font-size: 2.2rem; font-weight: 900; margin-bottom: 12px; letter-spacing: -0.5px; color: var(--text-primary);">Your Listening Recap</h1>
            <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6; margin-bottom: 30px;">
              Connect your Spotify account to calculate your personal Replay statistics, top artists, tracks, and albums.
            </p>
            <div style="display: flex; flex-direction: column; gap: 10px; width: 100%;">
              <button id="landing-connect-btn" class="pill-btn active" style="padding: 14px 32px; font-size: 1rem; background: #1db954; border-color: #1db954; box-shadow: 0 10px 20px rgba(29,185,84,0.2); font-weight: 700; width: 100%;">
                Connect Spotify Account
              </button>
              <button id="landing-demo-btn" class="pill-btn" style="padding: 12px 32px; font-size: 0.9rem; background: transparent; border-color: rgba(255,255,255,0.15); font-weight: 600; width: 100%;">
                Try Mock Demo Mode
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
