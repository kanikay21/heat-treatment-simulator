import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import SteelSelector from '../components/PhaseDiagram/SteelSelector';
import PhaseDiagramSVG from '../components/PhaseDiagram/PhaseDiagramSVG';
import MicrostructureCanvas from '../components/PhaseDiagram/MicrostructureCanvas';
import LeverRuleCard from '../components/PhaseDiagram/LeverRuleCard';
import TheoryModal from '../components/PhaseDiagram/TheoryModal';
import {
  fetchSteels,
  fetchPhaseDiagramBoundaries,
  calculateLeverRule,
} from '../api/client';

export default function ExplorerPage() {
  const [steels, setSteels] = useState([]);
  const [selectedSteel, setSelectedSteel] = useState(null);
  const [carbon, setCarbon] = useState(0.45);
  const [temperature, setTemperature] = useState(650);
  const [viewportMode, setViewportMode] = useState('steel_focus');
  const [boundariesData, setBoundariesData] = useState(null);
  const [leverResult, setLeverResult] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isTheoryOpen, setIsTheoryOpen] = useState(false);

  // Initial load
  useEffect(() => {
    async function loadData() {
      const steelsList = await fetchSteels();
      setSteels(steelsList);
      if (steelsList.length > 0) {
        setSelectedSteel(steelsList[0]);
        setCarbon(steelsList[0].C);
      }

      const boundaries = await fetchPhaseDiagramBoundaries();
      if (boundaries) {
        setBoundariesData(boundaries);
      }
    }
    loadData();
  }, []);

  // Compute lever rule whenever carbon or temperature changes
  const updateLeverRule = useCallback(async (c, t, steelId) => {
    const result = await calculateLeverRule(c, t, steelId);
    if (result) {
      setLeverResult(result);
    }
  }, []);

  useEffect(() => {
    updateLeverRule(carbon, temperature, selectedSteel?.id);
  }, [carbon, temperature, selectedSteel, updateLeverRule]);

  // Handlers
  const handleSelectSteel = (steel) => {
    setSelectedSteel(steel);
    setCarbon(steel.C);
    setIsLocked(false);
  };

  const handleCarbonChange = (c) => {
    setCarbon(c);
    setIsLocked(true);
  };

  const handleTemperatureChange = (t) => {
    setTemperature(t);
    setIsLocked(true);
  };

  const handleCoordinateChange = (c, t) => {
    setCarbon(c);
    setTemperature(t);
  };

  return (
    <div className="main-content">
      {/* Top Bar: Steels & Range Sliders */}
      <SteelSelector
        steels={steels}
        selectedSteel={selectedSteel}
        onSelectSteel={handleSelectSteel}
        carbon={carbon}
        temperature={temperature}
        onCarbonChange={handleCarbonChange}
        onTemperatureChange={handleTemperatureChange}
        leverResult={leverResult}
        viewportMode={viewportMode}
        isLocked={isLocked}
        onResetLock={() => setIsLocked(false)}
      />

      {/* Main Grid: Phase Diagram SVG (Left) + Inspector Microscope & Lever Rule (Right) */}
      <div className="explorer-grid">
        {/* Left Column: Interactive SVG Diagram */}
        <PhaseDiagramSVG
          boundariesData={boundariesData}
          carbon={carbon}
          temperature={temperature}
          onCoordinateChange={handleCoordinateChange}
          leverResult={leverResult}
          viewportMode={viewportMode}
          onViewportModeChange={setViewportMode}
          isLocked={isLocked}
          onToggleLock={setIsLocked}
        />

        {/* Right Column: Microscope metallography + Lever rule calculator */}
        <div className="inspector-column">
          <MicrostructureCanvas
            carbon={carbon}
            temperature={temperature}
            leverResult={leverResult}
            selectedSteel={selectedSteel}
          />

          <LeverRuleCard
            carbon={carbon}
            temperature={temperature}
            leverResult={leverResult}
          />
        </div>
      </div>

      {/* Bottom Handbook Callout Banner */}
      <div className="theory-banner">
        <div className="theory-banner-text">
          <h4>
            <Sparkles size={16} style={{ display: 'inline', marginRight: 6, color: 'var(--heat-orange)', verticalAlign: 'text-bottom' }} />
            Metallurgical Handbook & Thermodynamic Principles
          </h4>
          <p>
            Explore detailed explanations of invariant eutectoid/eutectic reactions, lever rule tie-line derivations, and martensitic shear kinetics.
          </p>
        </div>
        <button className="btn-theory" onClick={() => setIsTheoryOpen(true)}>
          <BookOpen size={16} /> Open Theory Handbook
        </button>
      </div>

      {/* Theory Guide Modal */}
      <TheoryModal isOpen={isTheoryOpen} onClose={() => setIsTheoryOpen(false)} />
    </div>
  );
}
