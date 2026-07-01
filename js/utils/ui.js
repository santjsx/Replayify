/* ==========================================================================
   Album Finder - High-End UI Component Templates & Rendering Orchestrator
   ========================================================================== */

import { store } from '../state/store.js';

class UIComponentRenderer {
  /**
   * Inject warning/success notifications
   */
  showToast(text, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;

    let icon = 'ri-information-line';
    if (type === 'success') icon = 'ri-checkbox-circle-line';
    if (type === 'warning') icon = 'ri-error-warning-line';
    if (type === 'error') icon = 'ri-close-circle-line';

    toast.innerHTML = `
      <i class="${icon}"></i>
      <span>${text}</span>
    `;

    container.appendChild(toast);
    
    // Smooth entry and auto-destruction
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px) scale(0.95)';
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  /**
   * Shimmer card loading grid templates
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
   * Render Artist Grid Card Template (Alternative bento/library view)
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
            <button id="landing-connect-btn" class="pill-btn active" style="padding: 14px 32px; font-size: 1rem; background: #1db954; border-color: #1db954; box-shadow: 0 10px 20px rgba(29,185,84,0.2); font-weight: 700;">
              Connect Spotify Account
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render Home View (Apple Music Replay dashboard)
   */
  renderHomeView(topArtists, topTracks) {
    const activeMonth = store.get('activeMonth') || 'March';
    const stats = store.getSimulatedStats();
    
    // Dynamic minutes calculations matched with ranks
    const rawMinutes = parseInt(stats.minutes.replace(/,/g, '')) || 2410;
    const artistMinutes = [Math.round(rawMinutes * 0.44), Math.round(rawMinutes * 0.22), Math.round(rawMinutes * 0.14), Math.round(rawMinutes * 0.10)];

    // Month slider navigation tabs HTML (Short name display, full name mapping)
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

    // Ranked top artists templates (using live user top artists)
    const rankedArtistsHtml = topArtists.slice(0, 4).map((artist, idx) => {
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

    // Two-column songs layout (using live user top tracks)
    const songsHtml = topTracks.slice(0, 8).map((t, idx) => {
      const image = t.album?.images?.[0]?.url || t.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&h=100&q=80';
      const artistName = t.artists?.[0]?.name || t.artist || 'Unknown Artist';
      const plays = 52 - (idx * 4); // Simulate plays counts relative to rank
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

    // Extract unique albums from top tracks to show real user top albums carousel
    const uniqueAlbums = [];
    const albumIds = new Set();
    topTracks.forEach(t => {
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

    return `
      <!-- Replay Metric Header -->
      <section style="margin-top: 10px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h1 style="font-family: 'Outfit', sans-serif; font-size: 3rem; font-weight: 900; tracking-tight; line-height: 1; letter-spacing: -0.04em;">Replay</h1>
          <div class="pill-btn active" style="font-size: 0.8rem; padding: 4px 12px; background: rgba(255, 255, 255, 0.08); color: var(--text-primary); border-color: rgba(255, 255, 255, 0.06);">
            2026 <i class="ri-arrow-down-s-line"></i>
          </div>
        </div>
        
        <!-- Months slider tabs navigation -->
        <div class="month-slider-container">
          ${monthTabsHtml}
        </div>
        
        <h2 style="font-size: 1.45rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 12px; font-family: 'Outfit', sans-serif;">
          You listened for <span style="color: var(--text-primary); font-weight: 800;">${stats.minutes} minutes</span> in ${activeMonth}.
        </h2>
      </section>

      <!-- Section: Your Top Artists -->
      <section style="margin-bottom: 36px;">
        <div class="section-headline-wrap" style="margin-bottom: 16px;">
          <h3 class="section-title" style="font-size: 1.25rem; font-weight: 800;">Your Top Artists <i class="ri-arrow-right-s-line" style="font-size: 1.1rem; color: var(--text-tertiary);"></i></h3>
        </div>
        <div class="ranked-artists-slider">
          ${rankedArtistsHtml}
        </div>
      </section>

      <!-- Section: Your Top Songs -->
      <section style="margin-bottom: 36px;">
        <div class="section-headline-wrap" style="margin-bottom: 16px;">
          <h3 class="section-title" style="font-size: 1.25rem; font-weight: 800;">Your Top Songs <i class="ri-arrow-right-s-line" style="font-size: 1.1rem; color: var(--text-tertiary);"></i></h3>
        </div>
        <div class="replay-songs-grid">
          ${songsHtml}
        </div>
      </section>

      <!-- Section: Your Top Albums -->
      <section style="margin-bottom: 20px;">
        <div class="section-headline-wrap" style="margin-bottom: 16px;">
          <h3 class="section-title" style="font-size: 1.25rem; font-weight: 800;">Your Top Albums <i class="ri-arrow-right-s-line" style="font-size: 1.1rem; color: var(--text-tertiary);"></i></h3>
        </div>
        <div class="ranked-artists-slider" style="padding-bottom: 8px;">
          ${albumsHtml}
        </div>
      </section>
    `;
  }

  /**
   * Render Search Results Page Grid
   */
  renderSearchView(results, query, gridMode = true) {
    const artistCards = results.artists.map(a => this.renderArtistCard(a)).join('');
    const albumCards = results.albums.map(a => this.renderAlbumCard(a)).join('');
    
    // Format track list rows
    const trackRows = results.tracks.map((t, idx) => {
      const minutes = Math.floor(t.duration_ms / 60000);
      const seconds = Math.floor((t.duration_ms % 60000) / 1000).toString().padStart(2, '0');
      
      return `
        <tr class="track-row-item" data-track-id="${t.id}" data-preview-url="${t.preview_url || ''}" 
            data-track-name="${t.name.replace(/"/g, '&quot;')}" 
            data-track-artist="${t.artists?.[0]?.name.replace(/"/g, '&quot;')}"
            data-track-image="${t.album?.images?.[0]?.url || 'https://placehold.co/100x100/161616/eaeaea?text=Art'}"
            style="cursor: ${t.preview_url ? 'pointer' : 'default'}; border-bottom: 1px solid rgba(255,255,255,0.02);">
          <td style="padding: 12px 14px; color: var(--text-secondary); text-align: center; width: 45px;">${idx + 1}</td>
          <td style="padding: 10px; display: flex; align-items: center; gap: 10px;">
            <img src="${t.album?.images?.[0]?.url || ''}" alt="" style="width: 34px; height: 34px; border-radius: 4px; object-fit: cover;">
            <div style="min-width: 0;">
              <div style="font-weight: 700; font-size: 0.82rem; display: flex; align-items: center; gap: 6px; min-width: 0; width: 100%;">
                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 0 1 auto;">${t.name}</span>
                ${t.explicit ? '<span class="explicit-badge" style="background: var(--explicit-red); color: white; font-size: 0.58rem; padding: 0.5px 3.5px; border-radius: 2px; flex-shrink: 0;">E</span>' : ''}
              </div>
              <div style="font-size: 0.72rem; color: var(--text-secondary);">${t.artists?.[0]?.name}</div>
            </div>
          </td>
          <td class="hide-mobile" style="padding: 10px; font-size: 0.8rem; color: var(--text-secondary);">${t.album?.name || 'N/A'}</td>
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
                  <button id="search-grid-toggle" class="pill-btn ${gridMode ? 'active' : ''}"><i class="ri-grid-fill"></i></button>
                  <button id="search-list-toggle" class="pill-btn ${!gridMode ? 'active' : ''}"><i class="ri-list-check"></i></button>
                </div>
              </div>
              
              ${gridMode ? `
                <div class="bento-grid" style="margin-bottom: 30px;">${albumCards}</div>
              ` : `
                <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 30px;">
                  ${results.albums.map(a => `
                    <div class="bezel-container album-card" data-album-id="${a.id}" style="cursor: pointer; padding: 4px;">
                      <div class="inner-card" style="flex-direction: row; align-items: center; justify-content: space-between; padding: 8px 12px;">
                        <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
                          <img src="${a.images?.[0]?.url || 'https://placehold.co/100x100/161616/eaeaea?text=Art'}" alt="" style="width: 40px; height: 40px; border-radius: 4px;">
                          <div style="min-width: 0;">
                            <div style="font-size: 0.82rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${a.name}</div>
                            <div style="font-size: 0.72rem; color: var(--text-secondary);">${a.artists?.[0]?.name}</div>
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

    return `
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

  /**
   * Render Artist Profile layout Page
   */
  renderArtistProfileView(artist, topTracks, albums) {
    const id = artist.id;
    const name = artist.name;
    const image = artist.images?.[0]?.url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=500&h=500&q=80';
    const followers = artist.followers?.total ? artist.followers.total.toLocaleString() : '0';
    const monthlyListeners = artist.followers?.total ? Math.round(artist.followers.total * 1.15).toLocaleString() : '0';
    const genres = artist.genres || [];
    
    const trackRows = topTracks.map((t, idx) => {
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

    const albumCards = albums.map(a => this.renderAlbumCard(a)).join('');

    return `
      <!-- Artist Profile Big Header Bezel -->
      <div class="bezel-container col-12" style="padding: 4px; margin-bottom: 24px;">
        <div class="inner-card" style="flex-direction: row; gap: 24px; align-items: center; min-height: 200px; padding: 20px; flex-wrap: wrap;">
          <img src="${image}" alt="${name}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 2px solid rgba(255,255,255,0.06);">
          <div style="min-width: 220px; flex-grow: 1;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="meta-tag" style="background: var(--accent); color: white; font-size: 0.58rem; border-radius: var(--radius-pill); border: none;">Verified Artist</span>
              <button class="interactive-fav-btn fav-artist-btn ${store.isFavorite('artists', id) ? 'active' : ''}" 
                      data-artist-id="${id}"
                      data-artist-name="${name.replace(/"/g, '&quot;')}"
                      data-artist-image="${image}"
                      data-artist-followers="${followers}">
                <i class="${store.isFavorite('artists', id) ? 'ri-heart-3-fill' : 'ri-heart-3-line'}"></i>
              </button>
            </div>
            <h1 style="font-family: 'Outfit', sans-serif; font-size: 2.4rem; font-weight: 900; tracking-tight; line-height: 1.1; margin: 6px 0;">${name}</h1>
            <div style="font-size: 0.82rem; color: var(--text-secondary); display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 10px;">
              <span><strong>${followers}</strong> Followers</span>
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
                <div style="font-size: 1.6rem; font-weight: 900; font-family: 'Outfit', sans-serif;">Popularity: ${artist.popularity}%</div>
                <div style="height: 5px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; margin-top: 6px;">
                  <div style="width: ${artist.popularity}%; height: 100%; background: var(--accent-gradient);"></div>
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

  /**
   * Render Library View
   */
  renderLibraryView(favorites, history) {
    const favArtists = favorites.artists.map(a => this.renderArtistCard(a)).join('');
    const favAlbums = favorites.albums.map(a => this.renderAlbumCard(a)).join('');
    const totalFavCount = favorites.artists.length + favorites.albums.length;

    return `
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
            <p style="font-size: 0.75rem; color: var(--text-secondary);">${favorites.artists.length} artists followed, ${favorites.albums.length} albums saved.</p>
          </div>
        </div>
        
        <div class="bezel-container col-8">
          <div class="inner-card" style="padding: 16px; justify-content: center;">
            <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 8px;">Aesthetic Affinity Badges</div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              ${favorites.artists.length > 0 ? `<div class="pill-btn active" style="font-size: 0.75rem;"><i class="ri-user-star-line"></i> Follower Tier</div>` : ''}
              ${favorites.albums.length > 0 ? `<div class="pill-btn active" style="font-size: 0.75rem;"><i class="ri-disc-line"></i> Collector Tier</div>` : ''}
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
          ${history.length > 0 ? history.map(h => `
            <div class="bezel-container col-3 history-pill-card" data-${h.type}-id="${h.id}" style="cursor: pointer; padding: 4px;">
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

  /**
   * Render Album detail modal contents
   */
  renderAlbumDetailModalContent(album) {
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

    return `
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
}

// Global Audio Preview Player System
class GlobalAudioPlayer {
  constructor() {
    this.audio = new Audio();
    this.playingState = false;
    this.currentTrack = null;
    this.playlist = [];
    this.playlistIndex = -1;
    this.lyricsActive = false;

    // Elements
    this.playerContainer = document.getElementById('global-preview-player');
    this.playBtn = document.getElementById('player-play-btn');
    this.prevBtn = document.getElementById('player-prev-btn');
    this.nextBtn = document.getElementById('player-next-btn');
    this.shuffleBtn = document.getElementById('player-shuffle-btn');
    this.repeatBtn = document.getElementById('player-repeat-btn');
    this.closeBtn = document.getElementById('player-close-btn');

    this.progressBar = document.getElementById('player-progress-fill');
    this.progressContainer = document.querySelector('.player-progress-bar-container');

    this.trackImg = document.getElementById('player-track-img');
    this.trackName = document.getElementById('player-track-name');
    this.trackArtist = document.getElementById('player-track-artist');

    this._bindEvents();
  }

  _bindEvents() {
    if (!this.playerContainer) return;

    this.playBtn.addEventListener('click', () => this.toggle());
    
    if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.playPrevious());
    if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.playNext());
    
    this.audio.addEventListener('timeupdate', () => this._updateProgress());
    this.audio.addEventListener('ended', () => this._onTrackEnded());

    if (this.progressContainer) {
      this.progressContainer.addEventListener('click', (e) => this._scrub(e));
    }

    if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.stop());

    const lyricsBtn = document.querySelector('.active-lyric-btn');
    if (lyricsBtn) {
      lyricsBtn.addEventListener('click', () => {
        this.lyricsActive = !this.lyricsActive;
        lyricsBtn.classList.toggle('active', this.lyricsActive);
        uiRenderer.showToast(this.lyricsActive ? "Lyrics view activated." : "Lyrics view deactivated.", "info");
      });
    }
  }

  play(track) {
    if (!track.previewUrl) {
      uiRenderer.showToast("No audio preview available for this track.", "warning");
      return;
    }

    // Build immediate playlist context from active tracks on page if applicable
    this._rebuildPlaylistContext(track);

    if (this.currentTrack && this.currentTrack.id === track.id) {
      this.toggle();
      return;
    }

    this.currentTrack = track;
    this.audio.src = track.previewUrl;
    this.audio.load();
    this.audio.play()
      .then(() => {
        this.playingState = true;
        this._updatePlayerUI();
      })
      .catch((err) => {
        console.error("Audio preview playback failed:", err);
        uiRenderer.showToast("Failed to stream audio preview.", "error");
      });
  }

  _rebuildPlaylistContext(track) {
    const rows = Array.from(document.querySelectorAll('.track-row-item'));
    this.playlist = rows
      .map(row => ({
        id: row.dataset.trackId,
        name: row.dataset.trackName,
        artist: row.dataset.trackArtist,
        image: row.dataset.trackImage,
        previewUrl: row.dataset.previewUrl
      }))
      .filter(t => t.previewUrl);

    this.playlistIndex = this.playlist.findIndex(t => t.id === track.id);
  }

  playPrevious() {
    if (this.playlist.length === 0 || this.playlistIndex <= 0) return;
    this.playlistIndex--;
    this.play(this.playlist[this.playlistIndex]);
  }

  playNext() {
    if (this.playlist.length === 0 || this.playlistIndex >= this.playlist.length - 1) return;
    this.playlistIndex++;
    this.play(this.playlist[this.playlistIndex]);
  }

  toggle() {
    if (!this.currentTrack) return;
    if (this.playingState) {
      this.audio.pause();
      this.playingState = false;
    } else {
      this.audio.play();
      this.playingState = true;
    }
    this._updatePlayerUI();
  }

  stop() {
    this.audio.pause();
    this.audio.src = '';
    this.playingState = false;
    this.currentTrack = null;
    if (this.playerContainer) this.playerContainer.style.display = 'none';
  }

  _onTrackEnded() {
    // If repeat is active or next index exists
    if (this.playlist.length > 0 && this.playlistIndex < this.playlist.length - 1) {
      this.playNext();
    } else {
      this.playingState = false;
      this._updatePlayerUI();
    }
  }

  _updateProgress() {
    if (!this.audio.duration) return;
    const progress = (this.audio.currentTime / this.audio.duration) * 100;
    if (this.progressBar) this.progressBar.style.width = `${progress}%`;
  }

  _scrub(e) {
    if (!this.audio.duration) return;
    const width = this.progressContainer.clientWidth;
    const clickX = e.offsetX;
    const percentage = clickX / width;
    this.audio.currentTime = percentage * this.audio.duration;
  }

  _updatePlayerUI() {
    if (!this.playerContainer) return;

    this.playerContainer.style.display = 'block';
    
    // Bind metadata
    if (this.trackImg) this.trackImg.src = this.currentTrack.image;
    if (this.trackName) this.trackName.textContent = this.currentTrack.name;
    if (this.trackArtist) this.trackArtist.textContent = this.currentTrack.artist;

    // Toggle play button icons in player bar and active inline list highlight indicators
    const icon = this.playBtn.querySelector('i');
    if (icon) {
      icon.className = this.playingState ? 'ri-pause-fill' : 'ri-play-fill';
    }

    // Toggle prev/next button availability visual indicators
    if (this.prevBtn) this.prevBtn.style.opacity = this.playlistIndex > 0 ? '1' : '0.4';
    if (this.nextBtn) this.nextBtn.style.opacity = this.playlistIndex < this.playlist.length - 1 ? '1' : '0.4';
  }
}

export const uiRenderer = new UIComponentRenderer();
export const audioPlayer = new GlobalAudioPlayer();
