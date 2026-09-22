import React, { useState, useRef, useMemo } from 'react';
import { Crosshair, ZoomIn, Lock, Unlock, Compass, Maximize2 } from 'lucide-react';

export default function PhaseDiagramSVG({
  boundariesData,
  carbon,
  temperature,
  onCoordinateChange,
  leverResult,
  viewportMode,
  onViewportModeChange,
  isLocked,
  onToggleLock,
}) {
  const svgRef = useRef(null);
  const [hoverCoord, setHoverCoord] = useState(null);
  const [hoveredInvariant, setHoveredInvariant] = useState(null);

  // Dimensions of SVG canvas
  const svgWidth = 920;
  const svgHeight = 540;
  const margin = { top: 35, right: 40, bottom: 50, left: 65 };
  const plotWidth = svgWidth - margin.left - margin.right;
  const plotHeight = svgHeight - margin.top - margin.bottom;

  // Viewport bounds
  const isSteelFocus = viewportMode === 'steel_focus';
  const cMin = 0.0;
  const cMax = isSteelFocus ? 2.14 : 6.67;
  const tMin = isSteelFocus ? 400.0 : 0.0;
  const tMax = isSteelFocus ? 1100.0 : 1600.0;

  // Coordinate conversion functions
  const toSvgX = (c) => margin.left + ((c - cMin) / (cMax - cMin)) * plotWidth;
  const toSvgY = (t) => margin.top + ((tMax - t) / (tMax - tMin)) * plotHeight;
  const fromSvgX = (x) => cMin + ((x - margin.left) / plotWidth) * (cMax - cMin);
  const fromSvgY = (y) => tMax - ((y - margin.top) / plotHeight) * (tMax - tMin);

  // Mouse event handlers for interactive hover & pinning
  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Convert to SVG viewBox scale
    const scaleX = svgWidth / rect.width;
    const scaleY = svgHeight / rect.height;
    const svgX = clientX * scaleX;
    const svgY = clientY * scaleY;

    if (
      svgX >= margin.left &&
      svgX <= margin.left + plotWidth &&
      svgY >= margin.top &&
      svgY <= margin.top + plotHeight
    ) {
      const c = Math.max(cMin, Math.min(cMax, fromSvgX(svgX)));
      const t = Math.max(tMin, Math.min(tMax, fromSvgY(svgY)));
      setHoverCoord({ c, t });

      if (!isLocked) {
        onCoordinateChange(c, t);
      }
    } else {
      setHoverCoord(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverCoord(null);
  };

  const handleClick = (e) => {
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
      const c = Math.max(cMin, Math.min(cMax, fromSvgX(svgX)));
      const t = Math.max(tMin, Math.min(tMax, fromSvgY(svgY)));
      onCoordinateChange(c, t);
      onToggleLock(!isLocked);
    }
  };

  // Generate grid ticks
  const cTicks = useMemo(() => {
    if (isSteelFocus) {
      return [0.0, 0.2, 0.4, 0.6, 0.76, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.14];
    }
    return [0.0, 0.76, 1.0, 2.0, 2.14, 3.0, 4.0, 4.3, 5.0, 6.0, 6.67];
  }, [isSteelFocus]);

  const tTicks = useMemo(() => {
    if (isSteelFocus) {
      return [400, 500, 600, 700, 727, 800, 900, 912, 1000, 1100];
    }
    return [0, 200, 400, 600, 727, 800, 912, 1000, 1147, 1200, 1400, 1495, 1538, 1600];
  }, [isSteelFocus]);

  // SVG Active Point
  const activeX = toSvgX(carbon);
  const activeY = toSvgY(temperature);

  // Invariant points list
  const invariants = boundariesData?.invariants || {
    G: { C: 0.0, T: 912.0, name: 'G: Pure γ→α Transition (912°C)' },
    P: { C: 0.022, T: 727.0, name: 'P: Max C in Ferrite (0.022% C, 727°C)' },
    S: { C: 0.76, T: 727.0, name: 'S: Eutectoid Point (0.76% C, 727°C - Pearlite)' },
    E: { C: 2.14, T: 1147.0, name: 'E: Max C in Austenite (2.14% C, 1147°C)' },
    C: { C: 4.30, T: 1147.0, name: 'C: Eutectic Point (4.30% C, 1147°C - Ledeburite)' },
    A: { C: 0.0, T: 1538.0, name: 'A: Pure Fe Melting Point (1538°C)' },
    J: { C: 0.17, T: 1495.0, name: 'J: Peritectic Point (1495°C)' },
  };

  // Convert polyline points array to SVG path 'd' string
  const makePathD = (points) => {
    if (!points || points.length === 0) return '';
    const visiblePoints = points.filter((p) => p.c >= cMin && p.c <= cMax && p.t >= tMin && p.t <= tMax);
    if (visiblePoints.length === 0) return '';
    return visiblePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(p.c).toFixed(1)} ${toSvgY(p.t).toFixed(1)}`).join(' ');
  };

  // Tie-Line calculation display
  const tieLine = leverResult?.tie_line;
  const hasTieLine = tieLine && !tieLine.is_single_phase && tieLine.left_composition !== undefined;

  return (
    <div className="glass-panel diagram-panel">
      {/* Viewport Toolbar */}
      <div className="diagram-viewport-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="panel-title">
            <Compass size={18} color="var(--heat-orange)" />
            Fe-Fe₃C Phase Diagram Explorer
          </div>
          {isLocked && (
            <div className="hud-lock-badge">
              <Lock size={12} /> Point Pinned ({carbon.toFixed(2)}% C, {Math.round(temperature)}°C)
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="viewport-toggle">
            <button
              className={`viewport-btn ${isSteelFocus ? 'active' : ''}`}
              onClick={() => onViewportModeChange('steel_focus')}
            >
              Steel Focus (0–2.14% C)
            </button>
            <button
              className={`viewport-btn ${!isSteelFocus ? 'active' : ''}`}
              onClick={() => onViewportModeChange('full_range')}
            >
              Full Fe-C (0–6.67% C)
            </button>
          </div>

          <button
            className={`steel-pill ${isLocked ? 'active' : ''}`}
            onClick={() => onToggleLock(!isLocked)}
            title={isLocked ? 'Unlock tracking' : 'Lock point at current position'}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.35rem 0.65rem' }}
          >
            {isLocked ? <Lock size={13} /> : <Unlock size={13} />}
            {isLocked ? 'Pinned' : 'Pin Point'}
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="diagram-svg-container" onClick={handleClick} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="diagram-svg"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="austeniteGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.12" />
            </linearGradient>
            <linearGradient id="ferriteGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="pearliteGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="cementiteGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#e11d48" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="liquidGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ea580c" stopOpacity="0.1" />
            </linearGradient>

            {/* Filter for glow */}
            <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid Lines */}
          <g className="svg-grid">
            {cTicks.map((c) => (
              <line
                key={`grid-c-${c}`}
                x1={toSvgX(c)}
                y1={toSvgY(tMin)}
                x2={toSvgX(c)}
                y2={toSvgY(tMax)}
                className="svg-grid-line"
              />
            ))}
            {tTicks.map((t) => (
              <line
                key={`grid-t-${t}`}
                x1={toSvgX(cMin)}
                y1={toSvgY(t)}
                x2={toSvgX(cMax)}
                y2={toSvgY(t)}
                className="svg-grid-line"
              />
            ))}
          </g>

          {/* Shaded Phase Regions */}
          <g className="svg-regions">
            {/* 1. Ferrite + Pearlite (< 727°C, < 0.76% C) */}
            {tMin <= 727 && (
              <path
                d={`M ${toSvgX(0.0)} ${toSvgY(tMin)}
                    L ${toSvgX(0.0)} ${toSvgY(Math.min(727, tMax))}
                    L ${toSvgX(Math.min(0.76, cMax))} ${toSvgY(Math.min(727, tMax))}
                    L ${toSvgX(Math.min(0.76, cMax))} ${toSvgY(tMin)} Z`}
                fill="url(#pearliteGrad)"
                className="svg-region-path"
              />
            )}

            {/* 2. Pearlite + Proeutectoid Cementite (< 727°C, 0.76 to 2.14 or 6.67% C) */}
            {tMin <= 727 && cMax > 0.76 && (
              <path
                d={`M ${toSvgX(0.76)} ${toSvgY(tMin)}
                    L ${toSvgX(0.76)} ${toSvgY(Math.min(727, tMax))}
                    L ${toSvgX(Math.min(6.67, cMax))} ${toSvgY(Math.min(727, tMax))}
                    L ${toSvgX(Math.min(6.67, cMax))} ${toSvgY(tMin)} Z`}
                fill="url(#cementiteGrad)"
                className="svg-region-path"
              />
            )}

            {/* 3. Intercritical Dual Phase (Ferrite + Austenite) (727°C to 912°C, 0 to 0.76% C) */}
            {tMax >= 727 && (
              <path
                d={`M ${toSvgX(0.0)} ${toSvgY(727)}
                    L ${toSvgX(0.0)} ${toSvgY(912)}
                    ${(boundariesData?.curves?.a3_curve || []).map((p) => `L ${toSvgX(p.c)} ${toSvgY(p.t)}`).join(' ')}
                    L ${toSvgX(0.76)} ${toSvgY(727)}
                    L ${toSvgX(0.022)} ${toSvgY(727)} Z`}
                fill="url(#ferriteGrad)"
                className="svg-region-path"
              />
            )}

            {/* 4. Austenite (γ) Single Phase Region */}
            {tMax >= 727 && (
              <path
                d={`M ${toSvgX(0.0)} ${toSvgY(912)}
                    L ${toSvgX(0.0)} ${toSvgY(Math.min(1394, tMax))}
                    ${(boundariesData?.curves?.solvus_nj || []).map((p) => `L ${toSvgX(p.c)} ${toSvgY(p.t)}`).join(' ')}
                    ${(boundariesData?.curves?.solidus_je || []).map((p) => `L ${toSvgX(p.c)} ${toSvgY(p.t)}`).join(' ')}
                    ${(boundariesData?.curves?.acm_curve || []).slice().reverse().map((p) => `L ${toSvgX(p.c)} ${toSvgY(p.t)}`).join(' ')}
                    ${(boundariesData?.curves?.a3_curve || []).slice().reverse().map((p) => `L ${toSvgX(p.c)} ${toSvgY(p.t)}`).join(' ')}
                    Z`}
                fill="url(#austeniteGrad)"
                className="svg-region-path"
              />
            )}

            {/* 5. Austenite + Cementite (727°C to 1147°C, 0.76 to 2.14% C) */}
            {tMax >= 727 && cMax > 0.76 && (
              <path
                d={`M ${toSvgX(0.76)} ${toSvgY(727)}
                    ${(boundariesData?.curves?.acm_curve || []).map((p) => `L ${toSvgX(p.c)} ${toSvgY(p.t)}`).join(' ')}
                    L ${toSvgX(Math.min(6.67, cMax))} ${toSvgY(1147)}
                    L ${toSvgX(Math.min(6.67, cMax))} ${toSvgY(727)} Z`}
                fill="rgba(244, 63, 94, 0.12)"
                className="svg-region-path"
              />
            )}

            {/* 6. Liquid Region (if full range) */}
            {!isSteelFocus && (
              <path
                d={`M ${toSvgX(0.0)} ${toSvgY(1538)}
                    ${(boundariesData?.curves?.liquidus || []).map((p) => `L ${toSvgX(p.c)} ${toSvgY(p.t)}`).join(' ')}
                    L ${toSvgX(6.67)} ${toSvgY(tMax)}
                    L ${toSvgX(0.0)} ${toSvgY(tMax)} Z`}
                fill="url(#liquidGrad)"
                className="svg-region-path"
              />
            )}
          </g>

          {/* Region Text Labels */}
          <g className="svg-labels" style={{ pointerEvents: 'none', userSelect: 'none' }}>
            {/* Austenite Label */}
            {tMax >= 900 && (
              <text
                x={toSvgX(isSteelFocus ? 0.6 : 0.8)}
                y={toSvgY(isSteelFocus ? 920 : 980)}
                fill="#c084fc"
                fontSize="13"
                fontWeight="700"
                textAnchor="middle"
                opacity="0.85"
              >
                Austenite (γ)
              </text>
            )}

            {/* Ferrite + Pearlite */}
            {tMin <= 700 && (
              <text
                x={toSvgX(0.38)}
                y={toSvgY(isSteelFocus ? 580 : 450)}
                fill="#34d399"
                fontSize="12"
                fontWeight="600"
                textAnchor="middle"
                opacity="0.85"
              >
                α-Ferrite + Pearlite
              </text>
            )}

            {/* Pearlite + Cementite */}
            {tMin <= 700 && cMax >= 1.4 && (
              <text
                x={toSvgX(isSteelFocus ? 1.45 : 1.45)}
                y={toSvgY(isSteelFocus ? 580 : 450)}
                fill="#fb7185"
                fontSize="12"
                fontWeight="600"
                textAnchor="middle"
                opacity="0.85"
              >
                Pearlite + Fe₃C
              </text>
            )}

            {/* Dual Phase α + γ */}
            {isSteelFocus && (
              <text
                x={toSvgX(0.25)}
                y={toSvgY(790)}
                fill="#38bdf8"
                fontSize="11"
                fontWeight="600"
                textAnchor="middle"
                opacity="0.85"
              >
                α + γ
              </text>
            )}

            {/* Austenite + Cementite */}
            {cMax >= 1.4 && tMax >= 850 && (
              <text
                x={toSvgX(1.45)}
                y={toSvgY(880)}
                fill="#f43f5e"
                fontSize="11"
                fontWeight="600"
                textAnchor="middle"
                opacity="0.75"
              >
                γ + Fe₃C
              </text>
            )}

            {/* Liquid Phase */}
            {!isSteelFocus && (
              <text
                x={toSvgX(2.5)}
                y={toSvgY(1520)}
                fill="#fb923c"
                fontSize="14"
                fontWeight="700"
                textAnchor="middle"
              >
                Liquid (L)
              </text>
            )}
          </g>

          {/* Key Boundary Lines & Curves */}
          <g className="svg-boundaries">
            {/* A1 Line (727°C Eutectoid) */}
            {tMin <= 727 && tMax >= 727 && (
              <g>
                <line
                  x1={toSvgX(0.022)}
                  y1={toSvgY(727)}
                  x2={toSvgX(Math.min(6.67, cMax))}
                  y2={toSvgY(727)}
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray={isSteelFocus ? "none" : "4 2"}
                />
                <text
                  x={toSvgX(cMax) - 6}
                  y={toSvgY(727) - 6}
                  fill="#ef4444"
                  fontSize="11"
                  fontWeight="700"
                  textAnchor="end"
                >
                  A₁ = 727°C
                </text>
              </g>
            )}

            {/* A3 Curve (GS) */}
            <path
              d={makePathD(boundariesData?.curves?.a3_curve || [
                { c: 0.0, t: 912 }, { c: 0.2, t: 845 }, { c: 0.45, t: 780 }, { c: 0.76, t: 727 }
              ])}
              stroke="#38bdf8"
              strokeWidth="2.5"
              className="svg-boundary-curve"
            />
            {isSteelFocus && (
              <text x={toSvgX(0.35)} y={toSvgY(815)} fill="#38bdf8" fontSize="11" fontWeight="700">
                A₃
              </text>
            )}

            {/* Acm Curve (SE) */}
            <path
              d={makePathD(boundariesData?.curves?.acm_curve || [
                { c: 0.76, t: 727 }, { c: 1.2, t: 880 }, { c: 1.6, t: 1010 }, { c: 2.14, t: 1147 }
              ])}
              stroke="#f43f5e"
              strokeWidth="2.5"
              className="svg-boundary-curve"
            />
            {isSteelFocus && (
              <text x={toSvgX(1.25)} y={toSvgY(915)} fill="#f43f5e" fontSize="11" fontWeight="700">
                A_cm
              </text>
            )}

            {/* Eutectic Line (1147°C) */}
            {tMax >= 1147 && cMax >= 2.14 && (
              <g>
                <line
                  x1={toSvgX(2.14)}
                  y1={toSvgY(1147)}
                  x2={toSvgX(Math.min(6.67, cMax))}
                  y2={toSvgY(1147)}
                  stroke="#fb923c"
                  strokeWidth="2"
                  strokeDasharray="5 3"
                />
                <text
                  x={toSvgX(cMax) - 6}
                  y={toSvgY(1147) - 6}
                  fill="#fb923c"
                  fontSize="11"
                  fontWeight="700"
                  textAnchor="end"
                >
                  Eutectic: 1147°C
                </text>
              </g>
            )}

            {/* Liquidus Curve */}
            {!isSteelFocus && (
              <path
                d={makePathD(boundariesData?.curves?.liquidus || [])}
                stroke="#f97316"
                strokeWidth="2.5"
                className="svg-boundary-curve"
              />
            )}
          </g>

          {/* Selected Steel Vertical Guide Line */}
          <g className="svg-steel-line">
            <line
              x1={toSvgX(carbon)}
              y1={toSvgY(tMin)}
              x2={toSvgX(carbon)}
              y2={toSvgY(tMax)}
              stroke="rgba(249, 115, 22, 0.4)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          </g>

          {/* Dynamic Tie-Line Overlay */}
          {hasTieLine && (
            <g className="svg-tieline-group">
              {/* Tie-line bar */}
              <line
                x1={toSvgX(Math.max(cMin, tieLine.left_composition))}
                y1={activeY}
                x2={toSvgX(Math.min(cMax, tieLine.right_composition))}
                y2={activeY}
                className="svg-tieline-bar"
              />

              {/* Left endpoint */}
              {tieLine.left_composition >= cMin && tieLine.left_composition <= cMax && (
                <g>
                  <circle
                    cx={toSvgX(tieLine.left_composition)}
                    cy={activeY}
                    r="5"
                    className="svg-tieline-endpoint"
                  />
                  <text
                    x={toSvgX(tieLine.left_composition)}
                    y={activeY - 10}
                    fill="#38bdf8"
                    fontSize="10"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {tieLine.w_left}% {tieLine.left_phase?.split(' ')[0]}
                  </text>
                </g>
              )}

              {/* Right endpoint */}
              {tieLine.right_composition >= cMin && tieLine.right_composition <= cMax && (
                <g>
                  <circle
                    cx={toSvgX(tieLine.right_composition)}
                    cy={activeY}
                    r="5"
                    className="svg-tieline-endpoint"
                  />
                  <text
                    x={toSvgX(tieLine.right_composition)}
                    y={activeY - 10}
                    fill="#f43f5e"
                    fontSize="10"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {tieLine.w_right}% {tieLine.right_phase?.split(' ')[0]}
                  </text>
                </g>
              )}

              {/* Fulcrum Point */}
              <circle
                cx={activeX}
                cy={activeY}
                r="6"
                className="svg-tieline-fulcrum"
              />
            </g>
          )}

          {/* Active Coordinate Laser Crosshair */}
          <g className="svg-crosshair">
            <line
              x1={margin.left}
              y1={activeY}
              x2={margin.left + plotWidth}
              y2={activeY}
              className="svg-crosshair-line"
            />
            <line
              x1={activeX}
              y1={margin.top}
              x2={activeX}
              y2={margin.top + plotHeight}
              className="svg-crosshair-line"
            />
            <circle
              cx={activeX}
              cy={activeY}
              r="7"
              fill={isLocked ? '#ef4444' : '#f97316'}
              stroke="#ffffff"
              strokeWidth="2"
              filter="url(#laserGlow)"
            />
          </g>

          {/* Invariant Key Points Markers */}
          <g className="svg-invariants">
            {Object.entries(invariants).map(([key, pt]) => {
              if (pt.C < cMin || pt.C > cMax || pt.T < tMin || pt.T > tMax) return null;
              const px = toSvgX(pt.C);
              const py = toSvgY(pt.T);
              return (
                <g
                  key={`inv-${key}`}
                  className="svg-invariant-point"
                  onMouseEnter={() => setHoveredInvariant(pt)}
                  onMouseLeave={() => setHoveredInvariant(null)}
                >
                  <circle cx={px} cy={py} r="4.5" fill="#f59e0b" stroke="#000" strokeWidth="1.5" />
                  <text
                    x={px + 7}
                    y={py - 5}
                    fill="#fde68a"
                    fontSize="11"
                    fontWeight="700"
                  >
                    {key}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Axes and Tick Marks */}
          <g className="svg-axes">
            {/* X-Axis */}
            <line
              x1={margin.left}
              y1={margin.top + plotHeight}
              x2={margin.left + plotWidth}
              y2={margin.top + plotHeight}
              className="svg-axis-line"
            />
            {cTicks.map((c) => (
              <g key={`xtick-${c}`}>
                <line
                  x1={toSvgX(c)}
                  y1={margin.top + plotHeight}
                  x2={toSvgX(c)}
                  y2={margin.top + plotHeight + 5}
                  stroke="#94a3b8"
                />
                <text
                  x={toSvgX(c)}
                  y={margin.top + plotHeight + 18}
                  textAnchor="middle"
                  className="svg-tick-label"
                >
                  {c.toFixed(c === 0.76 || c === 2.14 || c === 0.022 ? 2 : 1)}
                </text>
              </g>
            ))}
            <text
              x={margin.left + plotWidth / 2}
              y={svgHeight - 10}
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize="12"
              fontWeight="600"
            >
              Carbon Content (wt% C)
            </text>

            {/* Y-Axis */}
            <line
              x1={margin.left}
              y1={margin.top}
              x2={margin.left}
              y2={margin.top + plotHeight}
              className="svg-axis-line"
            />
            {tTicks.map((t) => (
              <g key={`ytick-${t}`}>
                <line
                  x1={margin.left - 5}
                  y1={toSvgY(t)}
                  x2={margin.left}
                  y2={toSvgY(t)}
                  stroke="#94a3b8"
                />
                <text
                  x={margin.left - 10}
                  y={toSvgY(t) + 4}
                  textAnchor="end"
                  className="svg-tick-label"
                >
                  {t}
                </text>
              </g>
            ))}
            <text
              transform={`rotate(-90) translate(${-(margin.top + plotHeight / 2)}, 20)`}
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize="12"
              fontWeight="600"
            >
              Temperature (°C)
            </text>
          </g>
        </svg>

        {/* Live Coordinate & Region HUD */}
        <div className="diagram-hud">
          <div className="hud-item">
            <span className="hud-label">Carbon wt%</span>
            <span className="hud-val" style={{ color: 'var(--phase-ferrite)' }}>
              {carbon.toFixed(2)} %
            </span>
          </div>
          <div className="hud-item">
            <span className="hud-label">Temperature</span>
            <span className="hud-val" style={{ color: 'var(--heat-orange)' }}>
              {Math.round(temperature)} °C
            </span>
          </div>
          <div className="hud-item">
            <span className="hud-label">Active Phase Region</span>
            <span className="hud-val" style={{ color: '#fff' }}>
              {leverResult?.region_name || 'Calculating...'}
            </span>
          </div>
          {hoveredInvariant && (
            <div className="hud-item" style={{ borderLeft: '1px solid var(--border-medium)', paddingLeft: '0.75rem' }}>
              <span className="hud-label">Invariant Point</span>
              <span className="hud-val" style={{ color: '#f59e0b', fontSize: '0.75rem' }}>
                {hoveredInvariant.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
