/* ==========================================================================
   Album Finder - Global Audio Preview Player Component
   ========================================================================== */

import { toast } from './toast.js';

class GlobalAudioPlayer {
  constructor() {
    this.audio = new Audio();
    this.playingState = false;
    this.currentTrack = null;
    this.playlist = [];
    this.playlistIndex = -1;
    this.lyricsActive = false;

    // Cache elements on init
    this.initElements();
    this._bindEvents();
  }

  initElements() {
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
  }

  _bindEvents() {
    if (!this.playBtn) return;

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
        toast.show(this.lyricsActive ? "Lyrics view activated." : "Lyrics view deactivated.", "info");
      });
    }
  }

  play(track) {
    if (!track.previewUrl) {
      toast.show("No audio preview available for this track.", "warning");
      return;
    }

    // Lazy load DOM elements if they weren't cached during boot
    if (!this.playerContainer) {
      this.initElements();
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
        toast.show("Failed to stream audio preview.", "error");
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

export const audioPlayer = new GlobalAudioPlayer();
