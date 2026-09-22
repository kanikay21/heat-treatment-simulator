/**
 * API client for Heat Treatment Simulator backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchSteels() {
  try {
    const res = await fetch(`${API_BASE_URL}/steels`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Failed to fetch steels from API, using fallback list:', err);
    return [
      { id: 1, name: 'AISI 1045', C: 0.45, Mn: 0.75, Si: 0.22, Cr: 0.0, Ni: 0.0, Mo: 0.0, category: 'plain-carbon' },
      { id: 2, name: 'AISI 1080', C: 0.80, Mn: 0.75, Si: 0.22, Cr: 0.0, Ni: 0.0, Mo: 0.0, category: 'plain-carbon' },
      { id: 3, name: 'AISI 4140', C: 0.40, Mn: 0.85, Si: 0.25, Cr: 0.95, Ni: 0.0, Mo: 0.20, category: 'alloy' },
    ];
  }
}

export async function fetchPhaseDiagramBoundaries() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/phase-diagram/boundaries`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Failed to fetch phase diagram boundaries from API, fallback to local generator:', err);
    return null;
  }
}

export async function calculateLeverRule(carbon_wt, temperature_C, steel_id = null) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/phase-diagram/lever-rule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carbon_wt, temperature_C, steel_id }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Lever rule calculation failed via API, using client fallback:', err);
    return fallbackLeverRule(carbon_wt, temperature_C);
  }
}

export async function fetchSteelPhaseDiagram(steelId) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/steels/${steelId}/phase-diagram`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`Failed to fetch steel ${steelId} phase diagram:`, err);
    return null;
  }
}

// Client-side fallback lever rule in case backend is offline during development
function fallbackLeverRule(carbon_wt, temperature_C) {
  const c = Math.max(0.0, Math.min(6.67, Number(carbon_wt)));
  const t = Math.max(0.0, Math.min(1600.0, Number(temperature_C)));

  let region_id = 'austenite';
  let region_name = 'Austenite (γ)';
  let crystal_structure = 'FCC (Face-Centered Cubic)';
  let phase_fractions = {};
  let microconstituents = {};
  let tie_line = { is_single_phase: true, phase: 'Austenite (γ)', composition: c };

  if (t <= 727) {
    if (c <= 0.76) {
      region_id = 'ferrite_pearlite';
      region_name = 'Ferrite (α) + Pearlite';
      crystal_structure = 'BCC + Lamellar BCC/Orthorhombic';
      const w_pro = Math.max(0, Math.min(100, ((0.76 - c) / (0.76 - 0.022)) * 100));
      const w_p = 100 - w_pro;
      const w_fe3c = (c / 6.67) * 100;
      const w_alpha = 100 - w_fe3c;
      phase_fractions = { 'Ferrite (α)': +w_alpha.toFixed(1), 'Cementite (Fe₃C)': +w_fe3c.toFixed(1) };
      microconstituents = { 'Proeutectoid Ferrite (α)': +w_pro.toFixed(1), 'Pearlite (Lamellar α + Fe₃C)': +w_p.toFixed(1) };
      tie_line = {
        is_single_phase: false,
        left_phase: 'Ferrite (α)',
        left_composition: 0.022,
        right_phase: 'Cementite (Fe₃C)',
        right_composition: 6.67,
        c0: c,
        w_left: +w_alpha.toFixed(1),
        w_right: +w_fe3c.toFixed(1),
      };
    } else {
      region_id = 'pearlite_cementite';
      region_name = 'Pearlite + Proeutectoid Cementite';
      crystal_structure = 'Lamellar + Intergranular Fe₃C';
      const w_p = Math.max(0, Math.min(100, ((6.67 - c) / (6.67 - 0.76)) * 100));
      const w_cm_pro = 100 - w_p;
      const w_fe3c = (c / 6.67) * 100;
      const w_alpha = 100 - w_fe3c;
      phase_fractions = { 'Ferrite (α)': +w_alpha.toFixed(1), 'Cementite (Fe₃C)': +w_fe3c.toFixed(1) };
      microconstituents = { 'Pearlite': +w_p.toFixed(1), 'Proeutectoid Cementite (Fe₃C)': +w_cm_pro.toFixed(1) };
      tie_line = {
        is_single_phase: false,
        left_phase: 'Ferrite (α)',
        left_composition: 0.022,
        right_phase: 'Cementite (Fe₃C)',
        right_composition: 6.67,
        c0: c,
        w_left: +w_alpha.toFixed(1),
        w_right: +w_fe3c.toFixed(1),
      };
    }
  } else if (t <= 912 && c < 0.76) {
    region_id = 'ferrite_austenite';
    region_name = 'Ferrite (α) + Austenite (γ)';
    crystal_structure = 'BCC + FCC (Intercritical Dual Phase)';
    phase_fractions = { 'Ferrite (α)': 35.0, 'Austenite (γ)': 65.0 };
    microconstituents = { 'Ferrite (α)': 35.0, 'Austenite (γ)': 65.0 };
    tie_line = {
      is_single_phase: false,
      left_phase: 'Ferrite (α)',
      left_composition: 0.022,
      right_phase: 'Austenite (γ)',
      right_composition: 0.76,
      c0: c,
      w_left: 35.0,
      w_right: 65.0,
    };
  } else {
    phase_fractions = { 'Austenite (γ)': 100.0 };
    microconstituents = { 'Austenite (γ)': 100.0 };
  }

  return {
    carbon_wt: c,
    temperature_C: t,
    region_id,
    region_name,
    crystal_structure,
    equilibrium_phases: Object.keys(phase_fractions),
    phase_fractions,
    microconstituents,
    tie_line,
    explanation: `Equilibrium state at ${c.toFixed(2)} wt% C and ${t.toFixed(0)}°C.`,
    quenched_preview: t >= 727 ? 'Acicular Martensite (BCT) + Retained Austenite' : 'Equilibrium Ferrite-Carbide Microstructure',
    microstructure_recipe: {
      primary_type: region_id,
      ferrite_fraction: (phase_fractions['Ferrite (α)'] || 0) / 100,
      pearlite_fraction: (microconstituents['Pearlite (Lamellar α + Fe₃C)'] || microconstituents['Pearlite'] || 0) / 100,
      austenite_fraction: (phase_fractions['Austenite (γ)'] || 0) / 100,
      cementite_fraction: (phase_fractions['Cementite (Fe₃C)'] || 0) / 100,
    },
    critical_temperatures: { A1: 727, A3: 840, Acm: null, Ms: 340, Mf: 120 },
  };
}
