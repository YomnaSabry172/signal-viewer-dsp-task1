"use client";
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Alert, Nav, Spinner, Badge } from 'react-bootstrap';
import Seo from '@/shared/layout-components/seo/seo';
import ContinuousViewer from '@/shared/components/signal-viewer/ContinuousViewer';
import XORViewer from '@/shared/components/signal-viewer/XORViewer';
import PolarViewer from '@/shared/components/signal-viewer/PolarViewer';
import RecurrenceViewer from '@/shared/components/signal-viewer/RecurrenceViewer';
import { getEcgChannelLabel } from '@/shared/utils/ecgLeads';
import { CHANNEL_COLORS } from '@/shared/constants/signalViewer';
import { API_BASE } from '@/shared/constants/api';

export default function EEGViewerPage() {
  // Navigation & UI State
  const [viewerType, setViewerType] = useState('continuous');
  const [layoutMode, setLayoutMode] = useState('stacked');
  const [channelVisibility, setChannelVisibility] = useState([]);
  const [channelProps, setChannelProps] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewportSeconds, setViewportSeconds] = useState(2);

  // Data State
  const [records, setRecords] = useState([]);
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [signalData, setSignalData] = useState(null);
  const [aiPredictionResult, setAiPredictionResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 1. Fetch available records from Kaggle via Backend
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await fetch(`${API_BASE}/eeg/list-files`);
        const json = await res.json();
        const formattedRecords = (json.files || []).map(f => ({ 
          id: f, 
          label: f.split('/').pop() 
        }));
        setRecords(formattedRecords);

        if (formattedRecords.length > 0) {
          setSelectedRecordId(formattedRecords[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch EEG records:", err);
      }
    };
    fetchRecords();
  }, []);

  // 2. Fetch Signal Data for Visualization
  useEffect(() => {
    if (!selectedRecordId) return;

    const fetchSegment = async () => {
      setLoading(true);
      setAiPredictionResult(null); // Clear result immediately on change
      try {
        const recordPath = encodeURIComponent(selectedRecordId);
        const res = await fetch(`${API_BASE}/eeg/stream?file_path=${recordPath}`);
        const json = await res.json();
        
        setSignalData(json);
        
        // Setup initial UI states for channels
        setChannelVisibility(Array(json.channels).fill(true));
        setChannelProps(
          Object.fromEntries(
            Array.from({ length: json.channels }, (_, i) => [
              i,
              { color: CHANNEL_COLORS[i % CHANNEL_COLORS.length], lineWidth: 2 },
            ])
          )
        );
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch EEG segment:", err);
        setLoading(false);
      }
    };

    fetchSegment();
  }, [selectedRecordId]);

  // 3. AI Prediction Logic (Triggered after data loads)
  useEffect(() => {
    if (!selectedRecordId || !signalData?.data) return;

    const fetchPrediction = async () => {
      try {
        const res = await fetch(`${API_BASE}/eeg/predicteeg`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eeg_file_path: selectedRecordId, // Schema match: eeg_file_path
            cfg: {}                          // Schema match: cfg
          })
        });

        const json = await res.json();
        
        if (!res.ok) {
          // Display the backend error detail in the UI card
          setAiPredictionResult({ error: json.detail || "Analysis failed" });
        } else {
          setAiPredictionResult(json.predictions); 
        }
      } catch (err) {
        setAiPredictionResult({ error: "Could not connect to backend" });
      }
    };

    fetchPrediction();
  }, [selectedRecordId, signalData]);

  return (
    <>
      <Seo title="EEG AI Viewer" />
      <div className="mb-4 d-flex justify-content-between align-items-end">
        <div>
          <h4 className="fw-semibold">Brain Activity AI Viewer</h4>
          <p className="text-muted mb-0">BIOT Foundation Model • 16-Channel Analysis • 200Hz Resampling</p>
        </div>
        {isAnalyzing && (
          <Badge bg="primary-transparent" className="text-primary mb-2 p-2 px-3">
             <Spinner animation="border" size="sm" className="me-2" />
             AI Analyzing...
          </Badge>
        )}
      </div>

      <Row>
        <Col xl={4}>
          <Card className="custom-card shadow-sm">
            <Card.Header><h6 className="mb-0">EEG Dataset Record</h6></Card.Header>
            <Card.Body>
              <Form.Label className="small text-muted">Select a case from Kaggle dataset:</Form.Label>
              <Form.Select
                value={selectedRecordId}
                onChange={(e) => setSelectedRecordId(e.target.value)}
              >
                {records.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </Form.Select>
            </Card.Body>
          </Card>

          {/* AI Diagnostic Results Section */}
          <Card className={`custom-card border-${aiPredictionResult?.error ? 'danger' : 'primary'} shadow-sm`}>
            <Card.Header className={`bg-${aiPredictionResult?.error ? 'danger' : 'primary'}-transparent d-flex justify-content-between`}>
              <h6 className={`mb-0 text-${aiPredictionResult?.error ? 'danger' : 'primary'}`}>AI Diagnostic Result</h6>
              {aiPredictionResult?.segments && <Badge bg="primary">{aiPredictionResult.segments} Segments</Badge>}
            </Card.Header>
            <Card.Body>
              {aiPredictionResult ? (
                aiPredictionResult.error ? (
                  <Alert variant="danger" className="mb-0 small">
                    <strong>Error:</strong> {JSON.stringify(aiPredictionResult.error)}
                  </Alert>
                ) : (
                  <div className="text-center">
                    <h3 className="fw-bold text-primary mb-1">{aiPredictionResult.diagnosis}</h3>
                    <p className="text-muted small mb-3">{aiPredictionResult.confidence}</p>
                    <hr />
                    <div className="text-start">
                        <h6 className="small fw-semibold">Technical Breakdown:</h6>
                        <pre className="bg-light p-2 rounded small" style={{fontSize: '0.75rem'}}>
                            {JSON.stringify(aiPredictionResult.raw_predictions, null, 1)}
                        </pre>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center py-4">
                  <Spinner animation="grow" size="sm" variant="primary" className="me-2" />
                  <span className="text-muted small">Loading AI Model...</span>
                </div>
              )}
            </Card.Body>
          </Card>

          <Card className="custom-card">
            <Card.Header><h6 className="mb-0">Channel Management</h6></Card.Header>
            <Card.Body style={{maxHeight: '300px', overflowY: 'auto'}}>
              {signalData?.data?.map((_, i) => (
                <div key={i} className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom border-light">
                  <Form.Check
                    type="switch"
                    id={`ch-${i}`}
                    label={<span className="small">{getEcgChannelLabel(signalData, i)}</span>}
                    checked={channelVisibility[i] !== false}
                    onChange={(e) => setChannelVisibility((v) => {
                      const n = [...v];
                      n[i] = e.target.checked;
                      return n;
                    })}
                  />
                  <Form.Control
                    type="color"
                    size="sm"
                    style={{ width: 30, height: 24, padding: 2, border: 'none' }}
                    value={channelProps[i]?.color || CHANNEL_COLORS[i % CHANNEL_COLORS.length]}
                    onChange={(e) => setChannelProps(p => ({ ...p, [i]: { ...p[i], color: e.target.value }}))}
                  />
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>

        <Col xl={8}>
          <Card className="custom-card shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
                <Nav variant="pills" activeKey={viewerType} onSelect={(k) => setViewerType(k)}>
                  <Nav.Item><Nav.Link eventKey="continuous">Waveform</Nav.Link></Nav.Item>
                  <Nav.Item><Nav.Link eventKey="xor">XOR View</Nav.Link></Nav.Item>
                  <Nav.Item><Nav.Link eventKey="polar">Polar</Nav.Link></Nav.Item>
                  <Nav.Item><Nav.Link eventKey="recurrence">Recurrence</Nav.Link></Nav.Item>
                </Nav>
                <div className="d-flex gap-2">
                    <Badge bg="light" className="text-dark border">SR: {signalData?.sampleRate || 0}Hz</Badge>
                </div>
            </Card.Header>
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center p-5 mt-5 mb-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2 text-muted">Fetching Signal from Kaggle...</p>
                </div>
              ) : (
                <div style={{ minHeight: '500px' }}>
                  {viewerType === 'continuous' && (
                    <ContinuousViewer
                      signalData={signalData}
                      viewportSeconds={viewportSeconds}
                      layoutMode={layoutMode}
                      channelVisibility={channelVisibility}
                      channelProps={channelProps}
                      isPlaying={isPlaying}
                      onPlayPause={setIsPlaying}
                    />
                  )}
                  {viewerType === 'xor' && (
                    <XORViewer signalData={signalData} channelVisibility={channelVisibility} channelProps={channelProps} />
                  )}
                  {viewerType === 'polar' && (
                    <PolarViewer signalData={signalData} viewportSeconds={viewportSeconds} channelVisibility={channelVisibility} channelProps={channelProps} />
                  )}
                  {viewerType === 'recurrence' && (
                    <RecurrenceViewer signalData={signalData} channelVisibility={channelVisibility} />
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}