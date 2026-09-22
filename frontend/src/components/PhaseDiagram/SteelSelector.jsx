import React from 'react';
import { Layers, Flame, Gauge, Sparkles } from 'lucide-react';

export default function SteelSelector({
  steels,
  selectedSteel,
  onSelectSteel,
  carbon,
  temperature,
  onCarbonChange,
  onTemperatureChange,
  leverResult,
  viewportMode,
  isLocked,
  onResetLock,
}) {
  const isSteelFocus = viewportMode === 'steel_focus';
  const maxCarbon = isSteelFocus ? 2.14 : 6.67;
  const maxTemp = isSteelFocus ? 1100 : 1600;
  const minTemp = isSteelFocus ? 400 : 25;

  const crit = leverResult?.critical_temperatures || {};

  return (
    <div className="glass-panel top-controls-bar">
      {/* 1. Preset Grade Buttons */}
      <div>
        <div className="control-group-title">
          <Layers size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
          Preset Steels & Alloys
        </div>
        <div className="steel-pills">
          {steels.map((steel) => {
            const isSelected = selectedSteel?.id === steel.id;
            return (
              <button
                key={steel.id}
                className={`steel-pill ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectSteel(steel)}
              >
                {steel.name}
                <span style={{ fontSize: '0.7em', opacity: 0.8, marginLeft: 4 }}>
                  ({steel.C}% C)
                </span>
              </button>
            );
          })}
          <button
            className={`steel-pill ${carbon === 0.0 ? 'active' : ''}`}
            onClick={() => onSelectSteel({ id: -1, name: 'Pure Fe (Armco)', C: 0.0, Mn: 0, Si: 0, Cr: 0, Ni: 0, Mo: 0 })}
          >
            Pure Fe
          </button>
          <button
            className={`steel-pill ${carbon === 4.3 ? 'active' : ''}`}
            onClick={() => onSelectSteel({ id: -2, name: 'Cast Iron (Eutectic)', C: 4.30, Mn: 0.5, Si: 1.5, Cr: 0, Ni: 0, Mo: 0 })}
          >
            Cast Iron (4.3%)
          </button>
        </div>
      </div>

      {/* 2. Interactive Precision Sliders */}
      <div className="sliders-container">
        {/* Carbon Slider */}
        <div className="slider-wrapper">
          <div className="slider-header">
            <span className="slider-label">Composition (Carbon Content)</span>
            <span className="slider-value carbon">{carbon.toFixed(2)} wt% C</span>
          </div>
          <input
            type="range"
            min={0.0}
            max={maxCarbon}
            step={0.01}
            value={carbon}
            onChange={(e) => onCarbonChange(parseFloat(e.target.value))}
          />
        </div>

        {/* Temperature Slider */}
        <div className="slider-wrapper">
          <div className="slider-header">
            <span className="slider-label">Temperature (Furnace / State)</span>
            <span className="slider-value temperature">{Math.round(temperature)} °C</span>
          </div>
          <input
            type="range"
            min={minTemp}
            max={maxTemp}
            step={1}
            value={temperature}
            onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
          />
        </div>
      </div>

      {/* 3. Critical Transformation Badges */}
      <div>
        <div className="control-group-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>
            <Flame size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            Critical Points
          </span>
          {isLocked && (
            <button
              onClick={onResetLock}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--heat-orange)',
                fontSize: '0.7rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Reset Pin
            </button>
          )}
        </div>
        <div className="crit-temps-row">
          <div className="crit-badge" title="Eutectoid Transformation Line">
            <span className="crit-badge-label">A₁ / A_c1</span>
            <span className="crit-badge-val">{crit.A1 ? `${Math.round(crit.A1)}°C` : '727°C'}</span>
          </div>
          <div className="crit-badge" title="Upper Critical Austenite Line">
            <span className="crit-badge-label">{carbon <= 0.76 ? 'A₃' : 'A_cm'}</span>
            <span className="crit-badge-val">
              {carbon <= 0.76 ? (crit.A3 ? `${Math.round(crit.A3)}°C` : '-') : (crit.Acm ? `${Math.round(crit.Acm)}°C` : '-')}
            </span>
          </div>
          <div className="crit-badge" title="Martensite Start Temperature">
            <span className="crit-badge-label">M_s</span>
            <span className="crit-badge-val" style={{ color: 'var(--phase-martensite)' }}>
              {crit.Ms ? `${Math.round(crit.Ms)}°C` : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
