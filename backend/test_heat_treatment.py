"""Unit tests for Heat Treatment & TTT Kinetics Engine."""

import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.engine.heat_treatment import generate_ttt_diagram, simulate_thermal_cycle


def test_ttt_diagram_generation():
    print("Testing TTT Diagram generation for AISI 1045...")
    ttt_1045 = generate_ttt_diagram(
        steel_id=1,
        steel_name="AISI 1045",
        c=0.45,
        mn=0.75,
        si=0.22,
        cr=0.0,
        ni=0.0,
        mo=0.0,
    )
    assert "pearlite_start" in ttt_1045["curves"]
    assert "bainite_start" in ttt_1045["curves"]
    assert len(ttt_1045["curves"]["pearlite_start"]) > 10
    assert ttt_1045["markers"]["Ms"] < 400.0
    assert ttt_1045["markers"]["critical_cooling_rate_C_per_s"] > 50.0
    print(f"[OK] AISI 1045 TTT: Ms = {ttt_1045['markers']['Ms']}°C, Crit Rate = {ttt_1045['markers']['critical_cooling_rate_C_per_s']} °C/s")

    print("Testing TTT Diagram generation for AISI 4140 (alloy steel with higher hardenability)...")
    ttt_4140 = generate_ttt_diagram(
        steel_id=3,
        steel_name="AISI 4140",
        c=0.40,
        mn=0.85,
        si=0.25,
        cr=0.95,
        ni=0.0,
        mo=0.20,
    )
    # Due to Cr and Mo, pearlite nose time should be significantly delayed compared to 1045
    t_nose_1045 = ttt_1045["markers"]["pearlite_nose_time_s"]
    t_nose_4140 = ttt_4140["markers"]["pearlite_nose_time_s"]
    assert t_nose_4140 > t_nose_1045
    print(f"[OK] AISI 4140 Pearlitic nose delayed: {t_nose_4140:.2f}s vs 1045: {t_nose_1045:.2f}s")


def test_thermal_cycle_water_quench():
    print("Testing severe Water Quench simulation (expecting Martensite)...")
    comp = {"C": 0.45, "Mn": 0.75, "Si": 0.22, "Cr": 0.0, "Ni": 0.0, "Mo": 0.0}
    res = simulate_thermal_cycle(
        steel_id=1,
        steel_name="AISI 1045",
        composition=comp,
        austenitizing_temp_C=850.0,
        quench_medium="water",
        enable_tempering=False,
    )
    phases = res["results"]["phase_fractions"]
    print(f"[OK] Water Quench Phases: {phases}")
    assert phases["martensite"] > 90.0
    assert res["results"]["predicted_hardness_hrc"] >= 55.0


def test_thermal_cycle_quench_and_temper():
    print("Testing Quench and Tempering at 450°C...")
    comp = {"C": 0.45, "Mn": 0.75, "Si": 0.22, "Cr": 0.0, "Ni": 0.0, "Mo": 0.0}
    res = simulate_thermal_cycle(
        steel_id=1,
        steel_name="AISI 1045",
        composition=comp,
        austenitizing_temp_C=850.0,
        quench_medium="water",
        enable_tempering=True,
        tempering_temp_C=450.0,
        tempering_time_min=60.0,
    )
    phases = res["results"]["phase_fractions"]
    hrc = res["results"]["predicted_hardness_hrc"]
    print(f"[OK] Tempered Phases: {phases}, Hardness: {hrc} HRC")
    assert phases["tempered_martensite"] > 90.0
    assert phases["martensite"] == 0.0
    assert 35.0 <= hrc <= 50.0  # Tempered hardness dropped appropriately


def test_thermal_cycle_austempering():
    print("Testing Austempering (Isothermal hold at 360°C)...")
    comp = {"C": 0.80, "Mn": 0.75, "Si": 0.22, "Cr": 0.0, "Ni": 0.0, "Mo": 0.0}
    res = simulate_thermal_cycle(
        steel_id=2,
        steel_name="AISI 1080",
        composition=comp,
        austenitizing_temp_C=820.0,
        enable_isothermal_hold=True,
        isothermal_temp_C=360.0,
        isothermal_time_s=1200.0,
    )
    phases = res["results"]["phase_fractions"]
    print(f"[OK] Austempered Phases: {phases}")
    assert phases["bainite"] > 90.0


def test_thermal_cycle_furnace_anneal():
    print("Testing Slow Furnace Cool (Full Anneal)...")
    comp = {"C": 0.45, "Mn": 0.75, "Si": 0.22, "Cr": 0.0, "Ni": 0.0, "Mo": 0.0}
    res = simulate_thermal_cycle(
        steel_id=1,
        steel_name="AISI 1045",
        composition=comp,
        austenitizing_temp_C=850.0,
        quench_medium="furnace",
    )
    phases = res["results"]["phase_fractions"]
    print(f"[OK] Furnace Anneal Phases: {phases}")
    assert phases["pearlite"] > 40.0
    assert phases["proeutectoid_ferrite"] > 30.0
    assert phases["martensite"] == 0.0


if __name__ == "__main__":
    test_ttt_diagram_generation()
    test_thermal_cycle_water_quench()
    test_thermal_cycle_quench_and_temper()
    test_thermal_cycle_austempering()
    test_thermal_cycle_furnace_anneal()
    print("\nALL HEAT TREATMENT UNIT TESTS PASSED!")
