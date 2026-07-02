/* ==========================================================================
   Album Finder - Search View Controller
   ========================================================================== */

import { BaseView } from './baseView.js';
import { store } from '../state/store.js';
import { musicService } from '../api/musicService.js';
import { audioPlayer } from '../components/audioPlayer.js';
import { albumModal } from '../components/albumModal.js';
import { toast } from '../components/toast.js';

const SEARCH_DEBOUNCE_MS = 350;

export class SearchView extends BaseView {
  constructor(viewport) {
    super(viewport);
    this.results = { artists: [], albums: [], tracks: [] };
    this.gridMode = true;
    this.searchTimeout = null;
    this.suggestionFocusIdx = -1;
    this.activeSearchController = null;
  }

  async init(data) {
    await super.init(data);
    const query = store.get('searchQuery');
    const token = store.get('spotifyToken');
    const isMock = store.get('mockMode');

    if ((token || isMock) && query) {
      try {
        this.results = await musicService.search(query);
      } catch (err) {
        console.error("Search query execution failure:", err);
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

    const query = store.get('searchQuery');
    const artistCards = this.results.artists.map(a => this.renderArtistCard(a)).join('');
    const albumCards = this.results.albums.map(a => this.renderAlbumCard(a)).join('');
    
    const trackRows = this.results.tracks.map((t, idx) => {
      const minutes = Math.floor(t.duration_ms / 60000);
      const seconds = Math.floor((t.duration_ms % 60000) / 1000).toString().padStart(2, '0');
      const albumArt = t.album?.images?.[0]?.url || 'https://placehold.co/100x100/161616/eaeaea?text=Art';
      const artistName = t.artists?.[0]?.name || t.artist || 'Unknown';
      const albumName = t.album?.name || 'N/A';
      
      return `
        <tr class="track-row-item" data-track-id="${t.id}" data-preview-url="${t.preview_url || ''}" 
            data-track-name="${t.name.replace(/"/g, '&quot;')}" 
            data-track-artist="${artistName.replace(/"/g, '&quot;')}"
            data-track-image="${albumArt}"
            style="cursor: ${t.preview_url ? 'pointer' : 'default'}; border-bottom: 1px solid rgba(255,255,255,0.02);">
          <td style="padding: 12px 14px; color: var(--text-secondary); text-align: center; width: 45px;">${idx + 1}</td>
          <td style="padding: 10px; display: flex; align-items: center; gap: 10px;">
            <img src="${albumArt}" alt="" style="width: 34px; height: 34px; border-radius: 4px; object-fit: cover;">
            <div style="min-width: 0;">
              <div style="font-weight: 700; font-size: 0.82rem; display: flex; align-items: center; gap: 6px; min-width: 0; width: 100%;">
                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 0 1 auto;">${t.name}</span>
                ${t.explicit ? '<span class="explicit-badge" style="background: var(--explicit-red); color: white; font-size: 0.58rem; padding: 0.5px 3.5px; border-radius: 2px; flex-shrink: 0;">E</span>' : ''}
              </div>
              <div style="font-size: 0.72rem; color: var(--text-secondary);">${artistName}</div>
            </div>
          </td>
          <td class="hide-mobile" style="padding: 10px; font-size: 0.8rem; color: var(--text-secondary);">${albumName}</td>
          <td style="padding: 10px 14px; font-size: 0.8rem; color: var(--text-secondary); text-align: right; width: 70px;">${minutes}:${seconds}</td>
        </tr>
      `;
    }).join('');

    let contentHtml = '';
    if (query) {
      if (artistCards || albumCards || trackRows) {
        contentHtml = `
          <div style="margin-top: 10px;">
            ${artistCards ? `
              <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.15rem; font-weight: 800; margin-bottom: 16px;">Matching Artists</h3>
              <div class="bento-grid" style="margin-bottom: 30px;">${artistCards}</div>
            ` : ''}

            ${albumCards ? `
              <div class="section-headline-wrap">
                <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.15rem; font-weight: 800;">Albums</h3>
                <div style="display: flex; gap: 6px;">
                  <button id="search-grid-toggle" class="pill-btn ${this.gridMode ? 'active' : ''}"><i class="ri-grid-fill"></i></button>
                  <button id="search-list-toggle" class="pill-btn ${!this.gridMode ? 'active' : ''}"><i class="ri-list-check"></i></button>
                </div>
              </div>
              
              ${this.gridMode ? `
                <div class="bento-grid" style="margin-bottom: 30px;">${albumCards}</div>
              ` : `
                <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 30px;">
                  ${this.results.albums.map(a => `
                    <div class="bezel-container album-card" data-album-id="${a.id}" style="cursor: pointer; padding: 4px;">
                      <div class="inner-card" style="flex-direction: row; align-items: center; justify-content: space-between; padding: 8px 12px;">
                        <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
                          <img src="${a.images?.[0]?.url || 'https://placehold.co/100x100/161616/eaeaea?text=Art'}" alt="" style="width: 40px; height: 40px; border-radius: 4px;">
                          <div style="min-width: 0;">
                            <div style="font-size: 0.82rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${a.name}</div>
                            <div style="font-size: 0.72rem; color: var(--text-secondary);">${a.artists?.[0]?.name || 'Unknown'}</div>
                          </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 14px;">
                          <span class="meta-tag" style="font-size: 0.6rem;">${a.release_date?.split('-')[0]}</span>
                          <button class="interactive-fav-btn fav-album-btn ${store.isFavorite('albums', a.id) ? 'active' : ''}" data-album-id="${a.id}" onclick="event.stopPropagation();"><i class="ri-heart-fill"></i></button>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              `}
            ` : ''}

            ${trackRows ? `
              <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.15rem; font-weight: 800; margin-bottom: 16px;">Tracks Matching</h3>
              <div class="bezel-container" style="padding: 4px; overflow: hidden; margin-bottom: 30px;">
                <div class="inner-card" style="padding: 0; overflow-x: auto;">
                  <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.82rem;">
                    <thead>
                      <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); color: var(--text-secondary); font-weight: 600;">
                        <th style="padding: 10px 14px; text-align: center; width: 45px;">#</th>
                        <th style="padding: 10px;">Title</th>
                        <th class="hide-mobile" style="padding: 10px;">Album</th>
                        <th style="padding: 10px 14px; text-align: right; width: 70px;"><i class="ri-time-line"></i></th>
                      </tr>
                    </thead>
                    <tbody id="track-rows-wrapper">
                      ${trackRows}
                    </tbody>
                  </table>
                </div>
              </div>
            ` : ''}
          </div>
        `;
      } else {
        contentHtml = `
          <div style="text-align: center; padding: 70px 20px; max-width: 360px; margin: 0 auto;">
            <i class="ri-search-eye-line" style="font-size: 3.5rem; color: var(--text-tertiary); margin-bottom: 18px; display: inline-block;"></i>
            <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.2rem; font-weight: 800; margin-bottom: 6px;">No Results Found</h3>
            <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5;">We couldn't find matches for "${query}". Please check your search syntax.</p>
          </div>
        `;
      }
    } else {
      contentHtml = `
        <div style="text-align: center; padding: 60px 20px; max-width: 450px; margin: 0 auto;">
          <i class="ri-search-2-line" style="font-size: 3.5rem; color: var(--text-tertiary); margin-bottom: 18px; display: inline-block;"></i>
          <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.25rem; font-weight: 800; margin-bottom: 6px;">Search Replayify</h3>
          <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5; margin-bottom: 20px;">Find your favorite artists, tracks, and albums to check stats.</p>
        </div>
      `;
    }

    this.viewport.innerHTML = `
      <div style="margin-bottom: 28px;">
        <div class="input-bezel-wrapper" style="max-width: 600px; width: 100%; height: 46px; border-radius: 12px; background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.06); padding: 0 16px; margin: 0;">
          <i class="ri-search-line" style="color: var(--text-secondary); font-size: 1.1rem; margin-right: 12px; display: flex; align-items: center;"></i>
          <input type="text" id="search-page-input" placeholder="Search artists, albums, tracks..." value="${query || ''}" autocomplete="off" style="font-size: 0.95rem; font-weight: 500; width: 100%;">
          <button id="search-page-clear-btn" style="background: transparent; border: none; color: var(--text-secondary); cursor: pointer; display: ${query ? 'flex' : 'none'}; align-items: center; justify-content: center; font-size: 1.1rem; padding: 4px;"><i class="ri-close-line"></i></button>
        </div>
        <div id="search-suggestions-container" style="position: relative; max-width: 600px; width: 100%;">
          <div id="search-page-suggestions" class="search-suggestions-dropdown" style="display: none; width: 100%; top: 8px;"></div>
        </div>
      </div>

      <div id="search-results-viewport">
        ${contentHtml}
      </div>
    `;
  }

  bindEvents() {
    this.viewport.addEventListener('click', this._onViewportClick);
    
    // Register local listeners for the search bar
    const searchInput = document.getElementById('search-page-input');
    if (searchInput) {
      searchInput.addEventListener('input', this._onSearchInput);
      searchInput.addEventListener('keydown', this._onSearchKeydown);
    }
  }

  destroy() {
    this.viewport.removeEventListener('click', this._onViewportClick);
    
    const searchInput = document.getElementById('search-page-input');
    if (searchInput) {
      searchInput.removeEventListener('input', this._onSearchInput);
      searchInput.removeEventListener('keydown', this._onSearchKeydown);
    }
    
    clearTimeout(this.searchTimeout);
    this._hideSuggestions();
  }

  _onSearchInput = (e) => {
    const val = e.target.value.trim();
    const clearBtn = document.getElementById('search-page-clear-btn');
    if (clearBtn) clearBtn.style.display = val ? 'flex' : 'none';

    if (!val) {
      this._hideSuggestions();
      return;
    }

    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(async () => {
      try {
        const results = await musicService.search(val);
        this._showSuggestions(results);
      } catch (err) {
        console.warn("Failed suggestions fetch:", err);
      }
    }, SEARCH_DEBOUNCE_MS);
  };

  _onSearchKeydown = (e) => {
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
          this._hideSuggestions();
          store.set('searchQuery', query);
          store.addToHistory({ 
            type: 'search', 
            id: query, 
            name: `Search: "${query}"`, 
            image: '', 
            subtitle: 'Query Search' 
          });
          // Re-render immediately
          if (window.router) {
            window.router.navigateToView('search');
          }
        }
      }
    }
  };

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

  _showSuggestions(results) {
    const suggestionsDropdown = document.getElementById('search-page-suggestions');
    if (!suggestionsDropdown) return;

    const list = [
      ...(results.artists || []).slice(0, 3).map(a => ({ 
        type: 'artist', 
        id: a.id, 
        name: a.name, 
        image: a.images?.[0]?.url, 
        subtitle: 'Artist' 
      })),
      ...(results.albums || []).slice(0, 3).map(al => ({ 
        type: 'album', 
        id: al.id, 
        name: al.name, 
        image: al.images?.[0]?.url, 
        subtitle: `${al.artists?.[0]?.name || 'Unknown'} &bull; Album` 
      }))
    ];

    if (list.length === 0) {
      this._hideSuggestions();
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

  _hideSuggestions() {
    const suggestionsDropdown = document.getElementById('search-page-suggestions');
    if (suggestionsDropdown) suggestionsDropdown.style.display = 'none';
    this.suggestionFocusIdx = -1;
  }

  _clearInput() {
    const input = document.getElementById('search-page-input');
    if (input) {
      input.value = '';
      input.focus();
    }
    const clearBtn = document.getElementById('search-page-clear-btn');
    if (clearBtn) clearBtn.style.display = 'none';
    this._hideSuggestions();
  }

  _onViewportClick = (e) => {
    // Hide suggestions when clicking outside
    if (!e.target.closest('.input-bezel-wrapper') && !e.target.closest('#search-page-suggestions')) {
      this._hideSuggestions();
    }

    // 1. Clear button click
    if (e.target.closest('#search-page-clear-btn')) {
      this._clearInput();
      return;
    }

    // 2. Click suggestion item
    const suggestionItem = e.target.closest('.suggestion-item');
    if (suggestionItem) {
      const { type, id, name, image } = suggestionItem.dataset;
      this._clearInput();
      
      if (type === 'artist') {
        store.addToHistory({ type: 'artist', id, name, image, subtitle: 'Artist Page' });
        if (window.router) {
          window.router.navigateToView('artist', { artistId: id });
        }
      } else {
        store.addToHistory({ type: 'album', id, name, image, subtitle: 'Album Details' });
        albumModal.open(id);
      }
      return;
    }

    // 3. Click Grid toggle
    if (e.target.closest('#search-grid-toggle')) {
      this.gridMode = true;
      this.render();
      this.bindEvents(); // re-bind listeners as structure changed
      return;
    }

    // 4. Click List toggle
    if (e.target.closest('#search-list-toggle')) {
      this.gridMode = false;
      this.render();
      this.bindEvents(); // re-bind listeners as structure changed
      return;
    }

    // 5. Favorite Album toggle
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
      
      favAlbumBtn.classList.toggle('active', added);
      const icon = favAlbumBtn.querySelector('i');
      if (icon) icon.className = added ? 'ri-heart-3-fill' : 'ri-heart-3-line';
      toast.show(added ? `Saved "${albumName}" to library.` : `Removed "${albumName}" from library.`, 'success');
      return;
    }

    // 6. Favorite Artist toggle
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

    // 7. Click Artist Card -> Navigate
    const artistCard = e.target.closest('.artist-card');
    if (artistCard) {
      const { artistId, artistName, artistImage } = artistCard.dataset;
      store.addToHistory({ type: 'artist', id: artistId, name: artistName, image: artistImage, subtitle: 'Artist Page' });
      if (window.router) {
        window.router.navigateToView('artist', { artistId });
      }
      return;
    }

    // 8. Click Album Card -> Details modal
    const albumCard = e.target.closest('.album-card');
    if (albumCard) {
      const { albumId, albumName, albumImage, albumArtist } = albumCard.dataset;
      store.addToHistory({ type: 'album', id: albumId, name: albumName, image: albumImage, subtitle: albumArtist || 'Album Details' });
      albumModal.open(albumId);
      return;
    }

    // 9. Click Song row play
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
  };

  renderSpotifyLandingView() {
    return `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 65vh; text-align: center; padding: 40px 16px;">
        <div class="bezel-container" style="max-width: 500px; padding: 8px; margin-bottom: 24px;">
          <div class="inner-card" style="padding: 40px 24px; align-items: center;">
            <i class="ri-spotify-fill" style="font-size: 5rem; color: #1db954; margin-bottom: 20px;"></i>
            <h1 style="font-family: 'Outfit', sans-serif; font-size: 2rem; font-weight: 800; margin-bottom: 12px; color: var(--text-primary);">Search Music Details</h1>
            <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.5; margin-bottom: 24px;">
              Please connect your Spotify account first to run queries and search for matching titles.
            </p>
            <button onclick="document.getElementById('header-settings-btn').click()" class="pill-btn active" style="padding: 10px 28px;">
              Open App Settings
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
