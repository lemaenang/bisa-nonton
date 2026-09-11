/**
 * BISA NONTON - Video Player Engine
 * Mendukung HLS (.m3u8), selector kualitas, navigasi episode serial, dan auto-play next episode.
 */

class BisaPlayer {
  constructor() {
    // DOM Elements
    this.modal = document.getElementById('playerModal');
    this.videoContainer = document.getElementById('videoContainer');
    this.video = document.getElementById('main-video-element');
    this.closeBtn = document.getElementById('playerCloseBtn');
    this.playerTitle = document.getElementById('playerTitle');
    this.playerSubtitle = document.getElementById('playerSubtitle');
    this.loadingSpinner = document.getElementById('videoLoadingSpinner');
    this.centerPlayOverlay = document.getElementById('centerPlayOverlay');
    this.centerPlayIcon = document.getElementById('centerPlayIcon');

    // Controls
    this.controlsBar = document.getElementById('customControlsBar');
    this.btnPlayPause = document.getElementById('btnPlayPause');
    this.btnSkipBack = document.getElementById('btnSkipBack');
    this.btnSkipForward = document.getElementById('btnSkipForward');
    this.btnPrevEp = document.getElementById('btnPrevEp');
    this.btnNextEp = document.getElementById('btnNextEp');
    this.timeDisplay = document.getElementById('timeDisplay');
    this.progressBar = document.getElementById('progressBar');
    this.progressFilled = document.getElementById('progressFilled');
    this.progressBuffer = document.getElementById('progressBuffer');
    this.progressThumb = document.getElementById('progressThumb');

    // Playback Speed Selector
    this.btnSpeed = document.getElementById('btnSpeed');
    this.speedMenu = document.getElementById('speedMenu');
    this.speedLabel = document.getElementById('currentSpeedLabel');
    this.currentSpeed = 1;

    // Quality Selector
    this.btnQuality = document.getElementById('btnQuality');
    this.qualityMenu = document.getElementById('qualityMenu');
    this.qualityLabel = document.getElementById('currentQualityLabel');

    // Volume & Fullscreen
    this.btnMute = document.getElementById('btnMute');
    this.volumeSlider = document.getElementById('volumeSlider');
    this.btnFullscreen = document.getElementById('btnFullscreen');

    // Sidebar & Autoplay
    this.sidebar = document.getElementById('episodeSidebar');
    this.episodeList = document.getElementById('episodeList');
    this.episodeCountBadge = document.getElementById('episodeCountBadge');
    this.autoplayOverlay = document.getElementById('autoplayOverlay');
    this.autoplayNextTitle = document.getElementById('autoplayNextTitle');
    this.countdownBarFill = document.getElementById('countdownBarFill');
    this.autoplayPlayNowBtn = document.getElementById('autoplayPlayNowBtn');
    this.autoplayCancelBtn = document.getElementById('autoplayCancelBtn');

    // State Variables
    this.hls = null;
    this.currentItem = null; // Movie or Series object
    this.currentEpisodeIndex = 0;
    this.autoplayTimer = null;
    this.autoplayInterval = null;
    this.controlsTimeout = null;
    this.isDraggingSeek = false;

    this.initEvents();
  }

  initEvents() {
    // Modal Close
    this.closeBtn.addEventListener('click', () => this.close());

    // Video Play/Pause toggle
    this.btnPlayPause.addEventListener('click', () => this.togglePlay());
    this.video.addEventListener('click', () => this.togglePlay());

    // Lompat mundur / maju 10 detik
    if (this.btnSkipBack) {
      this.btnSkipBack.addEventListener('click', () => this.skipTime(-10));
    }
    if (this.btnSkipForward) {
      this.btnSkipForward.addEventListener('click', () => this.skipTime(10));
    }

    // Episode Prev / Next button
    this.btnPrevEp.addEventListener('click', () => this.playPreviousEpisode());
    this.btnNextEp.addEventListener('click', () => this.playNextEpisode());

    // Volume & Mute
    this.btnMute.addEventListener('click', () => this.toggleMute());
    this.volumeSlider.addEventListener('input', (e) => {
      this.video.volume = parseFloat(e.target.value);
      this.video.muted = this.video.volume === 0;
      this.updateVolumeIcon();
    });

    // Fullscreen
    this.btnFullscreen.addEventListener('click', () => this.toggleFullscreen());

    // Speed Menu Toggle
    if (this.btnSpeed && this.speedMenu) {
      this.btnSpeed.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.qualityMenu) this.qualityMenu.classList.remove('show');
        this.speedMenu.classList.toggle('show');
      });

      const speedOptions = this.speedMenu.querySelectorAll('.speed-option');
      speedOptions.forEach(opt => {
        opt.addEventListener('click', () => {
          const speed = parseFloat(opt.dataset.speed);
          this.setPlaybackSpeed(speed);
          this.speedMenu.classList.remove('show');
        });
      });
    }

    // Quality Menu Toggle
    this.btnQuality.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.speedMenu) this.speedMenu.classList.remove('show');
      this.qualityMenu.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (this.qualityMenu && !this.qualityMenu.contains(e.target) && e.target !== this.btnQuality) {
        this.qualityMenu.classList.remove('show');
      }
      if (this.speedMenu && !this.speedMenu.contains(e.target) && e.target !== this.btnSpeed) {
        this.speedMenu.classList.remove('show');
      }
    });

    // Progress Bar Seeking
    this.progressBar.addEventListener('mousedown', (e) => this.startSeek(e));
    window.addEventListener('mousemove', (e) => this.doSeek(e));
    window.addEventListener('mouseup', () => this.endSeek());

    // Video Event Listeners
    this.video.addEventListener('timeupdate', () => this.onTimeUpdate());
    this.video.addEventListener('progress', () => this.updateBuffer());
    this.video.addEventListener('waiting', () => this.showLoading(true));
    this.video.addEventListener('playing', () => {
      this.showLoading(false);
      this.btnPlayPause.textContent = '⏸';
      if (this.currentSpeed && this.currentSpeed !== 1) {
        this.video.playbackRate = this.currentSpeed;
      }
    });
    this.video.addEventListener('pause', () => {
      this.btnPlayPause.textContent = '▶';
    });
    this.video.addEventListener('ended', () => this.onVideoEnded());

    // Autoplay Next Episode overlay buttons
    this.autoplayPlayNowBtn.addEventListener('click', () => {
      this.cancelAutoplay();
      this.playNextEpisode();
    });

    this.autoplayCancelBtn.addEventListener('click', () => {
      this.cancelAutoplay();
    });

    // Idle controls hiding
    this.videoContainer.addEventListener('mousemove', () => this.resetControlsTimeout());
    this.videoContainer.addEventListener('mouseleave', () => {
      if (!this.video.paused) {
        this.videoContainer.classList.add('user-idle');
      }
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (!this.modal.classList.contains('active')) return;

      if (e.key === 'Escape') {
        this.close();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        this.togglePlay();
      } else if (e.key === 'ArrowRight' || e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        this.skipTime(10);
      } else if (e.key === 'ArrowLeft' || e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        this.skipTime(-10);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        this.toggleFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        this.toggleMute();
      }
    });
  }

  // Buka Pemutar Film/Serial
  open(item, episodeIndex = 0) {
    this.currentItem = item;
    this.currentEpisodeIndex = episodeIndex;
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    this.playerTitle.textContent = item.title;

    if (item.type === 'series') {
      this.sidebar.classList.remove('hidden');
      this.renderEpisodeList();
      this.playEpisode(episodeIndex);
    } else {
      this.sidebar.classList.add('hidden');
      this.playerSubtitle.textContent = item.genre || 'Film';
      this.btnPrevEp.disabled = true;
      this.btnNextEp.disabled = true;
      this.loadStream(item.stream_url);
    }
  }

  // Muat stream URL menggunakan HLS.js
  loadStream(url) {
    this.cancelAutoplay();
    this.showLoading(true);

    if (!url) {
      this.showToast('Link video belum diisi untuk film ini!');
      this.showLoading(false);
      return;
    }

    // Gunakan streaming proxy untuk link eksternal agar bebas dari blokir CORS CDN
    let streamUrl = url.trim();
    if (streamUrl.startsWith('http://') || streamUrl.startsWith('https://')) {
      streamUrl = `/api/proxy?url=${encodeURIComponent(streamUrl)}`;
    }

    // Bersihkan instance HLS sebelumnya
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    // Cek apakah browser mendukung Hls.js
    if (Hls.isSupported()) {
      this.hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      this.hls.loadSource(streamUrl);
      this.hls.attachMedia(this.video);

      this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        this.setupQualityLevels(this.hls.levels);
        this.video.play().catch(err => {
          console.warn('Autoplay dibatasi browser:', err);
        });
      });

      this.hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('HLS Network Error, mencoba memulihkan...', data);
              this.hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('HLS Media Error, mencoba recoverMediaError...', data);
              this.hls.recoverMediaError();
              break;
            default:
              console.error('HLS Fatal Error, stream tidak dapat diputar:', data);
              this.hls.destroy();
              this.showToast('Gagal memuat video. Pastikan link streaming aktif & dapat diakses.');
              break;
          }
        }
      });
    } 
    // Fallback untuk Safari atau browser dengan dukungan native HLS
    else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
      this.video.src = streamUrl;
      this.video.addEventListener('loadedmetadata', () => {
        this.video.play().catch(console.warn);
      }, { once: true });
      this.qualityLabel.textContent = 'Native';
      this.qualityMenu.innerHTML = `<button class="quality-option active">Native Auto</button>`;
    } else {
      this.showToast('Browser Anda tidak mendukung pemutaran HLS video.');
    }
  }

  // Render daftar episode di sidebar
  renderEpisodeList() {
    const episodes = this.currentItem.episodes || [];
    this.episodeCountBadge.textContent = `${episodes.length} Episode`;
    this.episodeList.innerHTML = '';

    if (episodes.length === 0) {
      this.episodeList.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); font-size: 0.85rem;">
          Belum ada episode yang ditambahkan.
        </div>
      `;
      return;
    }

    episodes.forEach((ep, idx) => {
      const epEl = document.createElement('div');
      epEl.className = `episode-item ${idx === this.currentEpisodeIndex ? 'active' : ''}`;
      epEl.innerHTML = `
        <div class="episode-num-badge">${ep.episode_number || (idx + 1)}</div>
        <div class="episode-details">
          <div class="episode-name">${ep.title || `Episode ${idx + 1}`}</div>
          <div class="episode-status">${idx === this.currentEpisodeIndex ? 'Sedang Diputar' : 'Putar'}</div>
        </div>
      `;

      epEl.addEventListener('click', () => {
        this.playEpisode(idx);
      });

      this.episodeList.appendChild(epEl);
    });
  }

  // Putar episode tertentu
  playEpisode(index) {
    const episodes = this.currentItem.episodes || [];
    if (index < 0 || index >= episodes.length) return;

    this.currentEpisodeIndex = index;
    const currentEp = episodes[index];

    this.playerSubtitle.textContent = `${currentEp.title || `Episode ${index + 1}`}`;

    // Update active class di sidebar
    const allItems = this.episodeList.querySelectorAll('.episode-item');
    allItems.forEach((el, idx) => {
      if (idx === index) {
        el.classList.add('active');
        el.querySelector('.episode-status').textContent = 'Sedang Diputar';
      } else {
        el.classList.remove('active');
        el.querySelector('.episode-status').textContent = 'Putar';
      }
    });

    // Update prev/next button states
    this.btnPrevEp.disabled = index === 0;
    this.btnNextEp.disabled = index === episodes.length - 1;

    // Load stream link
    this.loadStream(currentEp.stream_url);
  }

  playPreviousEpisode() {
    if (this.currentEpisodeIndex > 0) {
      this.playEpisode(this.currentEpisodeIndex - 1);
    }
  }

  playNextEpisode() {
    const episodes = this.currentItem.episodes || [];
    if (this.currentEpisodeIndex < episodes.length - 1) {
      this.playEpisode(this.currentEpisodeIndex + 1);
    }
  }

  // Ketika video selesai diputar (ended)
  onVideoEnded() {
    this.btnPlayPause.textContent = '▶';

    // Jika serial dan masih ada episode berikutnya -> Jalankan Auto-Play
    if (this.currentItem && this.currentItem.type === 'series') {
      const episodes = this.currentItem.episodes || [];
      const nextIndex = this.currentEpisodeIndex + 1;

      if (nextIndex < episodes.length) {
        const nextEp = episodes[nextIndex];
        this.triggerAutoplayNext(nextEp, nextIndex);
      } else {
        this.showToast('Anda telah menyelesaikan semua episode serial ini! 🎉');
      }
    }
  }

  // Menjalankan countdown otomatis memutar episode selanjutnya
  triggerAutoplayNext(nextEp, nextIndex) {
    this.autoplayNextTitle.textContent = nextEp.title || `Episode ${nextIndex + 1}`;
    this.autoplayOverlay.classList.remove('hidden');

    let secondsLeft = 5;
    this.countdownBarFill.style.transition = 'none';
    this.countdownBarFill.style.width = '100%';

    // Animate progress bar fill
    setTimeout(() => {
      this.countdownBarFill.style.transition = 'width 5s linear';
      this.countdownBarFill.style.width = '0%';
    }, 50);

    this.autoplayTimer = setTimeout(() => {
      this.cancelAutoplay();
      this.playEpisode(nextIndex);
    }, 5000);
  }

  cancelAutoplay() {
    if (this.autoplayTimer) {
      clearTimeout(this.autoplayTimer);
      this.autoplayTimer = null;
    }
    this.autoplayOverlay.classList.add('hidden');
  }

  // Setup dropdown pilihan kualitas dari Hls.js
  setupQualityLevels(levels) {
    this.qualityMenu.innerHTML = '';

    if (!levels || levels.length === 0) {
      this.qualityLabel.textContent = 'Default';
      this.qualityMenu.innerHTML = `
        <button class="quality-option active">Default (Auto)</button>
      `;
      return;
    }

    // 1. Opsi Auto
    const autoBtn = document.createElement('button');
    autoBtn.className = `quality-option ${this.hls.currentLevel === -1 ? 'active' : ''}`;
    autoBtn.textContent = 'Auto (Otomatis)';
    autoBtn.addEventListener('click', () => {
      this.hls.currentLevel = -1;
      this.qualityLabel.textContent = 'Auto';
      this.updateQualityActiveBtn(autoBtn);
    });
    this.qualityMenu.appendChild(autoBtn);

    // 2. Daftar Level Kualitas
    levels.forEach((lvl, idx) => {
      const btn = document.createElement('button');
      const label = lvl.height ? `${lvl.height}p` : `${Math.round(lvl.bitrate / 1000)}k`;
      btn.className = `quality-option ${this.hls.currentLevel === idx ? 'active' : ''}`;
      btn.textContent = label;

      btn.addEventListener('click', () => {
        this.hls.currentLevel = idx;
        this.qualityLabel.textContent = label;
        this.updateQualityActiveBtn(btn);
      });

      this.qualityMenu.appendChild(btn);
    });
  }

  updateQualityActiveBtn(activeBtn) {
    const allBtns = this.qualityMenu.querySelectorAll('.quality-option');
    allBtns.forEach(b => b.classList.remove('active'));
    activeBtn.classList.add('active');
    this.qualityMenu.classList.remove('show');
  }

  // Play / Pause
  togglePlay() {
    if (this.video.paused || this.video.ended) {
      this.video.play();
      this.flashCenterIcon('▶');
    } else {
      this.video.pause();
      this.flashCenterIcon('⏸');
    }
  }

  // Lompat waktu video (maju/mundur dalam detik)
  skipTime(seconds) {
    if (!this.video) return;
    const duration = this.video.duration || 0;
    const current = this.video.currentTime || 0;
    const newTime = Math.max(0, Math.min(duration, current + seconds));
    this.video.currentTime = newTime;
    this.onTimeUpdate();

    if (seconds < 0) {
      this.flashCenterIcon('⏪ -10s');
    } else {
      this.flashCenterIcon('+10s ⏩');
    }
  }

  // Atur kecepatan pemutaran video (playback speed)
  setPlaybackSpeed(speed) {
    this.currentSpeed = speed;
    if (this.video) {
      this.video.playbackRate = speed;
    }
    if (this.speedLabel) {
      this.speedLabel.textContent = `${speed}x`;
    }
    if (this.speedMenu) {
      const options = this.speedMenu.querySelectorAll('.speed-option');
      options.forEach(opt => {
        if (parseFloat(opt.dataset.speed) === speed) {
          opt.classList.add('active');
        } else {
          opt.classList.remove('active');
        }
      });
    }
    this.flashCenterIcon(`⚡ ${speed}x`);
  }

  // Stop playback and reset to beginning (tetap dipertahankan untuk backward compatibility)
  stop() {
    if (this.video) {
      this.video.pause();
      this.video.currentTime = 0;
    }
    this.flashCenterIcon('⏹');
    this.onTimeUpdate();
  }

  flashCenterIcon(iconText) {
    this.centerPlayIcon.textContent = iconText;
    this.centerPlayOverlay.classList.add('show-flash');
    setTimeout(() => {
      this.centerPlayOverlay.classList.remove('show-flash');
    }, 400);
  }

  // Time & Progress Update
  onTimeUpdate() {
    if (this.isDraggingSeek) return;

    const current = this.video.currentTime || 0;
    const duration = this.video.duration || 0;

    const percent = duration > 0 ? (current / duration) * 100 : 0;
    this.progressFilled.style.width = `${percent}%`;
    this.progressThumb.style.left = `${percent}%`;

    this.timeDisplay.textContent = `${this.formatTime(current)} / ${this.formatTime(duration)}`;
  }

  updateBuffer() {
    const duration = this.video.duration;
    if (duration > 0 && this.video.buffered.length > 0) {
      const bufferedEnd = this.video.buffered.end(this.video.buffered.length - 1);
      const percent = (bufferedEnd / duration) * 100;
      this.progressBuffer.style.width = `${percent}%`;
    }
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const m = mins < 10 ? `0${mins}` : mins;
    const s = secs < 10 ? `0${secs}` : secs;

    if (hrs > 0) {
      const h = hrs < 10 ? `0${hrs}` : hrs;
      return `${h}:${m}:${s}`;
    }
    return `${m}:${s}`;
  }

  // Seeking events
  startSeek(e) {
    this.isDraggingSeek = true;
    this.doSeek(e);
  }

  doSeek(e) {
    if (!this.isDraggingSeek) return;
    const rect = this.progressBar.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = pos * (this.video.duration || 0);

    this.progressFilled.style.width = `${pos * 100}%`;
    this.progressThumb.style.left = `${pos * 100}%`;
    this.timeDisplay.textContent = `${this.formatTime(targetTime)} / ${this.formatTime(this.video.duration || 0)}`;
  }

  endSeek() {
    if (!this.isDraggingSeek) return;
    this.isDraggingSeek = false;
    const percent = parseFloat(this.progressFilled.style.width) / 100;
    if (!isNaN(percent)) {
      this.video.currentTime = percent * (this.video.duration || 0);
    }
  }

  // Volume & Mute
  toggleMute() {
    this.video.muted = !this.video.muted;
    this.volumeSlider.value = this.video.muted ? 0 : (this.video.volume || 1);
    this.updateVolumeIcon();
  }

  updateVolumeIcon() {
    if (this.video.muted || this.video.volume === 0) {
      this.btnMute.textContent = '🔇';
    } else if (this.video.volume < 0.5) {
      this.btnMute.textContent = '🔉';
    } else {
      this.btnMute.textContent = '🔊';
    }
  }

  // Fullscreen
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      if (this.videoContainer.requestFullscreen) {
        this.videoContainer.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  // Idle controls hide
  resetControlsTimeout() {
    this.videoContainer.classList.remove('user-idle');
    clearTimeout(this.controlsTimeout);
    this.controlsTimeout = setTimeout(() => {
      if (!this.video.paused) {
        this.videoContainer.classList.add('user-idle');
      }
    }, 3000);
  }

  showLoading(show) {
    if (show) {
      this.loadingSpinner.classList.add('active');
    } else {
      this.loadingSpinner.classList.remove('active');
    }
  }

  showToast(msg) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    if (!toast || !toastMsg) return;
    toastMsg.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }

  close() {
    this.cancelAutoplay();
    this.video.pause();
    this.video.src = '';
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    this.modal.classList.remove('active');
    if (this.speedMenu) this.speedMenu.classList.remove('show');
    if (this.qualityMenu) this.qualityMenu.classList.remove('show');
    document.body.style.overflow = '';
  }
}

// Inisialisasi Player secara global
window.playerInstance = new BisaPlayer();
