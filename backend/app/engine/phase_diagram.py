"""Iron-Carbon (Fe-Fe3C) Phase Diagram and Lever Rule Calculation Engine.

Provides analytical boundary curves, phase identification, lever rule
calculations, constituent breakdowns, and empirical alloy critical temperatures.
"""

from __future__ import annotations

import math
from typing import Any


# ---------------------------------------------------------------------------
# Invariant / Key Reference Points in the Fe-Fe3C System (wt% C, Temp °C)
# ---------------------------------------------------------------------------
INVARIANT_POINTS = {
    "A": {"C": 0.000, "T": 1538.0, "name": "Pure Fe Melting Point (Delta)"},
    "N": {"C": 0.000, "T": 1394.0, "name": "Delta to Gamma Fe Transition"},
    "G": {"C": 0.000, "T": 912.0, "name": "Gamma to Alpha Fe Transition"},
    "H": {"C": 0.090, "T": 1495.0, "name": "Delta Ferrite Peritectic Limit"},
    "J": {"C": 0.170, "T": 1495.0, "name": "Peritectic Point (Gamma)"},
    "B": {"C": 0.530, "T": 1495.0, "name": "Liquid Peritectic Limit"},
    "P": {"C": 0.022, "T": 727.0, "name": "Max C in Alpha Ferrite at A1"},
    "Q": {"C": 0.008, "T": 25.0, "name": "Alpha Ferrite Solubility at Room Temp"},
    "S": {"C": 0.760, "T": 727.0, "name": "Eutectoid Point (Pearlite)"},
    "E": {"C": 2.140, "T": 1147.0, "name": "Max C in Austenite at Eutectic"},
    "C": {"C": 4.300, "T": 1147.0, "name": "Eutectic Point (Ledeburite)"},
    "F": {"C": 6.670, "T": 1147.0, "name": "Cementite Eutectic Point"},
    "K": {"C": 6.670, "T": 727.0, "name": "Cementite Eutectoid Line End"},
    "D": {"C": 6.670, "T": 1227.0, "name": "Cementite Liquidus End"},
}

C_EUTECTOID = 0.760
C_EUTECTIC = 4.300
C_STEEL_MAX = 2.140
C_CEMENTITE = 6.670
C_FERRITE_MAX = 0.022
C_FERRITE_RT = 0.008

T_EUTECTOID = 727.0
T_EUTECTIC = 1147.0
T_PERITECTIC = 1495.0
T_CURIE = 770.0


# ---------------------------------------------------------------------------
# Boundary Curve Functions
# ---------------------------------------------------------------------------

def temp_a3(c: float) -> float:
    """A3 line (GS curve): Ferrite/Austenite upper boundary for hypoeutectoid steel.
    Valid for 0.0 <= c <= 0.76.
    """
    if c <= 0.0:
        return 912.0
    if c >= C_EUTECTOID:
        return T_EUTECTOID
    ratio = max(0.0, min(1.0, c / C_EUTECTOID))
    return 912.0 - (912.0 - T_EUTECTOID) * math.pow(ratio, 0.82)


def carbon_a3_gamma(temp: float) -> float:
    """Austenite boundary composition along A3 for a given temperature T (727 <= T <= 912)."""
    if temp >= 912.0:
        return 0.0
    if temp <= T_EUTECTOID:
        return C_EUTECTOID
    ratio = (912.0 - temp) / (912.0 - T_EUTECTOID)
    return C_EUTECTOID * math.pow(ratio, 1.0 / 0.82)


def temp_acm(c: float) -> float:
    """Acm line (SE curve): Cementite/Austenite boundary for hypereutectoid steel.
    Valid for 0.76 <= c <= 2.14.
    """
    if c <= C_EUTECTOID:
        return T_EUTECTOID
    if c >= C_STEEL_MAX:
        return T_EUTECTIC
    ratio = (c - C_EUTECTOID) / (C_STEEL_MAX - C_EUTECTOID)
    return T_EUTECTOID + (T_EUTECTIC - T_EUTECTOID) * math.pow(ratio, 0.90)


def carbon_acm_gamma(temp: float) -> float:
    """Austenite boundary composition along Acm for temperature T (727 <= T <= 1147)."""
    if temp <= T_EUTECTOID:
        return C_EUTECTOID
    if temp >= T_EUTECTIC:
        return C_STEEL_MAX
    ratio = (temp - T_EUTECTOID) / (T_EUTECTIC - T_EUTECTOID)
    return C_EUTECTOID + (C_STEEL_MAX - C_EUTECTOID) * math.pow(ratio, 1.0 / 0.90)


def carbon_alpha_solvus(temp: float) -> float:
    """Ferrite alpha solvus composition (GP for 727-912°C, PQ for 25-727°C)."""
    if temp >= 912.0:
        return 0.0
    if temp >= T_EUTECTOID:
        # GP line: 912°C (0%) down to 727°C (0.022%)
        return C_FERRITE_MAX * (912.0 - temp) / (912.0 - T_EUTECTOID)
    # PQ line: 727°C (0.022%) down to 25°C (0.008%)
    t_clamped = max(25.0, temp)
    return C_FERRITE_RT + (C_FERRITE_MAX - C_FERRITE_RT) * (t_clamped - 25.0) / (T_EUTECTOID - 25.0)


def temp_liquidus(c: float) -> float:
    """Liquidus temperature ABCD for Fe-C."""
    if c <= 0.0:
        return 1538.0
    if c <= 0.53:
        return 1538.0 - (1538.0 - T_PERITECTIC) * (c / 0.53)
    if c <= C_EUTECTIC:
        ratio = (c - 0.53) / (C_EUTECTIC - 0.53)
        return T_PERITECTIC - (T_PERITECTIC - T_EUTECTIC) * math.pow(ratio, 0.95)
    if c <= C_CEMENTITE:
        ratio = (c - C_EUTECTIC) / (C_CEMENTITE - C_EUTECTIC)
        return T_EUTECTIC + (1227.0 - T_EUTECTIC) * ratio
    return 1227.0


def temp_solidus(c: float) -> float:
    """Solidus temperature AHJEF for Fe-C."""
    if c <= 0.0:
        return 1538.0
    if c <= 0.09:
        return 1538.0 - (1538.0 - T_PERITECTIC) * (c / 0.09)
    if c <= 0.17:
        return T_PERITECTIC
    if c <= C_STEEL_MAX:
        ratio = (c - 0.17) / (C_STEEL_MAX - 0.17)
        return T_PERITECTIC - (T_PERITECTIC - T_EUTECTIC) * math.pow(ratio, 0.92)
    return T_EUTECTIC


# ---------------------------------------------------------------------------
# Dense SVG Boundary Paths and Regions Generation
# ---------------------------------------------------------------------------

def generate_phase_diagram_boundaries() -> dict[str, Any]:
    """Generates dense point arrays and SVG paths for rendering both the
    Steel Focus (0-2.14% C, 400-1100°C) and Full Diagram (0-6.67% C, 0-1600°C).
    """
    # Sample A3 (GS) curve
    a3_points = []
    for i in range(50):
        c = (C_EUTECTOID * i) / 49.0
        t = temp_a3(c)
        a3_points.append({"c": round(c, 4), "t": round(t, 2)})

    # Sample Acm (SE) curve
    acm_points = []
    for i in range(50):
        c = C_EUTECTOID + ((C_STEEL_MAX - C_EUTECTOID) * i) / 49.0
        t = temp_acm(c)
        acm_points.append({"c": round(c, 4), "t": round(t, 2)})

    # Sample Alpha solvus GP and PQ
    alpha_solvus_gp = []
    for i in range(25):
        t = 912.0 - ((912.0 - T_EUTECTOID) * i) / 24.0
        c = carbon_alpha_solvus(t)
        alpha_solvus_gp.append({"c": round(c, 4), "t": round(t, 2)})

    alpha_solvus_pq = []
    for i in range(30):
        t = T_EUTECTOID - ((T_EUTECTOID - 25.0) * i) / 29.0
        c = carbon_alpha_solvus(t)
        alpha_solvus_pq.append({"c": round(c, 4), "t": round(t, 2)})

    # Sample Liquidus ABCD
    liquidus_points = []
    for i in range(100):
        c = (C_CEMENTITE * i) / 99.0
        t = temp_liquidus(c)
        liquidus_points.append({"c": round(c, 4), "t": round(t, 2)})

    # Sample Solidus AHJEF
    solidus_points = []
    for i in range(100):
        c = (C_CEMENTITE * i) / 99.0
        t = temp_solidus(c)
        solidus_points.append({"c": round(c, 4), "t": round(t, 2)})

    # Invariant and isothermal lines
    horizontal_lines = [
        {
            "id": "A1_PSK",
            "name": "A₁ Eutectoid Line (PSK)",
            "temperature_C": 727.0,
            "c_start": 0.022,
            "c_end": 6.67,
            "significance": "Austenite decomposes into Pearlite (Ferrite + Cementite)",
        },
        {
            "id": "A2_Curie",
            "name": "A₂ Magnetic Curie Line",
            "temperature_C": 770.0,
            "c_start": 0.0,
            "c_end": 0.50,
            "significance": "Ferrite loses ferromagnetism upon heating above 770°C",
        },
        {
            "id": "Eutectic_ECF",
            "name": "Eutectic Line (ECF)",
            "temperature_C": 1147.0,
            "c_start": 2.14,
            "c_end": 6.67,
            "significance": "Liquid decomposes into Ledeburite (Austenite + Cementite)",
        },
        {
            "id": "Peritectic_HJB",
            "name": "Peritectic Line (HJB)",
            "temperature_C": 1495.0,
            "c_start": 0.09,
            "c_end": 0.53,
            "significance": "Delta Ferrite + Liquid react to form Austenite",
        },
    ]

    # Pre-calculated polygon regions for colored diagram zones
    regions = [
        {
            "id": "austenite",
            "name": "Austenite (γ)",
            "crystal_structure": "FCC (Face-Centered Cubic)",
            "color": "#f59e0b",
            "description": "Single-phase solid solution of carbon in FCC iron. Ductile and non-magnetic.",
        },
        {
            "id": "ferrite_pearlite",
            "name": "Ferrite (α) + Pearlite",
            "crystal_structure": "BCC Ferrite + Lamellar Pearlite (α + Fe₃C)",
            "color": "#3b82f6",
            "description": "Hypoeutectoid steel microstructure at room temperature. Ductile ferrite matrix with strengthening pearlite colonies.",
        },
        {
            "id": "pearlite_cementite",
            "name": "Pearlite + Cementite (Fe₃C)",
            "crystal_structure": "Lamellar Pearlite + Intergranular Orthorhombic Fe₃C",
            "color": "#8b5cf6",
            "description": "Hypereutectoid steel microstructure. Hard and wear-resistant with proeutectoid cementite grain boundaries.",
        },
        {
            "id": "ferrite_austenite",
            "name": "Ferrite (α) + Austenite (γ)",
            "crystal_structure": "BCC + FCC (Intercritical Zone)",
            "color": "#06b6d4",
            "description": "Dual-phase intercritical annealing zone. Key for dual-phase (DP) automotive high-strength steels.",
        },
        {
            "id": "austenite_cementite",
            "name": "Austenite (γ) + Cementite (Fe₃C)",
            "crystal_structure": "FCC + Orthorhombic Fe₃C",
            "color": "#ec4899",
            "description": "Austenite with proeutectoid cementite precipitation along grain boundaries.",
        },
        {
            "id": "liquid",
            "name": "Liquid (L)",
            "crystal_structure": "Molten Liquid",
            "color": "#ef4444",
            "description": "Completely molten iron-carbon melt above liquidus.",
        },
        {
            "id": "liquid_austenite",
            "name": "Liquid + Austenite (γ + L)",
            "crystal_structure": "Molten + FCC Dendrites",
            "color": "#f97316",
            "description": "Semi-solid mushy zone with austenite dendrites growing in carbon-rich liquid.",
        },
        {
            "id": "ledeburite_region",
            "name": "Cast Iron Range (Ledeburite + Pearlite/Cementite)",
            "crystal_structure": "Eutectic Mixture + Cementite",
            "color": "#64748b",
            "description": "Cast iron domain (C > 2.14%). Brittle with high castability and damping.",
        },
    ]

    return {
        "curves": {
            "a3_curve": a3_points,
            "acm_curve": acm_points,
            "alpha_solvus_gp": alpha_solvus_gp,
            "alpha_solvus_pq": alpha_solvus_pq,
            "liquidus": liquidus_points,
            "solidus": solidus_points,
        },
        "invariants": INVARIANT_POINTS,
        "horizontal_lines": horizontal_lines,
        "regions": regions,
        "viewports": {
            "steel_focus": {
                "c_min": 0.0,
                "c_max": 2.14,
                "t_min": 400.0,
                "t_max": 1150.0,
                "title": "Steel Range (0 - 2.14 wt% C)",
            },
            "full_diagram": {
                "c_min": 0.0,
                "c_max": 6.67,
                "t_min": 0.0,
                "t_max": 1600.0,
                "title": "Full Fe-Fe₃C System (0 - 6.67 wt% C)",
            },
        },
    }


# ---------------------------------------------------------------------------
# Phase State Identification and Lever Rule Calculations
# ---------------------------------------------------------------------------

def calculate_lever_rule(carbon_wt: float, temperature_C: float, steel_id: int | None = None) -> dict[str, Any]:
    """Calculates the equilibrium phase state, tie-line endpoints, phase fractions,
    microconstituent breakdown, and microstructure rendering metadata for any (C, T) point.
    """
    c0 = max(0.0, min(6.67, float(carbon_wt)))
    t0 = max(0.0, min(1600.0, float(temperature_C)))

    t_liq = temp_liquidus(c0)
    t_sol = temp_solidus(c0)
    t_a3 = temp_a3(c0) if c0 <= C_EUTECTOID else None
    t_acm = temp_acm(c0) if c0 > C_EUTECTOID and c0 <= C_STEEL_MAX else None

    # Determine region and phase fractions
    region_id = ""
    region_name = ""
    crystal_structure = ""
    equilibrium_phases: list[str] = []
    tie_line: dict[str, Any] = {}
    phase_fractions: dict[str, float] = {}
    constituents: dict[str, float] = {}
    explanation = ""
    quenched_microstructure = ""

    # 1. Above Liquidus
    if t0 >= t_liq:
        region_id = "liquid"
        region_name = "Liquid (L)"
        crystal_structure = "Molten Liquid"
        equilibrium_phases = ["Liquid (L)"]
        phase_fractions = {"Liquid (L)": 100.0}
        constituents = {"Liquid": 100.0}
        tie_line = {
            "has_tie_line": False,
            "c_left": c0,
            "c_right": c0,
            "left_phase": "Liquid",
            "right_phase": "Liquid",
            "fulcrum": c0,
        }
        explanation = f"At {t0:.1f}°C and {c0:.2f} wt% C, the alloy is completely molten liquid."
        quenched_microstructure = "Rapidly solidified fine amorphous/dendritic structure"

    # 2. Between Solidus and Liquidus (Mushy zone)
    elif t0 >= t_sol:
        if c0 <= C_STEEL_MAX:
            region_id = "liquid_austenite"
            region_name = "Liquid + Austenite (γ + L)"
            crystal_structure = "FCC Austenite Dendrites in Molten Liquid"
            equilibrium_phases = ["Austenite (γ)", "Liquid (L)"]

            # Tie line between solidus (gamma) and liquidus
            c_gamma = 0.17 + (C_STEEL_MAX - 0.17) * max(0.0, min(1.0, (1495.0 - t0) / (1495.0 - 1147.0)))
            c_liq = 0.53 + (C_EUTECTIC - 0.53) * max(0.0, min(1.0, (1495.0 - t0) / (1495.0 - 1147.0)))
            c_left = min(c_gamma, c0)
            c_right = max(c_liq, c0)
            if c_right > c_left:
                w_gamma = max(0.0, min(100.0, (c_right - c0) / (c_right - c_left) * 100.0))
                w_liq = 100.0 - w_gamma
            else:
                w_gamma = 50.0
                w_liq = 50.0

            phase_fractions = {"Austenite (γ)": round(w_gamma, 1), "Liquid (L)": round(w_liq, 1)}
            constituents = {"Solidifying Austenite": round(w_gamma, 1), "Residual Liquid": round(w_liq, 1)}
            tie_line = {
                "has_tie_line": True,
                "c_left": round(c_left, 3),
                "c_right": round(c_right, 3),
                "left_phase": "Austenite (γ)",
                "right_phase": "Liquid (L)",
                "fulcrum": c0,
                "w_left": round(w_gamma, 1),
                "w_right": round(w_liq, 1),
            }
            explanation = (
                f"Two-phase mushy zone: Austenite grains (at {c_left:.2f}% C) solidify within "
                f"liquid melt (at {c_right:.2f}% C). Lever rule gives {w_gamma:.1f}% Austenite and {w_liq:.1f}% Liquid."
            )
            quenched_microstructure = "Dendritic Martensite + Quenched Retained Liquid/Eutectic"
        else:
            region_id = "liquid_cementite"
            region_name = "Liquid + Primary Cementite (Fe₃C + L)"
            crystal_structure = "Orthorhombic Fe₃C + Molten Liquid"
            equilibrium_phases = ["Liquid (L)", "Cementite (Fe₃C)"]
            c_left = C_EUTECTIC
            c_right = C_CEMENTITE
            w_liq = (c_right - c0) / (c_right - c_left) * 100.0
            w_cem = 100.0 - w_liq
            phase_fractions = {"Liquid (L)": round(w_liq, 1), "Cementite (Fe₃C)": round(w_cem, 1)}
            constituents = {"Primary Cementite": round(w_cem, 1), "Liquid": round(w_liq, 1)}
            tie_line = {
                "has_tie_line": True,
                "c_left": round(c_left, 3),
                "c_right": round(c_right, 3),
                "left_phase": "Liquid (L)",
                "right_phase": "Cementite (Fe₃C)",
                "fulcrum": c0,
                "w_left": round(w_liq, 1),
                "w_right": round(w_cem, 1),
            }
            explanation = f"Primary cementite plates precipitate directly from the cooling liquid melt."
            quenched_microstructure = "Coarse primary Fe₃C needles + quenched eutectic matrix"

    # 3. High Temperature Single Phase Austenite (γ)
    elif (c0 <= C_EUTECTOID and t0 >= t_a3) or (c0 > C_EUTECTOID and c0 <= C_STEEL_MAX and t0 >= t_acm):
        region_id = "austenite"
        region_name = "Austenite (γ)"
        crystal_structure = "FCC (Face-Centered Cubic)"
        equilibrium_phases = ["Austenite (γ)"]
        phase_fractions = {"Austenite (γ)": 100.0}
        constituents = {"Austenite grains": 100.0}
        tie_line = {
            "has_tie_line": False,
            "c_left": c0,
            "c_right": c0,
            "left_phase": "Austenite",
            "right_phase": "Austenite",
            "fulcrum": c0,
        }
        explanation = (
            f"At {t0:.1f}°C and {c0:.2f} wt% C, the steel is 100% single-phase Austenite (FCC). "
            f"All carbon is completely dissolved in interstitial solid solution. "
            f"Ideal temperature for austenitizing prior to quenching."
        )
        quenched_microstructure = "100% Martensite (if rapid quench) or Fine Bainite (if intermediate quench)"

    # 4. Intercritical Hypoeutectoid Zone (Ferrite + Austenite: α + γ, 727°C <= T < A3)
    elif c0 < C_EUTECTOID and t0 >= T_EUTECTOID:
        region_id = "ferrite_austenite"
        region_name = "Ferrite (α) + Austenite (γ)"
        crystal_structure = "BCC (Ferrite) + FCC (Austenite)"
        equilibrium_phases = ["Ferrite (α)", "Austenite (γ)"]

        c_alpha = carbon_alpha_solvus(t0)
        c_gamma = carbon_a3_gamma(t0)
        c_left = min(c_alpha, c0)
        c_right = max(c_gamma, c0)

        if c_right > c_left:
            w_alpha = (c_right - c0) / (c_right - c_left) * 100.0
            w_gamma = (c0 - c_left) / (c_right - c_left) * 100.0
        else:
            w_alpha = 50.0
            w_gamma = 50.0

        w_alpha = max(0.0, min(100.0, w_alpha))
        w_gamma = max(0.0, min(100.0, w_gamma))

        phase_fractions = {"Ferrite (α)": round(w_alpha, 1), "Austenite (γ)": round(w_gamma, 1)}
        constituents = {"Intercritical Ferrite": round(w_alpha, 1), "Carbon-Enriched Austenite": round(w_gamma, 1)}
        tie_line = {
            "has_tie_line": True,
            "c_left": round(c_left, 4),
            "c_right": round(c_right, 3),
            "left_phase": "Ferrite (α)",
            "right_phase": "Austenite (γ)",
            "fulcrum": c0,
            "w_left": round(w_alpha, 1),
            "w_right": round(w_gamma, 1),
        }
        explanation = (
            f"Dual-phase intercritical zone: Proeutectoid ferrite (BCC, ~{c_left:.3f}% C) coexists with "
            f"austenite (FCC, enriched to {c_right:.2f}% C). Lever rule: {w_alpha:.1f}% Ferrite + {w_gamma:.1f}% Austenite. "
            f"Quenching from here produces Dual-Phase (DP) steel (Ferrite matrix with Martensite islands)."
        )
        quenched_microstructure = f"Dual Phase: {w_alpha:.0f}% Proeutectoid Ferrite + {w_gamma:.0f}% Martensite islands"

    # 5. Intercritical Hypereutectoid Zone (Austenite + Cementite: γ + Fe3C, 727°C <= T < Acm)
    elif c0 >= C_EUTECTOID and c0 <= C_STEEL_MAX and t0 >= T_EUTECTOID:
        region_id = "austenite_cementite"
        region_name = "Austenite (γ) + Cementite (Fe₃C)"
        crystal_structure = "FCC (Austenite) + Orthorhombic (Fe₃C)"
        equilibrium_phases = ["Austenite (γ)", "Cementite (Fe₃C)"]

        c_gamma = carbon_acm_gamma(t0)
        c_left = min(c_gamma, c0)
        c_right = C_CEMENTITE

        w_gamma = (c_right - c0) / (c_right - c_left) * 100.0
        w_cem = (c0 - c_left) / (c_right - c_left) * 100.0

        w_gamma = max(0.0, min(100.0, w_gamma))
        w_cem = max(0.0, min(100.0, w_cem))

        phase_fractions = {"Austenite (γ)": round(w_gamma, 1), "Cementite (Fe₃C)": round(w_cem, 1)}
        constituents = {"Austenite Matrix": round(w_gamma, 1), "Proeutectoid Cementite Network": round(w_cem, 1)}
        tie_line = {
            "has_tie_line": True,
            "c_left": round(c_left, 3),
            "c_right": round(c_right, 3),
            "left_phase": "Austenite (γ)",
            "right_phase": "Cementite (Fe₃C)",
            "fulcrum": c0,
            "w_left": round(w_gamma, 1),
            "w_right": round(w_cem, 1),
        }
        explanation = (
            f"Austenite (at {c_left:.2f}% C) in equilibrium with proeutectoid Cementite (Fe₃C, 6.67% C) "
            f"forming along austenite grain boundaries. Lever rule: {w_gamma:.1f}% Austenite + {w_cem:.1f}% Cementite."
        )
        quenched_microstructure = f"Martensite matrix with intergranular Cementite (Fe₃C) network"

    # 6. High-Carbon Cast Iron Solid Zone (2.14% < C <= 6.67%, 727°C <= T < 1147°C)
    elif c0 > C_STEEL_MAX and t0 >= T_EUTECTOID:
        region_id = "austenite_cementite_ledeburite"
        region_name = "Austenite + Cementite + Ledeburite"
        crystal_structure = "FCC Austenite + Eutectic Ledeburite + Fe₃C"
        equilibrium_phases = ["Austenite (γ)", "Cementite (Fe₃C)"]

        c_left = carbon_acm_gamma(t0) if t0 <= T_EUTECTIC else C_STEEL_MAX
        c_right = C_CEMENTITE
        w_gamma = (c_right - c0) / (c_right - c_left) * 100.0
        w_cem = 100.0 - w_gamma

        phase_fractions = {"Austenite (γ)": round(w_gamma, 1), "Cementite (Fe₃C)": round(w_cem, 1)}
        constituents = {"Transformed Ledeburite": round(w_gamma, 1), "Primary/Secondary Cementite": round(w_cem, 1)}
        tie_line = {
            "has_tie_line": True,
            "c_left": round(c_left, 3),
            "c_right": round(c_right, 3),
            "left_phase": "Austenite (γ)",
            "right_phase": "Cementite (Fe₃C)",
            "fulcrum": c0,
            "w_left": round(w_gamma, 1),
            "w_right": round(w_cem, 1),
        }
        explanation = f"Cast iron region with austenite dendrites and eutectic ledeburite matrix."
        quenched_microstructure = "Martensite in transformed ledeburite eutectic matrix"

    # 7. Equilibrium Subcritical Steel & Iron (T < 727°C)
    else:
        c_alpha = carbon_alpha_solvus(t0)
        c_cem = C_CEMENTITE

        # Total equilibrium phases (alpha ferrite + Fe3C)
        w_alpha_total = (c_cem - c0) / (c_cem - c_alpha) * 100.0
        w_cem_total = (c0 - c_alpha) / (c_cem - c_alpha) * 100.0
        w_alpha_total = max(0.0, min(100.0, w_alpha_total))
        w_cem_total = max(0.0, min(100.0, w_cem_total))

        phase_fractions = {
            "Ferrite (α)": round(w_alpha_total, 1),
            "Cementite (Fe₃C)": round(w_cem_total, 1),
        }

        # Microconstituent breakdown (Proeutectoid vs Pearlite)
        if c0 <= C_FERRITE_MAX:
            region_id = "pure_ferrite"
            region_name = "Alpha Ferrite (α)"
            crystal_structure = "BCC (Body-Centered Cubic)"
            equilibrium_phases = ["Ferrite (α)"]
            constituents = {"Polygonal Ferrite grains": 100.0}
            explanation = f"Single-phase alpha ferrite with interstitial carbon dissolved in BCC lattice."
            quenched_microstructure = "Soft Ferrite with supersaturated interstitial carbon"

        elif c0 < C_EUTECTOID:
            region_id = "ferrite_pearlite"
            region_name = "Ferrite (α) + Pearlite"
            crystal_structure = "BCC Ferrite + Lamellar Pearlite (α + Fe₃C)"
            equilibrium_phases = ["Ferrite (α)", "Cementite (Fe₃C)"]

            # Proeutectoid ferrite and pearlite fractions
            w_pro_ferrite = (C_EUTECTOID - c0) / (C_EUTECTOID - C_FERRITE_MAX) * 100.0
            w_pearlite = (c0 - C_FERRITE_MAX) / (C_EUTECTOID - C_FERRITE_MAX) * 100.0
            w_pro_ferrite = max(0.0, min(100.0, w_pro_ferrite))
            w_pearlite = max(0.0, min(100.0, w_pearlite))

            constituents = {
                "Proeutectoid Ferrite (α)": round(w_pro_ferrite, 1),
                "Pearlite (Lamellar α + Fe₃C)": round(w_pearlite, 1),
            }
            explanation = (
                f"Hypoeutectoid steel at equilibrium: Proeutectoid ferrite nucleates first on cooling below A₃. "
                f"At 727°C, remaining austenite transforms to Pearlite. "
                f"Constituents: {w_pro_ferrite:.1f}% Proeutectoid Ferrite + {w_pearlite:.1f}% Pearlite "
                f"(Total phase balance: {w_alpha_total:.1f}% α-Fe + {w_cem_total:.1f}% Fe₃C)."
            )
            quenched_microstructure = "Annealed/Normalized equilibrium baseline (Ferrite + Pearlite)"

        elif abs(c0 - C_EUTECTOID) <= 0.015:
            region_id = "eutectoid_pearlite"
            region_name = "100% Pearlite (Eutectoid)"
            crystal_structure = "Lamellar alternating BCC Ferrite & Orthorhombic Fe₃C plates"
            equilibrium_phases = ["Ferrite (α)", "Cementite (Fe₃C)"]
            constituents = {"100% Pearlite Colonies": 100.0}
            explanation = (
                f"Eutectoid steel (0.76 wt% C): Austenite fully transforms isothermally at 727°C into "
                f"100% lamellar Pearlite (~88.8% Ferrite + ~11.2% Fe₃C by weight within the colonies)."
            )
            quenched_microstructure = "Full pearlite colonies (interlamellar spacing dependent on cooling rate)"

        elif c0 <= C_STEEL_MAX:
            region_id = "pearlite_cementite"
            region_name = "Pearlite + Proeutectoid Cementite (Fe₃C)"
            crystal_structure = "Lamellar Pearlite + Grain Boundary Fe₃C Network"
            equilibrium_phases = ["Ferrite (α)", "Cementite (Fe₃C)"]

            w_pro_cem = (c0 - C_EUTECTOID) / (C_CEMENTITE - C_EUTECTOID) * 100.0
            w_pearlite = (C_CEMENTITE - c0) / (C_CEMENTITE - C_EUTECTOID) * 100.0
            w_pro_cem = max(0.0, min(100.0, w_pro_cem))
            w_pearlite = max(0.0, min(100.0, w_pearlite))

            constituents = {
                "Pearlite": round(w_pearlite, 1),
                "Proeutectoid Cementite (Fe₃C)": round(w_pro_cem, 1),
            }
            explanation = (
                f"Hypereutectoid steel: Proeutectoid cementite precipitates along prior austenite grain boundaries "
                f"between Acm and 727°C ({w_pro_cem:.1f}%), followed by eutectoid transformation into {w_pearlite:.1f}% Pearlite."
            )
            quenched_microstructure = "Pearlite colonies with brittle intergranular cementite network"

        else:
            region_id = "cast_iron_pearlite_ledeburite"
            region_name = "Pearlite + Cementite + Transformed Ledeburite"
            crystal_structure = "Pearlite + Ledeburite + Fe₃C"
            equilibrium_phases = ["Ferrite (α)", "Cementite (Fe₃C)"]
            constituents = {
                "Pearlite": 40.0,
                "Transformed Ledeburite": 45.0,
                "Primary Cementite": 15.0,
            }
            explanation = f"White cast iron microstructure consisting of pearlite and transformed ledeburite eutectic."
            quenched_microstructure = "Hard white iron with cementite plates"

        tie_line = {
            "has_tie_line": True,
            "c_left": round(c_alpha, 4),
            "c_right": round(c_cem, 2),
            "left_phase": "Ferrite (α)",
            "right_phase": "Cementite (Fe₃C)",
            "fulcrum": c0,
            "w_left": round(w_alpha_total, 1),
            "w_right": round(w_cem_total, 1),
            "constituent_tie_line": {
                "c_eutectoid": C_EUTECTOID,
                "c_proeutectoid_left": C_FERRITE_MAX if c0 < C_EUTECTOID else C_EUTECTOID,
                "c_proeutectoid_right": C_EUTECTOID if c0 < C_EUTECTOID else C_CEMENTITE,
            },
        }

    # Microstructure generator rendering parameters
    microstructure_recipe = {
        "region_id": region_id,
        "region_name": region_name,
        "temperature_C": t0,
        "carbon_wt": c0,
        "phases": phase_fractions,
        "constituents": constituents,
        "quenched_preview": quenched_microstructure,
        "pearlite_fraction": constituents.get("Pearlite (Lamellar α + Fe₃C)") or constituents.get("Pearlite") or (100.0 if "pearlite" in region_id else 0.0),
        "proeutectoid_ferrite_fraction": constituents.get("Proeutectoid Ferrite (α)", 0.0),
        "proeutectoid_cementite_fraction": constituents.get("Proeutectoid Cementite (Fe₃C)", 0.0),
        "austenite_fraction": phase_fractions.get("Austenite (γ)", 0.0),
        "liquid_fraction": phase_fractions.get("Liquid (L)", 0.0),
    }

    return {
        "carbon_wt": c0,
        "temperature_C": t0,
        "region_id": region_id,
        "region_name": region_name,
        "crystal_structure": crystal_structure,
        "equilibrium_phases": equilibrium_phases,
        "phase_fractions": phase_fractions,
        "microconstituents": constituents,
        "tie_line": tie_line,
        "explanation": explanation,
        "quenched_preview": quenched_microstructure,
        "microstructure_recipe": microstructure_recipe,
        "critical_temperatures": {
            "A1": T_EUTECTOID,
            "A3": round(t_a3, 1) if t_a3 is not None else None,
            "Acm": round(t_acm, 1) if t_acm is not None else None,
            "Liquidus": round(t_liq, 1),
            "Solidus": round(t_sol, 1),
        },
    }


# ---------------------------------------------------------------------------
# Alloy Critical Transformation Temperatures (Andrews Empirical Formulas)
# ---------------------------------------------------------------------------

def calculate_alloy_critical_temperatures(
    c: float, mn: float = 0.0, si: float = 0.0, cr: float = 0.0, ni: float = 0.0, mo: float = 0.0
) -> dict[str, float]:
    """Calculates transformation temperatures Ac1, Ac3, Ms, and Mf accounting for alloying additions."""
    ac1 = 723.0 - 10.7 * mn - 16.9 * ni + 29.1 * si + 16.9 * cr
    ac3 = 910.0 - 203.0 * math.sqrt(max(0.001, c)) - 15.2 * ni + 44.7 * si + 31.5 * mo - 30.0 * mn

    ms = 539.0 - 423.0 * c - 30.4 * mn - 17.7 * ni - 12.1 * cr - 7.5 * mo
    mf = ms - 215.0
    bs = 830.0 - 270.0 * c - 90.0 * mn - 37.0 * ni - 70.0 * cr - 83.0 * mo

    return {
        "Ac1": round(ac1, 1),
        "Ac3": round(ac3, 1),
        "Ms": round(ms, 1),
        "Mf": round(max(20.0, mf), 1),
        "Bs": round(bs, 1),
    }
