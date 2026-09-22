import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from app.engine.phase_diagram import (
    calculate_alloy_critical_temperatures,
    calculate_lever_rule,
    generate_phase_diagram_boundaries,
    temp_a3,
    temp_acm,
)


def test_phase_diagram_calculations():
    print("Testing Fe-Fe3C Phase Diagram Engine...")

    # 1. Test Invariant & Boundary curves
    t_a3_0 = temp_a3(0.0)
    assert abs(t_a3_0 - 912.0) < 0.1, f"Expected 912.0 at 0% C, got {t_a3_0}"

    t_a3_eut = temp_a3(0.76)
    assert abs(t_a3_eut - 727.0) < 0.1, f"Expected 727.0 at 0.76% C, got {t_a3_eut}"

    t_acm_eut = temp_acm(0.76)
    assert abs(t_acm_eut - 727.0) < 0.1, f"Expected 727.0 at 0.76% C, got {t_acm_eut}"

    t_acm_max = temp_acm(2.14)
    assert abs(t_acm_max - 1147.0) < 0.1, f"Expected 1147.0 at 2.14% C, got {t_acm_max}"

    print("[OK] Invariant boundary lines verified.")

    # 2. Test AISI 1045 (0.45% C) at room temp (25°C) -> Ferrite + Pearlite
    res_1045_rt = calculate_lever_rule(carbon_wt=0.45, temperature_C=25.0)
    assert res_1045_rt["region_id"] == "ferrite_pearlite"
    consts = res_1045_rt["microconstituents"]
    # Proeutectoid Ferrite: (0.76 - 0.45)/(0.76 - 0.022) = 0.31 / 0.738 = ~42%
    # Pearlite: (0.45 - 0.022)/(0.76 - 0.022) = 0.428 / 0.738 = ~58%
    assert 40.0 <= consts["Proeutectoid Ferrite (alpha)"] <= 44.0 if "Proeutectoid Ferrite (alpha)" in consts else 40.0 <= list(consts.values())[0] <= 44.0, f"Unexpected Ferrite %: {consts}"
    print(f"[OK] AISI 1045 Room Temp: {consts}")

    # 3. Test AISI 1045 at 850°C -> 100% Austenite (gamma)
    res_1045_aust = calculate_lever_rule(carbon_wt=0.45, temperature_C=850.0)
    assert res_1045_aust["region_id"] == "austenite"
    assert list(res_1045_aust["phase_fractions"].values())[0] == 100.0
    print("[OK] AISI 1045 at 850°C: 100% Austenite verified.")

    # 4. Test AISI 1045 at 750°C -> Dual Phase (Ferrite + Austenite)
    res_1045_dual = calculate_lever_rule(carbon_wt=0.45, temperature_C=750.0)
    assert res_1045_dual["region_id"] == "ferrite_austenite"
    print(f"[OK] AISI 1045 at 750°C Intercritical: {res_1045_dual['phase_fractions']}")

    # 5. Test AISI 1080 (0.80% C) at room temp -> Pearlite + Proeutectoid Cementite
    res_1080_rt = calculate_lever_rule(carbon_wt=0.80, temperature_C=25.0)
    assert res_1080_rt["region_id"] == "pearlite_cementite"
    print(f"[OK] AISI 1080 Room Temp: {res_1080_rt['microconstituents']}")

    # 6. Test Alloy critical temperatures for AISI 4140 (0.40 C, 0.85 Mn, 0.25 Si, 0.95 Cr, 0.20 Mo)
    alloy_4140 = calculate_alloy_critical_temperatures(c=0.40, mn=0.85, si=0.25, cr=0.95, ni=0.0, mo=0.20)
    print(f"[OK] AISI 4140 Critical Temperatures: {alloy_4140}")
    assert 300.0 <= alloy_4140["Ms"] <= 380.0

    # 7. Test Boundary generation payload
    boundaries = generate_phase_diagram_boundaries()
    assert len(boundaries["curves"]["a3_curve"]) == 50
    assert len(boundaries["curves"]["liquidus"]) == 100
    assert "steel_focus" in boundaries["viewports"]
    print(f"[OK] Boundary datasets generated with {len(boundaries['regions'])} colored regions.")

    print("\nALL ENGINE UNIT TESTS PASSED!")


if __name__ == "__main__":
    test_phase_diagram_calculations()
