"use client";
import React, { useMemo, useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, Form, Button } from 'react-bootstrap';
import { getEcgChannelLabel } from '@/shared/utils/ecgLeads';
import { chartTextStyle, axisTheme } from '@/shared/utils/chartTheme';

// Fallback colors if getChannelColor isn't working/available
const CHANNEL_COLORS = [
  "#5470c6", "#91cc75", "#fac858", "#ee6666",
  "#73c0de", "#3ba272", "#fc8452", "#9a60b4",
];

export default function XORViewer({ 
  signalData, 
  chunkSeconds = 1, 
  channelVisibility = [], 
  channelProps = {} 
}) {
  const [chunkWidth, setChunkWidth] = useState(chunkSeconds);

  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(chunkSeconds); // Start at chunkWidth so we have a "previous" chunk to subtract

  const sampleRate = signalData?.sampleRate || 360;
  const totalSamples = signalData?.data?.[0]?.length || 0;
  const totalDuration = totalSamples > 0 ? totalSamples / sampleRate : 0;
  
  const maxTime = Math.max(chunkWidth, totalDuration - chunkWidth);

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
      setCurrentTime(chunkWidth);
    }
    setIsPlaying(!isPlaying);
  };

  const xorResult = useMemo(() => {
    if (!signalData?.data) return null;
    const chunkSamples = Math.floor(chunkWidth * sampleRate);
    const channels = signalData.data.length;

    // We need the current time window, and the window immediately preceding it
    const currentIndex = Math.floor(currentTime * sampleRate);
    const previousIndex = Math.max(0, currentIndex - chunkSamples);

    const results = [];
    
    for (let ch = 0; ch < channels; ch++) {
      if (channelVisibility.length && !channelVisibility[ch]) continue;
      
      const channelData = signalData.data[ch];
      if (!channelData) continue;

      const previousChunk = channelData.slice(previousIndex, previousIndex + chunkSamples);
      const currentChunk = channelData.slice(currentIndex, currentIndex + chunkSamples);

      if (previousChunk.length === 0 || currentChunk.length === 0) continue;

      // XOR LOGIC: Current Chunk minus Previous Chunk
      // If the heartbeat is identical to the last one, it results in 0 (erased).
      const resultData = currentChunk.map((point, j) => {
        const currentVal = point[1] || 0;
        const prevVal = previousChunk[j]?.[1] || 0;
        
        // Relative time from 0 to chunkWidth for the X-axis
        const relativeTime = (j / sampleRate); 
        const xorDifference = currentVal - prevVal;

        return [relativeTime, xorDifference];
      });

      results.push({
        data: resultData,
        color: channelProps[ch]?.color || CHANNEL_COLORS[ch % CHANNEL_COLORS.length],
        name: getEcgChannelLabel ? getEcgChannelLabel(signalData, ch) : `Ch ${ch + 1}`,
      });
    }
    return results;
  }, [signalData, chunkWidth, channelVisibility, channelProps, currentTime, sampleRate]);

  const axisStyle = axisTheme();
  const option = xorResult ? {
    animation: false,
    backgroundColor: 'transparent',
    textStyle: chartTextStyle(),
    legend: { textStyle: chartTextStyle() },
    grid: { left: '10%', right: '8%', top: '10%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'value',
      name: 'Time (s)',
      min: 0,
      max: chunkWidth,
      splitLine: { show: true, lineStyle: { opacity: 0.15 } },
      axisLabel: axisStyle.axisLabel,
      nameTextStyle: axisStyle.nameTextStyle,
    },
    yAxis: {
      type: 'value',
      name: 'XOR Magnitude (Diff)',
      splitLine: { show: true, lineStyle: { opacity: 0.15 } },
      axisLabel: axisStyle.axisLabel,
      nameTextStyle: axisStyle.nameTextStyle,
    },
    series: xorResult.map((r) => ({
      data: r.data,
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: { color: r.color },
      name: r.name,
    })),
  } : {};

  return (
    <Card className="custom-card">
      <Card.Header>
        <div className="d-flex flex-column gap-2">
          {/* Top Row: Title and Main Controls */}
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h6 className="mb-0">XOR Graph (Identical successive chunks erase)</h6>
            
            <Form.Group className="d-flex align-items-center gap-2">
              <Form.Label className="mb-0 small">Chunk width (s):</Form.Label>
              <Form.Control
                type="number"
                size="sm"
                style={{ width: 80 }}
                min={0.1}
                max={5}
                step={0.1}
                value={chunkWidth}
                onChange={(e) => {
                  const newWidth = parseFloat(e.target.value) || 1;
                  setChunkWidth(newWidth);
                  if (currentTime < newWidth) setCurrentTime(newWidth);
                }}
              />
            </Form.Group>
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
              min={chunkWidth}
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
        {xorResult?.length ? (
          <ReactECharts
            option={option}
            notMerge={true}
            lazyUpdate={false}
            style={{ height: 350 }}
          />
        ) : (
          <div className="text-muted text-center py-5">No data or no channels selected</div>
        )}
      </Card.Body>
    </Card>
  );
}