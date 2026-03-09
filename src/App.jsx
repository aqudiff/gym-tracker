import { useState, useEffect } from 'react';
import { initExercises } from './db';
import ExerciseSearch from './components/ExerciseSearch';
import SetLogger from './components/SetLogger';
import ExerciseSummary from './components/ExerciseSummary';
import ExerciseDetail from './components/ExerciseDetail';

export default function App() {
  const [tab, setTab] = useState('log');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [detailExercise, setDetailExercise] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initExercises().then(() => setReady(true));
  }, []);

  if (!ready) {
    return <div className="app-loading">Cargando...</div>;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Gym Tracker</h1>
      </header>

      <main className="app-main">
        {tab === 'log' && (
          <div className="log-screen">
            <ExerciseSearch
              selected={selectedExercise}
              onSelect={setSelectedExercise}
            />
            <SetLogger exercise={selectedExercise} />
          </div>
        )}

        {tab === 'progress' && !detailExercise && (
          <ExerciseSummary
            onSelectExercise={setDetailExercise}
            key={tab}
          />
        )}

        {tab === 'progress' && detailExercise && (
          <ExerciseDetail
            exercise={detailExercise}
            onBack={() => setDetailExercise(null)}
          />
        )}
      </main>

      <nav className="app-nav">
        <button
          className={`nav-btn ${tab === 'log' ? 'active' : ''}`}
          onClick={() => { setTab('log'); setDetailExercise(null); }}
        >
          <span className="nav-icon">📝</span>
          <span className="nav-label">Registro</span>
        </button>
        <button
          className={`nav-btn ${tab === 'progress' ? 'active' : ''}`}
          onClick={() => { setTab('progress'); setDetailExercise(null); }}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">Progreso</span>
        </button>
      </nav>
    </div>
  );
}
