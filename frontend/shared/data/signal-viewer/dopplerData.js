/**
 * Team#16 - Vehicle-Passing Doppler Effect
 * Uses continuous Doppler: f' = f * c / (c - v_r) with smooth v_r(t)
 * v_r = radial velocity toward listener, varies smoothly as vehicle passes
 */

const SOUND_SPEED = 343; // m/s

export function generateDopplerSound(velocity, hornFreq, duration = 3, sampleRate = 44100) {
  const v = Math.min(Math.max(0, velocity), SOUND_SPEED - 1); // avoid div-by-zero
  const samples = Math.floor(duration * sampleRate);
  const data = new Float32Array(samples);
  const passTime = duration / 2;

  // Smooth transition: tau controls how quickly freq changes at pass-by (smaller = sharper)
  const tau = duration * 0.15;

  let phase = 0;
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const dt = t - passTime;
    // Radial velocity toward listener: smooth from +v (approach) to -v (recede)
    const vRadial = v * dt / Math.sqrt(dt * dt + tau * tau);
    const freq = hornFreq * SOUND_SPEED / (SOUND_SPEED - vRadial);
    phase += 2 * Math.PI * freq / sampleRate;
    const envelope = Math.exp(-Math.pow((t - passTime) * 2, 2));
    data[i] = 0.4 * envelope * Math.sin(phase);
  }

  // Crop to last zero-crossing so we end at ~0
  const searchLen = Math.min(Math.floor(0.2 * sampleRate), samples - 1);
  let cutIndex = samples;
  for (let i = samples - 1; i > samples - searchLen && i > 0; i--) {
    if (data[i - 1] * data[i] <= 0) {
      cutIndex = Math.abs(data[i]) < Math.abs(data[i - 1]) ? i + 1 : i;
      break;
    }
  }
  const cropped = data.slice(0, cutIndex);

  // Fade-in at start (5ms) — prevents click when DAC starts
  const fadeInSamples = Math.min(Math.floor(0.005 * sampleRate), cutIndex);
  for (let i = 0; i < fadeInSamples; i++) {
    cropped[i] *= i / Math.max(1, fadeInSamples - 1);
  }

  // Append 150ms of silence — buffer ends at zero, prevents DAC click when playback stops
  const silenceSamples = Math.floor(0.15 * sampleRate);
  const out = new Float32Array(cutIndex + silenceSamples);
  out.set(cropped);

  const outDuration = out.length / sampleRate;
  return { data: out, sampleRate, duration: outDuration, velocity, hornFreq };
}

export function estimateVelocityFromDoppler(audioData, sampleRate) {
  const fftSize = 2048;
  const hopSize = 512;
  const peaks = [];
  for (let i = 0; i + fftSize < audioData.length; i += hopSize) {
    const slice = audioData.slice(i, i + fftSize);
    const maxIdx = slice.reduce((max, v, i, arr) => (Math.abs(v) > Math.abs(arr[max]) ? i : max), 0);
    const freq = (maxIdx / fftSize) * sampleRate;
    if (freq > 10 && freq < 5000) peaks.push({ freq, time: i / sampleRate });
  }
  if (peaks.length < 2) return { velocity: 0, frequency: 0 };
  const maxFreq = Math.max(...peaks.map(p => p.freq));
  const minFreq = Math.min(...peaks.map(p => p.freq));
  const f0 = (maxFreq + minFreq) / 2;
  const v = SOUND_SPEED * (maxFreq - minFreq) / (maxFreq + minFreq);
  return { velocity: Math.abs(v), frequency: f0 };
}
