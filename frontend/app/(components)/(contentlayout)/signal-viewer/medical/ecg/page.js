"use client";
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Alert, Nav, Accordion, Button } from 'react-bootstrap';
import ReactECharts from 'echarts-for-react';
import Seo from '@/shared/layout-components/seo/seo';
import ContinuousViewer from '@/shared/components/signal-viewer/ContinuousViewer';
import XORViewer from '@/shared/components/signal-viewer/XORViewer';
import PolarViewer from '@/shared/components/signal-viewer/PolarViewer';
import RecurrenceViewer from '@/shared/components/signal-viewer/RecurrenceViewer';
import { getEcgChannelLabel } from '@/shared/utils/ecgLeads';
import { CHANNEL_COLORS } from '@/shared/constants/signalViewer';

export default function ECGViewerPage() {
  const [viewerType, setViewerType] = useState('continuous');
  const [layoutMode, setLayoutMode] = useState('stacked');
  const [channelVisibility, setChannelVisibility] = useState([]);
  const [channelProps, setChannelProps] = useState({});
  const [classicResult, setClassicResult] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewportSeconds, setViewportSeconds] = useState(2);
  const [chunkSeconds, setChunkSeconds] = useState(1);
  const [records, setRecords] = useState([]);
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [recordSearch, setRecordSearch] = useState("");
  const [signalData, setSignalData] = useState(null);
  const [aiPredictionResult, setAiPredictionResult] = useState({});

  useEffect(() => {
    if (!signalData) return;
    setChannelVisibility(Array(signalData.channels).fill(true));
    setChannelProps(
      Object.fromEntries(
        Array.from({ length: signalData.channels }, (_, i) => [
          i,
          { color: CHANNEL_COLORS[i % CHANNEL_COLORS.length], lineWidth: 2 },
        ])
      )
    );
  }, [signalData]);

  useEffect(() => {
  const fetchRecords = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_ECG_ENDPOINT}/ecg/records`
      );
      const json = await res.json();

      setRecords(json.records || []);

      if (json.records?.length > 0) {
        setSelectedRecordId(json.records[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch records:", err);
    }
  };

  fetchRecords();
}, []);

useEffect(() => {
  if (!selectedRecordId) return;

  const fetchSegment = async () => {
    try {
      const recordPath = encodeURIComponent(selectedRecordId);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_ECG_ENDPOINT}/ecg/records/${recordPath}?start=0&seconds=10&max_points=10000`
      );

      const json = await res.json();
      setSignalData(json);
    } catch (err) {
      console.error("Failed to fetch ECG segment:", err);
    }
  };

  fetchSegment();
}, [selectedRecordId]);

useEffect(() => {
  if (!selectedRecordId) return;

  const baseUrl = process.env.NEXT_PUBLIC_ECG_ENDPOINT;
  const payload = { record_id: selectedRecordId, start: 0.0, seconds: 10.0 };

  // AI Prediction
  const fetchAI = async () => {
    try {
      const res = await fetch(`${baseUrl}/ecg/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      setAiPredictionResult(json);
    } catch (err) {
      console.error("Error fetching AI prediction:", err);
    }
  };

  // Classic ML: XQRS + RR statistics, autocorrelation, pNN50
  const fetchClassic = async () => {
    try {
      const res = await fetch(`${baseUrl}/ecg/classic-ml`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      setClassicResult(json);
    } catch (err) {
      console.error("Error fetching classic ML:", err);
      setClassicResult(null);
    }
  };

  fetchAI();
  fetchClassic();
}, [selectedRecordId]);
  return (
    <div className="ecg-viewer-page">
      <Seo title="ECG Viewer" />
      <div className="mb-3">
        <h4 className="fw-semibold mb-1">ECG Signal Viewer</h4>
        <p className="text-muted mb-0 small">Multi-channel ECG with AI and classic ML arrhythmia detection</p>
      </div>

      <Row className="g-3 align-items-start">
        <Col xl={3}>
          <Card className="custom-card">
            <Card.Header>
              <h6 className="mb-0">Select Record</h6>
            </Card.Header>
            <Card.Body>
              <Form.Control
                type="search"
                placeholder="Filter by record or diagnosis…"
                value={recordSearch}
                onChange={(e) => setRecordSearch(e.target.value)}
                className="mb-2"
                size="sm"
              />
              <div
                className="d-flex flex-column gap-1 overflow-auto"
                style={{ maxHeight: 180 }}
              >
                {records
                  .filter((r) => {
                    const q = recordSearch.toLowerCase();
                    if (!q) return true;
                    return (
                      (r.id || "").toLowerCase().includes(q) ||
                      (r.diagnosis || "").toLowerCase().includes(q)
                    );
                  })
                  .map((r) => {
                    const [patient, record] = (r.id || r.label || "").split("/");
                    const isSelected = selectedRecordId === r.id;
                    return (
                      <div
                        key={r.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedRecordId(r.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedRecordId(r.id);
                          }
                        }}
                        className={`rounded border px-2 py-2 text-start small ${
                          isSelected
                            ? "border-primary bg-primary-transparent"
                            : "border-secondary-subtle bg-transparent"
                        }`}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="d-flex justify-content-between align-items-start gap-1">
                          <span className="text-break fw-medium">
                            {patient ? `${patient} / ${record || ""}` : r.id}
                          </span>
                          {r.diagnosis && (
                            <span className="badge bg-secondary text-nowrap" style={{ fontSize: "0.65rem" }}>
                              {r.diagnosis}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
              {records.length === 0 && (
                <p className="text-muted small mb-0 mt-2">No records loaded</p>
              )}
            </Card.Body>
          </Card>

          {(aiPredictionResult || classicResult) && (
            <Accordion defaultActiveKey="" className="custom-card">
              {aiPredictionResult && (
                <Accordion.Item eventKey="0" className="border-0">
                  <Accordion.Header className="py-2 small">
                    <span className="text-primary">AI: {aiPredictionResult.abnormality_type}</span>
                    {aiPredictionResult.normal_abnormal === 'Abnormal' && (
                      <span className="badge bg-danger ms-2">Abnormal</span>
                    )}
                  </Accordion.Header>
                  <Accordion.Body>
                    {(aiPredictionResult.confidence || 0) < 0.5 && (
                      <Alert variant="warning" className="mb-2 small">
                        Low confidence ({((aiPredictionResult.confidence || 0) * 100).toFixed(0)}%)
                      </Alert>
                    )}
                    <p className="mb-1"><strong>Type:</strong> {aiPredictionResult.abnormality_type}</p>
                    <p className="mb-0 small">Confidence: {((aiPredictionResult.confidence || 0) * 100).toFixed(0)}%</p>
                  </Accordion.Body>
                </Accordion.Item>
              )}
              {classicResult && (
                <Accordion.Item eventKey="1" className="border-0">
                  <Accordion.Header className="py-2 small">
                    Classic ML: {classicResult.result} ({classicResult.heartRate != null ? `${classicResult.heartRate} bpm` : 'N/A'})
                  </Accordion.Header>
                  <Accordion.Body>
                    <p className="mb-1"><strong>Peaks:</strong> {classicResult.peakCount}</p>
                    {classicResult.features && Object.keys(classicResult.features).length > 0 && (
                      <details className="mt-2 small text-muted">
                        <summary>Features</summary>
                        <ul className="mb-0 mt-1 ps-3">{Object.entries(classicResult.features).map(([k, v]) => <li key={k}>{k}: {v}</li>)}</ul>
                      </details>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              )}
              {aiPredictionResult && classicResult && (
                <Accordion.Item eventKey="2" className="border-0">
                  <Accordion.Header className="py-2 small">AI vs Classic</Accordion.Header>
                  <Accordion.Body className="small">
                    <p className="mb-0 text-muted">AI: disease types. Classic: rhythm &amp; HR.</p>
                  </Accordion.Body>
                </Accordion.Item>
              )}
            </Accordion>
          )}
        </Col>
        <Col xl={9}>
          <Card className="custom-card">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <Nav variant="pills" activeKey={viewerType} onSelect={(k) => setViewerType(k)}>
                  <Nav.Item><Nav.Link eventKey="continuous">Continuous</Nav.Link></Nav.Item>
                  <Nav.Item><Nav.Link eventKey="xor">XOR</Nav.Link></Nav.Item>
                  <Nav.Item><Nav.Link eventKey="polar">Polar</Nav.Link></Nav.Item>
                  <Nav.Item><Nav.Link eventKey="recurrence">Recurrence</Nav.Link></Nav.Item>
                </Nav>
                {viewerType === 'continuous' && (
                  <Form.Select
                    size="sm"
                    style={{ width: 180 }}
                    value={layoutMode}
                    onChange={(e) => setLayoutMode(e.target.value)}
                  >
                    <option value="stacked">All channels (stacked)</option>
                    <option value="grid">One viewer per channel</option>
                  </Form.Select>
                )}
              </div>
            </Card.Header>
            {signalData?.data && (
              <Card.Body className="py-2 border-bottom">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-1">
                  <span className="small text-muted">Channel colors &amp; thickness</span>
                  <div className="d-flex gap-1">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => setChannelVisibility(Array(signalData.channels).fill(true))}
                    >
                      Enable all
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      onClick={() => setChannelVisibility(Array(signalData.channels).fill(false))}
                    >
                      Disable all
                    </Button>
                  </div>
                </div>
                <div className="row row-cols-2 row-cols-md-3 row-cols-xl-4 g-2 overflow-auto" style={{ maxHeight: 140 }}>
                  {signalData.data.map((_, i) => (
                    <div key={i} className="col" style={{ minWidth: 140 }}>
                      <div className="d-flex align-items-center gap-2 flex-nowrap">
                        <Form.Check
                          type="switch"
                          id={`ch-${i}`}
                          checked={channelVisibility[i] !== false}
                          onChange={(e) =>
                            setChannelVisibility((v) => {
                              const n = [...v];
                              n[i] = e.target.checked;
                              return n;
                            })
                          }
                          className="flex-shrink-0"
                        />
                        <span className="text-nowrap flex-shrink-0" style={{ width: 32, fontSize: "0.75rem" }} title={getEcgChannelLabel(signalData, i)}>
                          {getEcgChannelLabel(signalData, i)}
                        </span>
                        <Form.Control
                          type="color"
                          size="sm"
                          style={{ width: 30, height: 26, padding: 2, flexShrink: 0 }}
                          value={channelProps[i]?.color || CHANNEL_COLORS[i % CHANNEL_COLORS.length]}
                          onChange={(e) =>
                            setChannelProps((p) => ({
                              ...p,
                              [i]: { ...p[i], color: e.target.value },
                            }))
                          }
                          title="Color"
                        />
                        <Form.Control
                          type="number"
                          size="sm"
                          min={0.5}
                          max={6}
                          step={0.5}
                          style={{ width: 52, minWidth: 52, flexShrink: 0 }}
                          value={channelProps[i]?.lineWidth ?? 2}
                          onChange={(e) =>
                            setChannelProps((p) => ({
                              ...p,
                              [i]: { ...p[i], lineWidth: parseFloat(e.target.value) || 2 },
                            }))
                          }
                          title="Thickness (px)"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            )}
            <Card.Body>
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
                <XORViewer
                  signalData={signalData}
                  chunkSeconds={chunkSeconds}
                  channelVisibility={channelVisibility}
                  channelProps={channelProps}
                />
              )}
              {viewerType === 'polar' && (
                <PolarViewer
                  signalData={signalData}
                  viewportSeconds={viewportSeconds}
                  channelVisibility={channelVisibility}
                  channelProps={channelProps}
                />
              )}
              {viewerType === 'recurrence' && (
                <RecurrenceViewer
                  signalData={signalData}
                  channelVisibility={channelVisibility}
                />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
