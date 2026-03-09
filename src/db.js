import Dexie from 'dexie';

export const db = new Dexie('GymTracker');

db.version(1).stores({
  exercises: '++id, name',
  sets: '++id, exerciseId, date, sessionId',
  sessions: '++id, date'
});

const DEFAULT_EXERCISES = [
  'Sentadilla', 'Peso muerto', 'Press banca', 'Press militar',
  'Remo con barra', 'Dominadas', 'Hip thrust', 'Sentadilla búlgara',
  'Press inclinado', 'Remo con mancuerna', 'Curl bíceps', 'Extensión tríceps',
  'Elevaciones laterales', 'Face pull', 'Prensa de piernas', 'Extensión cuádriceps',
  'Curl femoral', 'Gemelos en máquina', 'Fondos en paralelas', 'Pull-over',
  'Jalón al pecho', 'Remo en polea baja', 'Press de pecho en máquina',
  'Sentadilla hack', 'Peso muerto rumano', 'Zancadas', 'Press Arnold',
  'Aperturas con mancuerna', 'Pájaros', 'Encogimientos de trapecio'
];

db.on('populate', (tx) => {
  tx.table('exercises').bulkAdd(DEFAULT_EXERCISES.map(name => ({ name })));
});

export async function initExercises() {
  await db.open();
}

export async function getExercises() {
  return db.exercises.orderBy('name').toArray();
}

export async function addExercise(name) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const existing = await db.exercises.where('name').equalsIgnoreCase(trimmed).first();
  if (existing) return existing;
  const id = await db.exercises.add({ name: trimmed });
  return { id, name: trimmed };
}

export async function saveSet({ exerciseId, weight, reps, rir }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTs = today.getTime();

  let session = await db.sessions.where('date').equals(todayTs).first();
  if (!session) {
    const id = await db.sessions.add({ date: todayTs });
    session = { id, date: todayTs };
  }

  const id = await db.sets.add({
    exerciseId,
    weight: Number(weight),
    reps: Number(reps),
    rir: Number(rir),
    date: Date.now(),
    sessionId: session.id
  });

  return id;
}

export async function getTodaySets(exerciseId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTs = today.getTime();

  const session = await db.sessions.where('date').equals(todayTs).first();
  if (!session) return [];

  let query = db.sets.where('sessionId').equals(session.id);
  const sets = await query.toArray();
  if (exerciseId) return sets.filter(s => s.exerciseId === exerciseId);
  return sets;
}

export async function getAllTodaySets() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const session = await db.sessions.where('date').equals(today.getTime()).first();
  if (!session) return [];
  return db.sets.where('sessionId').equals(session.id).toArray();
}

export async function deleteSet(id) {
  return db.sets.delete(id);
}

export async function getLastSessionBest(exerciseId) {
  const allSets = await db.sets.where('exerciseId').equals(exerciseId).toArray();
  if (allSets.length === 0) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTs = today.getTime();

  const todaySession = await db.sessions.where('date').equals(todayTs).first();
  const previousSets = todaySession
    ? allSets.filter(s => s.sessionId !== todaySession.id)
    : allSets;

  if (previousSets.length === 0) return null;

  const sessionIds = [...new Set(previousSets.map(s => s.sessionId))];
  const sessions = await db.sessions.where('id').anyOf(sessionIds).toArray();
  const lastSession = sessions.sort((a, b) => b.date - a.date)[0];
  if (!lastSession) return null;

  const lastSessionSets = previousSets.filter(s => s.sessionId === lastSession.id);
  const best = lastSessionSets.reduce((best, s) =>
    (s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps)) ? s : best
  , lastSessionSets[0]);

  const daysAgo = Math.round((todayTs - lastSession.date) / (1000 * 60 * 60 * 24));

  return {
    weight: best.weight,
    reps: best.reps,
    rir: best.rir,
    date: new Date(lastSession.date),
    daysAgo
  };
}

export async function getExerciseHistory(exerciseId) {
  const sets = await db.sets.where('exerciseId').equals(exerciseId).toArray();
  if (sets.length === 0) return [];

  const sessionIds = [...new Set(sets.map(s => s.sessionId))];
  const sessions = await db.sessions.where('id').anyOf(sessionIds).toArray();
  const sessionMap = Object.fromEntries(sessions.map(s => [s.id, s]));

  const grouped = {};
  for (const set of sets) {
    const session = sessionMap[set.sessionId];
    if (!session) continue;
    const key = session.date;
    if (!grouped[key]) grouped[key] = { date: session.date, sets: [] };
    grouped[key].sets.push(set);
  }

  return Object.values(grouped).sort((a, b) => a.date - b.date);
}

export async function getExerciseStats(exerciseId) {
  const history = await getExerciseHistory(exerciseId);
  if (history.length === 0) return null;

  let record = { weight: 0, date: null };
  const weeklyData = [];

  for (const session of history) {
    const best = session.sets.reduce((b, s) =>
      s.weight > b.weight ? s : b, session.sets[0]);

    if (best.weight > record.weight) {
      record = { weight: best.weight, reps: best.reps, rir: best.rir, date: session.date };
    }

    const volume = session.sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
    const avgRir = session.sets.reduce((sum, s) => sum + s.rir, 0) / session.sets.length;

    weeklyData.push({
      date: session.date,
      maxWeight: best.weight,
      volume,
      avgRir: Math.round(avgRir * 10) / 10,
      totalSets: session.sets.length,
      bestReps: best.reps
    });
  }

  const now = Date.now();
  const firstDate = history[0].date;
  const weeks = Math.max(1, (now - firstDate) / (7 * 24 * 60 * 60 * 1000));
  const frequency = Math.round((history.length / weeks) * 10) / 10;

  const recent = weeklyData.slice(-4);
  const trend = recent.length >= 2
    ? recent[recent.length - 1].maxWeight > recent[0].maxWeight ? 'up'
    : recent[recent.length - 1].maxWeight < recent[0].maxWeight ? 'down' : 'same'
    : 'same';

  return {
    record,
    weeklyData,
    frequency,
    trend,
    totalSessions: history.length,
    lastSession: history[history.length - 1]
  };
}

export async function getAllExercisesSummary() {
  const exercises = await getExercises();
  const summaries = [];

  for (const ex of exercises) {
    const sets = await db.sets.where('exerciseId').equals(ex.id).count();
    if (sets === 0) continue;

    const stats = await getExerciseStats(ex.id);
    if (!stats) continue;

    summaries.push({
      ...ex,
      maxWeight: stats.record.weight,
      trend: stats.trend,
      lastSessionDate: stats.lastSession.date,
      frequency: stats.frequency
    });
  }

  return summaries.sort((a, b) => b.lastSessionDate - a.lastSessionDate);
}

export async function exportData() {
  const [exercises, sets, sessions] = await Promise.all([
    db.exercises.toArray(),
    db.sets.toArray(),
    db.sessions.toArray()
  ]);
  return { exercises, sets, sessions };
}

export async function importData(data) {
  if (!data?.exercises || !data?.sets || !data?.sessions) {
    throw new Error('Formato de archivo no válido');
  }
  await db.transaction('rw', db.exercises, db.sets, db.sessions, async () => {
    await db.exercises.bulkPut(data.exercises);
    await db.sessions.bulkPut(data.sessions);
    await db.sets.bulkPut(data.sets);
  });
}
