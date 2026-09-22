from __future__ import annotations

from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class InvariantPoint(BaseModel):
    C: float
    T: float
    name: str


class CurvePoint(BaseModel):
    c: float
    t: float


class HorizontalLine(BaseModel):
    id: str
    name: str
    temperature_C: float
    c_start: float
    c_end: float
    significance: str


class DiagramRegion(BaseModel):
    id: str
    name: str
    crystal_structure: str
    color: str
    description: str


class ViewportConfig(BaseModel):
    c_min: float
    c_max: float
    t_min: float
    t_max: float
    title: str


class PhaseDiagramBoundariesResponse(BaseModel):
    curves: dict[str, list[CurvePoint]]
    invariants: dict[str, InvariantPoint]
    horizontal_lines: list[HorizontalLine]
    regions: list[DiagramRegion]
    viewports: dict[str, ViewportConfig]


class LeverRuleRequest(BaseModel):
    carbon_wt: float = Field(..., ge=0.0, le=6.67, description="Carbon weight percent (0.0 to 6.67%)")
    temperature_C: float = Field(..., ge=0.0, le=1600.0, description="Temperature in Celsius (0 to 1600°C)")
    steel_id: int | None = Field(None, description="Optional steel ID for composition context")


class LeverRuleResponse(BaseModel):
    carbon_wt: float
    temperature_C: float
    region_id: str
    region_name: str
    crystal_structure: str
    equilibrium_phases: list[str]
    phase_fractions: dict[str, float]
    microconstituents: dict[str, float]
    tie_line: dict[str, Any]
    explanation: str
    quenched_preview: str
    microstructure_recipe: dict[str, Any]
    critical_temperatures: dict[str, float | None]


class SteelPhaseDiagramResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    steel_id: int
    name: str
    category: str
    composition: dict[str, float]
    critical_temperatures: dict[str, float | None]
    alloy_critical_temperatures: dict[str, float]
    equilibrium_room_temp: LeverRuleResponse
    austenitizing_recommended_temp_C: float
