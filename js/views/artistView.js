/* ==========================================================================
   Album Finder - Artist Profile View Controller
   ========================================================================== */

import { BaseView } from './baseView.js';
import { store } from '../state/store.js';
import { musicService } from '../api/musicService.js';
import { audioPlayer } from '../components/audioPlayer.js';
import { albumModal } from '../components/albumModal.js';
import { toast } from '../components/toast.js';

export class ArtistView extends BaseView {
  constructor(viewport) {
    super(viewport);
    this.artist = null;
    this.topTracks = [];
    this.albums = [];
  }

  async init(data) {
    await super.init(data);
    const artistId = data?.artistId;
    if (!artistId) {
      toast.show("Artist ID is missing. Redirecting home.", "error");
      if (window.router) {
        window.router.navigateToView('home');
      }
      return;
    }

    try {
      this.artist = await musicService.getArtist(artistId);
      this.topTracks = await musicService.getArtistTopTracks(artistId);
      this.albums = await musicService.getArtistAlbums(artistId);
    } catch (err) {
      console.error("Failed to load artist details:", err);
    }
  }

  render() {
    if (!this.artist) {
      this.viewport.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
          <i class="ri-error-warning-line" style="font-size: 3rem; color: var(--explicit-red); margin-bottom: 16px; display: inline-block;"></i>
          <h3>Failed to load Artist Profile</h3>
          <button class="pill-btn active" onclick="window.router.navigateToView('home')" style="margin: 20px auto 0 auto;">Return Home</button>
        </div>
      `;
      return;
    }

    const id = this.artist.id;
    const name = this.artist.name;
    const image = this.artist.images?.[0]?.url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=500&h=500&q=80';
    const followers = this.artist.followers?.total ? this.artist.followers.total.toLocaleString() : '0';
    const monthlyListeners = this.artist.followers?.total ? Math.round(this.artist.followers.total * 1.15).toLocaleString() : '0';
    const genres = this.artist.genres || [];
    const isFav = store.isFavorite('artists', id);
    
    const trackRows = this.topTracks.map((t, idx) => {
      const minutes = Math.floor(t.duration_ms / 60000);
      const seconds = Math.floor((t.duration_ms % 60000) / 1000).toString().padStart(2, '0');
      return `
        <tr class="track-row-item" data-track-id="${t.id}" data-preview-url="${t.preview_url || ''}"
            data-track-name="${t.name.replace(/"/g, '&quot;')}"
            data-track-artist="${name.replace(/"/g, '&quot;')}"
            data-track-image="${image}"
            style="cursor: ${t.preview_url ? 'pointer' : 'default'}; border-bottom: 1px solid rgba(255,255,255,0.015);">
          <td style="padding: 10px 14px; color: var(--text-secondary); text-align: center; width: 45px;">${idx + 1}</td>
          <td style="padding: 10px;">
            <div style="font-weight: 700; font-size: 0.82rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 6px;">
              ${t.name}
              ${t.explicit ? '<span class="explicit-badge" style="background: var(--explicit-red); color: white; font-size: 0.58rem; padding: 0.5px 3.5px; border-radius: 2px;">E</span>' : ''}
            </div>
          </td>
          <td style="padding: 10px 14px; color: var(--text-secondary); text-align: right; width: 70px;">${minutes}:${seconds}</td>
        </tr>
      `;
    }).join('');

    const albumCards = this.albums.map(a => this.renderAlbumCard(a)).join('');

    this.viewport.innerHTML = `
      <!-- Artist Profile Big Header Bezel -->
      <div class="bezel-container col-12" style="padding: 4px; margin-bottom: 24px;">
        <div class="inner-card" style="flex-direction: row; gap: 24px; align-items: center; min-height: 200px; padding: 20px; flex-wrap: wrap;">
          <img src="${image}" alt="${name}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 2px solid rgba(255,255,255,0.06);">
          <div style="min-width: 220px; flex-grow: 1;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="meta-tag" style="background: var(--accent); color: white; font-size: 0.58rem; border-radius: var(--radius-pill); border: none;">Verified Artist</span>
              <button class="interactive-fav-btn fav-artist-btn ${isFav ? 'active' : ''}" 
                      data-artist-id="${id}"
                      data-artist-name="${name.replace(/"/g, '&quot;')}"
                      data-artist-image="${image}"
                      data-artist-followers="${followers}">
                <i class="${isFav ? 'ri-heart-3-fill' : 'ri-heart-3-line'}"></i>
              </button>
            </div>
            <h1 style="font-family: 'Outfit', sans-serif; font-size: 2.4rem; font-weight: 900; tracking-tight; line-height: 1.1; margin: 6px 0;">${name}</h1>
            <div style="font-size: 0.82rem; color: var(--text-secondary); display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 10px;">
              <span><strong>${followers}</strong> Followers</span>
              <span>&bull;</span>
              <span><strong>${monthlyListeners}</strong> Listeners</span>
            </div>
            <div style="display: flex; gap: 4px; flex-wrap: wrap;">
              ${genres.map(g => `<span class="pill-btn" style="cursor: default; pointer-events: none; font-size: 0.65rem; padding: 2px 8px;">${g}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 20px; flex-direction: row; flex-wrap: wrap; align-items: flex-start;">
        <!-- Top Tracks Table (Left) -->
        <div style="flex-grow: 1; flex-basis: 380px; min-width: 0;">
          <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.15rem; font-weight: 800; margin-bottom: 14px;">Popular Tracks</h3>
          <div class="bezel-container" style="padding: 4px; margin-bottom: 24px;">
            <div class="inner-card" style="padding: 0;">
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.82rem;">
                <tbody>
                  ${trackRows.length > 0 ? trackRows : '<tr><td style="padding: 16px; text-align: center; color: var(--text-secondary)">No tracks found.</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Artist stats (Right) -->
        <div style="flex-grow: 0; flex-basis: 260px; width: 100%;">
          <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.15rem; font-weight: 800; margin-bottom: 14px;">Artist Metrics</h3>
          <div class="bezel-container" style="padding: 4px; margin-bottom: 24px;">
            <div class="inner-card" style="padding: 14px; gap: 12px;">
              <div>
                <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">Global Index</div>
                <div style="font-size: 1.6rem; font-weight: 900; font-family: 'Outfit', sans-serif;">Popularity: ${this.artist.popularity}%</div>
                <div style="height: 5px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; margin-top: 6px;">
                  <div style="width: ${this.artist.popularity}%; height: 100%; background: var(--accent-gradient);"></div>
                </div>
              </div>
              <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px;">
                <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">Engagement Ratio</div>
                <div style="font-size: 0.85rem; font-weight: 600; margin-top: 2px; color: var(--text-primary);">High Listener Loyalty</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Albums Catalog Section -->
      <section style="margin-top: 10px; width: 100%;">
        <div class="section-headline-wrap" style="margin-bottom: 14px;">
          <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.15rem; font-weight: 800;">Albums & Singles Catalog</h3>
        </div>
        <div class="bento-grid">
          ${albumCards.length > 0 ? albumCards : '<div class="col-12" style="text-align: center; color: var(--text-tertiary)">No albums found.</div>'}
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
    // 1. Favorite Artist toggling
    const favArtistBtn = e.target.closest('.fav-artist-btn');
    if (favArtistBtn) {
      const { artistId, artistName, artistImage, artistFollowers } = favArtistBtn.dataset;
      const added = store.toggleFavorite('artists', {
        id: artistId,
        name: artistName,
        image: artistImage,
        followers: { total: parseInt(artistFollowers?.replace(/,/g, '')) || 0 }
      });
      
      favArtistBtn.classList.toggle('active', added);
      const icon = favArtistBtn.querySelector('i');
      if (icon) icon.className = added ? 'ri-heart-3-fill' : 'ri-heart-3-line';
      toast.show(added ? `Followed artist "${artistName}".` : `Unfollowed artist "${artistName}".`, 'success');
      return;
    }

    // 2. Play popular track preview click
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

    // 3. Click Album Card inside catalog
    const albumCard = e.target.closest('.album-card');
    if (albumCard) {
      const { albumId, albumName, albumImage, albumArtist } = albumCard.dataset;
      store.addToHistory({ type: 'album', id: albumId, name: albumName, image: albumImage, subtitle: albumArtist || 'Album Details' });
      albumModal.open(albumId);
      return;
    }
  }
}
