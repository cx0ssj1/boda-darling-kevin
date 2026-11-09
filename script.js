/**
 * Invitación de Boda — Darling & Kevin (Sábado 30 de Enero de 2027)
 * - Apertura 3D del sobre interactivo
 * - Reproductor de música dorado en vivo con barra de progreso y tiempo real
 * - Coreografía de velocidad en el autoscroll tipo video
 * - Partículas de destellos dorados flotantes
 * - Cuenta regresiva en tiempo real
 */
(function () {
  'use strict';

  const BASE_WIDTH = 516;
  const BASE_HEIGHT = 7342;

  // Elementos del DOM
  const body = document.body;
  const envelopeOverlay = document.getElementById('envelope-overlay');
  const envelopeStage = document.getElementById('envelope-stage');
  const openEnvelopeBtn = document.getElementById('open-envelope-btn');
  const stageWrapper = document.getElementById('canva-stage-wrapper');
  const canvaCanvas = document.getElementById('canva-canvas');

  // Reproductor de Música en Vivo
  const audio = document.getElementById('wedding-audio');
  const musicPlayerBox = document.getElementById('music-player-box');
  const musicPlayBtn = document.getElementById('music-play-btn');
  const mpProgressTrack = document.getElementById('mp-progress-track');
  const mpProgressFill = document.getElementById('mp-progress-fill');
  const mpProgressThumb = document.getElementById('mp-progress-thumb');
  const mpCurrentTime = document.getElementById('mp-current-time');
  const mpTotalTime = document.getElementById('mp-total-time');
  const mpPrevBtn = document.getElementById('mp-prev-btn');
  const mpNextBtn = document.getElementById('mp-next-btn');
  const mpRestartBtn = document.getElementById('mp-restart-btn');
  const mpLoopBtn = document.getElementById('mp-loop-btn');

  // Controles flotantes
  const floatingControls = document.getElementById('floating-controls');
  const toggleScrollBtn = document.getElementById('toggle-scroll-btn');
  const scrollIcon = document.getElementById('scroll-icon');
  const scrollLabel = document.getElementById('scroll-label');
  const toggleAudioBtn = document.getElementById('toggle-audio-btn');
  const audioIcon = document.getElementById('audio-icon');

  // Estado del Autoscroll Cinematográfico
  let isEnvelopeOpened = false;
  let isAutoScrollEnabled = true;
  let isUserInteracting = false;
  let userInteractionTimeout = null;
  let lastFrameTime = null;
  let scrollPositionY = 0;
  let currentScale = 1;

  // Velocidades base (px/s) para la coreografía tipo video:
  // Más fluido en transiciones florales/fotos y más pausado en secciones de lectura
  const SPEED_TRANSITION = 66;
  const SPEED_READING = 33;
  let currentSpeed = SPEED_TRANSITION;

  // Zonas del lienzo (en px del lienzo de 7342px) donde la cámara desacelera para leer
  const READING_ZONES = [
    [1620, 2310], // Guarda la fecha + Calendario Enero 2027 + Cuenta regresiva
    [3420, 4010], // Itinerario (El gran día, Ceremonia, Recepción)
    [4050, 4430], // Padrinos
    [4470, 4910], // Código de vestimenta (Formal playero, Para ellas, Para ellos)
    [4980, 5200], // Regalos
    [5240, 5980], // Ubicación en Lebu (Ceremonia, Recepción, Cabañas)
    [6040, 6820]  // Consideraciones y Confirmación de asistencia
  ];

  /* ==========================================================================
     1. Escalado proporcional exacto para cualquier pantalla móvil o escritorio
     ========================================================================== */
  function updateCanvasScale() {
    if (!stageWrapper || !canvaCanvas) return;
    const availableWidth = Math.min(window.innerWidth, BASE_WIDTH);
    currentScale = availableWidth / BASE_WIDTH;
    canvaCanvas.style.transform = `scale(${currentScale})`;
    stageWrapper.style.height = `${Math.ceil(BASE_HEIGHT * currentScale)}px`;
  }

  window.addEventListener('resize', updateCanvasScale);
  updateCanvasScale();

  /* ==========================================================================
     2. Cuenta regresiva en vivo: Sábado 30 de Enero de 2027 a las 17:00 hrs (Chile)
     ========================================================================== */
  const weddingTargetDate = new Date('2027-01-30T17:00:00-03:00').getTime();
  const elDays = document.getElementById('cd-days');
  const elHours = document.getElementById('cd-hours');
  const elMins = document.getElementById('cd-mins');
  const elSecs = document.getElementById('cd-secs');

  function updateCountdown() {
    const now = Date.now();
    const diff = Math.max(0, weddingTargetDate - now);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    if (elDays) elDays.textContent = String(days);
    if (elHours) elHours.textContent = String(hours).padStart(2, '0');
    if (elMins) elMins.textContent = String(mins).padStart(2, '0');
    if (elSecs) elSecs.textContent = String(secs).padStart(2, '0');
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* ==========================================================================
     3. Reproductor de Música Dorado 100% Vivo (Progreso y Tiempo en Tiempo Real)
     ========================================================================== */
  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function syncAudioUI() {
    const playing = audio && !audio.paused && !audio.muted;
    if (musicPlayerBox) {
      musicPlayerBox.classList.toggle('is-playing', playing);
    }
    if (audioIcon) {
      audioIcon.textContent = playing ? '🔊' : '🔇';
    }
  }

  function updateAudioProgress() {
    if (!audio) return;
    const cur = audio.currentTime || 0;
    const dur = audio.duration || 189;
    const pct = Math.min(100, Math.max(0, (cur / dur) * 100));

    if (mpProgressFill) mpProgressFill.style.width = `${pct}%`;
    if (mpProgressThumb) mpProgressThumb.style.left = `${pct}%`;
    if (mpCurrentTime) mpCurrentTime.textContent = formatTime(cur);
    if (mpTotalTime && Number.isFinite(audio.duration)) {
      mpTotalTime.textContent = formatTime(audio.duration);
    }
  }

  function toggleAudioPlayback(e) {
    if (e) e.stopPropagation();
    if (!audio) return;

    if (audio.paused) {
      audio.muted = false;
      audio.play().then(syncAudioUI).catch(() => {});
    } else {
      audio.pause();
      syncAudioUI();
    }
  }

  if (musicPlayBtn) {
    musicPlayBtn.addEventListener('click', toggleAudioPlayback);
  }
  if (toggleAudioBtn) {
    toggleAudioBtn.addEventListener('click', toggleAudioPlayback);
  }
  if (mpPrevBtn) {
    mpPrevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!audio) return;
      audio.currentTime = Math.max(0, audio.currentTime - 10);
      updateAudioProgress();
    });
  }
  if (mpNextBtn) {
    mpNextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!audio) return;
      audio.currentTime = Math.min(audio.duration || 189, audio.currentTime + 10);
      updateAudioProgress();
    });
  }
  if (mpRestartBtn) {
    mpRestartBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!audio) return;
      audio.currentTime = 0;
      if (audio.paused) audio.play().catch(() => {});
      updateAudioProgress();
    });
  }
  if (mpLoopBtn) {
    mpLoopBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!audio) return;
      audio.loop = !audio.loop;
      mpLoopBtn.style.opacity = audio.loop ? '1' : '0.45';
    });
  }
  if (mpProgressTrack) {
    mpProgressTrack.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!audio || !audio.duration) return;
      const rect = mpProgressTrack.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      audio.currentTime = ratio * audio.duration;
      updateAudioProgress();
    });
  }

  if (audio) {
    audio.addEventListener('play', syncAudioUI);
    audio.addEventListener('pause', syncAudioUI);
    audio.addEventListener('timeupdate', updateAudioProgress);
    audio.addEventListener('loadedmetadata', updateAudioProgress);
  }

  /* ==========================================================================
     4. Aparición suave de elementos al avanzar (IntersectionObserver)
     ========================================================================== */
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      {
        root: null,
        threshold: 0.08,
        rootMargin: '0px 0px -30px 0px'
      }
    );

    revealElements.forEach((el) => observer.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add('is-visible'));
  }

  /* ==========================================================================
     5. Autoscroll Cinematográfico con Coreografía de Velocidad
     ========================================================================== */
  function syncScrollUI() {
    if (!scrollIcon || !scrollLabel) return;
    if (isAutoScrollEnabled) {
      scrollIcon.textContent = '⏸';
      scrollLabel.textContent = 'Auto-scroll';
    } else {
      scrollIcon.textContent = '▶';
      scrollLabel.textContent = 'Continuar';
    }
  }

  function getTargetSpeedForPosition(scrollY) {
    // Convertir posición actual del centro de la pantalla a coordenada base (0..7342)
    const viewportCenterBaseY = (scrollY + window.innerHeight * 0.48) / currentScale;
    for (let i = 0; i < READING_ZONES.length; i++) {
      const [startY, endY] = READING_ZONES[i];
      if (viewportCenterBaseY >= startY && viewportCenterBaseY <= endY) {
        return SPEED_READING;
      }
    }
    return SPEED_TRANSITION;
  }

  function autoScrollStep(timestamp) {
    if (!isEnvelopeOpened) return;

    if (lastFrameTime === null) {
      lastFrameTime = timestamp;
    }
    const deltaSec = Math.min((timestamp - lastFrameTime) / 1000, 0.1);
    lastFrameTime = timestamp;

    if (isAutoScrollEnabled && !isUserInteracting) {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (window.scrollY < maxScroll - 1) {
        // Suavizar cambios de velocidad entre secciones de transición y de lectura
        const targetSpeed = getTargetSpeedForPosition(scrollPositionY);
        currentSpeed += (targetSpeed - currentSpeed) * 0.08;

        const stepPx = currentSpeed * currentScale * deltaSec;
        scrollPositionY += stepPx;
        window.scrollTo(0, scrollPositionY);
      } else {
        isAutoScrollEnabled = false;
        syncScrollUI();
      }
    } else {
      scrollPositionY = window.scrollY;
    }

    requestAnimationFrame(autoScrollStep);
  }

  function handleManualInteraction() {
    if (!isEnvelopeOpened) return;
    isUserInteracting = true;
    scrollPositionY = window.scrollY;

    if (userInteractionTimeout) {
      clearTimeout(userInteractionTimeout);
    }
    userInteractionTimeout = setTimeout(() => {
      scrollPositionY = window.scrollY;
      isUserInteracting = false;
    }, 3500);
  }

  window.addEventListener('wheel', handleManualInteraction, { passive: true });
  window.addEventListener('touchstart', handleManualInteraction, { passive: true });
  window.addEventListener('touchmove', handleManualInteraction, { passive: true });
  window.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' '].includes(e.key)) {
      handleManualInteraction();
    }
  });

  if (toggleScrollBtn) {
    toggleScrollBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (!isAutoScrollEnabled && window.scrollY >= maxScroll - 5) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        scrollPositionY = 0;
      }
      isAutoScrollEnabled = !isAutoScrollEnabled;
      isUserInteracting = false;
      scrollPositionY = window.scrollY;
      syncScrollUI();
    });
  }

  /* ==========================================================================
     6. Destellos Dorados Flotantes en Fondo (Efecto Video de Boda)
     ========================================================================== */
  const sparklesCanvas = document.getElementById('sparkles-canvas');
  if (sparklesCanvas && sparklesCanvas.getContext) {
    const ctx = sparklesCanvas.getContext('2d');
    let cw = (sparklesCanvas.width = window.innerWidth);
    let ch = (sparklesCanvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      cw = sparklesCanvas.width = window.innerWidth;
      ch = sparklesCanvas.height = window.innerHeight;
    });

    const PARTICLE_COUNT = 26;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * cw,
      y: Math.random() * ch,
      r: 1.2 + Math.random() * 2.4,
      vy: -(0.18 + Math.random() * 0.35),
      vx: (Math.random() - 0.5) * 0.25,
      alpha: 0.15 + Math.random() * 0.45,
      phase: Math.random() * Math.PI * 2
    }));

    function renderSparkles(t) {
      ctx.clearRect(0, 0, cw, ch);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y += p.vy;
        p.x += p.vx + Math.sin(t * 0.001 + p.phase) * 0.15;

        if (p.y < -10) {
          p.y = ch + 10;
          p.x = Math.random() * cw;
        }
        if (p.x < -10) p.x = cw + 10;
        if (p.x > cw + 10) p.x = -10;

        const twinkle = p.alpha * (0.65 + 0.35 * Math.sin(t * 0.0025 + p.phase));
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.4);
        grad.addColorStop(0, `rgba(211, 169, 49, ${twinkle})`);
        grad.addColorStop(0.5, `rgba(200, 185, 122, ${twinkle * 0.5})`);
        grad.addColorStop(1, 'rgba(200, 185, 122, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(renderSparkles);
    }

    requestAnimationFrame(renderSparkles);
  }

  /* ==========================================================================
     7. Animación de Apertura de la Carta / Sobre
     ========================================================================== */
  function openEnvelope() {
    if (isEnvelopeOpened) return;
    isEnvelopeOpened = true;

    if (audio) {
      audio.volume = 0.85;
      audio.play().then(syncAudioUI).catch(() => {});
    }

    if (envelopeOverlay) {
      envelopeOverlay.classList.add('is-opening');
    }

    revealElements.forEach((el, index) => {
      if (index < 5) el.classList.add('is-visible');
    });

    setTimeout(() => {
      body.classList.remove('envelope-locked');
      window.scrollTo(0, 0);
      scrollPositionY = 0;

      if (envelopeOverlay) {
        envelopeOverlay.classList.add('is-hidden');
      }
      if (floatingControls) {
        floatingControls.classList.add('is-visible');
      }

      setTimeout(() => {
        lastFrameTime = null;
        requestAnimationFrame(autoScrollStep);
      }, 700);
    }, 1350);
  }

  if (envelopeStage) {
    envelopeStage.addEventListener('click', openEnvelope);
  }
  if (openEnvelopeBtn) {
    openEnvelopeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEnvelope();
    });
  }
})();
