/* ==========================================================================
   Album Finder - Mock Music API Client
   ========================================================================== */

import {
  MOCK_ARTISTS,
  MOCK_ALBUMS,
  MOCK_TOP_TRACKS,
  MOCK_ALBUM_DETAILS
} from './mockData.js';

class MockMusicClient {
  async search(query) {
    if (!query.trim()) return { artists: [], albums: [], tracks: [] };
    const q = query.toLowerCase();

    const filteredArtists = MOCK_ARTISTS.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.genres.some(g => g.toLowerCase().includes(q))
    );
    const filteredAlbums = MOCK_ALBUMS.filter(a =>
      a.name.toLowerCase().includes(q)
    );

    // Flatten all tracks and filter
    const allTracks = Object.values(MOCK_TOP_TRACKS).flat();
    // De-duplicate tracks by ID
    const uniqueTracksMap = new Map();
    allTracks.forEach(t => uniqueTracksMap.set(t.id, t));
    const uniqueTracks = Array.from(uniqueTracksMap.values());

    const filteredTracks = uniqueTracks.filter(t =>
      t.name.toLowerCase().includes(q)
    );

    return {
      artists: filteredArtists,
      albums: filteredAlbums,
      tracks: filteredTracks
    };
  }

  async getArtist(id) {
    const artist = MOCK_ARTISTS.find(a => a.id === id);
    if (!artist) {
      // Fallback to first mock artist to keep demo working
      return MOCK_ARTISTS[0];
    }
    return artist;
  }

  async getArtistTopTracks(id) {
    return MOCK_TOP_TRACKS[id] || MOCK_TOP_TRACKS['tame_impala'] || [];
  }

  async getArtistAlbums(id, filter = 'album,single') {
    const albums = MOCK_ALBUMS.filter(a => a.artists[0].id === id);
    return albums.length > 0 ? albums : MOCK_ALBUMS;
  }

  async getAlbum(id) {
    return MOCK_ALBUM_DETAILS[id] || MOCK_ALBUM_DETAILS['random_access_memories'];
  }

  async getUserTopArtists() {
    return MOCK_ARTISTS;
  }

  async getUserTopTracks() {
    const tracks = Object.values(MOCK_TOP_TRACKS).flat();
    // Attach album info since uiRenderer uses it
    return tracks.map((t, idx) => {
      const albumKey = Object.keys(MOCK_ALBUM_DETAILS)[idx % Object.keys(MOCK_ALBUM_DETAILS).length];
      const mockAlbum = MOCK_ALBUM_DETAILS[albumKey];
      return {
        ...t,
        album: {
          id: mockAlbum.id,
          name: mockAlbum.name,
          images: mockAlbum.images,
          artists: mockAlbum.artists
        },
        artists: mockAlbum.artists
      };
    }).slice(0, 15);
  }

  async getTrendingArtists() {
    return MOCK_ARTISTS;
  }

  async getNewReleases() {
    return MOCK_ALBUMS;
  }
}

export const mockClient = new MockMusicClient();
