// FILE: src/App.jsx
import { useEffect, useState } from "react";
import "./App.css";

const STORAGE_KEY = "gym-tracker-session-v2";
const HISTORY_KEY = "gym-tracker-history-v1";

/**
 * Elenco workout disponibili.
 * Puoi modificarli / aggiungerne altri a piacere.
 */
const WORKOUTS = [
  {
    id: "fullbody-a",
    name: "Full Body A",
    defaultRestSeconds: 90,
    exercises: [
      {
        id: "squat",
        name: "Squat",
        targetSets: 4,
        targetReps: 6,
        defaultWeight: 60,
      },
      {
        id: "bench",
        name: "Panca piana",
        targetSets: 4,
        targetReps: 6,
        defaultWeight: 50,
      },
      {
        id: "row",
        name: "Rematore bilanciere",
        targetSets: 3,
        targetReps: 8,
        defaultWeight: 40,
      },
    ],
  },
  {
    id: "upper",
    name: "Upper Body",
    defaultRestSeconds: 75,
    exercises: [
      {
        id: "ohp",
        name: "Lento avanti",
        targetSets: 4,
        targetReps: 8,
        defaultWeight: 30,
      },
      {
        id: "pullup",
        name: "Trazioni",
        targetSets: 4,
        targetReps: 6,
        defaultWeight: 0,
      },
      {
        id: "incline-db",
        name: "Panca inclinata manubri",
        targetSets: 3,
        targetReps: 10,
        defaultWeight: 20,
      },
    ],
  },
  {
    id: "lower",
    name: "Lower Body",
    defaultRestSeconds: 90,
    exercises: [
      {
        id: "deadlift",
        name: "Stacco da terra",
        targetSets: 3,
        targetReps: 5,
        defaultWeight: 80,
      },
      {
        id: "legpress",
        name: "Leg press",
        targetSets: 4,
        targetReps: 10,
        defaultWeight: 120,
      },
      {
        id: "legcurl",
        name: "Leg curl",
        targetSets: 3,
        targetReps: 12,
        defaultWeight: 35,
      },
    ],
  },
];

function findWorkoutById(id) {
  return WORKOUTS.find((w) => w.id === id) || WORKOUTS[0];
}

function buildEmptySessionFromWorkout(workoutId) {
  const workout = findWorkoutById(workoutId);
  const now = new Date();

  return {
    workoutId: workout.id,
    workoutName: workout.name,
    startedAt: now.toISOString(),
    exercises: workout.exercises.map((ex) => ({
      id: ex.id,
      name: ex.name,
      sets: Array.from({ length: ex.targetSets }, (_, idx) => ({
        index: idx + 1,
        targetReps: ex.targetReps,
        reps: "",
        weight: ex.defaultWeight || "",
        done: false,
      })),
    })),
  };
}

function loadSessionFromStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSessionToStorage(session) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

function loadHistoryFromStorage() {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistoryToStorage(history) {
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // ignore
  }
}

function formatSeconds(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

function App() {
  // Workout selezionato (solo ID)
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(() => {
    const stored = loadSessionFromStorage();
    if (stored?.workoutId) {
      return stored.workoutId;
    }
    return WORKOUTS[0].id;
  });

  // Sessione corrente (dipende da selectedWorkoutId)
  const [session, setSession] = useState(() => {
    const stored = loadSessionFromStorage();
    if (stored && findWorkoutById(stored.workoutId)) {
      return stored;
    }
    return buildEmptySessionFromWorkout(WORKOUTS[0].id);
  });

  // Storico sessioni completate
  const [history, setHistory] = useState(() => loadHistoryFromStorage());

  // Timer di recupero
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  const [isRestRunning, setIsRestRunning] = useState(false);
  const [lastCompletedExercise, setLastCompletedExercise] = useState(null);
  const [lastCompletedSetIndex, setLastCompletedSetIndex] = useState(null);

  // Timer globale allenamento
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Sincronizza sessione con workout selezionato
  useEffect(() => {
    const stored = loadSessionFromStorage();

    // Se esiste una sessione salvata per quel workout, la riusiamo
    if (stored && stored.workoutId === selectedWorkoutId) {
      setSession(stored);
      return;
    }

    // Altrimenti creiamo una nuova sessione vuota per il workout selezionato
    const fresh = buildEmptySessionFromWorkout(selectedWorkoutId);
    setSession(fresh);
    setElapsedSeconds(0);
    setIsRestRunning(false);
    setRestSecondsLeft(0);
    setLastCompletedExercise(null);
    setLastCompletedSetIndex(null);
    saveSessionToStorage(fresh);
  }, [selectedWorkoutId]);

  // Salva la sessione ogni volta che cambia
  useEffect(() => {
    if (session) {
      saveSessionToStorage(session);
    }
  }, [session]);

  // Salva lo storico ogni volta che cambia
  useEffect(() => {
    saveHistoryToStorage(history);
  }, [history]);

  // Timer globale allenamento
  useEffect(() => {
    if (!session?.startedAt) return;
    const start = new Date(session.startedAt).getTime();

    const id = setInterval(() => {
      const now = Date.now();
      const diffSec = Math.floor((now - start) / 1000);
      setElapsedSeconds(diffSec);
    }, 1000);

    return () => clearInterval(id);
  }, [session?.startedAt]);

  // Timer recupero
  useEffect(() => {
    if (!isRestRunning || restSecondsLeft <= 0) return;

    const id = setInterval(() => {
      setRestSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRestRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [isRestRunning, restSecondsLeft]);

  function handleSetFieldChange(exerciseId, setIndex, field, value) {
    setSession((prev) => {
      const updatedExercises = prev.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;

        const updatedSets = ex.sets.map((s) => {
          if (s.index !== setIndex) return s;
          return {
            ...s,
            [field]: value,
          };
        });

        return { ...ex, sets: updatedSets };
      });

      return { ...prev, exercises: updatedExercises };
    });
  }

  function handleToggleSetDone(exerciseId, setIndex) {
    setSession((prev) => {
      const updatedExercises = prev.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;

        const updatedSets = ex.sets.map((s) => {
          if (s.index !== setIndex) return s;
          return {
            ...s,
            done: !s.done,
          };
        });

        return { ...ex, sets: updatedSets };
      });

      return { ...prev, exercises: updatedExercises };
    });

    // Avvia timer recupero
    const workout = findWorkoutById(selectedWorkoutId);
    const exerciseConfig = workout.exercises.find((e) => e.id === exerciseId);
    const rest =
      exerciseConfig?.defaultRestSeconds || workout.defaultRestSeconds || 90;

    setLastCompletedExercise(exerciseId);
    setLastCompletedSetIndex(setIndex);
    setRestSecondsLeft(rest);
    setIsRestRunning(true);
  }

  function handleResetSession() {
    if (!window.confirm("Vuoi davvero resettare la sessione corrente?")) return;

    const fresh = buildEmptySessionFromWorkout(selectedWorkoutId);

    setSession(fresh);
    setElapsedSeconds(0);
    setIsRestRunning(false);
    setRestSecondsLeft(0);
    setLastCompletedExercise(null);
    setLastCompletedSetIndex(null);
    saveSessionToStorage(fresh);
  }

  function handleCompleteSession() {
    if (!session) return;

    const now = new Date();
    const finishedAt = now.toISOString();

    // Calcola volume e serie completate
    const allSets = session.exercises.flatMap((ex) =>
      ex.sets.map((s) => ({ exId: ex.id, exName: ex.name, ...s }))
    );

    const completedSets = allSets.filter((s) => s.done && s.reps && s.weight);
    const volume = completedSets.reduce(
      (sum, s) => sum + Number(s.reps) * Number(s.weight),
      0
    );

    const completedSession = {
      id: `${session.workoutId}-${session.startedAt}`, // id semplice
      workoutId: session.workoutId,
      workoutName: session.workoutName,
      startedAt: session.startedAt,
      finishedAt,
      volume,
      totalSetsDone: completedSets.length,
    };

    // Aggiungi in testa allo storico
    setHistory((prev) => [completedSession, ...prev]);

    // Crea una nuova sessione vuota per lo stesso workout
    const fresh = buildEmptySessionFromWorkout(selectedWorkoutId);
    setSession(fresh);
    setElapsedSeconds(0);
    setIsRestRunning(false);
    setRestSecondsLeft(0);
    setLastCompletedExercise(null);
    setLastCompletedSetIndex(null);
    saveSessionToStorage(fresh);
  }

  const totalVolume = session.exercises
    .flatMap((ex) => ex.sets.map((s) => ({ exName: ex.name, ...s })))
    .filter((s) => s.done && s.reps && s.weight)
    .reduce((sum, s) => sum + Number(s.reps) * Number(s.weight), 0);

  const currentWorkout = findWorkoutById(selectedWorkoutId);

  return (
    <div className="app-container">
      {/* Top bar con selezione workout */}
      <div className="top-bar">
        <div>
          <div className="app-title">Gym Tracker</div>
          <div className="small-text">Workout selezionato</div>
          <select
            value={selectedWorkoutId}
            onChange={(e) => setSelectedWorkoutId(e.target.value)}
            style={{
              marginTop: 4,
              padding: "6px 8px",
              borderRadius: 8,
              border: "1px solid #374151",
              backgroundColor: "#020617",
              color: "#e5e7eb",
              fontSize: "0.9rem",
            }}
          >
            {WORKOUTS.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div
            className={`timer-display ${
              elapsedSeconds > 0 ? "timer-running" : "timer-idle"
            }`}
          >
            ⏱ {formatSeconds(elapsedSeconds)}
          </div>
          <div className="small-text">Durata allenamento</div>
        </div>
      </div>

      {/* Card info workout */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">{currentWorkout.name}</div>
          <span className="badge">
            Rest: {currentWorkout.defaultRestSeconds}s
          </span>
        </div>
        <div className="session-summary">
          Esercizi: {currentWorkout.exercises.length}
        </div>
      </div>

      {/* Card timer recupero */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Recupero serie</div>
          <span className="badge">
            {isRestRunning ? "In corso" : "Pronto"}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            className={`timer-display ${
              isRestRunning ? "timer-running" : "timer-idle"
            }`}
          >
            {formatSeconds(restSecondsLeft)}
          </div>
          <button
            className="button button-secondary"
            onClick={() => {
              setIsRestRunning(false);
              setRestSecondsLeft(0);
            }}
          >
            Stop
          </button>
        </div>
        {lastCompletedExercise && (
          <div className="small-text" style={{ marginTop: 8 }}>
            Ultima serie: {lastCompletedExercise} #{lastCompletedSetIndex}
          </div>
        )}
      </div>

      {/* Card riepilogo sessione */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Riepilogo sessione</div>
        </div>
        <div className="session-summary">
          Volume totale completato:{" "}
          <strong>{Number.isNaN(totalVolume) ? 0 : totalVolume} kg</strong>
        </div>
      </div>

      {/* Card storico sessioni */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Storico sessioni</div>
          <span className="badge">
            {history.length === 0
              ? "Nessuna sessione"
              : `${history.length} totali`}
          </span>
        </div>
        {history.length === 0 ? (
          <div className="session-summary">
            Completa un allenamento per vedere lo storico.
          </div>
        ) : (
          <div>
            {history.slice(0, 5).map((h) => {
              const start = new Date(h.startedAt);
              const end = new Date(h.finishedAt);
              const durationSec = Math.max(
                0,
                Math.floor((end.getTime() - start.getTime()) / 1000)
              );

              const dateLabel = start.toLocaleDateString("it-IT", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              });

              const timeLabel = start.toLocaleTimeString("it-IT", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={h.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                      {h.workoutName}
                    </div>
                    <div className="small-text">
                      {dateLabel} • {timeLabel}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="small-text">
                      Durata: {formatSeconds(durationSec)}
                    </div>
                    <div className="small-text">
                      Volume: <strong>{h.volume} kg</strong>
                    </div>
                    <div className="small-text">
                      Serie: {h.totalSetsDone}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lista esercizi */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Esercizi di oggi</div>
        </div>
        <div>
          {session.exercises.map((exercise) => (
            <div key={exercise.id} style={{ marginBottom: 16 }}>
              <div className="exercise-name">{exercise.name}</div>
              <div className="small-text" style={{ marginBottom: 8 }}>
                Serie: {exercise.sets.length} | Target reps:{" "}
                {exercise.sets[0]?.targetReps}
              </div>
              <div>
                {exercise.sets.map((set) => (
                  <div key={set.index} className="set-row">
                    <div>
                      <div className="set-label">Set</div>
                      <div>#{set.index}</div>
                    </div>
                    <div>
                      <div className="set-label">Reps</div>
                      <input
                        type="number"
                        min="0"
                        value={set.reps}
                        onChange={(e) =>
                          handleSetFieldChange(
                            exercise.id,
                            set.index,
                            "reps",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <div className="set-label">Peso (kg)</div>
                      <input
                        type="number"
                        min="0"
                        value={set.weight}
                        onChange={(e) =>
                          handleSetFieldChange(
                            exercise.id,
                            set.index,
                            "weight",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <div className="set-label">Done</div>
                      <button
                        className={`button button-full ${
                          set.done ? "button-primary" : "button-secondary"
                        }`}
                        onClick={() =>
                          handleToggleSetDone(exercise.id, set.index)
                        }
                      >
                        {set.done ? "✓" : "OK"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="button button-secondary button-full"
          onClick={handleResetSession}
        >
          Reset sessione
        </button>
        <button
          className="button button-primary button-full"
          onClick={handleCompleteSession}
        >
          Completa allenamento
        </button>
      </div>
    </div>
  );
}

export default App;
