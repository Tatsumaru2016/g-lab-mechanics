/**
 * Jog-dial SFX from sample: public/audio/jog.wav (se_kinko_kagi02.wav)
 */

export type RatchetKind = "minor" | "medium" | "major";

const JOG_SAMPLE_URL = `${import.meta.env.BASE_URL}audio/jog.wav`;

let sharedContext: AudioContext | null = null;
let cachedBuffer: AudioBuffer | null = null;
let loadPromise: Promise<AudioBuffer> | null = null;
let readyPromise: Promise<AudioContext> | null = null;
let sfxActivated = false;
let activationInFlight: Promise<AudioContext> | null = null;

function getOrCreateContext(): AudioContext {
  if (!sharedContext) {
    sharedContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)();
  }
  return sharedContext;
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
  return activationInFlight.then((ctx) => {
    sfxActivated = true;
    if (playConfirm) {
      void playSample(ctx, {
        gain: 0.85 * 0.72,
        playbackRate: 0.96,
        duration: 0.09,
      });
    }
    return ctx;
  });
}

/** First user gesture while sound is ON — mirrors OFF→ON activation once per session. */
export function activateJogAudioFromGesture(): void {
  if (sfxActivated || activationInFlight) return;
  void activateJogAudio();
}

export function isJogAudioActivated(): boolean {
  return sfxActivated;
}

async function playSample(
  ctx: AudioContext,
  opts: { gain: number; playbackRate?: number; startOffset?: number; duration?: number },
) {
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
  if (ctx.state !== "running") return;

  const buffer = await loadJogBuffer(ctx);

  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.playbackRate.value = opts.playbackRate ?? 1;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(opts.gain, ctx.currentTime);

  src.connect(gain);
  gain.connect(ctx.destination);

  const offset = opts.startOffset ?? 0;
  const duration = opts.duration ?? buffer.duration - offset;
  src.start(ctx.currentTime, offset, Math.max(0.01, duration));
}

function runSample(
  opts: { gain: number; playbackRate?: number; startOffset?: number; duration?: number },
) {
  void ensureJogAudioReady()
    .then((ctx) => playSample(ctx, opts))
    .catch(() => {
      // Ignore missing sample or decode errors during interaction.
    });
}

/** Every 6° ratchet step while dragging */
export function playRatchetTick(kind: RatchetKind) {
  if (kind === "minor") {
    runSample({ gain: 0.42, playbackRate: 1.08, duration: 0.06 });
    return;
  }
  if (kind === "medium") {
    runSample({ gain: 0.58, playbackRate: 1, duration: 0.08 });
    return;
  }
  runSample({ gain: 0.78, playbackRate: 0.94, duration: 0.1 });
}

/** Final detent lock when dial settles on a chamber */
export function playGearMeshLock(variant: "full" | "confirm" = "full") {
  const amp = variant === "full" ? 1 : 0.72;
  runSample({
    gain: 0.85 * amp,
    playbackRate: variant === "full" ? 0.88 : 0.96,
    duration: variant === "full" ? 0.14 : 0.09,
  });
}
