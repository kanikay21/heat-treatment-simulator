from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.schemas.steel import SteelSummary
from app.models.steel import Steel

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
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Steel not found")
    return steel
