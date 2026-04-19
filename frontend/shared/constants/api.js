/**
 * API Configuration
 * Centralized backend API URL configuration
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export const API_ENDPOINTS = {
  DOPPLER_ESTIMATE: `${API_BASE}/acoustic/doppler/estimate`,
  DOPPLER_GENERATE: `${API_BASE}/acoustic/doppler/generate`,
  DRONE_DETECT: `${API_BASE}/detect/`,
  ECG_RECORDS: `${API_BASE}/ecg/records`,
  MICROBIOME_PATIENTS: `${API_BASE}/microbiome/patients`,
  MICROBIOME_ABUNDANCE: `${API_BASE}/microbiome/abundance-over-time`,
  MICROBIOME_COMPOSITION: `${API_BASE}/microbiome/patient-composition`,
};
