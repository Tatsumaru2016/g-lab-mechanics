/**
 * Procedural mechanical jog-dial SFX — industrial encoder / safe-dial ratchet.
 * No samples; tuned for short, dense, metallic transients.
 */

export type RatchetKind = "minor" | "medium" | "major";

function noiseBurst(
  ctx: AudioContext,
  t: number,
  duration: number,
  opts: { freq: number; q: number; gain: number; decay?: number }
) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  const decay = opts.decay ?? 0.07;
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * decay));
  }

  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = opts.freq;
  filter.Q.value = opts.q;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(opts.gain, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start(t);
  src.stop(t + duration + 0.012);
}

function metalPing(
  ctx: AudioContext,
  t: number,
  freq: number,
  gainAmp: number,
  duration: number,
  q = 14
) {
  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.62, t + duration);

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = q;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainAmp, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.012);
}

function bodyThump(ctx: AudioContext, t: number, freq: number, gainAmp: number, duration: number) {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.45, t + duration);

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 220;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainAmp, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  osc.connect(lp);
  lp.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.012);
}

function pawlSnap(ctx: AudioContext, t: number, gainAmp: number) {
  noiseBurst(ctx, t, 0.008, { freq: 4200, q: 5.5, gain: gainAmp * 0.95, decay: 0.05 });
  metalPing(ctx, t, 1180, gainAmp * 0.42, 0.014, 10);
  bodyThump(ctx, t + 0.001, 145, gainAmp * 0.38, 0.022);
}

/** Every 6° ratchet step while dragging */
export function playRatchetTick(ctx: AudioContext, kind: RatchetKind) {
  const now = ctx.currentTime;

  if (kind === "minor") {
    noiseBurst(ctx, now, 0.011, { freq: 3400, q: 4.2, gain: 0.038, decay: 0.06 });
    metalPing(ctx, now + 0.0005, 2480, 0.014, 0.012, 16);
    return;
  }

  if (kind === "medium") {
    pawlSnap(ctx, now, 0.55);
    noiseBurst(ctx, now + 0.002, 0.014, { freq: 2600, q: 3.8, gain: 0.048, decay: 0.065 });
    metalPing(ctx, now + 0.003, 1640, 0.032, 0.018, 11);
    bodyThump(ctx, now + 0.004, 98, 0.07, 0.024);
    return;
  }

  // major — scene index detent
  pawlSnap(ctx, now, 1);
  noiseBurst(ctx, now + 0.001, 0.018, { freq: 2100, q: 3.2, gain: 0.072, decay: 0.07 });
  noiseBurst(ctx, now + 0.006, 0.012, { freq: 5200, q: 6, gain: 0.034, decay: 0.05 });
  metalPing(ctx, now + 0.002, 920, 0.055, 0.028, 9);
  metalPing(ctx, now + 0.008, 1860, 0.038, 0.022, 13);
  bodyThump(ctx, now + 0.005, 78, 0.12, 0.038);
}

/** Final gear mesh + housing seat when dial locks */
export function playGearMeshLock(ctx: AudioContext, variant: "full" | "confirm" = "full") {
  const now = ctx.currentTime;
  const amp = variant === "full" ? 1 : 0.52;

  const meshTooth = (t: number, freq: number, gainAmp: number, q = 8.5) => {
    noiseBurst(ctx, t, 0.007, { freq: freq * 2.8, q: 4.5, gain: gainAmp * 0.55, decay: 0.045 });
    metalPing(ctx, t, freq, gainAmp, 0.016, q);
  };

  // Pawl drops into well
  pawlSnap(ctx, now, amp);
  noiseBurst(ctx, now + 0.004, 0.022, { freq: 1800, q: 2.4, gain: 0.09 * amp, decay: 0.08 });

  // Gear teeth crawl — staggered metallic mesh
  meshTooth(now + 0.018, 640, 0.062 * amp, 7);
  meshTooth(now + 0.034, 820, 0.078 * amp, 8);
  meshTooth(now + 0.05, 1040, 0.092 * amp, 9);
  meshTooth(now + 0.066, 1320, 0.108 * amp, 10);

  const seatTime = now + 0.078;

  // Heavy housing / spring seat
  const housing = ctx.createOscillator();
  const housingGain = ctx.createGain();
  const housingLp = ctx.createBiquadFilter();
  housing.type = "sawtooth";
  housing.frequency.setValueAtTime(58, seatTime);
  housing.frequency.exponentialRampToValueAtTime(28, seatTime + 0.12);
  housingLp.type = "lowpass";
  housingLp.frequency.value = 160;
  housingGain.gain.setValueAtTime(0.14 * amp, seatTime);
  housingGain.gain.exponentialRampToValueAtTime(0.0001, seatTime + 0.125);
  housing.connect(housingLp);
  housingLp.connect(housingGain);
  housingGain.connect(ctx.destination);
  housing.start(seatTime);
  housing.stop(seatTime + 0.13);

  bodyThump(ctx, seatTime + 0.002, 52, 0.22 * amp, 0.09);
  bodyThump(ctx, seatTime + 0.012, 38, 0.16 * amp, 0.11);

  // Metal ring-out + spring scrape
  metalPing(ctx, seatTime + 0.006, 2240, 0.1 * amp, 0.055, 12);
  metalPing(ctx, seatTime + 0.014, 980, 0.065 * amp, 0.04, 8);

  noiseBurst(ctx, seatTime + 0.008, 0.035, {
    freq: 2800,
    q: 2.6,
    gain: 0.18 * amp,
    decay: 0.09,
  });

  if (variant === "full") {
    // Case resonance — final authority
    metalPing(ctx, seatTime + 0.028, 420, 0.045 * amp, 0.07, 6);
    noiseBurst(ctx, seatTime + 0.032, 0.025, { freq: 900, q: 1.8, gain: 0.08 * amp, decay: 0.1 });
  }
}
