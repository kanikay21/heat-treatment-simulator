import React from 'react';
import { Flame, Droplet, Wind, Sun, Clock, Zap, Settings2 } from 'lucide-react';

export default function HeatTreatmentControls({
  steels,
  selectedSteel,
  onSelectSteel,
  parameters,
  onChangeParameter,
  onApplyPreset,
  isSimulating,
}) {
  const presets = [
    { id: 'quench_temper', label: 'Quench & Temper', desc: 'Martensite + Carbide Tempering' },
    { id: 'austemper', label: 'Austempering', desc: 'Isothermal Bainite (High Ductility)' },
    { id: 'martemper', label: 'Martempering', desc: 'Marquenching (Low Distortion)' },
    { id: 'normalize', label: 'Normalizing (Air)', desc: 'Fine Lamellar Pearlite' },
    { id: 'anneal', label: 'Full Anneal', desc: 'Coarse Soft Pearlite' },
  ];

  const quenchMedia = [
    { id: 'water', label: 'Water (Severe)', icon: Droplet, rate: '140 °C/s' },
    { id: 'oil', label: 'Oil (Medium)', icon: Droplet, rate: '45 °C/s' },
    { id: 'polymer', label: 'Polymer', icon: Droplet, rate: '22 °C/s' },
    { id: 'air', label: 'Air Cool', icon: Wind, rate: '3 °C/s' },
    { id: 'furnace', label: 'Furnace Cool', icon: Sun, rate: '0.08 °C/s' },
  ];

  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      {/* 1. Steel Selector Bar */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Select Steel Grade
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {steels.map((steel) => {
            const isSelected = selectedSteel?.id === steel.id;
            return (
              <button
                key={steel.id}
                onClick={() => onSelectSteel(steel)}
                className={`steel-btn ${isSelected ? 'active' : ''}`}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--heat-orange)' : '1px solid var(--border-subtle)',
                  background: isSelected ? 'rgba(249, 115, 22, 0.15)' : 'var(--bg-card-solid)',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <span>{steel.name}</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.75 }}>({steel.C}% C)</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Process Presets */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Thermal Cycle Standard Presets
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onApplyPreset(preset.id)}
              style={{
                padding: '8px 10px',
                borderRadius: 6,
                background: parameters.process_type === preset.id ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-card-solid)',
                border: parameters.process_type === preset.id ? '1px solid var(--phase-ferrite)' : '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{preset.label}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{preset.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Austenitizing Temperature & Soak Time */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Austenitizing Temp</span>
            <strong style={{ color: 'var(--heat-orange)', fontFamily: 'monospace' }}>
              {parameters.austenitizing_temp_C}°C
            </strong>
          </div>
          <input
            type="range"
            min="720"
            max="1050"
            step="5"
            value={parameters.austenitizing_temp_C}
            onChange={(e) => onChangeParameter('austenitizing_temp_C', Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--heat-orange)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            <span>Ac3 threshold</span>
            <span>1050°C</span>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Soak Duration</span>
            <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>
              {parameters.soak_time_min} min
            </strong>
          </div>
          <input
            type="range"
            min="10"
            max="180"
            step="5"
            value={parameters.soak_time_min}
            onChange={(e) => onChangeParameter('soak_time_min', Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--phase-ferrite)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            <span>10 min</span>
            <span>180 min</span>
          </div>
        </div>
      </div>

      {/* 4. Quenching Medium */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Quench Medium (Cooling Severity)
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {quenchMedia.map((m) => {
            const isSelected = parameters.quench_medium === m.id;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => onChangeParameter('quench_medium', m.id)}
                style={{
                  flex: '1 1 calc(20% - 0.5rem)',
                  minWidth: 100,
                  padding: '7px 8px',
                  borderRadius: 6,
                  border: isSelected ? '1px solid var(--heat-orange)' : '1px solid var(--border-subtle)',
                  background: isSelected ? 'rgba(249, 115, 22, 0.15)' : 'var(--bg-card-solid)',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                  <Icon size={12} color={isSelected ? 'var(--heat-orange)' : 'var(--text-muted)'} />
                  {m.label}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>{m.rate}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Advanced Stages: Isothermal Hold & Tempering */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {/* Isothermal Hold Section */}
        <div
          style={{
            background: parameters.enable_isothermal_hold ? 'rgba(234, 179, 8, 0.08)' : 'var(--bg-card-solid)',
            padding: '0.75rem 0.9rem',
            borderRadius: 6,
            border: parameters.enable_isothermal_hold ? '1px solid var(--phase-bainite)' : '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={parameters.enable_isothermal_hold}
                onChange={(e) => onChangeParameter('enable_isothermal_hold', e.target.checked)}
                style={{ accentColor: 'var(--phase-bainite)' }}
              />
              Isothermal Hold (Austempering / Martempering)
            </label>
            {parameters.enable_isothermal_hold && (
              <span style={{ fontSize: '0.7rem', color: 'var(--phase-bainite)', fontWeight: 600 }}>
                {parameters.isothermal_temp_C}°C for {parameters.isothermal_time_s}s
              </span>
            )}
          </div>

          {parameters.enable_isothermal_hold && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Hold Temp: {parameters.isothermal_temp_C}°C</span>
                <input
                  type="range"
                  min="200"
                  max="550"
                  step="10"
                  value={parameters.isothermal_temp_C}
                  onChange={(e) => onChangeParameter('isothermal_temp_C', Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--phase-bainite)' }}
                />
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Hold Time: {parameters.isothermal_time_s}s</span>
                <input
                  type="range"
                  min="10"
                  max="3600"
                  step="30"
                  value={parameters.isothermal_time_s}
                  onChange={(e) => onChangeParameter('isothermal_time_s', Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--phase-bainite)' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Tempering Section */}
        <div
          style={{
            background: parameters.enable_tempering ? 'rgba(217, 70, 239, 0.08)' : 'var(--bg-card-solid)',
            padding: '0.75rem 0.9rem',
            borderRadius: 6,
            border: parameters.enable_tempering ? '1px solid #d946ef' : '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={parameters.enable_tempering}
                onChange={(e) => onChangeParameter('enable_tempering', e.target.checked)}
                style={{ accentColor: '#d946ef' }}
              />
              Tempering Stage (Carbide Precipitation & Stress Relief)
            </label>
            {parameters.enable_tempering && (
              <span style={{ fontSize: '0.7rem', color: '#d946ef', fontWeight: 600 }}>
                {parameters.tempering_temp_C}°C for {parameters.tempering_time_min} min
              </span>
            )}
          </div>

          {parameters.enable_tempering && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Temper Temp: {parameters.tempering_temp_C}°C</span>
                <input
                  type="range"
                  min="150"
                  max="650"
                  step="10"
                  value={parameters.tempering_temp_C}
                  onChange={(e) => onChangeParameter('tempering_temp_C', Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#d946ef' }}
                />
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Temper Time: {parameters.tempering_time_min} min</span>
                <input
                  type="range"
                  min="15"
                  max="180"
                  step="15"
                  value={parameters.tempering_time_min}
                  onChange={(e) => onChangeParameter('tempering_time_min', Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#d946ef' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
