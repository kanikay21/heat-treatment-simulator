import React from 'react';
import { BookOpen, X, CheckCircle2, Award } from 'lucide-react';

export default function TheoryModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="panel-title" style={{ fontSize: '1.1rem' }}>
            <BookOpen size={20} color="var(--heat-orange)" />
            Metallurgy Handbook: Fe-Fe₃C Thermodynamics & Heat Treatment
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <section>
            <h3>1. The Three Invariant Reactions</h3>
            <p>
              In the binary Iron-Carbon (Fe-Fe₃C) metastable system, three isothermal equilibrium reactions dictate all phase transformations:
            </p>
            <ul>
              <li>
                <strong>Eutectoid Reaction (727°C, 0.76 wt% C - Point S):</strong>
                <br />
                <code>γ (0.76% C) ⇄ α-Ferrite (0.022% C) + Fe₃C Cementite (6.67% C)</code>
                <br />
                Forms the lamellar microconstituent known as <strong>Pearlite</strong>.
              </li>
              <li>
                <strong>Eutectic Reaction (1147°C, 4.30 wt% C - Point C):</strong>
                <br />
                <code>Liquid (4.30% C) ⇄ γ-Austenite (2.14% C) + Fe₃C Cementite (6.67% C)</code>
                <br />
                Forms the cast iron eutectic microconstituent known as <strong>Ledeburite</strong>.
              </li>
              <li>
                <strong>Peritectic Reaction (1495°C, Point J):</strong>
                <br />
                <code>δ-Ferrite (0.09% C) + Liquid (0.53% C) ⇄ γ-Austenite (0.17% C)</code>
              </li>
            </ul>
          </section>

          <section>
            <h3>2. The Lever Rule (Inverse Lever Principle)</h3>
            <p>
              To determine the equilibrium weight fractions of two coexisting phases in a dual-phase field at temperature <em>T</em>:
            </p>
            <ol style={{ paddingLeft: '1.25rem', marginTop: '0.5rem' }}>
              <li>Construct a horizontal <strong>tie-line</strong> through alloy composition <code>C₀</code> at temperature <code>T</code>.</li>
              <li>Identify left boundary composition <code>C_L</code> and right boundary composition <code>C_R</code>.</li>
              <li>
                The weight fraction of the phase at the <strong>left</strong> boundary is given by the length of the <strong>opposite (right)</strong> arm:
                <br />
                <code>W_L = (C_R - C₀) / (C_R - C_L) × 100%</code>
              </li>
              <li>
                The weight fraction of the phase at the <strong>right</strong> boundary is:
                <br />
                <code>W_R = (C₀ - C_L) / (C_R - C_L) × 100%</code>
              </li>
            </ol>
          </section>

          <section>
            <h3>3. Classification of Steels by Carbon Content</h3>
            <ul>
              <li>
                <strong>Hypoeutectoid Steels (C &lt; 0.76%):</strong> Ferrite nucleates first above 727°C (proeutectoid ferrite), and remaining austenite transforms to pearlite at 727°C. (e.g. AISI 1045)
              </li>
              <li>
                <strong>Eutectoid Steels (C = 0.76%):</strong> 100% transforms into Pearlite colonies at 727°C. (e.g. AISI 1080)
              </li>
              <li>
                <strong>Hypereutectoid Steels (0.76% &lt; C &le; 2.14%):</strong> Proeutectoid Cementite precipitates along austenite grain boundaries above 727°C, followed by pearlite transformation at 727°C.
              </li>
            </ul>
          </section>

          <section>
            <h3>4. Quenching & Diffusionless Martensitic Transformation</h3>
            <p>
              When austenite (FCC) is cooled rapidly exceeding the critical cooling rate (quenching in water or oil), carbon atoms are trapped in the lattice without time for diffusion. The FCC lattice shears into a heavily strained <strong>Body-Centered Tetragonal (BCT) Martensite</strong> structure with maximum hardness and brittleness, starting at <code>M_s</code> and completing at <code>M_f</code>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
