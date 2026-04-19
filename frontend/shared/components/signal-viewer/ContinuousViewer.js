"use client";
import React, { useRef, useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, Form, Button, ButtonGroup } from 'react-bootstrap';
import { getEcgChannelLabel } from '@/shared/utils/ecgLeads';
import { getChannelColor } from '@/shared/constants/signalViewer';
import { chartTextStyle, axisTheme } from '@/shared/utils/chartTheme';

const SINGLE_CHART_HEIGHT = 120;

function SingleChannelPlot({ signalData, channelIndex, timeOffset, localViewport, channelProps }) {
  const chartRef = useRef(null);
  const sampleRate = signalData?.sampleRate || 360;

  const option = React.useMemo(() => {
    if (!signalData?.data?.[channelIndex]) return null;
    const ch = signalData.data[channelIndex];
    const startIdx = Math.floor(timeOffset * sampleRate);
    const endIdx = Math.floor((timeOffset + localViewport) * sampleRate);
    const slice = ch.slice(startIdx, endIdx);
    const xySlice =
      Array.isArray(slice[0]) && slice[0].length === 2
        ? slice
        : slice.map((y, i) => [(startIdx + i) / sampleRate, y]);
    const color = getChannelColor(channelIndex, channelProps);
    const lineWidth = channelProps[channelIndex]?.lineWidth ?? 2;

    const axisStyle = axisTheme();
    return {
      animation: false,
      backgroundColor: 'transparent',
      textStyle: chartTextStyle(),
      grid: { left: 130, right: '5%', top: '8%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'value',
        min: timeOffset,
        max: timeOffset + localViewport,
        name: 'Time (s)',
        splitLine: { show: false },
        axisLabel: { margin: 40, interval: 'auto', ...axisStyle.axisLabel },
        nameTextStyle: axisStyle.nameTextStyle,
      },
      yAxis: {
        type: 'value',
        scale: true,
        splitLine: { show: false },
        splitNumber: 4,
        axisLabel: { margin: 40, interval: 'auto', ...axisStyle.axisLabel },
        nameTextStyle: axisStyle.nameTextStyle,
      },
      series: [{
        data: xySlice,
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { color, width: lineWidth },
      }],
    };
  }, [signalData, channelIndex, timeOffset, localViewport, channelProps]);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = chartRef.current.getEchartsInstance?.();
    if (chart) chart.resize();
  }, [timeOffset, localViewport]);

  if (!option) return null;
  return (
    <ReactECharts ref={chartRef} option={option} notMerge={true} lazyUpdate={false} style={{ height: SINGLE_CHART_HEIGHT }} />
  );
}

export default function ContinuousViewer({
  signalData,
  viewportSeconds = 2,
  layoutMode = 'stacked',
  channelVisibility = [],
  channelProps = {},
  playSpeed = 1,
  isPlaying = false,
  onPlayPause,
}) {
  const chartRef = useRef(null);
  const [timeOffset, setTimeOffset] = useState(0);
  const [localViewport, setLocalViewport] = useState(viewportSeconds);
  const animationRef = useRef(null);

  const channels = signalData?.data?.length || 0;
  const visibleIndices = signalData?.data
    ? signalData.data.map((_, i) => i).filter((i) => !channelVisibility.length || channelVisibility[i])
    : [];
  const sampleRate = signalData?.sampleRate || 360;
  const totalDuration = signalData?.data?.[0]?.length ? signalData.data[0].length / sampleRate : 0;

  useEffect(() => {
    if (!isPlaying) return;
    const step = 0.1 * playSpeed;
    animationRef.current = setInterval(() => {
      setTimeOffset(prev => {
        const next = prev + step;
        if (next >= totalDuration - localViewport) {
          onPlayPause?.(false);
          return Math.max(0, totalDuration - localViewport);
        }
        return next;
      });
    }, 100);
    return () => clearInterval(animationRef.current);
  }, [isPlaying, playSpeed, totalDuration, localViewport, onPlayPause]);

  useEffect(() => {
    if (!chartRef.current && layoutMode === 'stacked') return;
    const chart = layoutMode === 'stacked' ? chartRef.current?.getEchartsInstance?.() : null;
    if (chart) {
      const t = setTimeout(() => chart.resize(), 0);
      const onResize = () => chart.resize();
      window.addEventListener("resize", onResize);
      return () => {
        clearTimeout(t);
        window.removeEventListener("resize", onResize);
      };
    }
  }, [layoutMode, channels, signalData, localViewport]);

  const getVisibleData = () => {
    if (!signalData?.data) return [];
    const startIdx = Math.floor(timeOffset * sampleRate);
    const endIdx = Math.floor((timeOffset + localViewport) * sampleRate);

    return signalData.data
      .map((ch, chi) => {
        if (channelVisibility.length && !channelVisibility[chi]) return null;
        const slice = ch.slice(startIdx, endIdx);
        const xySlice =
          Array.isArray(slice[0]) && slice[0].length === 2
            ? slice
            : slice.map((y, i) => [(startIdx + i) / sampleRate, y]);
        const color = getChannelColor(chi, channelProps);
        const lineWidth = channelProps[chi]?.lineWidth ?? 2;
        return {
          data: xySlice,
          type: "line",
          smooth: true,
          symbol: "none",
          lineStyle: { color, width: lineWidth },
          name: getEcgChannelLabel(signalData, chi),
        };
      })
      .filter(Boolean);
  };

  const handleZoomIn = () => setLocalViewport((v) => Math.max(0.25, v * 0.7));
  const handleZoomOut = () => setLocalViewport((v) => Math.min(totalDuration, v * 1.4));
  const panStep = localViewport * 0.25;
  const handlePanLeft = () => setTimeOffset((t) => Math.max(0, t - panStep));
  const handlePanRight = () => setTimeOffset((t) => Math.min(Math.max(0, totalDuration - localViewport), t + panStep));

  const axisStyle = axisTheme();
  const stackedOption = {
    animation: false,
    backgroundColor: 'transparent',
    textStyle: chartTextStyle(),
    legend: {
      bottom: 0,
      textStyle: chartTextStyle(),
    },
    grid: { left: 130, right: '8%', top: '10%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'value',
      min: timeOffset,
      max: timeOffset + localViewport,
      name: 'Time (s)',
      splitLine: { show: false },
      axisLabel: { margin: 40, interval: 'auto', ...axisStyle.axisLabel },
      nameTextStyle: axisStyle.nameTextStyle,
    },
    yAxis: {
      type: 'value',
      scale: true,
      splitLine: { show: false },
      splitNumber: 5,
      axisLabel: { margin: 40, interval: 'auto', ...axisStyle.axisLabel },
      nameTextStyle: axisStyle.nameTextStyle,
    },
    series: getVisibleData().map((s) => ({ ...s, yAxisIndex: 0, xAxisIndex: 0 })),
  };

  return (
    <Card className="custom-card">
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h6 className="mb-0">Continuous Time Viewer</h6>
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <ButtonGroup size="sm">
              <Button variant="outline-primary" onClick={() => onPlayPause?.(!isPlaying)}>
                {isPlaying ? 'Stop' : 'Play'}
              </Button>
              <Button variant="outline-secondary" onClick={() => setTimeOffset(0)}>Reset</Button>
            </ButtonGroup>
            <ButtonGroup size="sm">
              <Button variant="outline-secondary" onClick={handleZoomIn} title="Zoom in">+</Button>
              <Button variant="outline-secondary" onClick={handleZoomOut} title="Zoom out">−</Button>
            </ButtonGroup>
            <ButtonGroup size="sm">
              <Button variant="outline-secondary" onClick={handlePanLeft} title="Pan left">←</Button>
              <Button variant="outline-secondary" onClick={handlePanRight} title="Pan right">→</Button>
            </ButtonGroup>
            <Form.Range
              min={0.25}
              max={Math.min(30, totalDuration || 10)}
              step={0.25}
              value={localViewport}
              onChange={(e) => setLocalViewport(parseFloat(e.target.value))}
            />
            <small className="text-muted">{localViewport.toFixed(1)}s</small>
          </div>
        </div>
      </Card.Header>
      <Card.Body>
        {layoutMode === 'grid' ? (
          <div
            className="overflow-auto"
            style={{ maxHeight: 600 }}
          >
            {visibleIndices.map((chIdx) => (
              <div key={chIdx} className="mb-3">
                <div className="small fw-semibold mb-1 d-flex align-items-center gap-2">
                  <span
                    className="rounded"
                    style={{
                      width: 12,
                      height: 12,
                      backgroundColor: getChannelColor(chIdx, channelProps),
                      flexShrink: 0,
                    }}
                    title="Channel color"
                  />
                  <span className="text-muted">{getEcgChannelLabel(signalData, chIdx)}</span>
                </div>
                <SingleChannelPlot
                  signalData={signalData}
                  channelIndex={chIdx}
                  timeOffset={timeOffset}
                  localViewport={localViewport}
                  channelProps={channelProps}
                />
              </div>
            ))}
          </div>
        ) : (
          <ReactECharts
            ref={chartRef}
            option={stackedOption}
            notMerge={true}
            lazyUpdate={false}
            style={{ height: 300 }}
          />
        )}
      </Card.Body>
    </Card>
  );
}
