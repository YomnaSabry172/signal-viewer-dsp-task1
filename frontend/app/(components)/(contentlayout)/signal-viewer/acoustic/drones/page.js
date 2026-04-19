"use client";
import React, { useState, useRef } from 'react';
import { Card, Row, Col, Form, Button, Alert, Spinner } from 'react-bootstrap';
import Seo from '@/shared/layout-components/seo/seo';
import { API_ENDPOINTS } from '@/shared/constants/api';

export default function DronesPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.wav')) {
        setUploadError('Please select a WAV file');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
      setUploadResult(null);
    }
  };

  const handleDetect = async () => {
    if (!selectedFile) {
      setUploadError('Please select a WAV file first');
      return;
    }

    setLoading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile, selectedFile.name);

      const response = await fetch(API_ENDPOINTS.DRONE_DETECT, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setUploadError(data.detail || data.error || data.message || `Request failed: ${response.status}`);
        return;
      }

      setUploadResult(data);
    } catch (err) {
      setUploadError(`Error: ${err.message}. Ensure the backend is running.`);
    } finally {
      setLoading(false);
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
      <Seo title="Drones/Submarine" />
      <div className="mb-4">
        <h4 className="fw-semibold">Drone/Submarine Sound Detection</h4>
        <p className="text-muted mb-0">Detect propeller/drone sounds among similar acoustic signals</p>
      </div>

      <Row className="mt-3">
        <Col lg={6}>
          <Card className="custom-card">
            <Card.Header><h6 className="mb-0">Upload Audio File</h6></Card.Header>
            <Card.Body className="pt-3">
              <Form.Group className="mb-4">
                <Form.Label className="mb-2 d-block">Select WAV File</Form.Label>
                <Form.Control
                  ref={fileInputRef}
                  type="file"
                  accept=".wav"
                  onChange={handleFileSelect}
                  disabled={loading}
                  className="mb-2"
                />
                <Form.Text as="div" className="text-muted small d-block">
                  <span className="d-block mb-1">Format: WAV (mono or stereo)</span>
                  <span className="d-block">Content: Drone, submarine, or ambient sounds</span>
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
                  onClick={handleDetect}
                  disabled={!selectedFile || loading}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Detecting...
                    </>
                  ) : (
                    'Detect Drone From File'
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
          {uploadResult && (uploadResult.prediction != null || uploadResult.confidence != null) && (() => {
            const p = String(uploadResult.prediction || '').toLowerCase();
            const isDrone = p === 'drone' || p === 'yes_drone' || (p.includes('yes') && p.includes('drone'));
            return (
              <Card className={`custom-card border-${isDrone ? 'success' : 'secondary'}`}>
                <Card.Header className={isDrone ? 'bg-success-transparent' : ''}>
                  <h6 className="mb-0">Detection Result</h6>
                </Card.Header>
                <Card.Body>
                  {isDrone ? (
                    <Alert variant="success" className="mb-3">
                      ✓ Drone detected in audio
                    </Alert>
                  ) : (
                    <Alert variant="secondary" className="mb-3">
                      ✗ No drone detected — prediction: <strong>{uploadResult.prediction || 'other'}</strong>
                    </Alert>
                  )}

                  <div className="result-group mb-3">
                    <h6 className="fw-semibold mb-2">Confidence</h6>
                    <div>
                      <div className="progress" style={{ height: '25px' }}>
                        <div
                          className="progress-bar"
                          role="progressbar"
                          style={{ width: `${(uploadResult.confidence ?? 0) * 100}%` }}
                          aria-valuenow={(uploadResult.confidence ?? 0) * 100}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        >
                          {((uploadResult.confidence ?? 0) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="result-group mb-0">
                    <small className="text-muted">
                      <strong>Prediction:</strong> {uploadResult.prediction ?? 'N/A'}<br/>
                      <strong>Confidence:</strong> {((uploadResult.confidence ?? 0) * 100).toFixed(1)}%
                    </small>
                  </div>
                </Card.Body>
              </Card>
            );
          })()}

          {uploadResult && uploadResult.error && (
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
                  <li>Select a WAV file containing drone/submarine or ambient audio</li>
                  <li>Click "Detect Drone From File" to analyze</li>
                  <li>Results show prediction (drone / no drone) and confidence score</li>
                </ol>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </>
  );
}
