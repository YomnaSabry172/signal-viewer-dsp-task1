"use client";
import React, { useMemo, useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import { Card, Form, Button } from "react-bootstrap";
import { getEcgChannelLabel } from "@/shared/utils/ecgLeads";
import { chartTextStyle } from "@/shared/utils/chartTheme";

const CHANNEL_COLORS = [
  "#5470c6", "#91cc75", "#fac858", "#ee6666",
  "#73c0de", "#3ba272", "#fc8452", "#9a60b4",
];

function mean(arr) {
  let s = 0;
  for (let i = 0; i < arr.length; i++) s += arr[i];
  return s / (arr.length || 1);
}

function std(arr) {
  const m = mean(arr);
  let s = 0;
  for (let i = 0; i < arr.length; i++) {
    const d = arr[i] - m;
    s += d * d;
  }
  return Math.sqrt(s / (arr.length || 1));
}

function detectRPeaks(v, fs, { maxBpm = 180, thresholdK = 0.8 } = {}) {
  if (!v || v.length < 5) return [];

  const m = mean(v);
  const x = v.map((val) => val - m);

  const s = std(x);
  const threshold = thresholdK * s;

  const minDist = Math.max(1, Math.floor(fs * (60 / maxBpm)));

  const peaks = [];
  let last = -minDist;

  for (let i = 1; i < x.length - 1; i++) {
    const isLocalMax = x[i] > x[i - 1] && x[i] >= x[i + 1];
    if (!isLocalMax) continue;
    if (x[i] < threshold) continue;
    if (i - last < minDist) continue;

    peaks.push(i);
    last = i;
  }

  return peaks;
}

function minmaxNormalize(arr, eps = 1e-12) {
  let mn = Infinity, mx = -Infinity;
  for (let i = 0; i < arr.length; i++) {
    mn = Math.min(mn, arr[i]);
    mx = Math.max(mx, arr[i]);
  }
  const den = mx - mn + eps;
  return arr.map((v) => (v - mn) / den);
}

export default function PolarViewer({
  signalData,
  viewportSeconds = 2,
  channelVisibility = [],
  channelProps = {},
  mode = "latest", 
}) {
  const [viewport, setViewport] = useState(viewportSeconds);
  const [localMode, setLocalMode] = useState(mode);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); 

  const sampleRate = signalData?.sampleRate || 360;
  const totalSamples = signalData?.data?.[0]?.length || 0;
  const totalDuration = totalSamples > 0 ? totalSamples / sampleRate : 0;
  
  const maxTime = Math.max(0, totalDuration - viewport);

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

  const polarSeries = useMemo(() => {
    if (!signalData?.data?.length) return [];

    const windowPoints = Math.max(1, Math.floor(viewport * sampleRate));
    const channels = signalData.data.length;

    const refCh = 0;
    const refData = signalData.data[refCh] || [];
    if (!refData.length) return [];

    const currentStartIndex = Math.floor(currentTime * sampleRate);
    const currentEndIndex = Math.min(refData.length, currentStartIndex + windowPoints);
    
    const sliceStart = localMode === "cumulative" ? 0 : currentStartIndex;
    const sliceEnd = currentEndIndex;

    let peaks = [];
    if (localMode !== "cumulative") {
      const refSlice = refData.slice(sliceStart, sliceEnd);
      const refV = refSlice.map((p) => p[1]);
      peaks = detectRPeaks(refV, sampleRate, { maxBpm: 180, thresholdK: 0.8 });
    }

    const results = [];

    for (let ch = 0; ch < channels; ch++) {
      if (channelVisibility.length && channelVisibility[ch] === false) continue;

      const channelData = signalData.data[ch] || [];
      const slice = channelData.slice(sliceStart, sliceEnd);
      if (!slice.length) continue;

      const tArr = slice.map((p) => p[0]);
      const vArr = slice.map((p) => p[1]);

      let polarPoints = [];
      const rNormAll = minmaxNormalize(vArr).map((r) => r * 60 + 10); 

      if (localMode === "cumulative") {
        const revolutionsPerSecond = 1.0; 
        let lastAngle = -1;

        for (let i = 0; i < tArr.length; i++) {
          const t = tArr[i];
          const angle = (t * revolutionsPerSecond * 360) % 360;
          const r = rNormAll[i];

          if (lastAngle !== -1 && angle < lastAngle - 10) {
            polarPoints.push([null, null]);
          }
          
          polarPoints.push([r, angle]);
          lastAngle = angle;
        }
      } else {
        let validBeatsDrawn = false;

        if (peaks.length >= 2) {
          const polarPts = [];
          const startBeat = localMode === "latest" ? Math.max(0, peaks.length - 2) : 0;

          for (let bi = startBeat; bi < peaks.length - 1; bi++) {
            const a = peaks[bi];
            const b = peaks[bi + 1];
            if (b <= a + 2) continue;
            if (a < 0 || b > tArr.length) continue;

            const t0 = tArr[a];
            const t1 = tArr[b];
            const rr = (t1 - t0) || 1e-12;

            const beatT = tArr.slice(a, b);

            for (let i = 0; i < beatT.length; i++) {
              const angle = 360 * ((beatT[i] - t0) / rr);
              const radius = rNormAll[a + i]; 
              
              polarPts.push([radius, angle]);
            }
            polarPts.push([null, null]);
            validBeatsDrawn = true;
          }
          if (validBeatsDrawn) polarPoints = polarPts;
        }

        // --- THE FALLBACK ---
        // If the window doesn't contain a full heartbeat yet, draw the raw signal so it isn't blank
        if (!validBeatsDrawn) {
          const revolutionsPerSecond = 1.0; 
          let lastAngle = -1;
          for (let i = 0; i < tArr.length; i++) {
            const t = tArr[i];
            const angle = (t * revolutionsPerSecond * 360) % 360;
            const r = rNormAll[i];

            if (lastAngle !== -1 && angle < lastAngle - 10) {
              polarPoints.push([null, null]);
            }
            polarPoints.push([r, angle]);
            lastAngle = angle;
          }
        }
      }

      results.push({
        id: `ch-${ch}`,
        data: polarPoints,
        type: "line",
        coordinateSystem: "polar",
        symbol: "none",
        smooth: true,
        showSymbol: false,
        lineStyle: {
          color: channelProps[ch]?.color || CHANNEL_COLORS[ch % CHANNEL_COLORS.length],
          width: channelProps[ch]?.lineWidth ?? 2,
          opacity: 0.9,
        },
        name: getEcgChannelLabel ? getEcgChannelLabel(signalData, ch) : `Ch ${ch + 1}`,
      });
    }

    return results;
  }, [signalData, viewport, channelVisibility, channelProps, localMode, currentTime, sampleRate]);

  const option = polarSeries.length
    ? {
        animation: false,
        backgroundColor: "transparent",
        textStyle: chartTextStyle(),
        legend: { textStyle: chartTextStyle() },
        polar: { center: ["50%", "50%"], radius: "85%" },
        angleAxis: {
          type: "value",
          startAngle: 0, 
          min: 0,
          max: 360, 
          axisLabel: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: true, lineStyle: { opacity: 0.15 } },
        },
        radiusAxis: {
          min: 0,
          max: 80, 
          axisLabel: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
          splitNumber: 6,
          splitLine: { show: true, lineStyle: { opacity: 0.15 } },
        },
        series: polarSeries,
        tooltip: { trigger: "axis" },
      }
    : {};

  return (
    <Card className="custom-card">
      <Card.Header>
        <div className="d-flex flex-column gap-2">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Polar Graph (r=magnitude, θ=time)</h6>

            <div className="d-flex gap-3 align-items-center">
              <Form.Select
                size="sm"
                style={{ width: 150 }}
                value={localMode}
                onChange={(e) => setLocalMode(e.target.value)}
              >
                <option value="latest">Latest (fixed time)</option>
                <option value="cumulative">Cumulative</option> 
              </Form.Select>

              <Form.Group className="d-flex align-items-center gap-2">
                <Form.Label className="mb-0 small">Time (s):</Form.Label>
                <Form.Control
                  type="number"
                  size="sm"
                  style={{ width: 80 }}
                  min={0.1} 
                  max={10}
                  step={0.1} 
                  value={viewport}
                  onChange={(e) => setViewport(parseFloat(e.target.value) || 2)}
                />
              </Form.Group>
            </div>
          </div>

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
        <ReactECharts
          key={`${localMode}-${viewport}-${channelVisibility.join("")}`}
          option={option}
          style={{ height: 350 }}
          notMerge={true}
        />
      </Card.Body>
    </Card>
  );
}