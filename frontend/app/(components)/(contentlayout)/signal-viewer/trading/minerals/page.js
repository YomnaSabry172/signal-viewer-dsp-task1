"use client";
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Alert } from 'react-bootstrap';
import ReactECharts from 'echarts-for-react';
import Seo from '@/shared/layout-components/seo/seo';
import { fetchMineralData, predictNext, MOCK_MINERALS } from '@/shared/data/signal-viewer/tradingData';
import { chartTextStyle, axisTheme } from '@/shared/utils/chartTheme';

export default function MineralsPage() {
  const [mineral, setMineral] = useState('XAU');
  const [data, setData] = useState([]);
  const [minerals, setMinerals] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchMinerals = async () => {
      try {
        const apiEndpoint = process.env.NEXT_PUBLIC_ECG_ENDPOINT || 'http://127.0.0.1:8000';
        const res = await fetch(`${apiEndpoint}/gold/minerals`);
        if (res.ok) {
          const json = await res.json();
          if (json.ok && json.columns) {
            // Filter out 'Date' and 'version' columns, format as "Currency/USD"
            const mineralsList = json.columns
              .filter(m => m !== 'Date')
            setMinerals(mineralsList);
            if (mineralsList.length > 0) {
              setMineral(mineralsList[0]);
            }
          }
        }
      } catch (e) {
        console.log('Could not fetch minerals list from backend');
        setMinerals([]);
      }
    };
    fetchMinerals();
  }, []);

  // Fetch data when pair changes
  useEffect(() => {
    if (!mineral) return;
    setLoading(true);
    fetchMineralData(mineral).then((d) => {
      setData(d);
      setPrediction(predictNext(d));
      setLoading(false);
    });
  }, [mineral]);

  const axisStyle = axisTheme();
  const labelInterval = data.length > 20 ? Math.floor(data.length / 15) : 0;
  const option = data.length ? {
    backgroundColor: 'transparent',
    textStyle: chartTextStyle(),
    grid: { left: 50, right: 30, top: 40, bottom: 70, containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(([d]) => d),
      axisLabel: {
        rotate: 45,
        interval: labelInterval,
        ...axisStyle.axisLabel,
        margin: 10,
      },
      axisTick: { alignWithLabel: true },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      scale: true,
      name: 'Price',
      axisLabel: axisStyle.axisLabel,
      nameTextStyle: axisStyle.nameTextStyle,
      splitLine: { lineStyle: { opacity: 0.15 } },
    },
    series: [{
      data: data.map(([, v]) => v),
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      lineStyle: { width: 2 },
      areaStyle: { opacity: 0.15 },
      itemStyle: { borderWidth: 1 },
    }],
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const p = params?.[0];
        if (!p) return '';
        const idx = p.dataIndex;
        return `${data[idx]?.[0] || ''}<br/><strong>${data[idx]?.[1] != null ? Number(data[idx][1]).toFixed(2) : '—'}</strong>`;
      },
    },
  } : {};

  // const current = MOCK_MINERALS.find(m => m.symbol === mineral);

  return (
    <>
      <Seo title="Minerals" />
      <div className="mb-4">
        <h4 className="fw-semibold">Mineral/Commodity Signals</h4>
        <p className="text-muted mb-0">Precious metals and commodity price visualization</p>
      </div>

      <Row>
        <Col lg={4}>
          <Card className="custom-card">
            <Card.Header><h6 className="mb-0">Select Mineral</h6></Card.Header>
            <Card.Body>
              <Form.Select value={mineral} onChange={(e) => setMineral(e.target.value)}>
                {minerals.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Form.Select>
            </Card.Body>
          </Card>
          {prediction && (
            <Card className="custom-card border-primary">
              <Card.Header className="bg-primary-transparent"><h6 className="mb-0">Prediction</h6></Card.Header>
              <Card.Body>
                <Alert variant="info" className="mb-0">
                  <strong>Next estimate:</strong> ${prediction.predicted.toFixed(2)}
                  <br />
                  <small>Method: {prediction.method}</small>
                </Alert>
              </Card.Body>
            </Card>
          )}
        </Col>
        <Col lg={8}>
          <Card className="custom-card">
            <Card.Header><h6 className="mb-0">{mineral} Price Chart</h6></Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-5 text-muted">Loading...</div>
              ) : (
                <ReactECharts option={option} style={{ height: 420, width: '100%' }} notMerge={true} />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}
