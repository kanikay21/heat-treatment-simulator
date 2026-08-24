from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Steel(Base):
    __tablename__ = "steels"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    C: Mapped[float] = mapped_column(Float, nullable=False)
    Mn: Mapped[float] = mapped_column(Float, default=0.0)
    Si: Mapped[float] = mapped_column(Float, default=0.0)
    Cr: Mapped[float] = mapped_column(Float, default=0.0)
    Ni: Mapped[float] = mapped_column(Float, default=0.0)
    Mo: Mapped[float] = mapped_column(Float, default=0.0)
    category: Mapped[str] = mapped_column(String(32), nullable=False)

    ttt_curve_points: Mapped[list["TTTCurvePoint"]] = relationship(
        back_populates="steel", cascade="all, delete-orphan"
    )
    jominy_references: Mapped[list["JominyReference"]] = relationship(
        back_populates="steel", cascade="all, delete-orphan"
    )


class TTTCurvePoint(Base):
    __tablename__ = "ttt_curve_points"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    steel_id: Mapped[int] = mapped_column(ForeignKey("steels.id"), nullable=False, index=True)
    phase: Mapped[str] = mapped_column(String(32), nullable=False)
    temperature_C: Mapped[float] = mapped_column(Float, nullable=False)
    time_seconds: Mapped[float] = mapped_column(Float, nullable=False)

    steel: Mapped["Steel"] = relationship(back_populates="ttt_curve_points")


class JominyReference(Base):
    __tablename__ = "jominy_reference"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    steel_id: Mapped[int] = mapped_column(ForeignKey("steels.id"), nullable=False, index=True)
    distance_mm: Mapped[float] = mapped_column(Float, nullable=False)
    hardness_HRC: Mapped[float] = mapped_column(Float, nullable=False)

    steel: Mapped["Steel"] = relationship(back_populates="jominy_references")
