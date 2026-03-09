import { useState, useEffect, useRef } from 'react';
import { getExercises, addExercise } from '../db';

export default function ExerciseSearch({ onSelect, selected }) {
  const [query, setQuery] = useState('');
  const [exercises, setExercises] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    getExercises().then(setExercises);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setFiltered(exercises);
    } else {
      const q = query.toLowerCase();
      setFiltered(exercises.filter(e => e.name.toLowerCase().includes(q)));
    }
  }, [query, exercises]);

  function handleSelect(exercise) {
    onSelect(exercise);
    setQuery('');
    setIsOpen(false);
  }

  async function handleAddNew() {
    const newEx = await addExercise(query);
    if (newEx) {
      setExercises(prev => [...prev, newEx].sort((a, b) => a.name.localeCompare(b.name)));
      handleSelect(newEx);
    }
  }

  function handleClear() {
    onSelect(null);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  if (selected) {
    return (
      <div className="exercise-selected">
        <span className="exercise-name">{selected.name}</span>
        <button className="btn-change" onClick={handleClear}>Cambiar</button>
      </div>
    );
  }

  return (
    <div className="exercise-search">
      <input
        ref={inputRef}
        type="text"
        placeholder="Buscar ejercicio..."
        value={query}
        onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        className="search-input"
        autoComplete="off"
      />
      {isOpen && (
        <div className="search-results">
          {filtered.map(ex => (
            <button key={ex.id} className="search-item" onClick={() => handleSelect(ex)}>
              {ex.name}
            </button>
          ))}
          {query.trim() && filtered.length === 0 && (
            <button className="search-item add-new" onClick={handleAddNew}>
              + Crear "{query.trim()}"
            </button>
          )}
          {query.trim() && filtered.length > 0 && !filtered.some(e => e.name.toLowerCase() === query.trim().toLowerCase()) && (
            <button className="search-item add-new" onClick={handleAddNew}>
              + Crear "{query.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}
