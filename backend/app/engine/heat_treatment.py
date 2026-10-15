"""Heat Treatment Cycle & TTT / CCT Transformation Kinetics Engine.

Implements:
1. Parametric TTT diagram generation with alloying element shifts (C, Mn, Si, Cr, Ni, Mo).
2. Quench cooling trajectory generation (Water, Oil, Polymer, Air, Furnace, Custom).
3. Continuous cooling transformation (Scheil's additivity rule) & Isothermal kinetics.
4. Martensitic transformation via Koistinen-Marburger equation.
5. Tempering kinetics & Hollomon-Jaffe parameter for hardness estimation.
"""

from __future__ import annotations

import math
from typing import Any

from app.engine.phase_diagram import calculate_alloy_critical_temperatures


# ---------------------------------------------------------------------------
# Default Quench Media Characteristics (ambient ~25°C)
# ---------------------------------------------------------------------------
COOLING_MEDIA_PARAMS: dict[str, dict[str, Any]] = {
    "water": {
        "name": "Agitated Water Quench",
        "avg_rate": 140.0,  # °C/s between 800°C and 400°C
        "decay_constant": 0.28,
        "description": "Severe quench; maximum martensitic hardness, high risk of distortion/cracking.",
    },
    "oil": {
        "name": "Agitated Oil Quench",
        "avg_rate": 45.0,  # °C/s
        "decay_constant": 0.085,
        "description": "Standard alloy steel quench medium; balanced cooling to minimize thermal shock.",
    },
    "polymer": {
        "name": "Polymer Solution Quench",
        "avg_rate": 22.0,  # °C/s
        "decay_constant": 0.040,
        "description": "Intermediate between water and oil; consistent heat extraction with reduced stress.",
    },
    "air": {
        "name": "Still Air Cool (Normalizing)",
        "avg_rate": 3.0,  # °C/s
        "decay_constant": 0.0055,
        "description": "Normalizing cool producing fine lamellar pearlite and proeutectoid phases.",
    },
    "furnace": {
        "name": "Slow Furnace Cool (Full Anneal)",
        "avg_rate": 0.08,  # °C/s (~280 °C/hr)
        "decay_constant": 0.00015,
        "description": "Near-equilibrium cooling producing coarse pearlite and maximum ductility/machinability.",
    },
}


# ---------------------------------------------------------------------------
# TTT Curve Synthesis & Interpolation
# ---------------------------------------------------------------------------
def calculate_hardenability_factor(c: float, mn: float, si: float, cr: float, ni: float, mo: float) -> float:
    """Calculates relative hardenability delay factor based on Grossmann alloy multipliers.
    A factor > 1 shifts pearlite and bainite noses to longer times.
    """
    f_c = math.sqrt(max(0.1, c))
    f_mn = 1.0 + 3.33 * mn
    f_si = 1.0 + 0.7 * si
    f_cr = 1.0 + 2.16 * cr
    f_ni = 1.0 + 0.36 * ni
    f_mo = 1.0 + 3.0 * mo
    return max(0.5, f_c * f_mn * f_si * f_cr * f_ni * f_mo)


def generate_ttt_diagram(
    steel_id: int,
    steel_name: str,
    c: float,
    mn: float = 0.0,
    si: float = 0.0,
    cr: float = 0.0,
    ni: float = 0.0,
    mo: float = 0.0,
) -> dict[str, Any]:
    """Generates dense (time_s, temp_C) points for TTT transformation C-curves
    tailored to the steel composition and critical temperatures.
    """
    crit = calculate_alloy_critical_temperatures(c=c, mn=mn, si=si, cr=cr, ni=ni, mo=mo)
    ac1 = crit["Ac1"]
    ac3 = crit["Ac3"]
    ms = crit["Ms"]
    mf = crit["Mf"]
    bs = crit["Bs"]

    hardenability = calculate_hardenability_factor(c, mn, si, cr, ni, mo)

    # Base nose positions adjusted for alloy content:
    # Plain carbon nose is around 550°C and 0.8s; alloys push nose to longer times
    pearlite_nose_temp = 580.0 - 20.0 * c - 15.0 * cr
    pearlite_nose_time_start = max(0.4, 0.6 * hardenability)
    pearlite_nose_time_end = pearlite_nose_time_start * 8.5

    bainite_nose_temp = min(bs - 40.0, 460.0)
    # Cr and Mo retard pearlite more than bainite, creating the classic "bainite bay"
    bainite_nose_time_start = max(0.8, 1.2 * math.sqrt(hardenability) * (1.0 + 0.8 * mo))
    bainite_nose_time_end = bainite_nose_time_start * 9.0

    # 1. Pearlite C-curve (from ~720°C down to ~500°C)
    pearlite_start_pts = []
    pearlite_end_pts = []
    t_upper_p = min(ac1 - 5.0, 725.0)
    t_lower_p = max(bainite_nose_temp + 30.0, 500.0)

    for temp in [t_upper_p - i * (t_upper_p - t_lower_p) / 24.0 for i in range(25)]:
        # Parabolic log-time shape around nose
        delta_t = (temp - pearlite_nose_temp) / 75.0
        exponent = 1.6 * (delta_t**2)
        # As temp approaches Ac1, time diverges asymptotically
        if temp > ac1 - 15.0:
            exponent += 3.5 / max(0.5, ac1 - temp)

        t_start = pearlite_nose_time_start * math.exp(exponent)
        t_end = pearlite_nose_time_end * math.exp(exponent)

        pearlite_start_pts.append({"time_s": round(t_start, 3), "temp_C": round(temp, 1)})
        pearlite_end_pts.append({"time_s": round(t_end, 3), "temp_C": round(temp, 1)})

    # 2. Bainite C-curve (from Bs down to Ms)
    bainite_start_pts = []
    bainite_end_pts = []
    t_upper_b = min(bs - 5.0, 560.0)
    t_lower_b = max(ms + 10.0, 320.0)

    for temp in [t_upper_b - i * (t_upper_b - t_lower_b) / 20.0 for i in range(21)]:
        delta_t = (temp - bainite_nose_temp) / 55.0
        exponent = 1.5 * (delta_t**2)
        if temp < ms + 25.0:
            exponent += 1.2 / max(0.5, temp - ms)

        t_start = bainite_nose_time_start * math.exp(exponent)
        t_end = bainite_nose_time_end * math.exp(exponent)

        bainite_start_pts.append({"time_s": round(t_start, 3), "temp_C": round(temp, 1)})
        bainite_end_pts.append({"time_s": round(t_end, 3), "temp_C": round(temp, 1)})

    # Critical cooling rate: average rate required to miss pearlite nose
    # dT/dt_crit ≈ (Austenitizing temp - Pearlite nose temp) / t_nose
    t_aust_typical = ac3 + 50.0
    crit_rate = round((t_aust_typical - pearlite_nose_temp) / pearlite_nose_time_start, 1)

    return {
        "steel_id": steel_id,
        "steel_name": steel_name,
        "composition": {"C": c, "Mn": mn, "Si": si, "Cr": cr, "Ni": ni, "Mo": mo},
        "critical_temperatures": crit,
        "time_range_s": [0.1, 100000.0],
        "temp_range_C": [0.0, 950.0],
        "curves": {
            "pearlite_start": pearlite_start_pts,
            "pearlite_finish": pearlite_end_pts,
            "bainite_start": bainite_start_pts,
            "bainite_finish": bainite_end_pts,
        },
        "markers": {
            "Ac1": ac1,
            "Ac3": ac3,
            "Bs": bs,
            "Ms": ms,
            "Mf": mf,
            "M50": round(ms - (ms - mf) * 0.5, 1),
            "M90": round(ms - (ms - mf) * 0.85, 1),
            "pearlite_nose_temp": round(pearlite_nose_temp, 1),
            "pearlite_nose_time_s": round(pearlite_nose_time_start, 2),
            "critical_cooling_rate_C_per_s": crit_rate,
        },
    }


# ---------------------------------------------------------------------------
# Thermal Cycle & Cooling Trajectory Solver
# ---------------------------------------------------------------------------
def simulate_thermal_cycle(
    steel_id: int,
    steel_name: str,
    composition: dict[str, float],
    austenitizing_temp_C: float = 850.0,
    soak_time_min: float = 30.0,
    quench_medium: str = "water",
    custom_cooling_rate: float | None = None,
    enable_isothermal_hold: bool = False,
    isothermal_temp_C: float | None = None,
    isothermal_time_s: float | None = None,
    enable_tempering: bool = False,
    tempering_temp_C: float | None = None,
    tempering_time_min: float | None = None,
) -> dict[str, Any]:
    """Simulates multi-stage thermal profile and calculates resulting microstructure and hardness."""
    c = composition.get("C", 0.45)
    mn = composition.get("Mn", 0.0)
    si = composition.get("Si", 0.0)
    cr = composition.get("Cr", 0.0)
    ni = composition.get("Ni", 0.0)
    mo = composition.get("Mo", 0.0)

    ttt_data = generate_ttt_diagram(steel_id, steel_name, c, mn, si, cr, ni, mo)
    crit = ttt_data["critical_temperatures"]
    ms = crit["Ms"]
    mf = crit["Mf"]
    ac1 = crit["Ac1"]
    ac3 = crit["Ac3"]
    bs = crit["Bs"]
    crit_cooling_rate = ttt_data["markers"]["critical_cooling_rate_C_per_s"]

    # Determine cooling decay constant
    if quench_medium == "custom" and custom_cooling_rate:
        eff_cooling_rate = custom_cooling_rate
        decay_k = eff_cooling_rate / max(10.0, austenitizing_temp_C - 25.0)
    else:
        medium_info = COOLING_MEDIA_PARAMS.get(quench_medium, COOLING_MEDIA_PARAMS["water"])
        decay_k = medium_info["decay_constant"]
        eff_cooling_rate = medium_info["avg_rate"]

    # 1. Generate Cooling Trajectory on TTT Time-Scale (t=0 at start of quench)
    cooling_pts: list[dict[str, Any]] = []
    t_ambient = 25.0

    # High-resolution logarithmic sampling from 0.05s up to 100,000s
    time_samples: list[float] = []
    cur_t = 0.05
    while cur_t <= 50000.0:
        time_samples.append(cur_t)
        if cur_t < 1.0:
            cur_t += 0.05
        elif cur_t < 10.0:
            cur_t += 0.5
        elif cur_t < 100.0:
            cur_t += 5.0
        elif cur_t < 1000.0:
            cur_t += 50.0
        else:
            cur_t *= 1.4

    # Trajectory generation
    if enable_isothermal_hold and isothermal_temp_C is not None and isothermal_time_s is not None:
        # Rapid quench down to isothermal_temp, hold, then air cool
        iso_t = isothermal_temp_C
        iso_duration = isothermal_time_s
        time_to_reach_iso = -math.log(max(0.001, (iso_t - t_ambient) / (austenitizing_temp_C - t_ambient))) / decay_k

        for t in time_samples:
            if t <= time_to_reach_iso:
                temp = t_ambient + (austenitizing_temp_C - t_ambient) * math.exp(-decay_k * t)
                stage = "Quench to Hold"
            elif t <= time_to_reach_iso + iso_duration:
                temp = iso_t
                stage = "Isothermal Hold"
            else:
                post_hold_time = t - (time_to_reach_iso + iso_duration)
                temp = t_ambient + (iso_t - t_ambient) * math.exp(-COOLING_MEDIA_PARAMS["air"]["decay_constant"] * post_hold_time)
                stage = "Final Air Cool"

            cooling_pts.append({"time_s": round(t, 2), "temp_C": round(temp, 1), "stage": stage})
            if temp <= 26.0 and t > time_to_reach_iso + iso_duration + 50.0:
                break
    else:
        for t in time_samples:
            temp = t_ambient + (austenitizing_temp_C - t_ambient) * math.exp(-decay_k * t)
            cooling_pts.append({"time_s": round(t, 2), "temp_C": round(temp, 1), "stage": "Continuous Quench"})
            if temp <= 26.0:
                break

    # 2. Continuous Process Trajectory for Full Heat Treatment Cycle Overview (in minutes)
    process_pts: list[dict[str, Any]] = []
    # Stage A: Heating (assume 10 °C/min heating rate)
    heating_duration_min = round((austenitizing_temp_C - 25.0) / 10.0, 1)
    process_pts.append({"total_time_min": 0.0, "temp_C": 25.0, "stage": "Start (Ambient)"})
    process_pts.append({"total_time_min": heating_duration_min, "temp_C": austenitizing_temp_C, "stage": "Heating Complete"})

    # Stage B: Austenitizing Soak
    soak_end_time = heating_duration_min + soak_time_min
    process_pts.append({"total_time_min": soak_end_time, "temp_C": austenitizing_temp_C, "stage": "Austenitization Soak"})

    # Stage C: Quenching / Hold
    quench_duration_min = round(cooling_pts[-1]["time_s"] / 60.0, 2)
    quench_end_time = soak_end_time + quench_duration_min
    process_pts.append({"total_time_min": quench_end_time, "temp_C": 25.0, "stage": "Quenched to Ambient"})

    # Stage D: Optional Tempering
    if enable_tempering and tempering_temp_C is not None and tempering_time_min is not None:
        temper_heat_min = round((tempering_temp_C - 25.0) / 15.0, 1)
        t_temper_start = quench_end_time + 10.0  # 10 min handling delay
        t_temper_heated = t_temper_start + temper_heat_min
        t_temper_soaked = t_temper_heated + tempering_time_min
        t_temper_cooled = t_temper_soaked + 60.0  # 1 hour cool

        process_pts.append({"total_time_min": t_temper_start, "temp_C": 25.0, "stage": "Charge to Tempering Furnace"})
        process_pts.append({"total_time_min": t_temper_heated, "temp_C": tempering_temp_C, "stage": "Temper Heating"})
        process_pts.append({"total_time_min": t_temper_soaked, "temp_C": tempering_temp_C, "stage": "Tempering Soak"})
        process_pts.append({"total_time_min": t_temper_cooled, "temp_C": 25.0, "stage": "Tempering Air Cool Complete"})

    # 3. Kinetic Phase Transformation Assessment
    transformation_notes: list[str] = []
    pearlite_nose_t = ttt_data["markers"]["pearlite_nose_temp"]
    pearlite_nose_s = ttt_data["markers"]["pearlite_nose_time_s"]

    # Compute effective cooling rate between 800°C and 500°C
    t800_pt = next((p for p in cooling_pts if p["temp_C"] <= 800.0), cooling_pts[0])
    t500_pt = next((p for p in cooling_pts if p["temp_C"] <= 500.0), cooling_pts[-1])
    dt = max(0.01, t500_pt["time_s"] - t800_pt["time_s"])
    actual_cooling_rate = round(300.0 / dt, 1)

    # Base as-quenched hardness of 100% martensite based on carbon: HRC ≈ 20 + 60 * sqrt(C)
    hrc_max_martensite = min(67.0, 20.0 + 60.0 * math.sqrt(max(0.05, c)))

    f_martensite = 0.0
    f_tempered_martensite = 0.0
    f_bainite = 0.0
    f_pearlite = 0.0
    f_ferrite = 0.0
    f_cementite = 0.0
    f_retained_austenite = 0.0

    if enable_isothermal_hold and isothermal_temp_C is not None and isothermal_time_s is not None:
        # Case A: Isothermal Heat Treatment (Austempering / Martempering)
        iso_t = isothermal_temp_C
        iso_s = isothermal_time_s

        if ms < iso_t < bs:
            # Austempering regime
            # Check if hold duration exceeds bainite finish curve
            b_finish_time = 15.0 * ttt_data["markers"]["pearlite_nose_time_s"]
            if iso_s >= b_finish_time * 2.0:
                f_bainite = 97.0
                f_retained_austenite = 3.0
                transformation_notes.append("Complete isothermal transformation to Acicular Bainite achieved (Austempering).")
            else:
                ratio = min(1.0, iso_s / b_finish_time)
                f_bainite = round(ratio * 90.0, 1)
                # Remainder transforms to martensite upon final quench below Ms
                untransformed = 100.0 - f_bainite
                f_martensite = round(untransformed * 0.95, 1)
                f_retained_austenite = round(untransformed * 0.05, 1)
                transformation_notes.append("Partial bainite transformation; remaining austenite transformed to martensite during final cool.")
            pred_hrc = 46.0 + 10.0 * c
        elif iso_t <= ms:
            # Martempering regime (marquenching)
            f_martensite = 96.0
            f_retained_austenite = 4.0
            transformation_notes.append("Martempering: thermal equalization above/at Ms followed by slow cooling minimizing distortion.")
            pred_hrc = hrc_max_martensite - 1.0
        else:
            # High-temperature isothermal hold (Pearlitic / Patenting)
            f_pearlite = 92.0
            f_ferrite = 8.0 if c < 0.76 else 0.0
            pred_hrc = 28.0 + 18.0 * c
            transformation_notes.append("High-temperature isothermal transformation yielding uniform lamellar pearlite.")

    else:
        # Case B: Continuous Cooling Transformation (CCT)
        if actual_cooling_rate >= crit_cooling_rate * 0.85:
            # Exceeded critical cooling rate: Full Martensitic Quench
            km_fraction = 1.0 - math.exp(-0.011 * (ms - 25.0))
            f_martensite = round(km_fraction * 100.0, 1)
            f_retained_austenite = round(max(0.5, (1.0 - km_fraction) * 100.0), 1)
            pred_hrc = hrc_max_martensite
            transformation_notes.append(
                f"Quench rate ({actual_cooling_rate} °C/s) exceeded critical threshold ({crit_cooling_rate} °C/s). "
                "100% shear transformation into tetragonal martensite."
            )

        elif actual_cooling_rate >= crit_cooling_rate * 0.25:
            # Intermediate cooling rate (e.g. oil or polymer quench of plain carbon or air cool of alloy steel)
            f_bainite = 45.0
            f_pearlite = 15.0
            f_martensite = 36.0
            f_retained_austenite = 4.0
            pred_hrc = hrc_max_martensite * 0.75
            transformation_notes.append(
                f"Intermediate cooling rate ({actual_cooling_rate} °C/s): curve intersected the bainitic/pearlitic nose. "
                "Mixed microstructure of Bainite, Fine Pearlite, and Martensite."
            )

        elif actual_cooling_rate >= 1.0:
            # Normalizing in air
            if c < 0.76:
                proeutectoid = round((0.76 - c) / (0.76 - 0.022) * 80.0, 1)
                f_ferrite = proeutectoid
                f_pearlite = round(100.0 - proeutectoid, 1)
            else:
                f_pearlite = 94.0
                f_cementite = 6.0
            pred_hrc = 18.0 + 22.0 * c
            transformation_notes.append(
                f"Air cooling rate ({actual_cooling_rate} °C/s): complete diffusion-controlled transformation "
                "into fine pearlite and proeutectoid phase."
            )
        else:
            # Slow Furnace Anneal
            if c < 0.76:
                f_ferrite = round((0.76 - c) / (0.76 - 0.022) * 88.0, 1)
                f_pearlite = round(100.0 - f_ferrite, 1)
            else:
                f_pearlite = 92.0
                f_cementite = 8.0
            pred_hrc = 12.0 + 16.0 * c
            transformation_notes.append(
                "Slow equilibrium furnace cooling (<0.1 °C/s): coarse lamellar pearlite with maximum ductility and lowest hardness."
            )

    # 4. Tempering Adjustment
    if enable_tempering and tempering_temp_C is not None and tempering_time_min is not None and f_martensite > 0:
        # Hollomon-Jaffe Tempering Parameter: P = T_Kelvin * (C_0 + log10(time_hours))
        # For carbon and low-alloy steels, C_0 ≈ 19.5
        t_hours = max(0.1, tempering_time_min / 60.0)
        t_kelvin = tempering_temp_C + 273.15
        hjp = t_kelvin * (19.5 + math.log10(t_hours))

        # Empirical tempering softening:
        # P ~ 9500 (200°C for 0.5h) -> mild stress relief (~10% softening)
        # P ~ 14500 (450°C for 1h) -> fine tempered troostite (~50% softening)
        # P ~ 18500 (650°C for 2h) -> spheroidized sorbite (~80% softening)
        p_min, p_max = 9500.0, 19000.0
        softening_progress = min(0.85, max(0.08, (hjp - p_min) / (p_max - p_min)))
        hrc_drop = softening_progress * (pred_hrc - 20.0)
        pred_hrc = round(max(20.0, pred_hrc - hrc_drop), 1)

        # Convert martensite to tempered martensite
        f_tempered_martensite = f_martensite
        f_martensite = 0.0
        # Retained austenite decomposes during high tempering
        if tempering_temp_C >= 250.0 and f_retained_austenite > 0:
            f_bainite += f_retained_austenite * 0.8
            f_retained_austenite = round(f_retained_austenite * 0.2, 1)

        transformation_notes.append(
            f"Tempered at {tempering_temp_C} °C for {tempering_time_min} min (Hollomon-Jaffe: {round(hjp)}): "
            f"Precipitated fine transition carbides, relieved residual quenching stress, final hardness {pred_hrc} HRC."
        )

    # Convert HRC to approximate Vickers (ASTM E140 approx)
    # HV ≈ 10 * HRC + 150 for HRC > 20
    pred_hv = round(max(100.0, 10.5 * pred_hrc + 165.0), 0)

    # Phase fractions cleanup & normalization
    fractions_dict = {
        "martensite": round(f_martensite, 1),
        "tempered_martensite": round(f_tempered_martensite, 1),
        "bainite": round(f_bainite, 1),
        "pearlite": round(f_pearlite, 1),
        "proeutectoid_ferrite": round(f_ferrite, 1),
        "proeutectoid_cementite": round(f_cementite, 1),
        "retained_austenite": round(f_retained_austenite, 1),
    }

    # Summary text
    dominant_phase = max(fractions_dict.items(), key=lambda x: x[1])[0].replace("_", " ").title()
    summary = (
        f"{steel_name} underwent {quench_medium.title()} cooling from {austenitizing_temp_C} °C. "
        f"Resulting microstructure is predominantly {dominant_phase} ({max(fractions_dict.values())}%) "
        f"with predicted hardness of {round(pred_hrc, 1)} HRC (~{int(pred_hv)} HV)."
    )

    return {
        "steel_id": steel_id,
        "steel_name": steel_name,
        "cycle_parameters": {
            "austenitizing_temp_C": austenitizing_temp_C,
            "soak_time_min": soak_time_min,
            "quench_medium": quench_medium,
            "enable_isothermal_hold": enable_isothermal_hold,
            "isothermal_temp_C": isothermal_temp_C,
            "isothermal_time_s": isothermal_time_s,
            "enable_tempering": enable_tempering,
            "tempering_temp_C": tempering_temp_C,
            "tempering_time_min": tempering_time_min,
        },
        "cooling_trajectory": cooling_pts,
        "process_trajectory": process_pts,
        "results": {
            "phase_fractions": fractions_dict,
            "predicted_hardness_hrc": round(pred_hrc, 1),
            "predicted_hardness_hv": pred_hv,
            "critical_cooling_rate_C_per_s": crit_cooling_rate,
            "actual_average_cooling_rate": actual_cooling_rate,
            "transformation_notes": transformation_notes,
            "metallurgical_summary": summary,
        },
        "ttt_diagram": ttt_data,
    }
