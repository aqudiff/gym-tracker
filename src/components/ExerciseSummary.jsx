import { useState, useEffect } from 'react';
import { getAllExercisesSummary } from '../db';

export default function ExerciseSummary({ onSelectExercise }) {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummaries();
  }, []);

  async function loadSummaries() {
    setLoading(true);
    const data = await getAllExercisesSummary();
    setSummaries(data);
    setLoading(false);
  }

  function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = Math.round((now.getTime() - timestamp) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Ayer';
    if (diff < 7) return `Hace ${diff} dias`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  function trendIcon(trend) {
    if (trend === 'up') return <span className="trend up">▲</span>;
    if (trend === 'down') return <span className="trend down">▼</span>;
    return <span className="trend same">=</span>;
  }

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  if (summaries.length === 0) {
    return (
      <div className="empty-progress">
        <div className="empty-icon">📊</div>
        <p>Aun no hay datos</p>
        <p className="empty-sub">Registra tus primeras series para ver tu progreso</p>
      </div>
    );
  }

  return (
    <div className="exercise-summary">
      <h2>Tus ejercicios</h2>
      <div className="summary-list">
        {summaries.map(ex => (
          <button key={ex.id} className="summary-card" onClick={() => onSelectExercise(ex)}>
            <div className="summary-main">
              <span className="summary-name">{ex.name}</span>
              <span className="summary-weight">{ex.maxWeight} kg {trendIcon(ex.trend)}</span>
            </div>
            <div className="summary-sub">
              <span className="summary-date">{formatDate(ex.lastSessionDate)}</span>
              <span className="summary-freq">{ex.frequency}x/sem</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
