import React from 'react';
import { Scale, Calculator, Box, Activity } from 'lucide-react';

export default function LeverRuleCard({ carbon, temperature, leverResult }) {
  if (!leverResult) {
    return (
      <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Calculating equilibrium state...
      </div>
    );
  }

  const {
    region_name,
    crystal_structure,
    phase_fractions = {},
    microconstituents = {},
    tie_line = {},
  } = leverResult;

  const isSinglePhase = tie_line.is_single_phase;
  const cL = tie_line.left_composition ?? 0;
  const cR = tie_line.right_composition ?? 6.67;
  const c0 = carbon;

  // Calculate percentage positions for visual balance beam
  const fulcrumPercent = cR > cL ? Math.max(5, Math.min(95, ((c0 - cL) / (cR - cL)) * 100)) : 50;

  // Color mapping helper
  const getPhaseColor = (name) => {
    if (name.includes('Ferrite') || name.includes('α')) return 'var(--phase-ferrite)';
    if (name.includes('Austenite') || name.includes('γ')) return 'var(--phase-austenite)';
    if (name.includes('Cementite') || name.includes('Fe₃C')) return 'var(--phase-cementite)';
    if (name.includes('Pearlite')) return 'var(--phase-pearlite)';
    if (name.includes('Martensite')) return 'var(--phase-martensite)';
    if (name.includes('Liquid')) return 'var(--phase-liquid)';
    return '#94a3b8';
  };

  return (
    <div className="glass-panel">
      <div className="glass-panel-header">
        <div className="panel-title">
          <Scale size={18} color="var(--heat-amber)" />
          Lever Rule & Equilibrium Solver
        </div>
      </div>

      <div className="lever-card-content">
        {/* Phase State & Crystal Lattice */}
        <div className="phase-state-badge">
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>
              Equilibrium State
            </div>
            <div className="phase-state-title">{region_name}</div>
          </div>
          <div className="crystal-structure-tag">
            <Box size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            {crystal_structure.split(' ')[0]}
          </div>
        </div>

        {/* Visual Balance Beam Diagram */}
        {!isSinglePhase ? (
          <div className="balance-beam-container">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: '100%', textAlign: 'left', paddingLeft: 8 }}>
              Tie-Line Balance Scale (T = {Math.round(temperature)}°C)
            </div>

            <div className="balance-beam-track">
              {/* Left End Weight */}
              <div
                className="balance-weight left"
                style={{ left: '0%' }}
                title={`${tie_line.left_phase}: ${tie_line.w_left}%`}
              />
              {/* Fulcrum (Current Alloy Composition C0) */}
              <div
                className="balance-fulcrum"
                style={{ left: `${fulcrumPercent}%` }}
                title={`Alloy Composition C₀ = ${c0.toFixed(2)} wt% C`}
              />
              {/* Right End Weight */}
              <div
                className="balance-weight right"
                style={{ left: '100%' }}
                title={`${tie_line.right_phase}: ${tie_line.w_right}%`}
              />
            </div>

            <div className="balance-labels">
              <div>
                <span style={{ color: 'var(--phase-ferrite)' }}>{tie_line.left_phase?.split(' ')[0]}</span> ({cL.toFixed(2)}% C)
                <div className="balance-label-val" style={{ color: 'var(--phase-ferrite)' }}>
                  {tie_line.w_left}%
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ color: '#f59e0b' }}>Fulcrum C₀</span>
                <div className="balance-label-val" style={{ color: '#fff' }}>
                  {c0.toFixed(2)}% C
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: 'var(--phase-cementite)' }}>{tie_line.right_phase?.split(' ')[0]}</span> ({cR.toFixed(2)}% C)
                <div className="balance-label-val" style={{ color: 'var(--phase-cementite)' }}>
                  {tie_line.w_right}%
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '0.85rem', background: 'rgba(0,0,0,0.2)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Single-phase field: Alloy is homogeneous <strong style={{ color: '#fff' }}>{tie_line.phase}</strong> with 100% phase fraction at {c0.toFixed(2)} wt% C.
          </div>
        )}

        {/* Step-by-Step Mathematical Formula Display */}
        {!isSinglePhase && cR > cL && (
          <div className="formula-box">
            <div style={{ color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calculator size={12} /> Algebraic Lever Rule Substitution:
            </div>
            <div>
              W<sub>left</sub> = (C<sub>R</sub> - C<sub>0</sub>) / (C<sub>R</sub> - C<sub>L</sub>) × 100%
            </div>
            <div style={{ marginTop: 2 }}>
              = ({cR.toFixed(2)} - {c0.toFixed(2)}) / ({cR.toFixed(2)} - {cL.toFixed(2)}) × 100% ={' '}
              <strong className="formula-highlight">{tie_line.w_left}% {tie_line.left_phase?.split(' ')[0]}</strong>
            </div>
          </div>
        )}

        {/* Microconstituents Progress Bars */}
        <div className="fractions-group">
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
            Microconstituent Breakdown
          </div>
          {Object.entries(microconstituents).map(([name, pct]) => (
            <div key={`mc-${name}`} className="fraction-bar-item">
              <div className="fraction-bar-header">
                <span>{name}</span>
                <span className="fraction-bar-val">{pct.toFixed(1)}%</span>
              </div>
              <div className="fraction-progress-track">
                <div
                  className="fraction-progress-fill"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: getPhaseColor(name),
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Fundamental Equilibrium Phases */}
        <div className="fractions-group" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
            Fundamental Equilibrium Phases
          </div>
          {Object.entries(phase_fractions).map(([name, pct]) => (
            <div key={`pf-${name}`} className="fraction-bar-item">
              <div className="fraction-bar-header">
                <span>{name}</span>
                <span className="fraction-bar-val">{pct.toFixed(1)}%</span>
              </div>
              <div className="fraction-progress-track">
                <div
                  className="fraction-progress-fill"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: getPhaseColor(name),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
