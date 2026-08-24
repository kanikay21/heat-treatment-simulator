"""Reference compositions and curve data for seed steels.

TTT points are simplified textbook approximations for development.
Replace with WebPlotDigitizer-extracted data for production accuracy.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class SteelSeed:
    name: str
    C: float
    Mn: float
    Si: float
    Cr: float
    Ni: float
    Mo: float
    category: str


@dataclass(frozen=True)
class TTTPointSeed:
    phase: str
    temperature_C: float
    time_seconds: float


@dataclass(frozen=True)
class JominyPointSeed:
    distance_mm: float
    hardness_HRC: float


STEELS: list[SteelSeed] = [
    SteelSeed("AISI 1045", 0.45, 0.75, 0.22, 0.0, 0.0, 0.0, "plain-carbon"),
    SteelSeed("AISI 1080", 0.80, 0.75, 0.22, 0.0, 0.0, 0.0, "plain-carbon"),
    SteelSeed("AISI 4140", 0.40, 0.85, 0.25, 0.95, 0.0, 0.20, "alloy"),
]

# Simplified TTT curve points keyed by steel name
TTT_DATA: dict[str, list[TTTPointSeed]] = {
    "AISI 1045": [
        # Pearlite start (upper curve)
        TTTPointSeed("pearlite_start", 720, 10),
        TTTPointSeed("pearlite_start", 700, 100),
        TTTPointSeed("pearlite_start", 680, 1000),
        TTTPointSeed("pearlite_start", 650, 10000),
        # Pearlite finish (lower curve)
        TTTPointSeed("pearlite_end", 720, 100),
        TTTPointSeed("pearlite_end", 700, 1000),
        TTTPointSeed("pearlite_end", 680, 10000),
        TTTPointSeed("pearlite_end", 650, 100000),
        # Bainite start
        TTTPointSeed("bainite_start", 550, 10),
        TTTPointSeed("bainite_start", 500, 100),
        TTTPointSeed("bainite_start", 450, 1000),
        TTTPointSeed("bainite_start", 400, 10000),
        # Bainite finish
        TTTPointSeed("bainite_end", 550, 1000),
        TTTPointSeed("bainite_end", 500, 10000),
        TTTPointSeed("bainite_end", 450, 100000),
        # Martensite start (Ms line — time-independent marker)
        TTTPointSeed("ms", 330, 1),
    ],
    "AISI 1080": [
        TTTPointSeed("pearlite_start", 710, 5),
        TTTPointSeed("pearlite_start", 680, 50),
        TTTPointSeed("pearlite_start", 650, 500),
        TTTPointSeed("pearlite_start", 600, 5000),
        TTTPointSeed("pearlite_end", 710, 50),
        TTTPointSeed("pearlite_end", 680, 500),
        TTTPointSeed("pearlite_end", 650, 5000),
        TTTPointSeed("pearlite_end", 600, 50000),
        TTTPointSeed("bainite_start", 520, 5),
        TTTPointSeed("bainite_start", 470, 50),
        TTTPointSeed("bainite_start", 420, 500),
        TTTPointSeed("bainite_end", 520, 500),
        TTTPointSeed("bainite_end", 470, 5000),
        TTTPointSeed("bainite_end", 420, 50000),
        TTTPointSeed("ms", 250, 1),
    ],
    "AISI 4140": [
        TTTPointSeed("pearlite_start", 750, 100),
        TTTPointSeed("pearlite_start", 700, 1000),
        TTTPointSeed("pearlite_start", 650, 10000),
        TTTPointSeed("pearlite_start", 600, 100000),
        TTTPointSeed("pearlite_end", 750, 1000),
        TTTPointSeed("pearlite_end", 700, 10000),
        TTTPointSeed("pearlite_end", 650, 100000),
        TTTPointSeed("pearlite_end", 600, 1000000),
        TTTPointSeed("bainite_start", 500, 10),
        TTTPointSeed("bainite_start", 450, 100),
        TTTPointSeed("bainite_start", 400, 1000),
        TTTPointSeed("bainite_end", 500, 1000),
        TTTPointSeed("bainite_end", 450, 10000),
        TTTPointSeed("bainite_end", 400, 100000),
        TTTPointSeed("ms", 310, 1),
    ],
}

JOMINY_DATA: dict[str, list[JominyPointSeed]] = {
    "AISI 1045": [
        JominyPointSeed(1.5, 58),
        JominyPointSeed(3.0, 55),
        JominyPointSeed(6.0, 45),
        JominyPointSeed(9.0, 38),
        JominyPointSeed(12.0, 32),
        JominyPointSeed(24.0, 25),
        JominyPointSeed(32.0, 22),
    ],
    "AISI 1080": [
        JominyPointSeed(1.5, 62),
        JominyPointSeed(3.0, 60),
        JominyPointSeed(6.0, 52),
        JominyPointSeed(9.0, 45),
        JominyPointSeed(12.0, 38),
        JominyPointSeed(24.0, 30),
        JominyPointSeed(32.0, 26),
    ],
    "AISI 4140": [
        JominyPointSeed(1.5, 57),
        JominyPointSeed(3.0, 55),
        JominyPointSeed(6.0, 50),
        JominyPointSeed(9.0, 45),
        JominyPointSeed(12.0, 40),
        JominyPointSeed(24.0, 32),
        JominyPointSeed(32.0, 28),
    ],
}
