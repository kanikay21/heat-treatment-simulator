import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Flame, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';
import { fetchSteels, fetchSteelTTT, simulateThermalCycle } from '../api/client';
import HeatTreatmentControls from '../components/HeatTreatment/HeatTreatmentControls';
import TTTDiagramSVG from '../components/HeatTreatment/TTTDiagramSVG';
import ThermalCycleTimelineSVG from '../components/HeatTreatment/ThermalCycleTimelineSVG';
import MicrostructureKineticsCard from '../components/HeatTreatment/MicrostructureKineticsCard';

export default function HeatTreatmentPage() {
  const [steels, setSteels] = useState([]);
  const [selectedSteel, setSelectedSteel] = useState(null);
  const [tttData, setTttData] = useState(null);
  const [simulationResponse, setSimulationResponse] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Cycle parameters
  const [parameters, setParameters] = useState({
    process_type: 'quench_temper',
    austenitizing_temp_C: 850.0,
    soak_time_min: 30.0,
    quench_medium: 'water',
    custom_cooling_rate: null,
    enable_isothermal_hold: false,
    isothermal_temp_C: 350.0,
    isothermal_time_s: 1200.0,
    enable_tempering: true,
    tempering_temp_C: 400.0,
    tempering_time_min: 60.0,
  });

  // 1. Initial Load: Steels
  useEffect(() => {
    async function init() {
      const steelsList = await fetchSteels();
      setSteels(steelsList);
      if (steelsList.length > 0) {
        setSelectedSteel(steelsList[0]);
      }
    }
    init();
  }, []);

  // 2. Fetch TTT Diagram for Selected Steel
  useEffect(() => {
    if (!selectedSteel) return;
    async function loadTTT() {
      const data = await fetchSteelTTT(selectedSteel.id);
      if (data) {
        setTttData(data);
      }
    }
    loadTTT();
  }, [selectedSteel]);

  // 3. Trigger Simulation on Parameter Change
  const runSimulation = useCallback(
    async (params, steelId) => {
      if (!steelId) return;
      setIsSimulating(true);
      const payload = {
        steel_id: steelId,
        ...params,
      };
      const response = await simulateThermalCycle(payload);
      if (response) {
        setSimulationResponse(response);
      }
      setIsSimulating(false);
    },
    []
  );

  useEffect(() => {
    if (selectedSteel) {
      runSimulation(parameters, selectedSteel.id);
    }
  }, [selectedSteel, parameters, runSimulation]);

  // Handlers
  const handleSelectSteel = (steel) => {
    setSelectedSteel(steel);
  };

  const handleChangeParameter = (key, val) => {
    setParameters((prev) => ({
      ...prev,
      process_type: 'custom',
      [key]: val,
    }));
  };

  const handleApplyPreset = (presetId) => {
    let newParams = { ...parameters, process_type: presetId };
    if (presetId === 'quench_temper') {
      newParams = {
        ...newParams,
        austenitizing_temp_C: selectedSteel?.name === 'AISI 1080' ? 820.0 : 850.0,
        soak_time_min: 30.0,
        quench_medium: selectedSteel?.category === 'alloy' ? 'oil' : 'water',
        enable_isothermal_hold: false,
        enable_tempering: true,
        tempering_temp_C: 450.0,
        tempering_time_min: 60.0,
      };
    } else if (presetId === 'austemper') {
      newParams = {
        ...newParams,
        austenitizing_temp_C: 840.0,
        soak_time_min: 30.0,
        quench_medium: 'water',
        enable_isothermal_hold: true,
        isothermal_temp_C: 360.0,
        isothermal_time_s: 1800.0,
        enable_tempering: false,
      };
    } else if (presetId === 'martemper') {
      newParams = {
        ...newParams,
        austenitizing_temp_C: 840.0,
        soak_time_min: 30.0,
        quench_medium: 'oil',
        enable_isothermal_hold: true,
        isothermal_temp_C: 280.0,
        isothermal_time_s: 180.0,
        enable_tempering: true,
        tempering_temp_C: 300.0,
        tempering_time_min: 45.0,
      };
    } else if (presetId === 'normalize') {
      newParams = {
        ...newParams,
        austenitizing_temp_C: 880.0,
        soak_time_min: 45.0,
        quench_medium: 'air',
        enable_isothermal_hold: false,
        enable_tempering: false,
      };
    } else if (presetId === 'anneal') {
      newParams = {
        ...newParams,
        austenitizing_temp_C: 840.0,
        soak_time_min: 60.0,
        quench_medium: 'furnace',
        enable_isothermal_hold: false,
        enable_tempering: false,
      };
    }
    setParameters(newParams);
  };

  return (
    <div className="main-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Process Controls & Presets Panel */}
      <HeatTreatmentControls
        steels={steels}
        selectedSteel={selectedSteel}
        onSelectSteel={handleSelectSteel}
        parameters={parameters}
        onChangeParameter={handleChangeParameter}
        onApplyPreset={handleApplyPreset}
        isSimulating={isSimulating}
      />

      {/* 2. Main Two-Column View: TTT Diagram (Left) + Kinetics & Hardness (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.25rem' }}>
        <TTTDiagramSVG
          tttData={simulationResponse?.ttt_diagram || tttData}
          coolingTrajectory={simulationResponse?.cooling_trajectory || []}
          steelName={selectedSteel?.name}
          cycleParameters={parameters}
        />

        <MicrostructureKineticsCard
          simulationResults={simulationResponse?.results}
          steelName={selectedSteel?.name}
        />
      </div>

      {/* 3. Full Industrial Timeline Schedule */}
      <ThermalCycleTimelineSVG
        processTrajectory={simulationResponse?.process_trajectory || []}
        cycleParameters={parameters}
      />
    </div>
  );
}
