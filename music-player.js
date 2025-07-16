
// Robust Audio Player with better error handling
class RobustAudioPlayer {
  constructor() {
    this.audio = null;
    this.playBtn = document.querySelector(".music-btn");
    this.currentTrack = 0;
    this.isShuffleOn = false;
    this.isPlaying = false;
    this.isInitialized = false;
    this.retryCount = 0;
    this.maxRetries = 3;

    // Playlist
    this.playlist = [
      {
        src: "https://files.catbox.moe/o8voe4.mp3",
        name: "Blue Bird",
        artist: "Ikimono-gakari"
      },
      {
        src: "https://files.catbox.moe/omanpf.mp3",
        name: "Sign (サイン)",
        artist: "FLOW"
      },
      {
        src: "https://files.catbox.moe/6kua0k.mp3",
        name: "Utakata Hanabi",
        artist: "Supercell feat. Nagi Yanagi"
      }
    ];

    this.init();
  }

  init() {
    try {
      this.createAudioElement();
      this.setupEventListeners();
      this.loadTrack(this.currentTrack);
      this.isInitialized = true;
      console.log('Robust audio player initialized');
    } catch (error) {
      console.error('Audio player init failed:', error);
      this.showError('Player tidak dapat diinisialisasi');
    }
  }

  createAudioElement() {
    if (this.audio) {
      this.audio.remove();
    }

    this.audio = document.createElement('audio');
    this.audio.id = 'dynamic-audio';
    this.audio.preload = 'metadata';
    this.audio.volume = 0.5;
    this.audio.crossOrigin = 'anonymous';
    this.audio.setAttribute('playsinline', '');
    this.audio.setAttribute('webkit-playsinline', '');

    if (navigator.userAgent.match(/iPhone|iPad|iPod|Android/i)) {
      this.audio.muted = true;
    }

    document.body.appendChild(this.audio);
  }

  setupEventListeners() {
    if (!this.audio) return;

    this.audio.addEventListener('canplaythrough', () => {
      console.log('Audio dapat dimainkan');
      this.hideLoading();

      if (this.isPlaying && this.audio.paused) {
        this.play().catch(console.error);
      }
    });

    this.audio.addEventListener('error', (e) => {
      console.error('Audio error event:', e);
      this.handleAudioError();
    });

    this.audio.addEventListener('ended', () => {
      this.isPlaying = true;
      this.nextTrack();
    });

    this.audio.addEventListener('timeupdate', () => {
      this.updateProgress();
    });

    this.audio.addEventListener('loadstart', () => {
      this.showLoading();
    });

    this.audio.addEventListener('loadedmetadata', () => {
      console.log('Metadata dimuat untuk:', this.playlist[this.currentTrack].name);
    });
  }

  showLoading() {
    const trackNameEl = document.getElementById('track-name');
    const trackArtistEl = document.getElementById('track-artist');

    if (trackNameEl) trackNameEl.textContent = 'Memuat...';
    if (trackArtistEl) trackArtistEl.textContent = 'Mohon tunggu';
    if (this.playBtn) this.playBtn.textContent = "⏳";
  }

  hideLoading() {
    const track = this.playlist[this.currentTrack];
    const trackNameEl = document.getElementById('track-name');
    const trackArtistEl = document.getElementById('track-artist');

    if (trackNameEl) trackNameEl.textContent = track.name;
    if (trackArtistEl) trackArtistEl.textContent = track.artist;
    if (this.playBtn) this.playBtn.textContent = this.isPlaying ? "⏸️" : "▶️";
  }

  showError(message) {
    const trackNameEl = document.getElementById('track-name');
    const trackArtistEl = document.getElementById('track-artist');

    if (trackNameEl) trackNameEl.textContent = message;

    const platform = this.detectPlatform();
    let artistMessage = '';

    if (message.includes('Klik untuk memutar')) {
      switch(platform) {
        case 'vercel':
          artistMessage = 'Vercel memblokir autoplay - Klik tombol play';
          break;
        case 'mobile':
          artistMessage = 'Mobile browser - Tap untuk memutar';
          break;
        default:
          artistMessage = 'Browser memblokir autoplay - Klik untuk mulai';
      }
    } else {
      artistMessage = message;
    }

    if (trackArtistEl) trackArtistEl.textContent = artistMessage;
    if (this.playBtn) this.playBtn.textContent = "▶️";
    this.isPlaying = false;

    const animationEl = document.getElementById('music-animation');
    if (animationEl) animationEl.classList.remove('playing');
  }

  detectPlatform() {
    const hostname = window.location.hostname;
    const userAgent = navigator.userAgent;

    if (hostname.includes('vercel.app') || hostname.includes('vercel.com')) {
      return 'vercel';
    } else if (hostname.includes('replit.') || hostname.includes('repl.')) {
      return 'replit';
    } else if (userAgent.match(/iPhone|iPad|iPod|Android/i)) {
      return 'mobile';
    } else {
      return 'desktop';
    }
  }

  handleAudioError() {
    this.retryCount++;
    if (this.retryCount < this.maxRetries) {
      console.log(`Mencoba ulang audio (${this.retryCount}/${this.maxRetries})`);
      setTimeout(() => {
        this.loadTrack(this.currentTrack);
      }, 1000);
    } else {
      this.showError('File audio tidak dapat dimuat');
      this.retryCount = 0;
    }
  }

  loadTrack(index) {
    try {
      if (!this.audio) return;

      const track = this.playlist[index];
      this.currentTrack = index;

      this.stop();
      this.showLoading();

      this.audio.src = track.src;
      this.audio.load();

      this.retryCount = 0;

      console.log('Loading track:', track.name);

    } catch (error) {
      console.error('Error loading track:', error);
      this.handleAudioError();
    }
  }

  async play() {
    try {
      if (!this.audio || !this.isInitialized) {
        throw new Error('Audio not ready');
      }

      if (this.audio.muted) {
        this.audio.muted = false;
      }

      if (this.audio.readyState < 2) {
        console.log('Menunggu audio siap...');
        await this.waitForAudioReady();
      }

      const playPromise = this.audio.play();

      if (playPromise !== undefined) {
        await playPromise;
      }

      this.isPlaying = true;
      if (this.playBtn) {
        this.playBtn.textContent = "⏸️";
        this.playBtn.classList.add('playing');
      }

      const animationEl = document.getElementById('music-animation');
      if (animationEl) animationEl.classList.add('playing');

      console.log('Playback dimulai');

    } catch (error) {
      console.error('Play error:', error);
      this.isPlaying = false;
      if (this.playBtn) {
        this.playBtn.textContent = "▶️";
        this.playBtn.classList.remove('playing');
      }

      const animationEl = document.getElementById('music-animation');
      if (animationEl) animationEl.classList.remove('playing');

      if (error.name === 'NotAllowedError') {
        this.showError('Klik untuk memutar audio');
      } else if (error.name === 'NotSupportedError') {
        this.showError('Format audio tidak didukung');
      } else {
        this.showError('Tidak dapat memutar');
      }
    }
  }

  waitForAudioReady() {
    return new Promise((resolve, reject) => {
      if (this.audio.readyState >= 2) {
        resolve();
        return;
      }

      let timeout = setTimeout(() => {
        reject(new Error('Audio load timeout'));
      }, 10000);

      const onCanPlay = () => {
        clearTimeout(timeout);
        this.audio.removeEventListener('canplaythrough', onCanPlay);
        this.audio.removeEventListener('error', onError);
        resolve();
      };

      const onError = () => {
        clearTimeout(timeout);
        this.audio.removeEventListener('canplaythrough', onCanPlay);
        this.audio.removeEventListener('error', onError);
        reject(new Error('Audio load failed'));
      };

      this.audio.addEventListener('canplaythrough', onCanPlay);
      this.audio.addEventListener('error', onError);
    });
  }

  pause() {
    try {
      if (this.audio) {
        this.audio.pause();
      }
      this.isPlaying = false;
      if (this.playBtn) {
        this.playBtn.textContent = "▶️";
        this.playBtn.classList.remove('playing');
      }

      const animationEl = document.getElementById('music-animation');
      if (animationEl) animationEl.classList.remove('playing');
    } catch (error) {
      console.error('Pause error:', error);
    }
  }

  stop() {
    try {
      this.pause();
      if (this.audio) {
        this.audio.currentTime = 0;
      }
    } catch (error) {
      console.error('Stop error:', error);
    }
  }

  async toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      await this.play();
    }
  }

  nextTrack() {
    try {
      const nextIndex = this.isShuffleOn 
        ? Math.floor(Math.random() * this.playlist.length)
        : (this.currentTrack + 1) % this.playlist.length;

      const wasPlaying = this.isPlaying;
      this.loadTrack(nextIndex);

      const playWhenReady = () => {
        if (this.audio.readyState >= 2) {
          this.play().catch(console.error);
        } else {
          setTimeout(playWhenReady, 100);
        }
      };

      if (wasPlaying) {
        setTimeout(playWhenReady, 500);
      }
    } catch (error) {
      console.error('Next track error:', error);
    }
  }

  previousTrack() {
    try {
      const prevIndex = this.isShuffleOn
        ? Math.floor(Math.random() * this.playlist.length)
        : (this.currentTrack - 1 + this.playlist.length) % this.playlist.length;

      const wasPlaying = this.isPlaying;
      this.loadTrack(prevIndex);

      const playWhenReady = () => {
        if (this.audio.readyState >= 2) {
          this.play().catch(console.error);
        } else {
          setTimeout(playWhenReady, 100);
        }
      };

      if (wasPlaying) {
        setTimeout(playWhenReady, 500);
      }
    } catch (error) {
      console.error('Previous track error:', error);
    }
  }

  toggleShuffle() {
    this.isShuffleOn = !this.isShuffleOn;
    const shuffleBtn = document.querySelector('.music-control-btn:last-child');
    if (shuffleBtn) {
      shuffleBtn.classList.toggle('shuffle-active', this.isShuffleOn);
    }
  }

  setVolume(value) {
    try {
      if (!this.audio) return;

      const volume = Math.max(0, Math.min(1, value / 100));
      this.audio.volume = volume;

      const volumeIcon = document.querySelector('.volume-icon');
      if (volumeIcon) {
        if (volume === 0) {
          volumeIcon.textContent = '🔇';
        } else if (volume < 0.3) {
          volumeIcon.textContent = '🔈';
        } else if (volume < 0.7) {
          volumeIcon.textContent = '🔉';
        } else {
          volumeIcon.textContent = '🔊';
        }
      }
    } catch (error) {
      console.error('Volume error:', error);
    }
  }

  seek(percent) {
    try {
      if (this.audio && this.audio.duration && !isNaN(this.audio.duration)) {
        this.audio.currentTime = Math.max(0, Math.min(this.audio.duration, percent * this.audio.duration));
      }
    } catch (error) {
      console.error('Seek error:', error);
    }
  }

  updateProgress() {
    try {
      const timeDisplay = document.getElementById('music-time');
      const progressFill = document.getElementById('progress-fill');

      if (!timeDisplay || !progressFill || !this.audio) return;

      if (this.audio.duration && !isNaN(this.audio.duration) && this.audio.currentTime !== undefined) {
        const current = this.formatTime(this.audio.currentTime);
        const total = this.formatTime(this.audio.duration);
        timeDisplay.textContent = `${current} / ${total}`;

        const progress = (this.audio.currentTime / this.audio.duration) * 100;
        progressFill.style.width = Math.min(100, Math.max(0, progress)) + '%';
      } else {
        timeDisplay.textContent = '00:00 / 00:00';
        progressFill.style.width = '0%';
      }
    } catch (error) {
      // Silent error for progress updates
    }
  }

  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

// Initialize audio players
let audioPlayer;

function initializeAudioPlayer() {
  if (!audioPlayer) {
    audioPlayer = new RobustAudioPlayer();
    console.log('Audio player initialized');

    const trackNameEl = document.getElementById('track-name');
    const trackArtistEl = document.getElementById('track-artist');

    if (trackNameEl) trackNameEl.textContent = '🎵 Klik untuk memutar musik';
    if (trackArtistEl) trackArtistEl.textContent = 'Tekan tombol play untuk memulai';
  }
}

// Global functions for UI
function toggleMusic() {
  try {
    if (!audioPlayer) {
      audioPlayer = new RobustAudioPlayer();
      setTimeout(() => {
        audioPlayer.toggle().catch(console.error);
      }, 300);
    } else {
      audioPlayer.toggle().catch(console.error);
    }
  } catch (error) {
    console.error('Toggle music error:', error);
  }
}

function nextTrack() {
  try {
    if (audioPlayer) {
      audioPlayer.nextTrack();
    }
  } catch (error) {
    console.error('Next track error:', error);
  }
}

function previousTrack() {
  try {
    if (audioPlayer) {
      audioPlayer.previousTrack();
    }
  } catch (error) {
    console.error('Previous track error:', error);
  }
}

function toggleShuffle() {
  try {
    if (audioPlayer) {
      audioPlayer.toggleShuffle();
    }
  } catch (error) {
    console.error('Toggle shuffle error:', error);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  initializeAudioPlayer();
});

// Initialize on user interaction
['click', 'touchstart', 'keydown'].forEach(event => {
  document.addEventListener(event, function() {
    initializeAudioPlayer();
  }, { once: true });
});

// Volume control functionality
const volumeSlider = document.getElementById('volume-slider');
const volumeValue = document.getElementById('volume-value');

function updateVolume() {
  if (!volumeSlider || !volumeValue) return;

  const value = volumeSlider.value;
  volumeValue.textContent = value + '%';

  if (audioPlayer) {
    audioPlayer.setVolume(value);
  }
}

if (volumeSlider) {
  volumeSlider.addEventListener('input', updateVolume);
}

// Progress bar click handler
const progressBar = document.getElementById('progress-bar');
if (progressBar) {
  progressBar.addEventListener('click', function(e) {
    if (audioPlayer) {
      const rect = this.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      audioPlayer.seek(percent);
    }
  });
}

// Set initial volume
updateVolume();

// Cleanup on page visibility change and unload
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (audioPlayer) {
      audioPlayer.pause();
    }
  }
});

window.addEventListener("beforeunload", () => {
  if (audioPlayer) {
    audioPlayer.pause();
  }
});
