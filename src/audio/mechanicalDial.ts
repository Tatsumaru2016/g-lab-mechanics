/**
 * Jog-dial SFX from sample: public/audio/jog.wav (se_kinko_kagi02.wav)
 */

export type RatchetKind = "minor" | "medium" | "major";

const JOG_SAMPLE_URL = `${import.meta.env.BASE_URL}audio/jog.wav`;

let cachedBuffer: AudioBuffer | null = null;
let loadPromise: Promise<AudioBuffer> | null = null;

export async function warmUpJogAudio(ctx: AudioContext): Promise<void> {
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
  await loadJogBuffer(ctx);
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

function playSample(
  ctx: AudioContext,
  opts: { gain: number; playbackRate?: number; startOffset?: number; duration?: number },
) {
  void loadJogBuffer(ctx)
    .then((buffer) => {
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
    })
    .catch(() => {
      // Ignore missing sample or decode errors during interaction.
    });
}

/** Every 6° ratchet step while dragging */
export function playRatchetTick(ctx: AudioContext, kind: RatchetKind) {
  if (kind === "minor") {
    playSample(ctx, { gain: 0.42, playbackRate: 1.08, duration: 0.06 });
    return;
  }
  if (kind === "medium") {
    playSample(ctx, { gain: 0.58, playbackRate: 1, duration: 0.08 });
    return;
  }
  playSample(ctx, { gain: 0.78, playbackRate: 0.94, duration: 0.1 });
}

/** Final detent lock when dial settles on a chamber */
export function playGearMeshLock(ctx: AudioContext, variant: "full" | "confirm" = "full") {
  const amp = variant === "full" ? 1 : 0.72;
  playSample(ctx, {
    gain: 0.85 * amp,
    playbackRate: variant === "full" ? 0.88 : 0.96,
    duration: variant === "full" ? 0.14 : 0.09,
  });
}
