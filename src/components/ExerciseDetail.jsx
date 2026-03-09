import { useState, useEffect } from 'react';
import { getExerciseStats } from '../db';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ExerciseDetail({ exercise, onBack }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [exercise.id]);

  async function loadStats() {
    setLoading(true);
    const data = await getExerciseStats(exercise.id);
    setStats(data);
    setLoading(false);
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  if (loading) return <div className="loading">Cargando...</div>;
  if (!stats) return <div className="loading">Sin datos</div>;

  const chartData = stats.weeklyData.map(d => ({
    date: formatDate(d.date),
    peso: d.maxWeight,
    volumen: Math.round(d.volume / 1000)
  }));

  const recentSessions = stats.weeklyData.slice(-5).reverse();
  const avgRir = recentSessions.length > 0
    ? Math.round(recentSessions.reduce((s, d) => s + d.avgRir, 0) / recentSessions.length * 10) / 10
    : '-';

  return (
    <div className="exercise-detail">
      <button className="btn-back" onClick={onBack}>← Volver</button>

      <h2>{exercise.name}</h2>

      <div className="record-card">
        <div className="record-label">Record historico</div>
        <div className="record-value">{stats.record.weight} kg x {stats.record.reps} reps</div>
        <div className="record-date">{formatDate(stats.record.date)} · RIR {stats.record.rir}</div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.frequency}x</div>
          <div className="stat-label">por semana</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalSessions}</div>
          <div className="stat-label">sesiones</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{avgRir}</div>
          <div className="stat-label">RIR medio</div>
        </div>
      </div>

      <div className="chart-section">
        <h3>Progresion del peso</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="date" stroke="#888" fontSize={11} />
            <YAxis stroke="#888" fontSize={11} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: 8 }}
              labelStyle={{ color: '#aaa' }}
            />
            <Line type="monotone" dataKey="peso" stroke="#4ade80" strokeWidth={2} dot={{ fill: '#4ade80', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {chartData.length > 1 && (
        <div className="chart-section">
          <h3>Volumen (toneladas)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#888" fontSize={11} />
              <YAxis stroke="#888" fontSize={11} />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: 8 }}
                labelStyle={{ color: '#aaa' }}
              />
              <Line type="monotone" dataKey="volumen" stroke="#60a5fa" strokeWidth={2} dot={{ fill: '#60a5fa', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="recent-sessions">
        <h3>Ultimas sesiones</h3>
        {recentSessions.map((s, i) => (
          <div key={i} className="session-row">
            <span className="session-date">{formatDate(s.date)}</span>
            <span className="session-best">{s.maxWeight} kg x {s.bestReps}</span>
            <span className="session-sets">{s.totalSets} series</span>
            <span className="session-rir">RIR {s.avgRir}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
