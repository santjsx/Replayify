/* ==========================================================================
   Album Finder - Library View Controller
   ========================================================================== */

import { BaseView } from './baseView.js';
import { store } from '../state/store.js';
import { albumModal } from '../components/albumModal.js';
import { toast } from '../components/toast.js';

export class LibraryView extends BaseView {
  constructor(viewport) {
    super(viewport);
    this.favorites = { artists: [], albums: [] };
    this.history = [];
  }

  async init(data) {
    await super.init(data);
    this.favorites = store.get('favorites') || { artists: [], albums: [] };
    this.history = store.get('history') || [];
  }

  render() {
    const favArtists = this.favorites.artists.map(a => this.renderArtistCard(a)).join('');
    const favAlbums = this.favorites.albums.map(a => this.renderAlbumCard(a)).join('');
    const totalFavCount = this.favorites.artists.length + this.favorites.albums.length;

    this.viewport.innerHTML = `
      <div class="section-headline-wrap">
        <div>
          <span class="section-eyebrow">Your space</span>
          <h2 class="section-title">Music Library</h2>
        </div>
        <button id="clear-lib-history-btn" class="pill-btn" style="color: var(--explicit-red); border-color: rgba(255, 59, 48, 0.2);"><i class="ri-delete-bin-line"></i> Reset Data</button>
      </div>

      <!-- Bento dashboard widgets -->
      <div class="bento-grid" style="margin-bottom: 30px;">
        <div class="bezel-container col-4">
          <div class="inner-card" style="padding: 16px;">
            <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">Favorites Total</div>
            <div style="font-size: 2.4rem; font-weight: 900; margin: 4px 0; font-family: 'Outfit', sans-serif;">${totalFavCount}</div>
            <p style="font-size: 0.75rem; color: var(--text-secondary);">${this.favorites.artists.length} artists followed, ${this.favorites.albums.length} albums saved.</p>
          </div>
        </div>
        
        <div class="bezel-container col-8">
          <div class="inner-card" style="padding: 16px; justify-content: center;">
            <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 8px;">Aesthetic Affinity Badges</div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              ${this.favorites.artists.length > 0 ? `<div class="pill-btn active" style="font-size: 0.75rem;"><i class="ri-user-star-line"></i> Follower Tier</div>` : ''}
              ${this.favorites.albums.length > 0 ? `<div class="pill-btn active" style="font-size: 0.75rem;"><i class="ri-disc-line"></i> Collector Tier</div>` : ''}
              ${totalFavCount === 0 ? '<span style="font-size: 0.8rem; color: var(--text-secondary);">Favorite music to earn library badges.</span>' : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- Favorite Artists Tab -->
      <section style="margin-bottom: 30px;">
        <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.15rem; font-weight: 800; margin-bottom: 16px;"><i class="ri-user-heart-line"></i> Followed Artists</h3>
        <div class="bento-grid">
          ${favArtists.length > 0 ? favArtists : '<div class="col-12" style="text-align: center; color: var(--text-tertiary); padding: 30px 0;">No favorite artists added.</div>'}
        </div>
      </section>

      <!-- Favorite Albums Tab -->
      <section style="margin-bottom: 30px;">
        <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.15rem; font-weight: 800; margin-bottom: 16px;"><i class="ri-disc-line"></i> Saved Albums</h3>
        <div class="bento-grid">
          ${favAlbums.length > 0 ? favAlbums : '<div class="col-12" style="text-align: center; color: var(--text-tertiary); padding: 30px 0;">No favorite albums added.</div>'}
        </div>
      </section>

      <!-- Library Activity History -->
      <section>
        <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.15rem; font-weight: 800; margin-bottom: 16px;"><i class="ri-history-line"></i> Recent Activity</h3>
        <div class="bento-grid">
          ${this.history.length > 0 ? this.history.map(h => `
            <div class="bezel-container col-3 history-pill-card" data-type="${h.type}" data-id="${h.id}" data-name="${h.name.replace(/"/g, '&quot;')}" data-image="${h.image || ''}" style="cursor: pointer; padding: 4px;">
              <div class="inner-card" style="flex-direction: row; align-items: center; gap: 10px; padding: 6px 10px;">
                <img src="${h.image || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=100&h=100&q=80'}" alt="" style="width: 34px; height: 34px; border-radius: ${h.type === 'artist' ? '50%' : '4px'}; object-fit: cover;">
                <div style="min-width: 0; flex-grow: 1;">
                  <div style="font-size: 0.78rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary);">${h.name}</div>
                  <div style="font-size: 0.65rem; color: var(--text-secondary); text-transform: uppercase;">${h.type}</div>
                </div>
                <i class="ri-arrow-right-up-line" style="color: var(--text-tertiary);"></i>
              </div>
            </div>
          `).join('') : '<div class="col-12" style="text-align: center; color: var(--text-tertiary); padding: 30px 0;">Activity history is empty.</div>'}
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
    // 1. Reset library data
    const clearLibBtn = e.target.closest('#clear-lib-history-btn');
    if (clearLibBtn) {
      if (confirm('Are you sure you want to reset all saved library data, history, and favorites?')) {
        store.clearHistory();
        store.set('favorites', { artists: [], albums: [] });
        toast.show('Library data reset complete.', 'info');
        // Refresh this view
        this.favorites = { artists: [], albums: [] };
        this.history = [];
        this.render();
        this.bindEvents();
      }
      return;
    }

    // 2. Favorite Artist heart toggle inside library card
    const favArtistBtn = e.target.closest('.fav-artist-btn');
    if (favArtistBtn) {
      const { artistId, artistName, artistImage, artistFollowers } = favArtistBtn.dataset;
      const added = store.toggleFavorite('artists', {
        id: artistId,
        name: artistName,
        image: artistImage,
        followers: { total: parseInt(artistFollowers?.replace(/,/g, '')) || 0 }
      });

      // Simple refresh view to update counts and list state
      this.init(this.data).then(() => {
        this.render();
        this.bindEvents();
      });
      toast.show(added ? `Followed artist "${artistName}".` : `Unfollowed artist "${artistName}".`, 'success');
      return;
    }

    // 3. Favorite Album heart toggle inside library card
    const favAlbumBtn = e.target.closest('.fav-album-btn');
    if (favAlbumBtn) {
      const { albumId, albumName, albumImage, albumArtist, albumYear } = favAlbumBtn.dataset;
      const added = store.toggleFavorite('albums', {
        id: albumId,
        name: albumName,
        image: albumImage,
        artists: [{ name: albumArtist }],
        release_date: albumYear
      });

      // Simple refresh view
      this.init(this.data).then(() => {
        this.render();
        this.bindEvents();
      });
      toast.show(added ? `Saved "${albumName}" to library.` : `Removed "${albumName}" from library.`, 'success');
      return;
    }

    // 4. Click artist card
    const artistCard = e.target.closest('.artist-card');
    if (artistCard) {
      const { artistId, artistName, artistImage } = artistCard.dataset;
      store.addToHistory({ type: 'artist', id: artistId, name: artistName, image: artistImage, subtitle: 'Artist Page' });
      if (window.router) {
        window.router.navigateToView('artist', { artistId });
      }
      return;
    }

    // 5. Click album card
    const albumCard = e.target.closest('.album-card');
    if (albumCard) {
      const { albumId, albumName, albumImage, albumArtist } = albumCard.dataset;
      store.addToHistory({ type: 'album', id: albumId, name: albumName, image: albumImage, subtitle: albumArtist || 'Album Details' });
      albumModal.open(albumId);
      return;
    }

    // 6. Click History Pill Card
    const historyCard = e.target.closest('.history-pill-card');
    if (historyCard) {
      const { type, id, name, image } = historyCard.dataset;
      
      if (type === 'artist') {
        store.addToHistory({ type: 'artist', id, name, image, subtitle: 'Artist Page' });
        if (window.router) {
          window.router.navigateToView('artist', { artistId: id });
        }
      } else if (type === 'album') {
        store.addToHistory({ type: 'album', id, name, image, subtitle: 'Album Details' });
        albumModal.open(id);
      } else if (type === 'search') {
        // It's a query search: trigger search view with query
        store.set('searchQuery', id); // 'id' contains query text
        if (window.router) {
          window.router.navigateToView('search');
        }
      }
      return;
    }
  }
}
