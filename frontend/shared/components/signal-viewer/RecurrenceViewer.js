"use client";
import React, { useMemo, useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, Form, Button } from 'react-bootstrap';
import { getEcgChannelLabel } from '@/shared/utils/ecgLeads';
import { chartTextStyle, axisTheme } from '@/shared/utils/chartTheme';

const COLORMAPS = {
  viridis: ['#440154', '#482878', '#3e4a89', '#31688e', '#26838f', '#1f9e89', '#35b779', '#6dcd59', '#b4de2c', '#fde725'],
  plasma: ['#0d0887', '#47039f', '#7301a8', '#9c179e', '#bd3786', '#d8576b', '#ed7953', '#fb9f3a', '#fdca26', '#f0f921'],
  inferno: ['#000004', '#1b0c41', '#4a0c6b', '#781c6d', '#a52c60', '#cf4446', '#ed6925', '#fb9b06', '#f7d13d', '#fcffa4'],
  magma: ['#000004', '#180f3e', '#451077', '#721f81', '#9f2f7f', '#cd4071', '#f1605d', '#fd9668', '#fec287', '#fcfdbf'],
};

export default function RecurrenceViewer({
  signalData,
  channelX = 0,
  channelY = 1,
  channelVisibility = [],
  colorMap = 'viridis',
  viewportSeconds = 2,
  pointCount = 500, // Maximum points to render in the window for performance
}) {
  const [chX, setChX] = useState(channelX);
  const [chY, setChY] = useState(channelY);
  const [localColorMap, setLocalColorMap] = useState(colorMap);
  const [viewport, setViewport] = useState(viewportSeconds);

  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const sampleRate = signalData?.sampleRate || 360;
  const totalSamples = signalData?.data?.[0]?.length || 0;
  const totalDuration = totalSamples > 0 ? totalSamples / sampleRate : 0;
  const maxTime = Math.max(0, totalDuration - viewport);

  // Playback Effect
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const nextTime = prev + 0.05;
          if (nextTime >= maxTime) {
            setIsPlaying(false);
            return maxTime;
          }
          return nextTime;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying, maxTime]);

  const togglePlay = () => {
    if (!isPlaying && currentTime >= maxTime) {
      setCurrentTime(0);
    }
    setIsPlaying(!isPlaying);
  };

  const scatterData = useMemo(() => {
    if (!signalData?.data || signalData.data.length < 2) return null;
    const chXData = signalData.data[chX];
    const chYData = signalData.data[chY];
    if (!chXData || !chYData) return null;

    // Slice based on the sliding time window
    const startIndex = Math.floor(currentTime * sampleRate);
    const endIndex = Math.min(chXData.length, startIndex + Math.floor(viewport * sampleRate));
    
    const sliceX = chXData.slice(startIndex, endIndex);
    const sliceY = chYData.slice(startIndex, endIndex);
    
    // Downsample if the window has too many points to keep rendering smooth
    const step = Math.max(1, Math.floor(sliceX.length / pointCount));
    const points = [];

    for (let i = 0; i < sliceX.length && points.length < pointCount; i += step) {
      const x = sliceX[i]?.[1] ?? 0;
      const y = sliceY[i]?.[1] ?? 0;
      const t = sliceX[i]?.[0] ?? 0; // The actual time value
      // Push [x, y, time] so we can color-code by time
      points.push([x, y, t]); 
    }
    return points;
  }, [signalData, chX, chY, currentTime, viewport, pointCount, sampleRate]);

  const colors = COLORMAPS[localColorMap] || COLORMAPS.viridis;

  const axisStyle = axisTheme();
  const option = scatterData ? {
    animation: false,
    backgroundColor: 'transparent',
    textStyle: chartTextStyle(),
    grid: { left: '12%', right: '10%', top: '10%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'value',
      name: getEcgChannelLabel(signalData, chX),
      splitLine: { show: true, lineStyle: { opacity: 0.15 } },
      axisLabel: axisStyle.axisLabel,
      nameTextStyle: axisStyle.nameTextStyle,
    },
    yAxis: {
      type: 'value',
      name: getEcgChannelLabel(signalData, chY),
      splitLine: { show: true, lineStyle: { opacity: 0.15 } },
      axisLabel: axisStyle.axisLabel,
      nameTextStyle: axisStyle.nameTextStyle,
    },
    visualMap: {
      type: 'continuous', // Using continuous makes the gradient smooth
      show: false,
      dimension: 2, // Map colors to the 3rd array element (time)
      min: currentTime, // Oldest point color
      max: currentTime + viewport, // Newest point color
      inRange: {
        color: colors 
      }
    },
    series: [{
      type: 'scatter', // Try 'line' here if you want a connected phase portrait!
      data: scatterData,
      symbolSize: 4,
      emphasis: { scale: 2 },
    }],
  } : {};

  const channels = signalData?.data?.length || 0;

  return (
    <Card className="custom-card">
      <Card.Header>
        <div className="d-flex flex-column gap-2">
          {/* Top Row: Title and Main Controls */}
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h6 className="mb-0">Recurrence Plot (Phase Space)</h6>
            
            <div className="d-flex gap-3 align-items-center">
              <Form.Group className="d-flex align-items-center gap-2">
                <Form.Label className="mb-0 small">Ch X:</Form.Label>
                <Form.Select size="sm" style={{ width: 70 }} value={chX} onChange={(e) => setChX(Number(e.target.value))}>
                  {Array.from({ length: channels }, (_, i) => (
                    <option key={i} value={i}>{getEcgChannelLabel(signalData, i)}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="d-flex align-items-center gap-2">
                <Form.Label className="mb-0 small">Ch Y:</Form.Label>
                <Form.Select size="sm" style={{ width: 70 }} value={chY} onChange={(e) => setChY(Number(e.target.value))}>
                  {Array.from({ length: channels }, (_, i) => (
                    <option key={i} value={i}>{getEcgChannelLabel(signalData, i)}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="d-flex align-items-center gap-2">
                <Form.Label className="mb-0 small">Colormap:</Form.Label>
                <Form.Select size="sm" style={{ width: 100 }} value={localColorMap} onChange={(e) => setLocalColorMap(e.target.value)}>
                  {Object.keys(COLORMAPS).map(k => (
                    <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              
              <Form.Group className="d-flex align-items-center gap-2">
                <Form.Label className="mb-0 small">Time (s):</Form.Label>
                <Form.Control
                  type="number"
                  size="sm"
                  style={{ width: 70 }}
                  min={0.1}
                  max={10}
                  step={0.1}
                  value={viewport}
                  onChange={(e) => setViewport(parseFloat(e.target.value) || 2)}
                />
              </Form.Group>
            </div>
          </div>

          {/* Bottom Row: Playback Controls */}
          <div className="d-flex align-items-center gap-3 pt-2 border-top border-secondary border-opacity-25">
            <Button 
              variant={isPlaying ? "outline-warning" : "outline-success"} 
              size="sm" 
              onClick={togglePlay}
              style={{ width: "80px" }}
            >
              {isPlaying ? "⏸ Pause" : "▶ Play"}
            </Button>
            
            <Form.Range 
              className="flex-grow-1"
              min={0}
              max={maxTime}
              step={0.01}
              value={currentTime}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentTime(parseFloat(e.target.value));
              }}
            />
            
            <span className="small text-muted" style={{ minWidth: "50px" }}>
              {currentTime.toFixed(1)}s
            </span>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        {scatterData ? (
          <ReactECharts option={option} style={{ height: 350 }} notMerge={true} />
        ) : (
          <div className="text-muted text-center py-5">Need at least 2 channels</div>
        )}
      </Card.Body>
    </Card>
  );
}