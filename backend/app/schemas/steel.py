from pydantic import BaseModel, ConfigDict, Field


class SteelBase(BaseModel):
    name: str
    C: float = Field(..., description="Carbon content (wt%)")
    Mn: float = Field(0.0, description="Manganese (wt%)")
    Si: float = Field(0.0, description="Silicon (wt%)")
    Cr: float = Field(0.0, description="Chromium (wt%)")
    Ni: float = Field(0.0, description="Nickel (wt%)")
    Mo: float = Field(0.0, description="Molybdenum (wt%)")
    category: str


class SteelSummary(SteelBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class SteelDetail(SteelSummary):
    pass


class TTTCurvePointSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    phase: str
    temperature_C: float
    time_seconds: float
