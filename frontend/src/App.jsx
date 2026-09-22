import React, { useState, useEffect } from 'react';
import { Flame, Compass, GitMerge, Activity, BarChart2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import ExplorerPage from './pages/ExplorerPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('phase_diagram');
  const [backendStatus, setBackendStatus] = useState('checking');

  // Health check on FastAPI backend
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch('http://localhost:8000/health');
        if (res.ok) {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      } catch (err) {
        setBackendStatus('offline');
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <header className="app-header">
        <div className="brand-wrapper">
          <div className="brand-icon">
            <Flame size={22} />
          </div>
          <div>
            <div className="brand-title">THERMOSIM</div>
            <div className="brand-subtitle">Steel Metallurgy & Heat Treatment Suite</div>
          </div>
        </div>

        {/* High-Level Module Navigation Tabs */}
        <nav className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'phase_diagram' ? 'active' : ''}`}
            onClick={() => setActiveTab('phase_diagram')}
          >
            <Compass size={16} />
            Phase Diagram Explorer
          </button>

          <button
            className={`nav-tab ${activeTab === 'heat_treatment' ? 'active' : ''}`}
            onClick={() => setActiveTab('heat_treatment')}
            title="Module 2 (Coming next in build order)"
          >
            <Activity size={16} />
            Heat Treatment & TTT
            <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 4, marginLeft: 4 }}>
              Next
            </span>
          </button>

          <button
            className={`nav-tab ${activeTab === 'jominy' ? 'active' : ''}`}
            onClick={() => setActiveTab('jominy')}
            title="Module 3 (Coming in build order)"
          >
            <BarChart2 size={16} />
            Jominy End-Quench
          </button>
        </nav>

        {/* Backend Connection Indicator */}
        <div className="header-status">
          <div
            className="status-dot"
            style={{
              backgroundColor: backendStatus === 'online' ? '#10b981' : '#f59e0b',
              boxShadow: backendStatus === 'online' ? '0 0 8px #10b981' : '0 0 8px #f59e0b',
            }}
          />
          <span>
            {backendStatus === 'online' ? 'FastAPI Engine Connected' : 'Local Engine Ready'}
          </span>
        </div>
      </header>

      {/* Active Tab View */}
      {activeTab === 'phase_diagram' && <ExplorerPage />}

      {activeTab === 'heat_treatment' && (
        <div className="main-content" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div className="glass-panel" style={{ maxWidth: 650, margin: '0 auto', padding: '3rem 2rem' }}>
            <Activity size={48} color="var(--heat-orange)" style={{ marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Heat Treatment Cycle & TTT Simulator</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Next step in your build order: Input austenitizing temperature, quench cooling rates (water, oil, air), and tempering profiles with CCT/TTT transformation overlays.
            </p>
            <button className="btn-theory" style={{ margin: '0 auto' }} onClick={() => setActiveTab('phase_diagram')}>
              Return to Phase Diagram Explorer
            </button>
          </div>
        </div>
      )}

      {activeTab === 'jominy' && (
        <div className="main-content" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div className="glass-panel" style={{ maxWidth: 650, margin: '0 auto', padding: '3rem 2rem' }}>
            <BarChart2 size={48} color="var(--phase-ferrite)" style={{ marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Jominy End-Quench Hardenability Module</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Simulate cooling rates and predicted Rockwell C hardness curves across the standardized 100 mm bar based on steel composition and Grossman hardenability multipliers.
            </p>
            <button className="btn-theory" style={{ margin: '0 auto' }} onClick={() => setActiveTab('phase_diagram')}>
              Return to Phase Diagram Explorer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
