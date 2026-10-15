import React, { useRef, useState, useMemo } from 'react';
import { Activity, Clock, Gauge, Flame, Sparkles } from 'lucide-react';

export default function TTTDiagramSVG({
  tttData,
  coolingTrajectory = [],
  steelName = 'Steel',
  cycleParameters,
}) {
  const svgRef = useRef(null);
  const [hoverData, setHoverData] = useState(null);

  // SVG Canvas dimensions
  const svgWidth = 780;
  const svgHeight = 480;
  const margin = { top: 35, right: 35, bottom: 45, left: 60 };
  const plotWidth = svgWidth - margin.left - margin.right;
  const plotHeight = svgHeight - margin.top - margin.bottom;

  // Coordinate scales:
  // Time is Log10: from 10^-1 (0.1s) to 10^5 (100,000s) -> 6 decades
  const logTMin = -1.0;
  const logTMax = 5.0;
  const tempMin = 0.0;
  const tempMax = 900.0;

  const toSvgX = (timeS) => {
    const clampedT = Math.max(0.1, Math.min(100000.0, timeS));
    const logT = Math.log10(clampedT);
    return margin.left + ((logT - logTMin) / (logTMax - logTMin)) * plotWidth;
  };

  const toSvgY = (tempC) => {
    const clampedTemp = Math.max(tempMin, Math.min(tempMax, tempC));
    return margin.top + ((tempMax - clampedTemp) / (tempMax - tempMin)) * plotHeight;
  };

  const fromSvgX = (x) => {
    const frac = (x - margin.left) / plotWidth;
    const logT = logTMin + frac * (logTMax - logTMin);
    return Math.pow(10, logT);
  };

  const fromSvgY = (y) => {
    const frac = (y - margin.top) / plotHeight;
    return tempMax - frac * (tempMax - tempMin);
  };

  // Convert points array to SVG path string
  const pointsToPathD = (points) => {
    if (!points || points.length === 0) return '';
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(p.time_s).toFixed(1)} ${toSvgY(p.temp_C).toFixed(1)}`)
      .join(' ');
  };

  // Convert cooling trajectory to SVG path string
  const coolingPathD = useMemo(() => {
    if (!coolingTrajectory || coolingTrajectory.length === 0) return '';
    return coolingTrajectory
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(p.time_s).toFixed(1)} ${toSvgY(p.temp_C).toFixed(1)}`)
      .join(' ');
  }, [coolingTrajectory]);

  // Log time grid ticks: 0.1s, 1s, 10s, 100s, 1000s (10^3), 10000s (10^4), 100000s (10^5)
  const timeDecades = [
    { val: 0.1, label: '0.1s' },
    { val: 1.0, label: '1s' },
    { val: 10.0, label: '10s' },
    { val: 60.0, label: '1 min' },
    { val: 1000.0, label: '10³s' },
    { val: 3600.0, label: '1 hr' },
    { val: 100000.0, label: '10⁵s' },
  ];

  // Temperature linear ticks
  const tempTicks = [100, 200, 300, 400, 500, 600, 700, 800, 900];

  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = svgWidth / rect.width;
    const scaleY = svgHeight / rect.height;
    const svgX = (e.clientX - rect.left) * scaleX;
    const svgY = (e.clientY - rect.top) * scaleY;

    if (
      svgX >= margin.left &&
      svgX <= margin.left + plotWidth &&
      svgY >= margin.top &&
      svgY <= margin.top + plotHeight
    ) {
      const timeS = fromSvgX(svgX);
      const tempC = fromSvgY(svgY);
      setHoverData({ timeS, tempC, svgX, svgY });
    } else {
      setHoverData(null);
    }
  };

  const markers = tttData?.markers || {};
  const curves = tttData?.curves || {};

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={18} color="var(--heat-orange)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            TTT Diagram & Cooling Overlay ({steelName})
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--phase-pearlite)' }} />
            Pearlite Bay
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--phase-bainite)' }} />
            Bainite Bay
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--phase-martensite)' }} />
            Martensite (Ms: {Math.round(markers.Ms || 320)}°C)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 14, height: 3, background: 'var(--heat-orange)', borderRadius: 1 }} />
            Cooling Curve
          </span>
        </div>
      </div>

      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: 'auto', display: 'block', background: 'rgba(5, 7, 12, 0.65)', borderRadius: 8 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverData(null)}
        >
          <defs>
            {/* Shaded zone gradients */}
            <linearGradient id="pearliteZone" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--phase-pearlite)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--phase-pearlite)" stopOpacity="0.08" />
            </linearGradient>

            <linearGradient id="bainiteZone" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--phase-bainite)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--phase-bainite)" stopOpacity="0.08" />
            </linearGradient>

            <linearGradient id="martensiteZone" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--phase-martensite)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--phase-martensite)" stopOpacity="0.06" />
            </linearGradient>

            <filter id="trajectoryGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Plot Background Area */}
          <rect
            x={margin.left}
            y={margin.top}
            width={plotWidth}
            height={plotHeight}
            fill="transparent"
            stroke="var(--border-subtle)"
            strokeWidth="1"
          />

          {/* Grid lines: Decades */}
          {timeDecades.map((dec) => {
            const x = toSvgX(dec.val);
            return (
              <g key={dec.val}>
                <line
                  x1={x}
                  y1={margin.top}
                  x2={x}
                  y2={margin.top + plotHeight}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray="3 3"
                />
                <text
                  x={x}
                  y={margin.top + plotHeight + 18}
                  fill="var(--text-muted)"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {dec.label}
                </text>
              </g>
            );
          })}

          {/* Grid lines: Temperature */}
          {tempTicks.map((t) => {
            const y = toSvgY(t);
            return (
              <g key={t}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={margin.left + plotWidth}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray="3 3"
                />
                <text
                  x={margin.left - 10}
                  y={y + 3.5}
                  fill="var(--text-muted)"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {t}°
                </text>
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={margin.left + plotWidth / 2}
            y={svgHeight - 8}
            fill="var(--text-secondary)"
            fontSize="11"
            fontWeight="600"
            textAnchor="middle"
          >
            Time (Logarithmic Scale)
          </text>

          <text
            x={16}
            y={margin.top + plotHeight / 2}
            fill="var(--text-secondary)"
            fontSize="11"
            fontWeight="600"
            textAnchor="middle"
            transform={`rotate(-90 16 ${margin.top + plotHeight / 2})`}
          >
            Temperature (°C)
          </text>

          {/* 1. Martensite Region (below Ms) */}
          {markers.Ms && (
            <rect
              x={margin.left}
              y={toSvgY(markers.Ms)}
              width={plotWidth}
              height={toSvgY(0) - toSvgY(markers.Ms)}
              fill="url(#martensiteZone)"
            />
          )}

          {/* 2. Pearlite C-Curves (Ps and Pf) */}
          {curves.pearlite_start && curves.pearlite_finish && (
            <path
              d={`${pointsToPathD(curves.pearlite_start)} ${(curves.pearlite_finish || [])
                .slice()
                .reverse()
                .map((p) => `L ${toSvgX(p.time_s)} ${toSvgY(p.temp_C)}`)
                .join(' ')} Z`}
              fill="url(#pearliteZone)"
            />
          )}

          {/* 3. Bainite C-Curves (Bs and Bf) */}
          {curves.bainite_start && curves.bainite_finish && (
            <path
              d={`${pointsToPathD(curves.bainite_start)} ${(curves.bainite_finish || [])
                .slice()
                .reverse()
                .map((p) => `L ${toSvgX(p.time_s)} ${toSvgY(p.temp_C)}`)
                .join(' ')} Z`}
              fill="url(#bainiteZone)"
            />
          )}

          {/* Pearlite Start Boundary Line */}
          {curves.pearlite_start && (
            <path
              d={pointsToPathD(curves.pearlite_start)}
              fill="none"
              stroke="var(--phase-pearlite)"
              strokeWidth="2"
            />
          )}

          {/* Pearlite Finish Boundary Line */}
          {curves.pearlite_finish && (
            <path
              d={pointsToPathD(curves.pearlite_finish)}
              fill="none"
              stroke="var(--phase-pearlite)"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
          )}

          {/* Bainite Start Boundary Line */}
          {curves.bainite_start && (
            <path
              d={pointsToPathD(curves.bainite_start)}
              fill="none"
              stroke="var(--phase-bainite)"
              strokeWidth="2"
            />
          )}

          {/* Bainite Finish Boundary Line */}
          {curves.bainite_finish && (
            <path
              d={pointsToPathD(curves.bainite_finish)}
              fill="none"
              stroke="var(--phase-bainite)"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
          )}

          {/* Transformation Region Text Annotations */}
          {markers.Ac1 && (
            <g>
              <line
                x1={margin.left}
                y1={toSvgY(markers.Ac1)}
                x2={margin.left + plotWidth}
                y2={toSvgY(markers.Ac1)}
                stroke="var(--heat-red)"
                strokeWidth="1.5"
                strokeDasharray="6 3"
              />
              <text
                x={margin.left + plotWidth - 10}
                y={toSvgY(markers.Ac1) - 5}
                fill="var(--heat-red)"
                fontSize="10"
                fontWeight="700"
                textAnchor="end"
              >
                Ac₁ ({Math.round(markers.Ac1)}°C)
              </text>
            </g>
          )}

          {markers.Ac3 && (
            <g>
              <line
                x1={margin.left}
                y1={toSvgY(markers.Ac3)}
                x2={margin.left + plotWidth}
                y2={toSvgY(markers.Ac3)}
                stroke="var(--phase-austenite)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text
                x={margin.left + plotWidth - 10}
                y={toSvgY(markers.Ac3) - 5}
                fill="var(--phase-austenite)"
                fontSize="10"
                fontWeight="700"
                textAnchor="end"
              >
                Ac₃ ({Math.round(markers.Ac3)}°C)
              </text>
            </g>
          )}

          {/* Ms Horizontal Line */}
          {markers.Ms && (
            <g>
              <line
                x1={margin.left}
                y1={toSvgY(markers.Ms)}
                x2={margin.left + plotWidth}
                y2={toSvgY(markers.Ms)}
                stroke="var(--phase-martensite)"
                strokeWidth="2"
              />
              <text
                x={margin.left + 15}
                y={toSvgY(markers.Ms) - 5}
                fill="var(--phase-martensite)"
                fontSize="11"
                fontWeight="700"
              >
                Ms = {Math.round(markers.Ms)}°C
              </text>
            </g>
          )}

          {/* Mf Horizontal Line */}
          {markers.Mf && (
            <g>
              <line
                x1={margin.left}
                y1={toSvgY(markers.Mf)}
                x2={margin.left + plotWidth}
                y2={toSvgY(markers.Mf)}
                stroke="var(--phase-martensite)"
                strokeWidth="1"
                strokeDasharray="4 2"
                opacity="0.7"
              />
              <text
                x={margin.left + 15}
                y={toSvgY(markers.Mf) - 4}
                fill="var(--phase-martensite)"
                fontSize="9"
                opacity="0.8"
              >
                Mf ≈ {Math.round(markers.Mf)}°C (95% Martensite)
              </text>
            </g>
          )}

          {/* Labels for C-curves */}
          <text
            x={toSvgX(markers.pearlite_nose_time_s ? markers.pearlite_nose_time_s * 2.5 : 5.0)}
            y={toSvgY(markers.pearlite_nose_temp || 580)}
            fill="var(--phase-pearlite)"
            fontSize="12"
            fontWeight="700"
          >
            Pearlite (P)
          </text>

          <text
            x={toSvgX(markers.pearlite_nose_time_s ? markers.pearlite_nose_time_s * 4.0 : 8.0)}
            y={toSvgY(460)}
            fill="var(--phase-bainite)"
            fontSize="12"
            fontWeight="700"
          >
            Bainite (B)
          </text>

          <text
            x={margin.left + plotWidth / 2}
            y={toSvgY(markers.Ms ? markers.Ms / 2 : 150)}
            fill="var(--phase-martensite)"
            fontSize="13"
            fontWeight="700"
            textAnchor="middle"
            opacity="0.8"
          >
            Martensite (M) Transformation Zone
          </text>

          {/* 4. Superimposed Quench Cooling Trajectory Curve */}
          {coolingPathD && (
            <g>
              <path
                d={coolingPathD}
                fill="none"
                stroke="var(--heat-orange)"
                strokeWidth="3.5"
                filter="url(#trajectoryGlow)"
              />
              <path
                d={coolingPathD}
                fill="none"
                stroke="#fff"
                strokeWidth="1.2"
                strokeDasharray="6 3"
              />
            </g>
          )}

          {/* Hover Crosshair & Tooltip */}
          {hoverData && (
            <g pointerEvents="none">
              <line
                x1={hoverData.svgX}
                y1={margin.top}
                x2={hoverData.svgX}
                y2={margin.top + plotHeight}
                stroke="rgba(255, 255, 255, 0.4)"
                strokeDasharray="2 2"
              />
              <line
                x1={margin.left}
                y1={hoverData.svgY}
                x2={margin.left + plotWidth}
                y2={hoverData.svgY}
                stroke="rgba(255, 255, 255, 0.4)"
                strokeDasharray="2 2"
              />
              <circle
                cx={hoverData.svgX}
                cy={hoverData.svgY}
                r="4.5"
                fill="var(--heat-orange)"
                stroke="#fff"
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Floating HUD Tooltip */}
      {hoverData && (
        <div
          style={{
            position: 'absolute',
            bottom: 25,
            right: 25,
            background: 'var(--bg-card-solid)',
            border: '1px solid var(--border-medium)',
            padding: '0.5rem 0.85rem',
            borderRadius: 6,
            fontSize: '0.8rem',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            gap: '1rem',
          }}
        >
          <span>
            <Clock size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom', color: 'var(--text-muted)' }} />
            Time: <strong>{hoverData.timeS < 60 ? `${hoverData.timeS.toFixed(1)}s` : `${(hoverData.timeS / 60).toFixed(1)} min`}</strong>
          </span>
          <span>
            <Flame size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom', color: 'var(--heat-orange)' }} />
            Temp: <strong>{Math.round(hoverData.tempC)}°C</strong>
          </span>
        </div>
      )}
    </div>
  );
}
