import React from 'react';
import { Gauge, Layers, Info, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function MicrostructureKineticsCard({ simulationResults, steelName }) {
  if (!simulationResults) return null;

  const {
    phase_fractions = {},
    predicted_hardness_hrc = 0,
    predicted_hardness_hv = 0,
    critical_cooling_rate_C_per_s = 0,
    actual_average_cooling_rate = 0,
    transformation_notes = [],
    metallurgical_summary = '',
  } = simulationResults;

  // Phase color mapping
  const phaseColors = {
    martensite: 'var(--phase-martensite)',
    tempered_martensite: '#d946ef',
    bainite: 'var(--phase-bainite)',
    pearlite: 'var(--phase-pearlite)',
    proeutectoid_ferrite: 'var(--phase-ferrite)',
    proeutectoid_cementite: 'var(--phase-cementite)',
    retained_austenite: 'var(--phase-austenite)',
  };

  const phaseLabels = {
    martensite: 'Untempered Martensite',
    tempered_martensite: 'Tempered Martensite',
    bainite: 'Acicular Bainite',
    pearlite: 'Lamellar Pearlite',
    proeutectoid_ferrite: 'Proeutectoid Ferrite',
    proeutectoid_cementite: 'Proeutectoid Cementite',
    retained_austenite: 'Retained Austenite',
  };

  // Filter non-zero phases
  const activePhases = Object.entries(phase_fractions)
    .filter(([_, val]) => val > 0.4)
    .sort((a, b) => b[1] - a[1]);

  // Hardness qualitative assessment
  let hardnessBadge = { text: 'Medium Strength', color: 'var(--heat-amber)' };
  if (predicted_hardness_hrc >= 58) {
    hardnessBadge = { text: 'Glass-Hard / Wear Resistant', color: 'var(--phase-martensite)' };
  } else if (predicted_hardness_hrc >= 45) {
    hardnessBadge = { text: 'High Tensile & Fatigue Strength', color: 'var(--heat-orange)' };
  } else if (predicted_hardness_hrc >= 30) {
    hardnessBadge = { text: 'Balanced Toughness & Ductility', color: 'var(--phase-pearlite)' };
  } else {
    hardnessBadge = { text: 'Soft / Ductile & Machinable', color: 'var(--phase-ferrite)' };
  }

  const isQuenchSufficient = actual_average_cooling_rate >= critical_cooling_rate_C_per_s * 0.85;

  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={18} color="var(--heat-orange)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Microstructural Phase Breakdown & Mechanical Properties
          </h3>
        </div>
        <span
          style={{
            fontSize: '0.75rem',
            padding: '3px 8px',
            borderRadius: 6,
            background: 'rgba(255, 255, 255, 0.08)',
            color: hardnessBadge.color,
            fontWeight: 600,
            border: `1px solid ${hardnessBadge.color}40`,
          }}
        >
          {hardnessBadge.text}
        </span>
      </div>

      {/* Dual Property Cards: Hardness + Cooling Rate */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {/* Hardness Stat Card */}
        <div
          style={{
            background: 'var(--bg-card-solid)',
            padding: '0.85rem 1rem',
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Predicted Room Temp Hardness
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
              {predicted_hardness_hrc.toFixed(1)}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-highlight)', fontWeight: 700 }}>HRC</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              ~{Math.round(predicted_hardness_hv)} HV
            </span>
          </div>
        </div>

        {/* Quench Severity & Critical Rate */}
        <div
          style={{
            background: 'var(--bg-card-solid)',
            padding: '0.85rem 1rem',
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Quench vs Critical Rate (v_c)
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: isQuenchSufficient ? 'var(--phase-pearlite)' : 'var(--heat-amber)',
                fontFamily: 'monospace',
              }}
            >
              {actual_average_cooling_rate}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>°C/s</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              Threshold: {critical_cooling_rate_C_per_s} °C/s
            </span>
          </div>
        </div>
      </div>

      {/* Stacked Phase Composition Bar */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Phase Fractions Volume Breakdown</span>
          <span style={{ color: 'var(--text-muted)' }}>100% Total Matrix</span>
        </div>
        <div
          style={{
            height: 20,
            borderRadius: 6,
            overflow: 'hidden',
            display: 'flex',
            border: '1px solid var(--border-subtle)',
            background: 'rgba(0,0,0,0.4)',
          }}
        >
          {activePhases.map(([phaseKey, pct]) => (
            <div
              key={phaseKey}
              style={{
                width: `${pct}%`,
                background: phaseColors[phaseKey] || '#888',
                transition: 'width 0.3s ease',
              }}
              title={`${phaseLabels[phaseKey]}: ${pct}%`}
            />
          ))}
        </div>

        {/* Phase Badges Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.75rem' }}>
          {activePhases.map(([phaseKey, pct]) => (
            <div
              key={phaseKey}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.75rem',
                background: 'rgba(255,255,255,0.04)',
                padding: '3px 8px',
                borderRadius: 4,
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: phaseColors[phaseKey] || '#888',
                }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>{phaseLabels[phaseKey]}:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{pct.toFixed(1)}%</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Metallurgical Engineering Summary & Diagnostic Notes */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderLeft: `3px solid ${isQuenchSufficient ? 'var(--phase-pearlite)' : 'var(--heat-amber)'}`,
          padding: '0.75rem 1rem',
          borderRadius: '0 6px 6px 0',
        }}
      >
        <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '0.5rem' }}>
          {metallurgical_summary}
        </p>

        {transformation_notes.map((note, i) => (
          <div
            key={i}
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.4rem',
              marginTop: '0.35rem',
            }}
          >
            <CheckCircle2 size={13} style={{ color: 'var(--phase-pearlite)', flexShrink: 0, marginTop: 2 }} />
            <span>{note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
