import { useState, useRef } from 'react';
import { exportData, importData } from '../db';

export default function Settings() {
  const [message, setMessage] = useState(null);
  const fileRef = useRef(null);

  const handleExport = async () => {
    try {
      const data = await exportData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const date = new Date().toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gym-tracker-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Datos exportados correctamente' });
    } catch {
      setMessage({ type: 'error', text: 'Error al exportar los datos' });
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importData(data);
      setMessage({ type: 'success', text: `Datos importados: ${data.exercises.length} ejercicios, ${data.sets.length} series` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Error al importar los datos' });
    }

    e.target.value = '';
  };

  return (
    <div className="settings">
      <h2>Ajustes</h2>

      <div className="settings-section">
        <h3>Copia de seguridad</h3>

        <button className="settings-btn" onClick={handleExport}>
          <span className="settings-btn-icon">📤</span>
          Exportar datos (JSON)
        </button>

        <button className="settings-btn" onClick={() => fileRef.current?.click()}>
          <span className="settings-btn-icon">📥</span>
          Importar datos (JSON)
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />
      </div>

      {message && (
        <div className={`settings-msg ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
