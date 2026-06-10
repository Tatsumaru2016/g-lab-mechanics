/**
 * Jog-dial SFX from sample: public/audio/jog.wav (se_kinko_kagi02.wav)
 */

export type RatchetKind = "minor" | "medium" | "major";

const JOG_SAMPLE_URL = `${import.meta.env.BASE_URL}audio/jog.wav`;
/** Boost perceived loudness — short jog.wav slices read quiet on laptop speakers / Pages. */
const SFX_MASTER_GAIN = 1.75;

let sharedContext: AudioContext | null = null;
let cachedBuffer: AudioBuffer | null = null;
let loadPromise: Promise<AudioBuffer> | null = null;
let readyPromise: Promise<AudioContext> | null = null;
let sfxActivated = false;
let activationInFlight: Promise<AudioContext> | null = null;
let fallbackClip: HTMLAudioElement | null = null;
let unbindWatchers: (() => void) | null = null;

function getOrCreateContext(): AudioContext {
  if (!sharedContext) {
    sharedContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)();
    sharedContext.addEventListener("statechange", () => {
      if (sharedContext?.state === "suspended") {
        sfxActivated = false;
        readyPromise = null;
      }
    });
  }
  return sharedContext;
}

function getFallbackClip(): HTMLAudioElement {
  if (!fallbackClip) {
    fallbackClip = new Audio(JOG_SAMPLE_URL);
    fallbackClip.preload = "auto";
  }
  return fallbackClip;
}

/** Prime HTMLAudioElement output path (helps on Windows when WebAudio stays suspended). */
function primeFallbackAudioSync(): void {
  try {
    const clip = getFallbackClip();
    clip.volume = Math.min(1, 0.92 * SFX_MASTER_GAIN);
    const playAttempt = clip.play();
    if (playAttempt) {
      void playAttempt
        .then(() => {
          clip.pause();
          clip.currentTime = 0;
        })
        .catch(() => {
          // Needs a user gesture; ignore until then.
        });
    }
  } catch {
    // Audio unavailable
  }
}

function playFallback(opts: { volume?: number; playbackRate?: number; duration?: number }) {
  try {
    const clip = getFallbackClip();
    clip.volume = Math.min(1, (opts.volume ?? 0.85) * SFX_MASTER_GAIN);
    clip.playbackRate = opts.playbackRate ?? 1;
    clip.currentTime = 0;
    void clip.play().catch(() => {});
    if (opts.duration) {
      window.setTimeout(() => {
        clip.pause();
      }, opts.duration * 1000);
    }
  } catch {
    // Audio unavailable
  }
}

async function loadJogBuffer(ctx: AudioContext): Promise<AudioBuffer> {
  if (cachedBuffer) return cachedBuffer;
  if (!loadPromise) {
    loadPromise = fetch(JOG_SAMPLE_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load jog.wav (${response.status})`);
        }
        return response.arrayBuffer();
      })
      .then((data) => ctx.decodeAudioData(data))
      .then((buffer) => {
        cachedBuffer = buffer;
        return buffer;
      });
  }
  return loadPromise;
}

/** Call synchronously inside pointerdown / click / keydown handlers. */
export function unlockJogAudioSync(): AudioContext | null {
  try {
    const ctx = getOrCreateContext();
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    primeFallbackAudioSync();
    void loadJogBuffer(ctx);
    if (ctx.state !== "running") {
      readyPromise = null;
    }
    return ctx;
  } catch {
    return null;
  }
}

/** Resume AudioContext and preload jog.wav. */
export function ensureJogAudioReady(): Promise<AudioContext> {
  unlockJogAudioSync();
  const ctx = getOrCreateContext();
  if (ctx.state !== "running") {
    readyPromise = null;
  }
  if (!readyPromise) {
    readyPromise = (async () => {
      const active = getOrCreateContext();
      if (active.state === "suspended") {
        await active.resume();
      }
      await loadJogBuffer(active);
      if (active.state === "suspended") {
        await active.resume();
      }
      return active;
    })().catch((err) => {
      readyPromise = null;
      throw err;
    });
  }
  return readyPromise;
}

function isAudioRunning(): boolean {
  return sharedContext?.state === "running";
}

/**
 * Same path as toggling sound OFF → ON:
 * unlock, preload sample, play confirm lock click.
 */
export function activateJogAudio(options: { playConfirm?: boolean } = {}): Promise<AudioContext> {
  const playConfirm = options.playConfirm ?? true;
  unlockJogAudioSync();
  if (!activationInFlight) {
    activationInFlight = ensureJogAudioReady().finally(() => {
      activationInFlight = null;
    });
  }
  return activationInFlight.then(async (ctx) => {
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    if (ctx.state === "running") {
      sfxActivated = true;
      if (playConfirm) {
        await playSample(ctx, {
          gain: 0.92 * 0.72,
          playbackRate: 0.96,
          duration: 0.11,
        });
      }
    } else {
      sfxActivated = false;
      if (playConfirm) {
        playFallback({ volume: 0.92 * 0.72, playbackRate: 0.96, duration: 0.11 });
      }
    }
    return ctx;
  });
}

/**
 * Call on every user gesture while sound is ON.
 * Re-activates when the context is suspended (common on Windows until output wakes).
 */
export function primeJogAudioFromGesture(): void {
  unlockJogAudioSync();
  if (!sfxActivated || !isAudioRunning()) {
    if (!activationInFlight) {
      void activateJogAudio({ playConfirm: !sfxActivated });
    }
    return;
  }
  void ensureJogAudioReady();
}

export function isJogAudioActivated(): boolean {
  return sfxActivated && isAudioRunning();
}

/** Focus / visibility / device changes can wake the OS audio path — retry resume. */
export function bindJogAudioWatchers(): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  unbindWatchers?.();

  const retry = () => {
    unlockJogAudioSync();
    void ensureJogAudioReady();
  };

  window.addEventListener("focus", retry);
  document.addEventListener("visibilitychange", retry);
  navigator.mediaDevices?.addEventListener("devicechange", retry);

  unbindWatchers = () => {
    window.removeEventListener("focus", retry);
    document.removeEventListener("visibilitychange", retry);
    navigator.mediaDevices?.removeEventListener("devicechange", retry);
    unbindWatchers = null;
  };

  return unbindWatchers;
}

async function playSample(
  ctx: AudioContext,
  opts: { gain: number; playbackRate?: number; startOffset?: number; duration?: number },
): Promise<boolean> {
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
  if (ctx.state !== "running") {
    playFallback({
      volume: opts.gain,
      playbackRate: opts.playbackRate,
      duration: opts.duration,
    });
    return false;
  }

  const buffer = await loadJogBuffer(ctx);

  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.playbackRate.value = opts.playbackRate ?? 1;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(Math.min(1, opts.gain * SFX_MASTER_GAIN), ctx.currentTime);

  src.connect(gain);
  gain.connect(ctx.destination);

  const offset = opts.startOffset ?? 0;
  const duration = opts.duration ?? buffer.duration - offset;
  src.start(ctx.currentTime, offset, Math.max(0.01, duration));
  return true;
}

function runSample(
  opts: { gain: number; playbackRate?: number; startOffset?: number; duration?: number },
) {
  unlockJogAudioSync();
  void ensureJogAudioReady()
    .then((ctx) => playSample(ctx, opts))
    .catch(() => {
      playFallback({
        volume: opts.gain,
        playbackRate: opts.playbackRate,
        duration: opts.duration,
      });
    });
}

/** Every 6° ratchet step while dragging */
export function playRatchetTick(kind: RatchetKind) {
  if (kind === "minor") {
    runSample({ gain: 0.48, playbackRate: 1.08, duration: 0.07 });
    return;
  }
  if (kind === "medium") {
    runSample({ gain: 0.64, playbackRate: 1, duration: 0.09 });
    return;
  }
  runSample({ gain: 0.82, playbackRate: 0.94, duration: 0.11 });
}

/** Final detent lock when dial settles on a chamber */
export function playGearMeshLock(variant: "full" | "confirm" = "full") {
  const amp = variant === "full" ? 1 : 0.72;
  runSample({
    gain: 0.92 * amp,
    playbackRate: variant === "full" ? 0.88 : 0.96,
    duration: variant === "full" ? 0.16 : 0.11,
  });
}

/** @deprecated Use primeJogAudioFromGesture */
export function activateJogAudioFromGesture(): void {
  primeJogAudioFromGesture();
}
