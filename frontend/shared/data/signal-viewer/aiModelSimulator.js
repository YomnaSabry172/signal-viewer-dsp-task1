/**
 * Team#16 - Simulated Multi-Channel AI Model (ECGNet/EfficientNet style)
 * In production, this would load a real TensorFlow.js model.
 * This simulator uses signal statistics across all channels for classification.
 */

function extractFeatures(data) {
  const channels = data.length;
  const features = [];

  for (let ch = 0; ch < channels; ch++) {
    const values = data[ch].map(([, v]) => v);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);

    // Autocorrelation at lag 1
    let autocorr = 0;
    for (let i = 1; i < values.length; i++) {
      autocorr += (values[i] - mean) * (values[i - 1] - mean);
    }
    autocorr /= (values.length - 1) / (variance || 1);

    // Peak frequency (simplified FFT magnitude)
    const n = Math.min(256, values.length);
    let maxMag = 0, maxFreq = 0;
    for (let k = 1; k < n / 2; k++) {
      let re = 0, im = 0;
      for (let i = 0; i < n; i++) {
        const angle = (2 * Math.PI * k * i) / n;
        re += values[i] * Math.cos(angle);
        im += values[i] * Math.sin(angle);
      }
      const mag = Math.sqrt(re * re + im * im);
      if (mag > maxMag) {
        maxMag = mag;
        maxFreq = k;
      }
    }

    features.push({ mean, std, autocorr, maxFreq, maxMag });
  }

  return features;
}

function classifyECG(features, sampleRate) {
  const avgStd = features.reduce((s, f) => s + f.std, 0) / features.length;
  const avgAutocorr = features.reduce((s, f) => s + f.autocorr, 0) / features.length;
  const freqSpread = Math.max(...features.map(f => f.maxFreq)) - Math.min(...features.map(f => f.maxFreq));

  // Heuristic rules simulating a trained multi-channel CNN
  if (avgStd < 0.15 && avgAutocorr > 0.7) return { label: 'Normal Sinus Rhythm', confidence: 0.92 };
  if (avgAutocorr < 0.4 && freqSpread > 5) return { label: 'Atrial Fibrillation', confidence: 0.88 };
  if (features[0].maxFreq > 3 && avgStd > 0.5) return { label: 'Ventricular Tachycardia', confidence: 0.85 };
  if (features[0].maxFreq < 1.2) return { label: 'Bradycardia', confidence: 0.82 };
  if (avgStd > 0.4 && features.some(f => f.mean > 0.3)) return { label: 'ST Elevation', confidence: 0.78 };

  return { label: 'Normal Sinus Rhythm', confidence: 0.75 };
}

function classifyEEG(features, sampleRate) {
  const avgStd = features.reduce((s, f) => s + f.std, 0) / features.length;
  const focalDiff = Math.abs(
    features.slice(0, 4).reduce((s, f) => s + f.std, 0) / 4 -
    features.slice(4, 8).reduce((s, f) => s + f.std, 0) / 4
  );

  if (avgStd < 0.3 && focalDiff < 0.1) return { label: 'Normal EEG', confidence: 0.9 };
  if (features.some(f => f.maxMag > 2)) return { label: 'Spike-and-Wave (Absence)', confidence: 0.86 };
  if (focalDiff > 0.2) return { label: 'Focal Slowing', confidence: 0.84 };
  if (avgStd > 0.5 && features[0].maxFreq < 3) return { label: 'Generalized Slowing', confidence: 0.82 };
  if (features.some(f => f.autocorr > 0.9)) return { label: 'Periodic Discharges', confidence: 0.8 };

  return { label: 'Normal EEG', confidence: 0.72 };
}

/**
 * Multi-channel AI classification - simulates ECGNet/EfficientNet style model
 */
export function classifyMedicalSignal(data, signalType = 'ecg', sampleRate = 360) {
  const features = extractFeatures(data);
  const result = signalType === 'eeg'
    ? classifyEEG(features, sampleRate)
    : classifyECG(features, sampleRate);

  return {
    ...result,
    isNormal: result.label.toLowerCase().includes('normal'),
    signalType,
  };
}
