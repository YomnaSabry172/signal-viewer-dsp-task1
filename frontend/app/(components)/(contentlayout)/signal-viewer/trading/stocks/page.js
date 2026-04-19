"use client";
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Alert } from 'react-bootstrap';
import ReactECharts from 'echarts-for-react';
import Seo from '@/shared/layout-components/seo/seo';
import { fetchStockData, predictNext, MOCK_STOCKS } from '@/shared/data/signal-viewer/tradingData';
import { chartTextStyle, axisTheme } from '@/shared/utils/chartTheme';

export default function StocksPage() {
  const [stock, setStock] = useState('AAPL');
  const [data, setData] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const apiEndpoint = process.env.NEXT_PUBLIC_ECG_ENDPOINT || 'http://127.0.0.1:8000';
        const res = await fetch(`${apiEndpoint}/gold/stock`);
        if (res.ok) {
          const json = await res.json();
          if (json.ok && json.columns) {
            // Filter out 'Date' and 'version' columns, format as "Currency/USD"
            const stocksList = json.columns
              .filter(m => m !== 'Date')
            setStocks(stocksList);
            if (stocksList.length > 0) {
              setStock(stocksList[0]);
            }
          }
        }
      } catch (e) {
        console.log('Could not fetch stock list from backend');
        setStocks([]);
      }
    };
    fetchStocks();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchStockData(stock).then((d) => {
      setData(d);
      setPrediction(predictNext(d));
      setLoading(false);
    });
  }, [stock]);

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
      name: 'Price ($)',
      axisLabel: axisStyle.axisLabel,
      nameTextStyle: axisStyle.nameTextStyle,
      splitLine: { lineStyle: { opacity: 0.15 } },
    },
    series: [
      {
        data: data.map(([, v]) => v),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 2 },
        areaStyle: { opacity: 0.15 },
        itemStyle: { borderWidth: 1 },
      },
    ],
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const p = params?.[0];
        if (!p) return '';
        const idx = p.dataIndex;
        const date = data[idx]?.[0] || '';
        const val = data[idx]?.[1];
        return `${date}<br/><strong>$${val != null ? Number(val).toFixed(2) : '—'}</strong>`;
      },
    },
  } : {};

  return (
    <>
      <Seo title="Stock Market" />
      <div className="mb-4">
        <h4 className="fw-semibold">Stock Market Signals</h4>
        <p className="text-muted mb-0">Visualize and predict stock prices</p>
      </div>

      <Row>
        <Col lg={4}>
          <Card className="custom-card">
            <Card.Header><h6 className="mb-0">Select Stock</h6></Card.Header>
            <Card.Body>
              <Form.Select value={stock} onChange={(e) => setStock(e.target.value)}>
                {stocks.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Form.Select>
            </Card.Body>
          </Card>
          {prediction && (
            <Card className="custom-card border-primary">
              <Card.Header className="bg-primary-transparent"><h6 className="mb-0">Prediction</h6></Card.Header>
              <Card.Body>
                <Alert variant="info" className="mb-0">
                  <strong>Next day estimate:</strong> ${prediction.predicted.toFixed(2)}
                  <br />
                  <small>Method: {prediction.method}</small>
                </Alert>
              </Card.Body>
            </Card>
          )}
        </Col>
        <Col lg={8}>
          <Card className="custom-card">
            <Card.Header><h6 className="mb-0">Price Chart</h6></Card.Header>
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
