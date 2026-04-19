"use client";
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Alert, Spinner } from 'react-bootstrap';
import ReactECharts from 'echarts-for-react';
import Seo from '@/shared/layout-components/seo/seo';
import { fetchCurrencyData, predictNext } from '@/shared/data/signal-viewer/tradingData';
import { chartTextStyle, axisTheme } from '@/shared/utils/chartTheme';

export default function CurrenciesPage() {
  const [pair, setPair] = useState('');
  const [data, setData] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currenciesLoaded, setCurrenciesLoaded] = useState(false);

  // Fetch available currencies from backend
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const apiEndpoint = process.env.NEXT_PUBLIC_ECG_ENDPOINT || 'http://127.0.0.1:8000';
        const res = await fetch(`${apiEndpoint}/gold/currency`);
        if (res.ok) {
          const json = await res.json();
          if (json.ok && json.columns) {
            const currencyList = json.columns
              .filter(c => c !== 'Date' && c !== 'version')
              .map(c => `${c}/USD`);
            setCurrencies(currencyList);
            if (currencyList.length > 0) {
              setPair(currencyList[0]);
              setLoading(true);
            } else {
              setLoading(false);
            }
            setCurrenciesLoaded(true);
          } else {
            setLoading(false);
            setCurrenciesLoaded(true);
          }
        } else {
          setLoading(false);
          setCurrenciesLoaded(true);
        }
      } catch (e) {
        console.log('Could not fetch currency list from backend');
        setCurrencies([]);
        setLoading(false);
        setCurrenciesLoaded(true);
      }
    };
    fetchCurrencies();
  }, []);

  // Fetch data when pair changes (only after we have a valid pair from backend)
  useEffect(() => {
    if (!pair) return;
    setLoading(true);
    fetchCurrencyData(pair)
      .then((d) => {
        setData(d || []);
        setPrediction(predictNext(d || []));
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [pair]);

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
      name: 'Rate',
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
        return `${data[idx]?.[0] || ''}<br/><strong>${data[idx]?.[1] != null ? Number(data[idx][1]).toFixed(4) : '—'}</strong>`;
      },
    },
  } : {};

  return (
    <>
      <Seo title="Currencies" />
      <div className="mb-4">
        <h4 className="fw-semibold">Currency Signals</h4>
        <p className="text-muted mb-0">Real-time currency exchange rates visualization and prediction</p>
      </div>

      <Row>
        <Col lg={4}>
          <Card className="custom-card">
            <Card.Header><h6 className="mb-0">Select Currency</h6></Card.Header>
            <Card.Body>
              <Form.Select value={pair} onChange={(e) => setPair(e.target.value)}>
                {currencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Form.Select>
            </Card.Body>
          </Card>
          {prediction && (
            <Card className="custom-card border-primary">
              <Card.Header className="bg-primary-transparent"><h6 className="mb-0">Prediction</h6></Card.Header>
              <Card.Body>
                <Alert variant="info" className="mb-0">
                  <strong>Next estimate:</strong> {prediction.predicted.toFixed(4)}
                  <br />
                  <small>Method: {prediction.method}</small>
                </Alert>
              </Card.Body>
            </Card>
          )}
        </Col>
        <Col lg={8}>
          <Card className="custom-card">
            <Card.Header><h6 className="mb-0">Exchange Rate Chart{pair ? ` - ${pair}` : ''}</h6></Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-5 text-muted d-flex flex-column align-items-center gap-2">
                  <Spinner animation="border" variant="primary" />
                  <span>{pair ? 'Loading exchange rate data...' : 'Loading currencies...'}</span>
                </div>
              ) : data.length > 0 ? (
                <ReactECharts option={option} style={{ height: 420, width: '100%' }} notMerge={true} />
              ) : (
                <div className="text-center py-5 text-muted">
                {pair ? `No data available for ${pair}. Ensure the backend is running.` : 'No currencies loaded.'}
              </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}
