import React, { useRef, useEffect, useState } from 'react';
import { Microscope, Zap, Eye, RefreshCw } from 'lucide-react';

export default function MicrostructureCanvas({
  carbon,
  temperature,
  leverResult,
  selectedSteel,
}) {
  const canvasRef = useRef(null);
  const [magnification, setMagnification] = useState(500);
  const [isQuenched, setIsQuenched] = useState(false);
  const [seed, setSeed] = useState(42);

  // Generate deterministic pseudo-random numbers
  const pseudoRandom = (n) => {
    const x = Math.sin(seed + n) * 10000;
    return x - Math.floor(x);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 4;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // Clip to circle for microscope eyepiece effect
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();

    // Fill background base metal color
    ctx.fillStyle = '#1e2430';
    ctx.fillRect(0, 0, width, height);

    const recipe = leverResult?.microstructure_recipe || {};
    const primaryType = recipe.primary_type || leverResult?.region_id || 'austenite';
    const ferriteFrac = recipe.ferrite_fraction ?? (carbon < 0.76 && temperature <= 727 ? (0.76 - carbon) / 0.738 : 0);
    const pearliteFrac = recipe.pearlite_fraction ?? (1 - ferriteFrac);
    const cementiteFrac = recipe.cementite_fraction ?? 0;

    // Number of grains depends on magnification
    const numGrains = magnification === 100 ? 120 : magnification === 500 ? 45 : 18;

    // -------------------------------------------------------------
    // RENDER PROCEDURAL METALLOGRAPHY
    // -------------------------------------------------------------
    if (isQuenched && temperature >= 700) {
      // -----------------------------------------------------------
      // QUENCHED STATE: Acicular Martensite Laths & Needles
      // -----------------------------------------------------------
      // Matrix background (retained austenite / fine matrix)
      ctx.fillStyle = '#2d1e2f';
      ctx.fillRect(0, 0, width, height);

      // Prior austenite grain boundaries (ghost boundaries)
      const grainCenters = [];
      for (let i = 0; i < 15; i++) {
        grainCenters.push({
          x: pseudoRandom(i * 11) * width,
          y: pseudoRandom(i * 13) * height,
        });
      }

      ctx.strokeStyle = 'rgba(236, 72, 153, 0.25)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < grainCenters.length; i++) {
        for (let j = i + 1; j < grainCenters.length; j++) {
          const dist = Math.hypot(grainCenters[i].x - grainCenters[j].x, grainCenters[i].y - grainCenters[j].y);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(grainCenters[i].x, grainCenters[i].y);
            ctx.lineTo(grainCenters[j].x, grainCenters[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw dense criss-crossing Martensite needles / laths
      const numNeedles = magnification === 1000 ? 250 : magnification === 500 ? 450 : 700;
      for (let i = 0; i < numNeedles; i++) {
        const nx = pseudoRandom(i * 3 + 1) * width;
        const ny = pseudoRandom(i * 5 + 2) * height;
        const length = (20 + pseudoRandom(i * 7) * 55) * (magnification / 500);
        // Angle oriented in packets (typically 60-degree or 120-degree crystallographic habit planes)
        const packetAngle = (Math.floor(pseudoRandom(i * 2) * 4) * Math.PI) / 3;
        const angle = packetAngle + (pseudoRandom(i * 9) - 0.5) * 0.35;

        ctx.strokeStyle = i % 3 === 0 ? '#f472b6' : i % 3 === 1 ? '#db2777' : '#9d174d';
        ctx.lineWidth = 1.0 + pseudoRandom(i * 4) * 1.5;
        ctx.beginPath();
        ctx.moveTo(nx - Math.cos(angle) * (length / 2), ny - Math.sin(angle) * (length / 2));
        ctx.lineTo(nx + Math.cos(angle) * (length / 2), ny + Math.sin(angle) * (length / 2));
        ctx.stroke();
      }
    } else if (primaryType === 'austenite' || temperature >= 912) {
      // -----------------------------------------------------------
      // AUSTENITE (γ): Equiaxed FCC Grains with Annealing Twins
      // -----------------------------------------------------------
      const grainPoints = generateVoronoiGrains(numGrains, width, height, seed);
      drawGrains(ctx, grainPoints, width, height, (idx) => {
        // Austenite grain shading
        const shade = 180 + Math.floor(pseudoRandom(idx * 7) * 45);
        return `rgb(${shade - 20}, ${shade - 30}, ${shade + 10})`;
      });

      // Add annealing twin bands across ~30% of austenite grains
      ctx.strokeStyle = 'rgba(60, 40, 80, 0.8)';
      ctx.lineWidth = 1.8;
      for (let i = 0; i < grainPoints.length; i++) {
        if (pseudoRandom(i * 17) > 0.6) {
          const pt = grainPoints[i];
          const twinAngle = pseudoRandom(i * 23) * Math.PI;
          ctx.beginPath();
          ctx.moveTo(pt.x - Math.cos(twinAngle) * 25, pt.y - Math.sin(twinAngle) * 25);
          ctx.lineTo(pt.x + Math.cos(twinAngle) * 25, pt.y + Math.sin(twinAngle) * 25);
          ctx.stroke();
        }
      }
    } else if (primaryType === 'ferrite_pearlite' || (temperature <= 727 && carbon < 0.76)) {
      // -----------------------------------------------------------
      // HYPOEUTECTOID: Proeutectoid Ferrite + Pearlite Colonies
      // -----------------------------------------------------------
      const grainPoints = generateVoronoiGrains(numGrains, width, height, seed);

      drawGrains(ctx, grainPoints, width, height, (idx) => {
        const isFerrite = pseudoRandom(idx * 19) < ferriteFrac;
        if (isFerrite) {
          // Light etched polygonal Ferrite grain (BCC)
          const shade = 215 + Math.floor(pseudoRandom(idx * 5) * 30);
          return `rgb(${shade}, ${shade + 2}, ${shade + 5})`;
        } else {
          // Pearlite matrix
          return '#64748b';
        }
      });

      // Overlay fine lamellar stripes for Pearlite colonies
      grainPoints.forEach((pt, idx) => {
        const isFerrite = pseudoRandom(idx * 19) < ferriteFrac;
        if (!isFerrite) {
          drawPearliteColony(ctx, pt.x, pt.y, 35 * (500 / magnification), pseudoRandom(idx * 31) * Math.PI);
        }
      });
    } else if (primaryType === 'pearlite_cementite' || (temperature <= 727 && carbon >= 0.76)) {
      // -----------------------------------------------------------
      // HYPEREUTECTOID: Pearlite + Grain Boundary Cementite Network
      // -----------------------------------------------------------
      const grainPoints = generateVoronoiGrains(numGrains, width, height, seed);

      // Draw 100% Pearlite colonies
      drawGrains(ctx, grainPoints, width, height, () => '#475569');

      grainPoints.forEach((pt, idx) => {
        drawPearliteColony(ctx, pt.x, pt.y, 40 * (500 / magnification), pseudoRandom(idx * 29) * Math.PI);
      });

      // Continuous bright white cementite network on prior austenite boundaries
      if (carbon > 0.8) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.min(4, Math.max(1.5, (carbon - 0.76) * 6));
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 4;
        drawGrainBoundaries(ctx, grainPoints, width, height);
        ctx.shadowBlur = 0;
      }
    } else if (primaryType === 'ferrite_austenite') {
      // -----------------------------------------------------------
      // DUAL PHASE INTERCRITICAL (α + γ)
      // -----------------------------------------------------------
      const grainPoints = generateVoronoiGrains(numGrains, width, height, seed);
      drawGrains(ctx, grainPoints, width, height, (idx) => {
        const isAustenite = pseudoRandom(idx * 13) < (1 - ferriteFrac);
        if (isAustenite) {
          return '#818cf8'; // Austenite grains
        }
        return '#e2e8f0'; // Ferrite grains
      });
    } else {
      // Liquid or Cast Iron / Ledeburite
      ctx.fillStyle = '#f97316';
      ctx.fillRect(0, 0, width, height);
    }

    // Vignette lighting and microscope glare
    const glareGrad = ctx.createRadialGradient(
      centerX - 40,
      centerY - 40,
      10,
      centerX,
      centerY,
      radius
    );
    glareGrad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    glareGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.05)');
    glareGrad.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
    ctx.fillStyle = glareGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }, [carbon, temperature, leverResult, magnification, isQuenched, seed]);

  // Helper function: draw alternating lamellae stripes for Pearlite
  const drawPearliteColony = (ctx, cx, cy, size, angle) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, size, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#cbd5e1'; // Ferrite matrix
    ctx.fillRect(cx - size, cy - size, size * 2, size * 2);

    ctx.strokeStyle = '#0f172a'; // Cementite lamellae
    ctx.lineWidth = 1.2;
    const spacing = 3.5;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    for (let d = -size * 1.5; d <= size * 1.5; d += spacing) {
      ctx.beginPath();
      ctx.moveTo(cx + cos * d - sin * size * 1.5, cy + sin * d + cos * size * 1.5);
      ctx.lineTo(cx + cos * d + sin * size * 1.5, cy + sin * d - cos * size * 1.5);
      ctx.stroke();
    }
    ctx.restore();
  };

  // Helper function: generate Voronoi-like grain seeds
  const generateVoronoiGrains = (count, w, h, baseSeed) => {
    const pts = [];
    for (let i = 0; i < count; i++) {
      const x = (pseudoRandom(i * 7 + baseSeed) * 0.9 + 0.05) * w;
      const y = (pseudoRandom(i * 13 + baseSeed) * 0.9 + 0.05) * h;
      pts.push({ x, y, id: i });
    }
    return pts;
  };

  // Helper function: draw polygonal grains by approximating nearest neighbors
  const drawGrains = (ctx, pts, w, h, colorFn) => {
    pts.forEach((pt, idx) => {
      ctx.fillStyle = colorFn(idx);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, (w / Math.sqrt(pts.length)) * 0.65, 0, Math.PI * 2);
      ctx.fill();
    });

    // Dark grain boundary outlines
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.lineWidth = 1.5;
    drawGrainBoundaries(ctx, pts, w, h);
  };

  const drawGrainBoundaries = (ctx, pts, w, h) => {
    const threshold = (w / Math.sqrt(pts.length)) * 1.25;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dist = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        if (dist < threshold) {
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.stroke();
        }
      }
    }
  };

  return (
    <div className="glass-panel microscope-card">
      <div className="glass-panel-header">
        <div className="panel-title">
          <Microscope size={18} color="var(--phase-ferrite)" />
          Microstructure Simulator
        </div>
        <button
          className="btn-close"
          onClick={() => setSeed((prev) => prev + 1)}
          title="Regenerate random grain realization"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="microscope-canvas-wrapper">
        {/* Eyepiece Circle */}
        <div className="microscope-eyepiece">
          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            className="microscope-canvas"
          />
          <div className="microscope-reticle" />

          {/* Scale Bar */}
          <div className="microscope-scale-bar">
            <div className="scale-bar-line" />
            <span className="scale-bar-text">
              {magnification === 100 ? '200 µm' : magnification === 500 ? '50 µm' : '20 µm'}
            </span>
          </div>
        </div>

        {/* Microscope Toolbar */}
        <div className="microscope-toolbar">
          <div className="mag-pill-group">
            {[100, 500, 1000].map((mag) => (
              <button
                key={mag}
                className={`mag-pill ${magnification === mag ? 'active' : ''}`}
                onClick={() => setMagnification(mag)}
              >
                {mag}x
              </button>
            ))}
          </div>

          <button
            className={`quench-toggle-btn ${isQuenched ? 'active' : ''}`}
            onClick={() => setIsQuenched(!isQuenched)}
            title="Simulate rapid water quench from current temperature"
          >
            <Zap size={13} />
            {isQuenched ? 'Quenched (Martensite)' : 'Simulate Quench'}
          </button>
        </div>
      </div>

      {/* Description Box */}
      <div className="micro-desc-box">
        <div style={{ marginBottom: 4 }}>
          <span className="micro-desc-highlight">Expected Morphology: </span>
          {isQuenched && temperature >= 700 ? (
            <span style={{ color: 'var(--phase-martensite)' }}>
              Acicular Martensite Laths (BCT) + Retained Austenite
            </span>
          ) : (
            <span>{leverResult?.region_name || 'Calculating...'}</span>
          )}
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {isQuenched && temperature >= 700
            ? 'Diffusionless martensitic shear transformation creates ultra-hard, highly strained body-centered tetragonal (BCT) needle packets with high dislocation density.'
            : leverResult?.explanation || 'Equilibrium thermodynamic microstructure.'}
        </p>
      </div>
    </div>
  );
}
