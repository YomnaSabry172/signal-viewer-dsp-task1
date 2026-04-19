/**
 * Team#16 - Drone/Submarine Sound Detection
 * Classic algorithm: spectral features (propeller harmonics ~50-500Hz), energy in bands
 * For demo: synthetic drone-like signal + detection
 */

export function generateDroneSound(duration = 2, sampleRate = 44100) {
  const samples = Math.floor(duration * sampleRate);
  const data = new Float32Array(samples);
  const fundamental = 120;
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const h1 = Math.sin(2 * Math.PI * fundamental * t);
    const h2 = 0.5 * Math.sin(2 * Math.PI * fundamental * 2 * t);
    const h3 = 0.3 * Math.sin(2 * Math.PI * fundamental * 3 * t);
    const noise = 0.05 * (Math.random() - 0.5);
    data[i] = 0.3 * (h1 + h2 + h3) + noise;
  }
  return { data, sampleRate, duration };
}

export function generateAmbientSound(duration = 2, sampleRate = 44100) {
  const samples = Math.floor(duration * sampleRate);
  const data = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    data[i] = 0.1 * (Math.random() - 0.5) + 0.05 * Math.sin(2 * Math.PI * 60 * i / sampleRate);
  }
  return { data, sampleRate, duration };
}

export function detectDrone(audioData, sampleRate) {
  const fftSize = 2048;
  const bandLow = Math.floor(50 * fftSize / sampleRate);
  const bandHigh = Math.floor(500 * fftSize / sampleRate);
  let droneEnergy = 0;
  let totalEnergy = 0;

  for (let start = 0; start + fftSize < audioData.length; start += fftSize) {
    const slice = audioData.slice(start, start + fftSize);
    for (let k = 1; k < fftSize / 2; k++) {
      let re = 0, im = 0;
      for (let n = 0; n < fftSize; n++) {
        const angle = (2 * Math.PI * k * n) / fftSize;
        re += slice[n] * Math.cos(angle);
        im += slice[n] * Math.sin(angle);
      }
      const mag = Math.sqrt(re * re + im * im) / fftSize;
      totalEnergy += mag * mag;
      if (k >= bandLow && k <= bandHigh) droneEnergy += mag * mag;
    }
  }

  const ratio = totalEnergy > 0 ? droneEnergy / totalEnergy : 0;
  const detected = ratio > 0.15;
  return {
    detected,
    confidence: Math.min(0.95, ratio * 3),
    droneBandRatio: ratio,
    message: detected ? 'Drone/Propeller sound detected' : 'No drone detected',
  };
}
