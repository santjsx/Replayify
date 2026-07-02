/* ==========================================================================
   Album Finder - Abstract Base View Controller Class
   ========================================================================== */

import { store } from '../state/store.js';

export class BaseView {
  constructor(viewport) {
    this.viewport = viewport;
    this.data = null;
  }

  /**
   * Called when routing starts. Can be used for fetch operations.
   */
  async init(data) {
    this.data = data;
  }

  /**
   * Output HTML template strings to viewport
   */
  render() {
    // Implemented by subclasses
  }

  /**
   * Bind event handlers specific to the active view scope
   */
  bindEvents() {
    // Implemented by subclasses
  }

  /**
   * Cleanup listeners or states when leaving the view
   */
  destroy() {
    // Implemented by subclasses
  }

  /**
   * Render shimmer card loading grid templates
   */
  renderGridSkeleton(count = 6) {
    let skeletons = '';
    for (let i = 0; i < count; i++) {
      skeletons += `
        <div class="bezel-container" style="flex: 0 0 190px; aspect-ratio: 3/4; padding: 6px;">
          <div class="inner-card" style="padding: 0;">
            <div class="skeleton-box" style="width: 100%; height: 100%;"></div>
          </div>
        </div>
      `;
    }
    return `
      <div style="height: 120px; display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
        <div class="skeleton-box" style="width: 150px; height: 32px;"></div>
        <div class="skeleton-box" style="width: 280px; height: 18px;"></div>
      </div>
      <div style="display: flex; gap: 16px; overflow: hidden; margin-bottom: 30px;">${skeletons}</div>
    `;
  }

  /**
   * Render Album Grid Card Template
   */
  renderAlbumCard(album) {
    const id = album.id;
    const name = album.name;
    const image = album.images?.[0]?.url || album.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80';
    const artistName = album.artists?.[0]?.name || 'Unknown Artist';
    const isFav = store.isFavorite('albums', id);
    const releaseYear = album.release_date ? album.release_date.split('-')[0] : 'N/A';
    
    return `
      <div class="bezel-container album-card" data-album-id="${id}" style="cursor: pointer;">
        <div class="inner-card" style="padding: 10px;">
          <div class="album-card-art-wrap" style="margin-bottom: 10px; border-radius: 8px;">
            <img src="${image}" alt="${name} Cover" class="album-card-art" loading="lazy">
          </div>
          <h3 class="card-title" style="font-size: 0.82rem; font-weight: 700;" title="${name}">${name}</h3>
          <p class="card-subtitle" style="font-size: 0.72rem; margin-bottom: 8px;">${artistName}</p>
          <div class="card-footer">
            <span class="meta-tag" style="font-size: 0.6rem; padding: 2px 6px;">${releaseYear}</span>
            <button class="interactive-fav-btn fav-album-btn ${isFav ? 'active' : ''}" 
                    data-album-id="${id}" 
                    data-album-name="${name.replace(/"/g, '&quot;')}"
                    data-album-image="${image}"
                    data-album-artist="${artistName.replace(/"/g, '&quot;')}"
                    data-album-year="${releaseYear}"
                    aria-label="Add album to favorites" 
                    onclick="event.stopPropagation();">
              <i class="${isFav ? 'ri-heart-3-fill' : 'ri-heart-3-line'}"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render Artist Grid Card Template
   */
  renderArtistCard(artist) {
    const id = artist.id;
    const name = artist.name;
    const image = artist.images?.[0]?.url || artist.image || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80';
    const followers = artist.followers?.total ? artist.followers.total.toLocaleString() : '0';
    const isFav = store.isFavorite('artists', id);
    
    return `
      <div class="bezel-container artist-card" data-artist-id="${id}" style="cursor: pointer; text-align: center;">
        <div class="inner-card" style="align-items: center; padding: 14px;">
          <div class="artist-card-art-wrap" style="width: 90px; height: 90px; margin-bottom: 12px; border-radius: 50%;">
            <img src="${image}" alt="${name}" class="artist-card-art" loading="lazy">
          </div>
          <h3 class="card-title" style="white-space: normal; text-align: center; font-weight: 700; font-size: 0.85rem; margin-bottom: 2px;">${name}</h3>
          <p class="card-subtitle" style="text-align: center; margin-bottom: 10px; font-size: 0.72rem;">${followers} Followers</p>
          <div class="card-footer" style="width: 100%;">
            <span class="meta-tag" style="border-radius: var(--radius-pill); font-size: 0.58rem; padding: 2px 6px;">Artist</span>
            <button class="interactive-fav-btn fav-artist-btn ${isFav ? 'active' : ''}" 
                    data-artist-id="${id}" 
                    data-artist-name="${name.replace(/"/g, '&quot;')}"
                    data-artist-image="${image}"
                    data-artist-followers="${followers}"
                    aria-label="Add artist to favorites" 
                    onclick="event.stopPropagation();">
              <i class="${isFav ? 'ri-heart-3-fill' : 'ri-heart-3-line'}"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
