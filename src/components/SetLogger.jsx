import { useState, useEffect, useRef } from 'react';
import { saveSet, getTodaySets, getLastSessionBest, deleteSet } from '../db';

export default function SetLogger({ exercise }) {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rir, setRir] = useState('');
  const [todaySets, setTodaySets] = useState([]);
  const [lastBest, setLastBest] = useState(null);
  const [activeField, setActiveField] = useState('weight');
  const [saving, setSaving] = useState(false);
  const weightRef = useRef(null);

  useEffect(() => {
    if (exercise) {
      loadData();
      setWeight('');
      setReps('');
      setRir('');
      setActiveField('weight');
      setTimeout(() => weightRef.current?.focus(), 100);
    }
  }, [exercise?.id]);

  async function loadData() {
    const [sets, best] = await Promise.all([
      getTodaySets(exercise.id),
      getLastSessionBest(exercise.id)
    ]);
    setTodaySets(sets);
    setLastBest(best);
  }

  async function handleSave() {
    if (!weight || !reps || rir === '') return;
    setSaving(true);
    await saveSet({
      exerciseId: exercise.id,
      weight: Number(weight),
      reps: Number(reps),
      rir: Number(rir)
    });
    await loadData();
    setWeight('');
    setReps('');
    setRir('');
    setActiveField('weight');
    setSaving(false);
    setTimeout(() => weightRef.current?.focus(), 100);
  }

  async function handleDelete(id) {
    await deleteSet(id);
    await loadData();
  }

  function handleFieldNext(current, value, setter) {
    setter(value);
    if (current === 'weight') setActiveField('reps');
    else if (current === 'reps') setActiveField('rir');
  }

  function formatDaysAgo(days) {
    if (days === 0) return 'hoy';
    if (days === 1) return 'ayer';
    return `hace ${days} dias`;
  }

  if (!exercise) {
    return (
      <div className="set-logger-empty">
        <div className="empty-icon">🏋️</div>
        <p>Selecciona un ejercicio para empezar</p>
      </div>
    );
  }

  const canSave = weight && reps && rir !== '';

  return (
    <div className="set-logger">
      {lastBest && (
        <div className="last-session-info">
          <span className="last-label">Ultima sesion</span>
          <span className="last-date">· {formatDaysAgo(lastBest.daysAgo)}</span>
          <div className="last-best">
            Mejor serie: <strong>{lastBest.weight} kg x {lastBest.reps} reps</strong> (RIR {lastBest.rir})
          </div>
        </div>
      )}

      <div className="input-fields">
        <div className={`field ${activeField === 'weight' ? 'active' : ''}`}>
          <label>Peso (kg)</label>
          <input
            ref={weightRef}
            type="number"
            inputMode="decimal"
            step="0.5"
            placeholder="0"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            onFocus={() => setActiveField('weight')}
            onKeyDown={e => e.key === 'Enter' && handleFieldNext('weight', weight, setWeight)}
          />
        </div>

        <div className={`field ${activeField === 'reps' ? 'active' : ''}`}>
          <label>Reps</label>
          <input
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={reps}
            onChange={e => setReps(e.target.value)}
            onFocus={() => setActiveField('reps')}
            onKeyDown={e => e.key === 'Enter' && handleFieldNext('reps', reps, setReps)}
          />
        </div>

        <div className={`field ${activeField === 'rir' ? 'active' : ''}`}>
          <label>RIR</label>
          <input
            type="number"
            inputMode="numeric"
            placeholder="0"
            min="0"
            max="10"
            value={rir}
            onChange={e => setRir(e.target.value)}
            onFocus={() => setActiveField('rir')}
            onKeyDown={e => e.key === 'Enter' && canSave && handleSave()}
          />
        </div>
      </div>

      <button
        className={`btn-save ${canSave ? '' : 'disabled'}`}
        onClick={handleSave}
        disabled={!canSave || saving}
      >
        {saving ? 'Guardando...' : 'Guardar serie'}
      </button>

      {todaySets.length > 0 && (
        <div className="today-sets">
          <h3>Series de hoy ({todaySets.length})</h3>
          {todaySets.map((s, i) => (
            <div key={s.id} className="set-row">
              <span className="set-number">#{i + 1}</span>
              <span className="set-data">{s.weight} kg x {s.reps} reps</span>
              <span className="set-rir">RIR {s.rir}</span>
              <button className="btn-delete" onClick={() => handleDelete(s.id)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
