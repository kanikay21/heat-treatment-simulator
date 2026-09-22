from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.engine.phase_diagram import (
    calculate_alloy_critical_temperatures,
    calculate_lever_rule,
    generate_phase_diagram_boundaries,
)
from app.models.steel import Steel
from app.schemas.phase_diagram import (
    LeverRuleRequest,
    LeverRuleResponse,
    PhaseDiagramBoundariesResponse,
    SteelPhaseDiagramResponse,
)
from app.schemas.steel import SteelSummary

router = APIRouter()


@router.get("/health")
def health_check(db: Session = Depends(get_db)) -> dict:
    steel_count = db.query(Steel).count()
    return {
        "status": "ok",
        "app": settings.app_name,
        "steels_loaded": steel_count,
    }


@router.get("/steels", response_model=list[SteelSummary])
def list_steels(db: Session = Depends(get_db)) -> list[Steel]:
    return db.query(Steel).order_by(Steel.name).all()


@router.get("/steels/{steel_id}", response_model=SteelSummary)
def get_steel(steel_id: int, db: Session = Depends(get_db)) -> Steel:
    steel = db.query(Steel).filter(Steel.id == steel_id).first()
    if steel is None:
        raise HTTPException(status_code=404, detail="Steel not found")
    return steel


@router.get("/phase-diagram/boundaries", response_model=PhaseDiagramBoundariesResponse)
def get_phase_diagram_boundaries() -> dict:
    """Returns boundary curves, invariant points, and region geometries for Fe-Fe3C phase diagram."""
    return generate_phase_diagram_boundaries()


@router.post("/phase-diagram/lever-rule", response_model=LeverRuleResponse)
def compute_lever_rule(payload: LeverRuleRequest, db: Session = Depends(get_db)) -> dict:
    """Calculates phase fractions, tie-lines, and microconstituent breakdown for given (C wt%, Temp °C)."""
    return calculate_lever_rule(
        carbon_wt=payload.carbon_wt,
        temperature_C=payload.temperature_C,
        steel_id=payload.steel_id,
    )


@router.get("/steels/{steel_id}/phase-diagram", response_model=SteelPhaseDiagramResponse)
def get_steel_phase_diagram(steel_id: int, db: Session = Depends(get_db)) -> dict:
    """Returns phase diagram context, critical temperatures, and baseline microstructure for a specific steel grade."""
    steel = db.query(Steel).filter(Steel.id == steel_id).first()
    if steel is None:
        raise HTTPException(status_code=404, detail="Steel not found")

    composition = {
        "C": steel.C,
        "Mn": steel.Mn,
        "Si": steel.Si,
        "Cr": steel.Cr,
        "Ni": steel.Ni,
        "Mo": steel.Mo,
    }

    alloy_temps = calculate_alloy_critical_temperatures(
        c=steel.C,
        mn=steel.Mn,
        si=steel.Si,
        cr=steel.Cr,
        ni=steel.Ni,
        mo=steel.Mo,
    )

    room_temp_analysis = calculate_lever_rule(carbon_wt=steel.C, temperature_C=25.0, steel_id=steel.id)

    # Standard austenitizing recommendation: A3/Acm + 50°C
    a3_or_acm = room_temp_analysis["critical_temperatures"].get("A3") or room_temp_analysis["critical_temperatures"].get("Acm") or 850.0
    rec_aust_temp = round(a3_or_acm + 50.0, 1)

    return {
        "steel_id": steel.id,
        "name": steel.name,
        "category": steel.category,
        "composition": composition,
        "critical_temperatures": room_temp_analysis["critical_temperatures"],
        "alloy_critical_temperatures": alloy_temps,
        "equilibrium_room_temp": room_temp_analysis,
        "austenitizing_recommended_temp_C": rec_aust_temp,
    }
