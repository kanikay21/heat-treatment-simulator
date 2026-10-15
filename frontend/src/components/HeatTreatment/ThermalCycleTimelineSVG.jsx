import React from 'react';
import { Clock, Flame, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function ThermalCycleTimelineSVG({ processTrajectory = [], cycleParameters }) {
  if (!processTrajectory || processTrajectory.length === 0) return null;

  const svgWidth = 780;
  const svgHeight = 190;
  const margin = { top: 25, right: 35, bottom: 35, left: 55 };
  const plotWidth = svgWidth - margin.left - margin.right;
  const plotHeight = svgHeight - margin.top - margin.bottom;

  const maxTimeMin = Math.max(120.0, processTrajectory[processTrajectory.length - 1].total_time_min * 1.1);
  const maxTempC = 1000.0;

  const toSvgX = (tMin) => margin.left + (tMin / maxTimeMin) * plotWidth;
  const toSvgY = (temp) => margin.top + ((maxTempC - temp) / maxTempC) * plotHeight;

  // Polyline string
  const pathD = processTrajectory
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(p.total_time_min).toFixed(1)} ${toSvgY(p.temp_C).toFixed(1)}`)
    .join(' ');

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={16} color="var(--phase-ferrite)" />
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Complete Thermal Process Schedule (Industrial Time-Temperature History)
          </h4>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          Total Cycle Duration: ~{Math.round(processTrajectory[processTrajectory.length - 1].total_time_min)} min
        </span>
      </div>

      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ width: '100%', height: 'auto', background: 'rgba(5, 7, 12, 0.5)', borderRadius: 8 }}
      >
        <defs>
          <linearGradient id="timelineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--heat-orange)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--heat-orange)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Temperature Guides */}
        {[200, 400, 600, 800].map((t) => (
          <g key={t}>
            <line
              x1={margin.left}
              y1={toSvgY(t)}
              x2={margin.left + plotWidth}
              y2={toSvgY(t)}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeDasharray="2 2"
            />
            <text x={margin.left - 8} y={toSvgY(t) + 3.5} fill="var(--text-muted)" fontSize="9" textAnchor="end">
              {t}°
            </text>
          </g>
        ))}

        {/* Shaded Area under Curve */}
        <path
          d={`${pathD} L ${toSvgX(processTrajectory[processTrajectory.length - 1].total_time_min)} ${toSvgY(0)} L ${toSvgX(0)} ${toSvgY(0)} Z`}
          fill="url(#timelineGrad)"
        />

        {/* Process Curve */}
        <path d={pathD} fill="none" stroke="var(--heat-orange)" strokeWidth="2.5" />

        {/* Stage Keypoints */}
        {processTrajectory.map((p, idx) => (
          <g key={idx}>
            <circle
              cx={toSvgX(p.total_time_min)}
              cy={toSvgY(p.temp_C)}
              r="3.5"
              fill="var(--heat-orange)"
              stroke="#fff"
              strokeWidth="1.2"
            />
            {idx > 0 && idx < processTrajectory.length && (
              <text
                x={toSvgX(p.total_time_min)}
                y={toSvgY(p.temp_C) - 8}
                fill="var(--text-secondary)"
                fontSize="8.5"
                fontWeight="600"
                textAnchor="middle"
              >
                {p.stage} ({Math.round(p.temp_C)}°C)
              </text>
            )}
          </g>
        ))}

        {/* X Axis Axis line */}
        <line
          x1={margin.left}
          y1={toSvgY(0)}
          x2={margin.left + plotWidth}
          y2={toSvgY(0)}
          stroke="var(--border-subtle)"
          strokeWidth="1"
        />
        <text
          x={margin.left + plotWidth / 2}
          y={svgHeight - 6}
          fill="var(--text-muted)"
          fontSize="10"
          textAnchor="middle"
        >
          Time (minutes)
        </text>
      </svg>
    </div>
  );
}
