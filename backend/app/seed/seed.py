from sqlalchemy.orm import Session

from app.models.steel import JominyReference, Steel, TTTCurvePoint
from app.seed.data import JOMINY_DATA, STEELS, TTT_DATA


def seed_database(db: Session) -> None:
    if db.query(Steel).count() > 0:
        return

    for steel_seed in STEELS:
        steel = Steel(
            name=steel_seed.name,
            C=steel_seed.C,
            Mn=steel_seed.Mn,
            Si=steel_seed.Si,
            Cr=steel_seed.Cr,
            Ni=steel_seed.Ni,
            Mo=steel_seed.Mo,
            category=steel_seed.category,
        )
        db.add(steel)
        db.flush()

        for point in TTT_DATA.get(steel_seed.name, []):
            db.add(
                TTTCurvePoint(
                    steel_id=steel.id,
                    phase=point.phase,
                    temperature_C=point.temperature_C,
                    time_seconds=point.time_seconds,
                )
            )

        for point in JOMINY_DATA.get(steel_seed.name, []):
            db.add(
                JominyReference(
                    steel_id=steel.id,
                    distance_mm=point.distance_mm,
                    hardness_HRC=point.hardness_HRC,
                )
            )

    db.commit()
