/* ==========================================================================
   Album Finder - Music Service Facade
   ========================================================================== */

import { store } from '../state/store.js';
import { spotify } from './spotify.js';
import { mockClient } from './mockClient.js';

class MusicService {
  /**
   * Determine the active client dynamically based on connection settings and token state
   */
  getClient() {
    const isMock = store.get('mockMode');
    const clientId = store.get('spotifyClientId');
    const token = store.get('spotifyToken');

    if (isMock || !clientId || !token) {
      return mockClient;
    }
    return spotify;
  }

  async search(query) {
    return this.getClient().search(query);
  }

  async getArtist(id) {
    return this.getClient().getArtist(id);
  }

  async getArtistTopTracks(id) {
    return this.getClient().getArtistTopTracks(id);
  }

  async getArtistAlbums(id, filter) {
    return this.getClient().getArtistAlbums(id, filter);
  }

  async getAlbum(id) {
    return this.getClient().getAlbum(id);
  }

  async getUserTopArtists() {
    return this.getClient().getUserTopArtists();
  }

  async getUserTopTracks() {
    return this.getClient().getUserTopTracks();
  }

  async getTrendingArtists() {
    return this.getClient().getTrendingArtists();
  }

  async getNewReleases() {
    return this.getClient().getNewReleases();
  }
}

export const musicService = new MusicService();
