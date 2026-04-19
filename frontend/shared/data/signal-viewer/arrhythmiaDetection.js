/**
 * Team#16 - Classic ML Arrhythmia Detection (Pan-Tompkins inspired)
 * Tuned for PTB Diagnostic at 1000 Hz; works with 250–1000 Hz.
 */

function bandpassFilter(signal, sampleRate, lowFreq = 5, highFreq = 15) {
  const n = signal.length;
  const result = new Float32Array(n);
  // Window sizes in samples (lower freq = longer window)
  const lowCutSamples = Math.max(2, Math.floor(sampleRate / highFreq));
  const highCutSamples = Math.max(2, Math.floor(sampleRate / lowFreq));

  for (let i = highCutSamples; i < n - highCutSamples; i++) {
    let sum = 0;
    for (let j = -highCutSamples; j <= highCutSamples; j++) {
      sum += signal[i + j];
    }
    result[i] = sum / (2 * highCutSamples + 1);
  }
  for (let i = highCutSamples; i < n - lowCutSamples; i++) {
    let sum = 0;
    for (let j = -lowCutSamples; j <= lowCutSamples; j++) {
      sum += result[i + j];
    }
    result[i] -= sum / (2 * lowCutSamples + 1);
  }
  return result;
}

function derivativeFilter(signal) {
  const n = signal.length;
  const result = new Float32Array(n);
  for (let i = 2; i < n - 2; i++) {
    result[i] = (2 * signal[i] + signal[i - 1] - signal[i - 2] - 2 * signal[i + 1] - signal[i + 2]) / 8;
  }
  return result;
}

function squareSignal(signal) {
  return signal.map((v) => v * v);
}

function movingWindowIntegrate(signal, sampleRate, windowMs = 80) {
  const n = signal.length;
  const result = new Float32Array(n);
  const windowSize = Math.max(8, Math.floor((sampleRate * windowMs) / 1000));
  const half = Math.floor(windowSize / 2);
  for (let i = half; i < n - half; i++) {
    let sum = 0;
    for (let j = -half; j <= half; j++) {
      sum += signal[i + j];
    }
    result[i] = sum / windowSize;
  }
  return result;
}

function findPeaks(signal, sampleRate, minRR = 0.3, maxRR = 2.0) {
  const peaks = [];
  const minDist = Math.floor(sampleRate * minRR);
  const n = signal.length;
  const signalMax = Math.max(...signal);
  if (signalMax <= 0) return peaks;

  let threshold = 0.4 * signalMax;
  let lastPeak = -Math.floor(sampleRate * maxRR) - 1;

  for (let i = 1; i < n - 1; i++) {
    if (signal[i] > signal[i - 1] && signal[i] > signal[i + 1] && signal[i] > threshold) {
      if (i - lastPeak >= minDist) {
        peaks.push({ index: i, time: i / sampleRate, value: signal[i] });
        lastPeak = i;
        threshold = 0.3 * signal[i] + 0.7 * threshold;
      }
    }
  }
  return peaks;
}

function autocorrelation(arr) {
  const n = arr.length;
  if (n === 0) return [];
  const mean = arr.reduce((a, b) => a + b, 0) / n;
  let result = [];

  for (let lag = 0; lag < n; lag++) {
    let sum = 0;
    for (let i = 0; i < n - lag; i++) {
      sum += (arr[i] - mean) * (arr[i + lag] - mean);
    }
    result.push(sum / (n - lag));
  }

  const maxLag = result[0] || 1;
  return result.map((val) => val / maxLag);
}
 /*This function computes the autocorrelation for an array (RR intervals). It returns an array where the first value corresponds to the autocorrelation at lag 0, and subsequent values represent the autocorrelation at increasing lags.*/

 
/**
 * Combined RR Analysis logic
 * Autocorrelation is unreliable with < 6 RR intervals; assume regular for short segments.
 */
function analyzeRRIntervals(peaks, sampleRate) {
  if (peaks.length < 3) return { result: 'insufficient_data', rrIntervals: [], heartRate: null };

  const rrIntervals = [];
  for (let i = 1; i < peaks.length; i++) {
    rrIntervals.push(((peaks[i].index - peaks[i - 1].index) / sampleRate) * 1000);
  }

  const meanRR = rrIntervals.reduce((a, b) => a + b, 0) / rrIntervals.length;
  const heartRate = 60000 / meanRR;
  const variance = rrIntervals.reduce((s, r) => s + Math.pow(r - meanRR, 2), 0) / rrIntervals.length;
  const std = Math.sqrt(variance);

  // Autocorrelation needs enough intervals to be meaningful; with < 6 RR intervals it's unreliable
  let isRegular = true;
  if (rrIntervals.length >= 6) {
    const autoCorr = autocorrelation(rrIntervals);
    isRegular = autoCorr.length > 1 ? autoCorr[1] > 0.6 : true;
  }

  // Heuristics for various types of arrhythmia
  if (heartRate < 50) return { result: 'bradycardia', confidence: 0.85, heartRate, rrIntervals };
  if (heartRate > 120) return { result: 'tachycardia', confidence: 0.8, heartRate, rrIntervals };
  if (!isRegular) return { result: 'irregular rhythm', confidence: 0.75, heartRate, rrIntervals };
  if (rrIntervals.length >= 6 && std > meanRR * 0.25) return { result: 'atrial_fibrillation', confidence: 0.75, heartRate, rrIntervals };

  return { result: 'normal', confidence: 0.9, heartRate, rrIntervals };
}
/*The function analyzerRRIntervals) still returns: bradycardia (slow heart rate), tachycardia (fast heart rate), atrial_fibrillation (irregular rhythm), normal (normal rhythm), irregular rhythm if the rhythm is found to be inconsistent based on autocorrelation.*/


export function detectArrhythmia(channelData, sampleRate = 1000) {
  // Ensure we are extracting the value from the [timestamp, value] pair
  const signal = channelData.map((d) => (Array.isArray(d) ? d[1] : d));
  const floatSignal = new Float32Array(signal);

  const filtered = bandpassFilter(floatSignal, sampleRate);
  const derived = derivativeFilter(filtered);
  const squared = squareSignal(derived);
  const integrated = movingWindowIntegrate(squared, sampleRate, 80); // 80 ms window

  const peaks = findPeaks(integrated, sampleRate);
  const analysis = analyzeRRIntervals(peaks, sampleRate);

  return {
    peaks,
    peakCount: peaks.length,
    ...analysis,
  };
}