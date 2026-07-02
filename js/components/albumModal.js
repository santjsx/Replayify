/* ==========================================================================
   Album Finder - Album Details Modal Component
   ========================================================================== */

import { store } from '../state/store.js';
import { musicService } from '../api/musicService.js';
import { audioPlayer } from './audioPlayer.js';
import { toast } from './toast.js';

class AlbumModalController {
  constructor() {
    this.modalOverlay = null;
    this.albumModal = null;
    this.scroller = null;
    this._eventsBound = false;
  }

  _initElements() {
    this.modalOverlay = document.getElementById('modal-overlay');
    this.albumModal = document.getElementById('album-details-modal');
    if (this.albumModal) {
      this.scroller = this.albumModal.querySelector('.modal-body-scroller');
    }
  }

  _bindEvents() {
    if (this._eventsBound || !this.albumModal) return;

    // Handle close button
    const closeBtn = document.getElementById('modal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Modal click delegation (Favorites, Preview playback, Sharing, Artist navigation)
    this.albumModal.addEventListener('click', (e) => this._delegateClicks(e));
    this._eventsBound = true;
  }

  async open(albumId) {
    this._initElements();
    this._bindEvents();

    if (this.modalOverlay) this.modalOverlay.style.display = 'block';
    if (this.albumModal) this.albumModal.style.display = 'block';

    this.renderLoading();

    try {
      const album = await musicService.getAlbum(albumId);
      this.renderContent(album);
    } catch (err) {
      console.error("Failed to load album details:", err);
      this.renderError();
    }
  }

  close() {
    this._initElements();
    if (this.modalOverlay) this.modalOverlay.style.display = 'none';
    if (this.albumModal) this.albumModal.style.display = 'none';
  }

  renderLoading() {
    if (!this.scroller) return;
    this.scroller.innerHTML = `
      <div style="padding: 40px; text-align: center;">
        <div class="skeleton-box" style="width: 70px; height: 70px; border-radius: 50%; margin: 0 auto 16px auto;"></div>
        <div class="skeleton-box" style="width: 180px; height: 20px; margin: 0 auto 10px auto;"></div>
        <div class="skeleton-box" style="width: 100px; height: 14px; margin: 0 auto;"></div>
      </div>
    `;
  }

  renderError() {
    if (!this.scroller) return;
    this.scroller.innerHTML = `
      <div style="padding: 40px; text-align: center;">
        <i class="ri-error-warning-line" style="font-size: 3rem; color: var(--explicit-red); margin-bottom: 16px; display: inline-block;"></i>
        <h3>Failed to load Album</h3>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">Resource request timed out or was unauthorized.</p>
        <button class="pill-btn active" style="margin: 0 auto;" id="modal-err-close-btn">Close</button>
      </div>
    `;
    const btn = this.scroller.querySelector('#modal-err-close-btn');
    if (btn) {
      btn.addEventListener('click', () => this.close());
    }
  }

  renderContent(album) {
    if (!this.scroller) return;

    const name = album.name;
    const image = album.images?.[0]?.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&h=300&q=80';
    const artist = album.artists?.[0] || { name: 'Unknown Artist', id: '' };
    const releaseYear = album.release_date ? album.release_date.split('-')[0] : 'N/A';
    const label = album.label || 'Independent Records';
    const copyright = album.copyrights?.[0]?.text || `© ${releaseYear} ${artist.name}`;
    const externalLink = album.external_urls?.spotify || '#';
    const isFav = store.isFavorite('albums', album.id);

    const trackRows = album.tracks.items.map((t, idx) => {
      const min = Math.floor(t.duration_ms / 60000);
      const sec = Math.floor((t.duration_ms % 60000) / 1000).toString().padStart(2, '0');
      
      return `
        <tr class="modal-track-row track-row-item" data-track-id="${t.id}" data-preview-url="${t.preview_url || ''}"
            data-track-name="${t.name.replace(/"/g, '&quot;')}"
            data-track-artist="${artist.name.replace(/"/g, '&quot;')}"
            data-track-image="${image}"
            style="cursor: ${t.preview_url ? 'pointer' : 'default'}; border-bottom: 1px solid rgba(255,255,255,0.015);">
          <td style="padding: 10px; color: var(--text-secondary); width: 35px; text-align: center; font-size: 0.8rem;">${t.track_number || idx + 1}</td>
          <td style="padding: 10px; font-weight: 600; font-size: 0.82rem; min-width: 0; max-width: 0; width: 100%;">
            <span style="display: flex; align-items: center; gap: 8px; min-width: 0; width: 100%;">
              <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 0 1 auto;">${t.name}</span>
              ${t.explicit ? '<span class="explicit-badge" style="background: var(--explicit-red); color: white; font-size: 0.58rem; padding: 0.5px 3.5px; border-radius: 2px; flex-shrink: 0;">E</span>' : ''}
              ${t.preview_url ? '<i class="ri-volume-up-line play-icon-hint" style="color: var(--accent); font-size: 0.75rem; display: none; flex-shrink: 0;"></i>' : ''}
            </span>
          </td>
          <td style="padding: 10px; color: var(--text-secondary); text-align: right; width: 50px; font-size: 0.8rem;">${min}:${sec}</td>
        </tr>
      `;
    }).join('');

    this.scroller.innerHTML = `
      <div style="display: flex; gap: 24px; flex-wrap: wrap; flex-direction: row; margin-top: 10px;">
        <!-- Cover Art (Left) -->
        <div style="flex-grow: 0; flex-shrink: 0; flex-basis: 220px; width: 100%; max-width: 220px; margin: 0 auto;">
          <div class="bezel-container" style="padding: 4px; margin-bottom: 16px; border-radius: 12px;">
            <div class="inner-card" style="padding: 0; border-radius: 8px;">
              <img src="${image}" alt="${name}" style="width: 100%; aspect-ratio: 1/1; object-fit: cover; border-radius: 8px;">
            </div>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <a href="${externalLink}" target="_blank" rel="noopener noreferrer" class="pill-btn active" style="justify-content: center; width: 100%; font-weight: 700; text-decoration: none; padding: 8px 12px;">
              <i class="ri-spotify-fill"></i> Play on Spotify
            </a>
            <button class="pill-btn toggle-modal-fav-btn ${isFav ? 'active' : ''}" 
                    data-album-id="${album.id}"
                    data-album-name="${name.replace(/"/g, '&quot;')}"
                    data-album-image="${image}"
                    data-album-artist="${artist.name.replace(/"/g, '&quot;')}"
                    data-album-year="${releaseYear}"
                    style="justify-content: center; width: 100%; font-weight: 700; padding: 8px 12px;">
              <i class="${isFav ? 'ri-heart-3-fill' : 'ri-heart-3-line'}"></i> Favorite
            </button>
            <button class="pill-btn copy-album-link-btn" data-url="${externalLink}" style="justify-content: center; width: 100%; font-weight: 700; padding: 8px 12px;">
              <i class="ri-share-forward-line"></i> Share Album
            </button>
          </div>
        </div>

        <!-- Metadata & Tracklist (Right) -->
        <div style="flex-grow: 1; flex-basis: 320px; min-width: 0;">
          <span class="section-eyebrow" style="cursor: pointer;" id="modal-artist-link" data-artist-id="${artist.id}">${artist.name}</span>
          <h2 id="album-detail-title" style="font-family: 'Outfit', sans-serif; font-size: 1.8rem; font-weight: 900; tracking-tight; margin: 4px 0 6px 0; line-height: 1.1;">${name}</h2>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 16px; display: flex; gap: 10px; flex-wrap: wrap;">
            <span>Released <strong>${releaseYear}</strong></span>
            <span>&bull;</span>
            <span>Tracks: <strong>${album.tracks.items.length}</strong></span>
            <span>&bull;</span>
            <span>Label: <strong>${label}</strong></span>
          </div>

          <h3 style="font-family: 'Outfit', sans-serif; font-size: 0.95rem; font-weight: 800; margin-bottom: 8px;">Tracks</h3>
          <div class="bezel-container" style="padding: 4px; margin-bottom: 16px; border-radius: 12px;">
            <div class="inner-card" style="padding: 0; max-height: 220px; overflow-y: auto; border-radius: 8px;">
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.82rem;">
                <tbody>
                  ${trackRows}
                </tbody>
              </table>
            </div>
          </div>
          <p style="font-size: 0.65rem; color: var(--text-tertiary); line-height: 1.3;">${copyright}</p>
        </div>
      </div>
    `;
  }

  _delegateClicks(e) {
    // 1. Toggle Favorite
    const favBtn = e.target.closest('.toggle-modal-fav-btn');
    if (favBtn) {
      const { albumId, albumName, albumImage, albumArtist, albumYear } = favBtn.dataset;
      const added = store.toggleFavorite('albums', { 
        id: albumId, 
        name: albumName, 
        image: albumImage, 
        artists: [{ name: albumArtist }], 
        release_date: albumYear 
      });

      favBtn.classList.toggle('active', added);
      const icon = favBtn.querySelector('i');
      if (icon) icon.className = added ? 'ri-heart-3-fill' : 'ri-heart-3-line';
      toast.show(added ? `Saved "${albumName}" to library.` : `Removed "${albumName}" from library.`, 'success');
      return;
    }

    // 2. Copy Share Link
    const shareBtn = e.target.closest('.copy-album-link-btn');
    if (shareBtn) {
      const url = shareBtn.dataset.url;
      navigator.clipboard.writeText(url)
        .then(() => toast.show("Album share link copied!", "success"))
        .catch(() => toast.show("Failed to copy link.", "error"));
      return;
    }

    // 3. Play Track Preview
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

    // 4. Click Artist Link
    const artistLink = e.target.closest('#modal-artist-link');
    if (artistLink) {
      const artistId = artistLink.dataset.artistId;
      const artistName = artistLink.textContent.trim();
      
      store.addToHistory({ type: 'artist', id: artistId, name: artistName, image: '', subtitle: 'Artist Page' });
      this.close();

      // Trigger routing
      if (window.router) {
        window.router.navigateToView('artist', { artistId });
      }
      return;
    }
  }
}

export const albumModal = new AlbumModalController();
