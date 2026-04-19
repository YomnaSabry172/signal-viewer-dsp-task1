"use client";
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Alert, Table, Spinner } from 'react-bootstrap';
import ReactECharts from 'echarts-for-react';
import Seo from '@/shared/layout-components/seo/seo';
import { API_ENDPOINTS } from '@/shared/constants/api';
import { chartTextStyle, axisTheme } from '@/shared/utils/chartTheme';

const LINE_COLORS = ['#5470c6', '#91cc75', '#ee6666', '#fac858', '#73c0de', '#3ba272'];

export default function MicrobiomePage() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [abundanceData, setAbundanceData] = useState(null);
  const [compositionData, setCompositionData] = useState(null);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingAbundance, setLoadingAbundance] = useState(false);
  const [loadingComposition, setLoadingComposition] = useState(false);
  const [abundanceError, setAbundanceError] = useState(null);
  const [patientsError, setPatientsError] = useState(null);

  useEffect(() => {
    const fetchPatients = async () => {
      setPatientsError(null);
      try {
        const res = await fetch(API_ENDPOINTS.MICROBIOME_PATIENTS);
        const contentType = res.headers.get('content-type');
        if (!res.ok) {
          const text = await res.text();
          let msg = text;
          if (contentType?.includes('application/json')) {
            try {
              const j = JSON.parse(text);
              msg = j.detail || j.message || text;
            } catch (_) {}
          }
          throw new Error(msg || `Failed to fetch patients (${res.status})`);
        }
        const data = contentType?.includes('application/json') ? await res.json() : {};
        const list = Array.isArray(data.patients) ? data.patients : [];
        setPatients(list);
        if (list.length && !selectedPatientId) {
          setSelectedPatientId(list[0]);
        }
      } catch (e) {
        setPatients([]);
        setPatientsError(e.message || 'Could not load patients list');
      } finally {
        setLoadingPatients(false);
      }
    };
    fetchPatients();
  }, []);

  useEffect(() => {
    if (!selectedPatientId) {
      setAbundanceData(null);
      setCompositionData(null);
      return;
    }
    setLoadingAbundance(true);
    setLoadingComposition(true);
    setAbundanceError(null);
    const pid = encodeURIComponent(selectedPatientId);
    fetch(`${API_ENDPOINTS.MICROBIOME_ABUNDANCE}?patient_id=${pid}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'No data for this patient' : 'Failed to fetch');
        return res.json();
      })
      .then((data) => setAbundanceData(data))
      .catch((e) => {
        setAbundanceError(e.message);
        setAbundanceData(null);
      })
      .finally(() => setLoadingAbundance(false));
    fetch(`${API_ENDPOINTS.MICROBIOME_COMPOSITION}?patient_id=${pid}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch composition');
        return res.json();
      })
      .then((data) => setCompositionData(data))
      .catch(() => setCompositionData(null))
      .finally(() => setLoadingComposition(false));
  }, [selectedPatientId]);

  const composition = compositionData?.composition || {};
  const topTaxa = compositionData?.top_taxa || [];
  const weekNum = compositionData?.week_num;

  const axisStyle = axisTheme();
  const textStyle = chartTextStyle();
  const pieOption = Object.keys(composition).length
    ? {
        backgroundColor: 'transparent',
        textStyle,
        tooltip: { trigger: 'item', confine: true },
        legend: {
          type: 'scroll',
          orient: 'horizontal',
          bottom: 12,
          left: 'center',
          width: '88%',
          padding: [14, 24, 14, 24],
          itemGap: 20,
          textStyle: { ...textStyle, fontSize: 11 },
          formatter: (name) => (name.length > 24 ? name.slice(0, 21) + '…' : name),
          pageIconColor: textStyle.color || '#666',
          pageTextStyle: { ...textStyle, fontSize: 10 },
          pageButtonItemGap: 8,
          pageButtonGap: 12,
        },
        series: [{
          type: 'pie',
          radius: ['30%', '58%'],
          center: ['50%', '42%'],
          data: Object.entries(composition).map(([name, value]) => ({
            name,
            value: (value * 100).toFixed(2),
          })),
          label: {
            fontSize: 10,
            formatter: '{d}%',
            color: textStyle.color || '#333',
          },
          emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' } },
        }],
      }
    : {};

  const lineOption = abundanceData?.curves?.length
    ? {
        backgroundColor: 'transparent',
        textStyle,
        tooltip: { trigger: 'axis', confine: true },
        grid: { left: 55, right: 50, top: 40, bottom: 80, containLabel: true },
        legend: {
          data: abundanceData.curves.map((c) => c.name),
          type: 'scroll',
          orient: 'horizontal',
          bottom: 12,
          left: 'center',
          width: '88%',
          padding: [14, 24, 14, 24],
          itemGap: 20,
          textStyle: { ...textStyle, fontSize: 11 },
          formatter: (name) => (name.length > 28 ? name.slice(0, 25) + '…' : name),
          pageIconColor: textStyle.color || '#666',
          pageTextStyle: { ...textStyle, fontSize: 10 },
          pageButtonItemGap: 8,
          pageButtonGap: 12,
        },
        xAxis: {
          type: 'category',
          name: 'Week',
          nameLocation: 'middle',
          nameGap: 28,
          data: abundanceData.weeks,
          axisLabel: axisStyle.axisLabel,
          nameTextStyle: axisStyle.nameTextStyle,
        },
        yAxis: {
          type: 'value',
          name: 'Abundance',
          axisLabel: axisStyle.axisLabel,
          nameTextStyle: axisStyle.nameTextStyle,
        },
        series: abundanceData.curves.map((curve, i) => ({
          name: curve.name,
          type: 'line',
          smooth: true,
          data: curve.data.map((d) => d.abundance),
          itemStyle: { color: LINE_COLORS[i % LINE_COLORS.length] },
        })),
      }
    : {};

  return (
    <>
      <Seo title="Microbiome" />
      <div className="mb-4">
        <h4 className="fw-semibold">Microbiome Signal Viewer</h4>
        <p className="text-muted mb-0">Bacterial/disease profiling from microbiome datasets (iHMP, iPOP style)</p>
      </div>

      <Row>
        <Col lg={4}>
          <Card className="custom-card">
            <Card.Header><h6 className="mb-0">Select Patient</h6></Card.Header>
            <Card.Body>
              {loadingPatients ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <>
                  {patientsError && <Alert variant="danger" className="small mb-2">{patientsError}</Alert>}
                  <Form.Select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                  >
                    <option value="">-- Select patient --</option>
                    {patients.map((id) => (
                      <option key={id} value={id}>Patient {id}</option>
                    ))}
                  </Form.Select>
                </>
              )}
            </Card.Body>
          </Card>

          {selectedPatientId && (topTaxa.length > 0 || weekNum != null) && (
            <Card className="custom-card border-primary">
              <Card.Header className="bg-primary-transparent">
                <h6 className="mb-0">Patient Profile</h6>
              </Card.Header>
              <Card.Body>
                <Alert variant="info" className="mb-0">
                  {weekNum != null && (
                    <><strong>Latest time point:</strong> Week {weekNum}<br /></>
                  )}
                  <strong>Top taxa:</strong> {topTaxa.length ? topTaxa.join(', ') : '—'}
                </Alert>
              </Card.Body>
            </Card>
          )}

          <Card className="custom-card">
            <Card.Header><h6 className="mb-0">Composition (latest week)</h6></Card.Header>
            <Card.Body>
              {loadingComposition && <Spinner animation="border" size="sm" />}
              {!loadingComposition && selectedPatientId && Object.keys(composition).length > 0 && (
                <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                  <Table size="sm" className="mb-0">
                    <tbody>
                    {Object.entries(composition).map(([k, v]) => (
                      <tr key={k}>
                        <td>{k}</td>
                        <td>{(v * 100).toFixed(2)}%</td>
                      </tr>
                    ))}
                    </tbody>
                  </Table>
                </div>
              )}
              {!loadingComposition && selectedPatientId && Object.keys(composition).length === 0 && (
                <p className="text-muted mb-0 small">No composition data for this patient.</p>
              )}
              {!selectedPatientId && <p className="text-muted mb-0 small">Select a patient.</p>}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={8}>
          <div className="d-flex flex-column gap-3">
            <Card className="custom-card">
              <Card.Header><h6 className="mb-0">Composition (Pie)</h6></Card.Header>
              <Card.Body>
                {loadingComposition && <div className="text-center py-4"><Spinner animation="border" /></div>}
                {!loadingComposition && Object.keys(composition).length > 0 && (
                  <ReactECharts option={pieOption} style={{ height: 360, width: '100%' }} />
                )}
                {!loadingComposition && selectedPatientId && Object.keys(composition).length === 0 && (
                  <p className="text-muted mb-0">No composition data for this patient.</p>
                )}
                {!selectedPatientId && <p className="text-muted mb-0">Select a patient to view composition.</p>}
              </Card.Body>
            </Card>
            <Card className="custom-card">
              <Card.Header><h6 className="mb-0">Abundance over Time (top microbiomes)</h6></Card.Header>
              <Card.Body>
                {loadingAbundance && <div className="text-center py-4"><Spinner animation="border" /></div>}
                {abundanceError && <Alert variant="warning">{abundanceError}</Alert>}
                {!loadingAbundance && !abundanceError && abundanceData?.curves?.length > 0 && (
                  <ReactECharts option={lineOption} style={{ height: 360, width: '100%' }} />
                )}
                {!loadingAbundance && !abundanceError && selectedPatientId && abundanceData?.curves?.length === 0 && (
                  <p className="text-muted mb-0">No abundance data for this patient.</p>
                )}
                {!loadingAbundance && !selectedPatientId && (
                  <p className="text-muted mb-0">Select a patient to view abundance over time.</p>
                )}
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>
    </>
  );
}
