// SINKI Premium Interaction Sound Engine
// Karakter: Soft Glass & Luxury Digital (Web Audio API Synthesizer)
// Zero latency, zero external asset downloads, cross-platform iOS & Android

export type SinkiSoundType = 'softClick' | 'glassTap' | 'digitalSoft' | 'luxurySuccess';

const SOUND_STORAGE_KEY = 'sinki_sound_enabled';
const SOUND_VOLUME_STORAGE_KEY = 'sinki_sound_volume';
const DEFAULT_VOLUME = 0.60; // 60% default volume (jernih, berbobot, & nyaman)

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let isAudioInitialized = false;
let lastSoundTime = 0;
let lastSoundType: SinkiSoundType | null = null;

// Ambil preferensi suara ON/OFF dari localStorage (default: true)
export const getSoundEnabled = (): boolean => {
  if (typeof window === 'undefined') return true;
  try {
    const stored = localStorage.getItem(SOUND_STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
};

// Simpan preferensi suara dan dispatch event sinkronisasi
export const setSoundEnabled = (enabled: boolean): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('sinki_sound_changed', { detail: { enabled } }));
  } catch (e) {
    console.warn('Gagal menyimpan preferensi suara:', e);
  }
};

// Ambil preferensi volume dari localStorage (default: 0.60 atau 60%)
export const getSoundVolume = (): number => {
  if (typeof window === 'undefined') return DEFAULT_VOLUME;
  try {
    const stored = localStorage.getItem(SOUND_VOLUME_STORAGE_KEY);
    if (stored === null) return DEFAULT_VOLUME;
    const val = parseFloat(stored);
    return isNaN(val) ? DEFAULT_VOLUME : Math.min(Math.max(val, 0.05), 1.0);
  } catch {
    return DEFAULT_VOLUME;
  }
};

// Simpan dan terapkan preferensi volume ke Master Gain Node
export const setSoundVolume = (vol: number): void => {
  if (typeof window === 'undefined') return;
  try {
    const clamped = Math.min(Math.max(vol, 0.05), 1.0);
    localStorage.setItem(SOUND_VOLUME_STORAGE_KEY, clamped.toString());
    if (masterGain && audioCtx) {
      masterGain.gain.setTargetAtTime(clamped, audioCtx.currentTime, 0.015);
    }
    window.dispatchEvent(new CustomEvent('sinki_volume_changed', { detail: { volume: clamped } }));
  } catch (e) {
    console.warn('Gagal menyimpan preferensi volume:', e);
  }
};

// Toggle Sound ON / OFF
export const toggleSound = (): boolean => {
  const current = getSoundEnabled();
  const next = !current;
  setSoundEnabled(next);
  if (next) {
    playInteractionSound('softClick');
  }
  return next;
};

// Inisialisasi AudioContext dengan lazy initialization & autoplay policy guard
const getOrCreateAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    audioCtx = new AudioContextClass();
    masterGain = audioCtx.createGain();
    const currentVol = getSoundVolume();
    masterGain.gain.setValueAtTime(currentVol, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

/**
 * 1. SOFT CLICK (Tombol & Menu)
 * Karakter: Micro-transient beresolusi tinggi, 22ms, jernih & lembut
 */
const synthesizeSoftClick = (ctx: AudioContext, dest: AudioNode, now: number) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1450, now);
  osc.frequency.exponentialRampToValueAtTime(750, now + 0.02);

  filter.type = 'highpass';
  filter.frequency.setValueAtTime(500, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.85, now + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  osc.start(now);
  osc.stop(now + 0.024);
};

/**
 * 2. GLASS TAP (Pemilihan Produk & Varian Botol Parfum)
 * Karakter: Resonansi kaca kristal flacon parfum (Harmonik 1860Hz & 3720Hz)
 */
const synthesizeGlassTap = (ctx: AudioContext, dest: AudioNode, now: number) => {
  // Fundamental crystal bell
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(1860, now);
  osc1.frequency.exponentialRampToValueAtTime(1820, now + 0.11);

  gain1.gain.setValueAtTime(0.0001, now);
  gain1.gain.linearRampToValueAtTime(0.90, now + 0.003);
  gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);

  // Sparkle harmonic overtone
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(3720, now);

  gain2.gain.setValueAtTime(0.0001, now);
  gain2.gain.linearRampToValueAtTime(0.35, now + 0.002);
  gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

  osc1.connect(gain1);
  gain1.connect(dest);

  osc2.connect(gain2);
  gain2.connect(dest);

  osc1.start(now);
  osc1.stop(now + 0.14);
  osc2.start(now);
  osc2.stop(now + 0.08);
};

/**
 * 3. DIGITAL SOFT (Transisi Tab Navigasi & Drawer)
 * Karakter: Warm luxury digital glide lembut, 85ms
 */
const synthesizeDigitalSoft = (ctx: AudioContext, dest: AudioNode, now: number) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(900, now);
  osc.frequency.exponentialRampToValueAtTime(680, now + 0.08);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2400, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.78, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  osc.start(now);
  osc.stop(now + 0.095);
};

/**
 * 4. LUXURY SUCCESS (Konfirmasi Pesanan / Checkout Berhasil)
 * Karakter: Dua akor harmoni kaca kristal lembut bertingkat (E5 -> B5), 360ms
 */
const synthesizeLuxurySuccess = (ctx: AudioContext, dest: AudioNode, now: number) => {
  // Nada 1: E5 (659.25Hz)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(659.25, now);

  gain1.gain.setValueAtTime(0.0001, now);
  gain1.gain.linearRampToValueAtTime(0.85, now + 0.005);
  gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

  osc1.connect(gain1);
  gain1.connect(dest);
  osc1.start(now);
  osc1.stop(now + 0.34);

  // Nada 2: B5 (987.77Hz) + Harmoni Atas (1975Hz) pada delay 90ms
  const t2 = now + 0.09;
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(987.77, t2);

  gain2.gain.setValueAtTime(0.0001, t2);
  gain2.gain.linearRampToValueAtTime(0.90, t2 + 0.006);
  gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.35);

  const osc3 = ctx.createOscillator();
  const gain3 = ctx.createGain();
  osc3.type = 'triangle';
  osc3.frequency.setValueAtTime(1975.5, t2);

  gain3.gain.setValueAtTime(0.0001, t2);
  gain3.gain.linearRampToValueAtTime(0.28, t2 + 0.004);
  gain3.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.20);

  osc2.connect(gain2);
  gain2.connect(dest);
  osc3.connect(gain3);
  gain3.connect(dest);

  osc2.start(t2);
  osc2.stop(t2 + 0.38);
  osc3.start(t2);
  osc3.stop(t2 + 0.22);
};

/**
 * Main Public API: Memutar suara interaksi
 */
export const playInteractionSound = (type: SinkiSoundType = 'softClick'): void => {
  if (!getSoundEnabled()) return;

  const ctx = getOrCreateAudioContext();
  if (!ctx || !masterGain) return;

  const now = ctx.currentTime;
  const timeSinceLast = Date.now() - lastSoundTime;

  // Throttling mikro agar tidak terjadi tumpukan suara distorsi saat double tap cepat
  if (timeSinceLast < 45 && lastSoundType === type) {
    return;
  }

  lastSoundTime = Date.now();
  lastSoundType = type;

  try {
    switch (type) {
      case 'softClick':
        synthesizeSoftClick(ctx, masterGain, now);
        break;
      case 'glassTap':
        synthesizeGlassTap(ctx, masterGain, now);
        break;
      case 'digitalSoft':
        synthesizeDigitalSoft(ctx, masterGain, now);
        break;
      case 'luxurySuccess':
        synthesizeLuxurySuccess(ctx, masterGain, now);
        break;
    }
  } catch (err) {
    console.warn('Audio playback notice:', err);
  }
};

/**
 * Inisialisasi Sistem Suara & Global Tactile Feedback:
 * 1. Mengaktifkan AudioContext pada gestur sentuhan pertama pengguna (Autoplay Policy Compliance)
 * 2. Menghubungkan klik tombol/menu secara cerdas dengan suara 'softClick'
 */
export const initSoundSystem = (): (() => void) => {
  if (typeof window === 'undefined' || isAudioInitialized) {
    return () => {};
  }
  isAudioInitialized = true;

  // 1. Gesture unlock untuk iOS Safari & Android Chrome
  const unlockAudio = () => {
    getOrCreateAudioContext();
    window.removeEventListener('pointerdown', unlockAudio, true);
    window.removeEventListener('touchstart', unlockAudio, true);
    window.removeEventListener('keydown', unlockAudio, true);
  };

  window.addEventListener('pointerdown', unlockAudio, { once: true, passive: true, capture: true });
  window.addEventListener('touchstart', unlockAudio, { once: true, passive: true, capture: true });
  window.addEventListener('keydown', unlockAudio, { once: true, passive: true, capture: true });

  // 2. Global delegasi interaksi sentuhan tombol/menu
  const handleGlobalClick = (e: MouseEvent) => {
    if (!getSoundEnabled()) return;

    // Jika suara spesifik baru saja dipicu oleh komponen dalam 40ms, lewati
    if (Date.now() - lastSoundTime < 40) {
      return;
    }

    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Jangan picu auto-click pada input range slider agar pergeseran slider halus
    if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'range') {
      return;
    }

    // Deteksi apakah target adalah elemen interaktif (button, link, interactive card, icon)
    const interactiveEl = target.closest(
      'button, a, [role="button"], input[type="radio"], input[type="checkbox"], .sinki-cushion-press, .sinki-arch-card-interactive, .luxury-ticker-container'
    );

    if (interactiveEl) {
      playInteractionSound('softClick');
    }
  };

  window.addEventListener('click', handleGlobalClick, { capture: true, passive: true });

  return () => {
    window.removeEventListener('click', handleGlobalClick, true);
  };
};
