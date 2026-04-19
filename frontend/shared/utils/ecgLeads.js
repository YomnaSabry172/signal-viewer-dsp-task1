/**
 * ECG Lead Names - 15-lead standard (12 standard + Frank XYZ)
 * Order: I, II, III, aVR, aVL, aVF, V1, V2, V3, V4, V5, V6, X, Y, Z
 */
export const ECG_15_LEAD_NAMES = [
  'I', 'II', 'III', 'aVR', 'aVL', 'aVF',
  'V1', 'V2', 'V3', 'V4', 'V5', 'V6',
  'X', 'Y', 'Z',
];

/** WFDB/PTB lowercase variants -> standard display */
const LEAD_FORMAT_MAP = {
  i: 'I', ii: 'II', iii: 'III',
  avr: 'aVR', avl: 'aVL', avf: 'aVF',
  v1: 'V1', v2: 'V2', v3: 'V3', v4: 'V4', v5: 'V5', v6: 'V6',
  vx: 'X', vy: 'Y', vz: 'Z',
};

/**
 * Get display label for an ECG channel.
 * Uses signalNames from backend when available (WFDB format), otherwise 15-lead standard mapping.
 * @param {Object} signalData - { signalNames?: string[], type?: string }
 * @param {number} channelIndex - 0-based channel index
 * @returns {string} e.g. "I", "aVR", "V3", "X", or "Ch 1" as fallback
 */
export function getEcgChannelLabel(signalData, channelIndex) {
  const names = signalData?.signalNames;
  if (names && names[channelIndex] != null) {
    const raw = String(names[channelIndex]).trim().toLowerCase();
    return LEAD_FORMAT_MAP[raw] ?? raw.toUpperCase();
  }
  if (signalData?.type === 'ecg' && channelIndex < ECG_15_LEAD_NAMES.length) {
    return ECG_15_LEAD_NAMES[channelIndex];
  }
  return `Ch ${channelIndex + 1}`;
}
