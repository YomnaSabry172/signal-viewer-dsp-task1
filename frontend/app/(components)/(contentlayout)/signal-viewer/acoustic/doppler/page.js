"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Alert, Spinner, Tabs, Tab } from 'react-bootstrap';
import ReactECharts from 'echarts-for-react';
import Seo from '@/shared/layout-components/seo/seo';
import { API_ENDPOINTS } from '@/shared/constants/api';
import { generateDopplerSound } from '@/shared/data/signal-viewer/dopplerData';
import { chartTextStyle, axisTheme } from '@/shared/utils/chartTheme';

const DURATION = 3;
const SAMPLE_RATE = 44100;

export default function DopplerPage() {
  // Synthetic generator state
  const [velocity, setVelocity] = useState(25); // m/s
  const [hornFreq, setHornFreq] = useState(400); // Hz
  const [duration, setDuration] = useState(DURATION);
  const [waveformData, setWaveformData] = useState(null);
  const [spectrumData, setSpectrumData] = useState(null);
  const [spectrogramData, setSpectrogramData] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const audioContextRef = useRef(null);

  // Real audio upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('synthetic');
  const [chartView, setChartView] = useState('spectrogram'); // 'spectrogram' | 'waveform' | 'spectrum'

  // Generate synthetic sound on parameter change
  const generateSound = () => {
    const gen = generateDopplerSound(velocity, hornFreq, duration, SAMPLE_RATE);
    const arr = Array.from(gen.data);

    // Time-domain waveform [time, amplitude] - downsample for display (fast)
    const downsample = Math.max(1, Math.floor(arr.length / 4000));
    setWaveformData(arr.filter((_, i) => i % downsample === 0).map((v, i) => [(i * downsample) / gen.sampleRate, v]));

    // Use smaller FFT params to avoid blocking main thread (naive DFT is O(N²))
    const fftSize = 512;
    const hopSize = 4096; // fewer windows for fast render
    const maxFreqHz = 1500;
    const maxK = Math.min(fftSize / 2, Math.ceil((maxFreqHz / gen.sampleRate) * fftSize));

    // Precompute Hanning window once
    const hanning = new Float32Array(fftSize);
    for (let n = 0; n < fftSize; n++) {
      hanning[n] = 0.5 * (1 - Math.cos((2 * Math.PI * n) / (fftSize - 1)));
    }

    // Spectrogram: Doppler waveform (time vs frequency) - shows chirp: high→low
    const spectrogram = [];
    for (let start = 0; start + fftSize <= arr.length; start += hopSize) {
      const t = start / gen.sampleRate;
      for (let k = 0; k < maxK; k++) {
        let re = 0, im = 0;
        const angleStep = (2 * Math.PI * k) / fftSize;
        for (let n = 0; n < fftSize; n++) {
          const angle = angleStep * n;
          const w = arr[start + n] * hanning[n];
          re += w * Math.cos(angle);
          im += w * Math.sin(angle);
        }
        const mag = Math.sqrt(re * re + im * im) / fftSize;
        spectrogram.push([t, (k / fftSize) * gen.sampleRate, mag]);
      }
    }
    setSpectrogramData(spectrogram);

    // Spectrum: single FFT at center (fast) - shows Doppler spread
    const centerStart = Math.max(0, Math.floor(arr.length / 2) - fftSize);
    const spectrum = [];
    for (let k = 0; k < fftSize / 2; k++) {
      let re = 0, im = 0;
      const angleStep = (2 * Math.PI * k) / fftSize;
      for (let n = 0; n < fftSize; n++) {
        const angle = angleStep * n;
        const w = arr[centerStart + n] * hanning[n];
        re += w * Math.cos(angle);
        im += w * Math.sin(angle);
      }
      spectrum.push([(k / fftSize) * gen.sampleRate, Math.sqrt(re * re + im * im) / fftSize]);
    }
    setSpectrumData(spectrum);
  };

  useEffect(() => {
    try {
      generateSound();
    } catch (err) {
      console.error('Doppler generation error:', err);
      setWaveformData(null);
      setSpectrogramData(null);
      setSpectrumData(null);
    }
  }, [velocity, hornFreq, duration]);

  const playSound = () => {
    if (velocity === 0) return; // No Doppler effect at zero velocity
    const gen = generateDopplerSound(velocity, hornFreq, duration, SAMPLE_RATE);
    const ctx = audioContextRef.current || new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = ctx;
    const buffer = ctx.createBuffer(1, gen.data.length, gen.sampleRate);
    buffer.getChannelData(0).set(gen.data);
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Use GainNode to ramp down over last 80ms — prevents click when buffer stops
    const gainNode = ctx.createGain();
    const rampStart = gen.duration - 0.08;
    gainNode.gain.setValueAtTime(1, ctx.currentTime);
    gainNode.gain.setValueAtTime(1, ctx.currentTime + Math.max(0, rampStart));
    gainNode.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + gen.duration);

    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start();
  };

  // Real audio file handlers
  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const ext = file.name.toLowerCase().split('.').pop();
      if (!['wav', 'flac', 'ogg', 'oga'].includes(ext)) {
        setUploadError('Please select WAV, FLAC, or OGG file');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
      setUploadResult(null);
    }
  };

  const handleEstimate = async () => {
    if (!selectedFile) {
      setUploadError('Please select an audio file first');
      return;
    }

    setLoading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile, selectedFile.name);

      const url = API_ENDPOINTS.DOPPLER_ESTIMATE;
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {},
      });

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      if (!response.ok) {
        const txt = await response.text();
        let errMsg = txt;
        if (isJson) {
          try {
            const errJson = JSON.parse(txt);
            errMsg = errJson.detail || errJson.error || errJson.message || txt;
          } catch (_) {}
        }
        setUploadError(`Request failed ${response.status}: ${errMsg}`);
        return;
      }

      if (!isJson) {
        setUploadError('Invalid response: server did not return JSON');
        return;
      }

      const data = await response.json();
      if (!data) {
        setUploadError('Empty response from server');
        return;
      }
      if (data.ok !== true) {
        setUploadError(data.error || 'Estimation failed');
        return;
      }

      setUploadResult(data);
    } catch (err) {
      const apiBase = API_ENDPOINTS.DOPPLER_ESTIMATE?.replace('/acoustic/doppler/estimate', '') || 'backend';
      setUploadError(`Request failed: ${err.message}. Ensure the backend is running at ${apiBase}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadWav = async () => {
    if (velocity === 0) return; // No Doppler effect at zero velocity
    setDownloadLoading(true);
    setDownloadError(null);
    try {
      const url = `${API_ENDPOINTS.DOPPLER_GENERATE}?velocity=${velocity}&frequency=${hornFreq}&duration=${duration}&sample_rate=${SAMPLE_RATE}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `doppler_v${velocity}_f${Math.round(hornFreq)}.wav`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      setDownloadError(err.message);
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleUseEstimated = () => {
    if (uploadResult?.ok && uploadResult.v_ms != null && uploadResult.f0_hz != null) {
      setVelocity(Number(uploadResult.v_ms));
      setHornFreq(Number(uploadResult.f0_hz));
      setActiveTab('synthetic');
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Seo title="Doppler Estimation" />
      <div className="mb-4">
        <h4 className="fw-semibold">Vehicle Horn Doppler Effect</h4>
        <p className="text-muted mb-0">Generate synthetic Doppler sounds or estimate vehicle velocity from real audio recordings</p>
      </div>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'synthetic')} className="mb-4">
        {/* Tab 1: Synthetic Generator */}
        <Tab eventKey="synthetic" title="Generate Doppler Sound">
          <Row className="mt-3 align-items-stretch">
            <Col lg={4}>
              <Card className="custom-card h-100">
                <Card.Header><h6 className="mb-0">Doppler Parameters</h6></Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Vehicle Velocity (m/s)</Form.Label>
                    <div className="d-flex gap-2 align-items-center mb-1">
                      <Form.Range
                        min={0}
                        max={50}
                        value={velocity}
                        onChange={(e) => setVelocity(parseFloat(e.target.value))}
                        step={0.5}
                        className="flex-grow-1"
                      />
                      <Form.Control
                        type="number"
                        size="sm"
                        style={{ width: 70 }}
                        min={0}
                        max={80}
                        step={0.5}
                        value={velocity}
                        onChange={(e) => setVelocity(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="d-flex justify-content-between small text-muted">
                      <span>0 m/s</span>
                      <span>{(velocity * 3.6).toFixed(1)} km/h</span>
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Horn Base Frequency (Hz)</Form.Label>
                    <div className="d-flex gap-2 align-items-center mb-1">
                      <Form.Range
                        min={100}
                        max={1000}
                        value={hornFreq}
                        onChange={(e) => setHornFreq(parseFloat(e.target.value))}
                        step={10}
                        className="flex-grow-1"
                      />
                      <Form.Control
                        type="number"
                        size="sm"
                        style={{ width: 70 }}
                        min={50}
                        max={2000}
                        step={10}
                        value={hornFreq}
                        onChange={(e) => setHornFreq(parseFloat(e.target.value) || 400)}
                      />
                    </div>
                    <div className="d-flex justify-content-between small text-muted">
                      <span>50 Hz</span>
                      <span>2000 Hz</span>
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Duration (s)</Form.Label>
                    <Form.Control
                      type="number"
                      min={1}
                      max={10}
                      step={0.5}
                      value={duration}
                      onChange={(e) => setDuration(parseFloat(e.target.value) || 3)}
                    />
                  </Form.Group>

                  {velocity === 0 && (
                    <Alert variant="info" className="mb-2 small">
                      No Doppler effect at zero velocity. Increase velocity to generate pass-by sound.
                    </Alert>
                  )}
                  <Button
                    variant="primary"
                    onClick={playSound}
                    disabled={velocity === 0}
                    className="w-100 mb-2"
                  >
                    ▶ Play Sound
                  </Button>
                  <Button
                    variant="outline-primary"
                    onClick={handleDownloadWav}
                    disabled={velocity === 0 || downloadLoading}
                    className="w-100 mb-2"
                  >
                    {downloadLoading ? <><Spinner animation="border" size="sm" className="me-2" />Downloading...</> : '⬇ Download WAV'}
                  </Button>
                  {downloadError && (
                    <Alert variant="danger" className="mb-2 small">{downloadError}</Alert>
                  )}

                  <Card.Text className="small text-muted mb-0">
                    <strong>Sound Speed:</strong> 343 m/s<br/>
                    <strong>Sample Rate:</strong> 44100 Hz
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={8}>
              <Card className="custom-card h-100">
                <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <h6 className="mb-0">
                    {chartView === 'spectrogram' && 'Doppler Waveform (Spectrogram)'}
                    {chartView === 'waveform' && 'Time-Domain Waveform'}
                    {chartView === 'spectrum' && 'Frequency Spectrum (FFT)'}
                  </h6>
                  <Form.Select
                    size="sm"
                    style={{ width: 220 }}
                    value={chartView}
                    onChange={(e) => setChartView(e.target.value)}
                  >
                    <option value="spectrogram">Spectrogram (Time vs Freq)</option>
                    <option value="waveform">Time-Domain Waveform</option>
                    <option value="spectrum">Frequency Spectrum (FFT)</option>
                  </Form.Select>
                </Card.Header>
                <Card.Body>
                  {chartView === 'spectrogram' && (
                    <small className="text-muted d-block mb-2">Time vs frequency — approach (high) → recede (low)</small>
                  )}
                  {chartView === 'spectrogram' && spectrogramData?.length > 0 && (
                    <ReactECharts
                      option={(() => {
                        const axisStyle = axisTheme();
                        return {
                          backgroundColor: 'transparent',
                          textStyle: chartTextStyle(),
                          tooltip: { formatter: (p) => `Time: ${p.data[0].toFixed(2)}s, Freq: ${p.data[1].toFixed(0)} Hz, Mag: ${p.data[2].toExponential(2)}` },
                          xAxis: {
                            type: 'value',
                            name: 'Time (s)',
                            axisLabel: axisStyle.axisLabel,
                            nameTextStyle: axisStyle.nameTextStyle,
                          },
                          yAxis: {
                            type: 'value',
                            name: 'Frequency (Hz)',
                            axisLabel: axisStyle.axisLabel,
                            nameTextStyle: axisStyle.nameTextStyle,
                          },
                          visualMap: {
                            min: 0,
                            max: Math.max(...spectrogramData.map((d) => d[2]), 1e-6),
                            dimension: 2,
                            calculable: true,
                            orient: 'vertical',
                            right: 10,
                            top: 'center',
                            inRange: { color: ['#0d2137', '#0d6efd', '#25d366'] },
                            textStyle: chartTextStyle(),
                          },
                          series: [{
                            type: 'scatter',
                            data: spectrogramData,
                            symbolSize: 4,
                            itemStyle: { borderWidth: 0 },
                          }],
                          grid: { left: '50px', right: '80px', top: '30px', bottom: '50px' },
                        };
                      })()}
                      style={{ height: 400 }}
                    />
                  )}
                  {chartView === 'waveform' && waveformData && (
                    <ReactECharts
                      option={(() => {
                        const axisStyle = axisTheme();
                        return {
                          backgroundColor: 'transparent',
                          textStyle: chartTextStyle(),
                          xAxis: {
                            type: 'value',
                            name: 'Time (s)',
                            axisLabel: axisStyle.axisLabel,
                            nameTextStyle: axisStyle.nameTextStyle,
                          },
                          yAxis: {
                            type: 'value',
                            name: 'Amplitude',
                            axisLabel: axisStyle.axisLabel,
                            nameTextStyle: axisStyle.nameTextStyle,
                          },
                          series: [{
                            data: waveformData,
                            type: 'line',
                            symbol: 'none',
                            lineStyle: { width: 1 },
                            itemStyle: { color: '#0d6efd' },
                          }],
                          grid: { left: '50px', right: '30px', top: '30px', bottom: '50px' },
                        };
                      })()}
                      style={{ height: 400 }}
                    />
                  )}
                  {chartView === 'spectrum' && spectrumData && (
                    <ReactECharts
                      option={(() => {
                        const axisStyle = axisTheme();
                        return {
                          backgroundColor: 'transparent',
                          textStyle: chartTextStyle(),
                          xAxis: {
                            type: 'value',
                            name: 'Frequency (Hz)',
                            axisLabel: axisStyle.axisLabel,
                            nameTextStyle: axisStyle.nameTextStyle,
                          },
                          yAxis: {
                            type: 'value',
                            name: 'Magnitude',
                            axisLabel: axisStyle.axisLabel,
                            nameTextStyle: axisStyle.nameTextStyle,
                          },
                          series: [{
                            data: spectrumData,
                            type: 'line',
                            symbol: 'none',
                            lineStyle: { width: 1 },
                            itemStyle: { color: '#198754' },
                            smooth: true,
                          }],
                          grid: { left: '50px', right: '30px', top: '30px', bottom: '50px' },
                        };
                      })()}
                      style={{ height: 400 }}
                    />
                  )}
                  {((chartView === 'spectrogram' && (!spectrogramData || spectrogramData.length === 0)) ||
                    (chartView === 'waveform' && !waveformData) ||
                    (chartView === 'spectrum' && !spectrumData)) && (
                    <div className="text-center py-5 text-muted">Loading...</div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        {/* Tab 2: Real Audio Estimation */}
        <Tab eventKey="realAudio" title="Estimate from Audio File">
          <Row className="mt-3">
            <Col lg={6}>
              <Card className="custom-card">
                <Card.Header><h6 className="mb-0">Upload Audio File</h6></Card.Header>
                <Card.Body className="pt-3">
                  <Form.Group className="mb-4">
                    <Form.Label className="mb-2 d-block">Select Audio File</Form.Label>
                    <Form.Control
                      ref={fileInputRef}
                      type="file"
                      accept=".wav,.flac,.ogg,.oga"
                      onChange={handleFileSelect}
                      disabled={loading}
                      className="mb-2"
                    />
                    <Form.Text as="div" className="text-muted small d-block">
                      <span className="d-block mb-1">Formats: WAV, FLAC, OGG (mono or stereo)</span>
                      <span className="d-block">Content: Vehicle passing with horn sound</span>
                    </Form.Text>
                  </Form.Group>

                  {selectedFile && (
                    <Alert variant="info" className="mb-4">
                      <strong>Selected:</strong> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </Alert>
                  )}

                  {uploadError && (
                    <Alert variant="danger" className="mb-4">
                      {uploadError}
                    </Alert>
                  )}

                  <div className="d-flex gap-2 mt-3">
                    <Button
                      variant="primary"
                      onClick={handleEstimate}
                      disabled={!selectedFile || loading}
                    >
                      {loading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Estimating...
                        </>
                      ) : (
                        'Estimate From File'
                      )}
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={handleClear}
                      disabled={loading}
                    >
                      Clear
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6}>
              {uploadResult && uploadResult.ok && (
                <Card className="custom-card border-success">
                  <Card.Header className="bg-success-transparent">
                    <h6 className="mb-0">Estimation Results</h6>
                  </Card.Header>
                  <Card.Body>
                    <Alert variant="success" className="mb-3">
                      ✓ Successfully estimated Doppler parameters
                    </Alert>

                    <div className="result-group mb-3">
                      <h6 className="fw-semibold mb-2">Estimated Velocity</h6>
                      <div className="d-flex gap-3">
                        <div>
                          <small className="text-muted d-block">m/s</small>
                          <span className="h5 fw-bold">{uploadResult.v_ms}</span>
                        </div>
                        <div>
                          <small className="text-muted d-block">km/h</small>
                          <span className="h5 fw-bold">{uploadResult.v_kmh}</span>
                        </div>
                      </div>
                    </div>

                    <div className="result-group mb-3">
                      <h6 className="fw-semibold mb-2">Horn Frequency</h6>
                      <div>
                        <small className="text-muted d-block">Base Frequency (f0)</small>
                        <span className="h5 fw-bold">{uploadResult.f0_hz} Hz</span>
                      </div>
                    </div>

                    <div className="result-group mb-3">
                      <h6 className="fw-semibold mb-2">Doppler Shift</h6>
                      <div className="row g-2">
                        <div className="col">
                          <small className="text-muted d-block">Approaching (fa)</small>
                          <span className="fw-bold">{uploadResult.fa_hz} Hz</span>
                        </div>
                        <div className="col">
                          <small className="text-muted d-block">Receding (fr)</small>
                          <span className="fw-bold">{uploadResult.fr_hz} Hz</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline-success"
                      className="mb-3"
                      onClick={handleUseEstimated}
                    >
                      Use these values in Generator →
                    </Button>

                    <hr className="my-3" />

                    <div className="debug-info">
                      <small className="text-muted d-block mb-2"><strong>Debug Info</strong></small>
                      <small className="text-muted">
                        Pass-by Time: {uploadResult.debug.passby_time_s}s<br/>
                        Frequency Tracking Points: {uploadResult.debug.freq_track_hz.length}<br/>
                        Duration: {(uploadResult.debug.times_s[uploadResult.debug.times_s.length - 1] || 0).toFixed(2)}s
                      </small>
                    </div>
                  </Card.Body>
                </Card>
              )}

              {uploadResult && !uploadResult.ok && (
                <Card className="custom-card border-danger">
                  <Card.Header className="bg-danger-transparent">
                    <h6 className="mb-0">Error</h6>
                  </Card.Header>
                  <Card.Body>
                    <Alert variant="danger" className="mb-0">
                      {uploadResult.error || 'Unknown error occurred'}
                    </Alert>
                  </Card.Body>
                </Card>
              )}

              {!uploadResult && !uploadError && (
                <Card className="custom-card">
                  <Card.Header><h6 className="mb-0">Instructions</h6></Card.Header>
                  <Card.Body>
                    <ol className="mb-0">
                      <li>Record or select a WAV file of a vehicle passing by</li>
                      <li>Horn should be audible during approach and recession</li>
                      <li>Click "Estimate From File" to process</li>
                      <li>Results include estimated velocity and base horn frequency</li>
                    </ol>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>
        </Tab>
      </Tabs>
    </>
  );
}
