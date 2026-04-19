/**
 * Team#16 - Medical Signal Data (ECG & EEG)
 * Sample multi-channel signals with 4 abnormality types each
 */

const SAMPLE_RATE = 360; // Hz for ECG, 256 for EEG
const DURATION_SEC = 10;
const POINTS = SAMPLE_RATE * DURATION_SEC;

// Generate normal sinus rhythm ECG (Lead I, II, III, aVR, aVL, aVF - 6 channels)
function generateNormalECG() {
  const channels = 6;
  const data = Array(channels).fill(null).map(() => []);
  const t = Array.from({ length: POINTS }, (_, i) => i / SAMPLE_RATE);

  for (let i = 0; i < POINTS; i++) {
    const time = t[i];
    const heartRate = 72;
    const cycleLength = 60 / heartRate;
    const phase = (time % cycleLength) / cycleLength * 2 * Math.PI;

    // Simplified ECG waveform: P wave, QRS, T wave
    const pWave = 0.15 * Math.exp(-Math.pow((phase - 0.2) * 10, 2));
    const qrs = 1.2 * Math.exp(-Math.pow((phase - 0.5) * 8, 2));
    const tWave = 0.3 * Math.exp(-Math.pow((phase - 0.75) * 6, 2));
    const baseline = 0.02 * Math.sin(time * 0.5);

    const value = pWave + qrs + tWave + baseline;
    for (let ch = 0; ch < channels; ch++) {
      data[ch].push([time, value * (1 + ch * 0.1)]);
    }
  }
  return { data, channels, sampleRate: SAMPLE_RATE, type: 'normal', label: 'Normal Sinus Rhythm' };
}

// Atrial Fibrillation - irregular RR intervals, no P waves
function generateAFibECG() {
  const { data: baseData } = generateNormalECG();
  const data = baseData.map((ch, chi) =>
    ch.map(([t, v], i) => {
      const irregularity = 0.3 * Math.sin(i * 0.7) * Math.sin(i * 0.13);
      const noPWave = v * 0.7 + 0.1 * Math.sin(t * 8 + i * 0.1);
      return [t, noPWave + irregularity];
    })
  );
  return { data, channels: 6, sampleRate: SAMPLE_RATE, type: 'afib', label: 'Atrial Fibrillation' };
}

// Ventricular Tachycardia - wide QRS, fast rate
function generateVTachECG() {
  const channels = 6;
  const data = Array(channels).fill(null).map(() => []);
  const t = Array.from({ length: POINTS }, (_, i) => i / SAMPLE_RATE);
  const heartRate = 180;
  const cycleLength = 60 / heartRate;

  for (let i = 0; i < POINTS; i++) {
    const time = t[i];
    const phase = (time % cycleLength) / cycleLength * 2 * Math.PI;
    const wideQRS = 1.5 * Math.exp(-Math.pow((phase - 0.5) * 4, 2)); // Wider QRS
    for (let ch = 0; ch < channels; ch++) {
      data[ch].push([time, wideQRS * (1 + ch * 0.08)]);
    }
  }
  return { data, channels, sampleRate: SAMPLE_RATE, type: 'vtach', label: 'Ventricular Tachycardia' };
}

// Bradycardia - slow heart rate
function generateBradyECG() {
  const { data: baseData } = generateNormalECG();
  const stretched = baseData.map(ch => {
    const newCh = [];
    for (let i = 0; i < POINTS; i++) {
      const slowT = i / SAMPLE_RATE * 0.6; // 60% speed = slower
      const idx = Math.min(Math.floor(slowT * SAMPLE_RATE), ch.length - 1);
      newCh.push([i / SAMPLE_RATE, ch[idx][1]]);
    }
    return newCh;
  });
  return { data: stretched, channels: 6, sampleRate: SAMPLE_RATE, type: 'brady', label: 'Bradycardia' };
}

// ST Elevation (STEMI-like)
function generateSTElevationECG() {
  const { data: baseData } = generateNormalECG();
  const data = baseData.map((ch, chi) =>
    ch.map(([t, v], i) => {
      const phase = (t % 0.8) / 0.8;
      const stElevation = phase > 0.55 && phase < 0.75 ? 0.4 : 0;
      return [t, v + stElevation];
    })
  );
  return { data, channels: 6, sampleRate: SAMPLE_RATE, type: 'stemi', label: 'ST Elevation' };
}

// EEG - Normal
function generateNormalEEG() {
  const channels = 8; // Fp1, Fp2, F3, F4, C3, C4, O1, O2
  const data = Array(channels).fill(null).map(() => []);
  const t = Array.from({ length: POINTS }, (_, i) => i / 256);

  for (let i = 0; i < POINTS; i++) {
    const time = t[i];
    const alpha = 0.5 * Math.sin(2 * Math.PI * 10 * time);
    const beta = 0.2 * Math.sin(2 * Math.PI * 20 * time);
    const theta = 0.3 * Math.sin(2 * Math.PI * 6 * time);
    const noise = 0.05 * (Math.random() - 0.5);
    for (let ch = 0; ch < channels; ch++) {
      data[ch].push([time, (alpha + beta + theta) * (1 + ch * 0.05) + noise]);
    }
  }
  return { data, channels, sampleRate: 256, type: 'normal', label: 'Normal EEG' };
}

// Spike-and-wave (absence seizure)
function generateSpikeWaveEEG() {
  const { data: baseData } = generateNormalEEG();
  const data = baseData.map((ch, chi) =>
    ch.map(([t, v], i) => {
      const cycle = Math.floor(t * 3);
      const phase = (t * 3) % 1;
      const spike = phase < 0.1 ? 2 * Math.exp(-Math.pow((phase - 0.05) * 50, 2)) : 0;
      const wave = phase > 0.1 && phase < 0.4 ? 0.5 * Math.sin((phase - 0.1) * 20) : 0;
      return [t, v + spike + wave];
    })
  );
  return { data, channels: 8, sampleRate: 256, type: 'spikewave', label: 'Spike-and-Wave (Absence)' };
}

// Focal slowing
function generateFocalSlowingEEG() {
  const { data: baseData } = generateNormalEEG();
  const data = baseData.map((ch, chi) =>
    ch.map(([t, v], i) => {
      const focal = (chi < 4) ? 0.4 * Math.sin(2 * Math.PI * 2 * t) : 0;
      return [t, v + focal];
    })
  );
  return { data, channels: 8, sampleRate: 256, type: 'focalslow', label: 'Focal Slowing' };
}

// Generalized slowing
function generateGeneralizedSlowingEEG() {
  const { data: baseData } = generateNormalEEG();
  const data = baseData.map(ch =>
    ch.map(([t, v]) => {
      const delta = 0.6 * Math.sin(2 * Math.PI * 2 * t);
      return [t, v * 0.5 + delta];
    })
  );
  return { data, channels: 8, sampleRate: 256, type: 'genslow', label: 'Generalized Slowing' };
}

// Periodic discharges
function generatePeriodicEEG() {
  const channels = 8;
  const data = Array(channels).fill(null).map(() => []);
  const t = Array.from({ length: POINTS }, (_, i) => i / 256);

  for (let i = 0; i < POINTS; i++) {
    const time = t[i];
    const period = 1;
    const phase = (time % period) / period;
    const discharge = phase < 0.05 ? 1.5 * Math.exp(-phase * 100) : 0.1 * Math.sin(2 * Math.PI * 8 * time);
    for (let ch = 0; ch < channels; ch++) {
      data[ch].push([time, discharge * (1 + ch * 0.05)]);
    }
  }
  return { data, channels, sampleRate: 256, type: 'periodic', label: 'Periodic Discharges' };
}

export const ECG_SIGNALS = [
  generateNormalECG(),
  generateAFibECG(),
  generateVTachECG(),
  generateBradyECG(),
  generateSTElevationECG(),
];

export const EEG_SIGNALS = [
  generateNormalEEG(),
  generateSpikeWaveEEG(),
  generateFocalSlowingEEG(),
  generateGeneralizedSlowingEEG(),
  generatePeriodicEEG(),
];
