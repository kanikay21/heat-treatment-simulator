from typing import Any, Optional
from pydantic import BaseModel, Field


class TTTCurvePoint(BaseModel):
    time_s: float
    temp_C: float


class TTTCurve(BaseModel):
    name: str
    phase: str
    points: list[TTTCurvePoint]


class TTTDiagramResponse(BaseModel):
    steel_id: int
    steel_name: str
    composition: dict[str, float]
    critical_temperatures: dict[str, float]
    time_range_s: list[float] = [0.1, 100000.0]
    temp_range_C: list[float] = [0.0, 950.0]
    curves: dict[str, list[TTTCurvePoint]]
    markers: dict[str, float]


class ThermalCycleRequest(BaseModel):
    steel_id: int
    process_type: str = Field(
        default="quench_temper",
        description="Preset: 'anneal', 'normalize', 'quench_temper', 'austemper', 'martemper', 'custom'",
    )
    austenitizing_temp_C: float = Field(default=850.0, ge=700.0, le=1150.0)
    soak_time_min: float = Field(default=30.0, ge=5.0, le=300.0)
    quench_medium: str = Field(
        default="water",
        description="'water', 'oil', 'air', 'furnace', 'polymer', 'custom'",
    )
    custom_cooling_rate: Optional[float] = Field(default=None, ge=0.01, le=500.0)
    enable_isothermal_hold: bool = Field(default=False)
    isothermal_temp_C: Optional[float] = Field(default=350.0, ge=150.0, le=600.0)
    isothermal_time_s: Optional[float] = Field(default=600.0, ge=1.0, le=50000.0)
    enable_tempering: bool = Field(default=False)
    tempering_temp_C: Optional[float] = Field(default=400.0, ge=150.0, le=680.0)
    tempering_time_min: Optional[float] = Field(default=60.0, ge=10.0, le=240.0)


class CoolingTrajectoryPoint(BaseModel):
    time_s: float
    temp_C: float
    stage: str


class ProcessTrajectoryPoint(BaseModel):
    total_time_min: float
    temp_C: float
    stage: str


class PhaseFractions(BaseModel):
    martensite: float
    tempered_martensite: float
    bainite: float
    pearlite: float
    proeutectoid_ferrite: float
    proeutectoid_cementite: float
    retained_austenite: float


class SimulationResults(BaseModel):
    phase_fractions: PhaseFractions
    predicted_hardness_hrc: float
    predicted_hardness_hv: float
    critical_cooling_rate_C_per_s: float
    actual_average_cooling_rate: float
    transformation_notes: list[str]
    metallurgical_summary: str


class ThermalCycleResponse(BaseModel):
    steel_id: int
    steel_name: str
    cycle_parameters: dict[str, Any]
    cooling_trajectory: list[CoolingTrajectoryPoint]
    process_trajectory: list[ProcessTrajectoryPoint]
    results: SimulationResults
    ttt_diagram: TTTDiagramResponse
