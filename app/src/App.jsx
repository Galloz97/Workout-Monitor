// FILE: src/App.jsx
import { useEffect, useState } from "react";
import "./App.css";

const STORAGE_KEY = "gym-tracker-session-v1";

// Config di esempio: un workout fisso
const DEFAULT_WORKOUT = {
  id: "fullbody-1",
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
};

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
    // niente
  }
}

function formatSeconds(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

function App() {
  // Stato sessione corrente
  const [session, setSession] = useState(() => {
    const stored = loadSessionFromStorage();
    if (stored && stored.workoutId === DEFAULT_WORKOUT.id) {
      return stored;
    }

    // Se non c'è sessione salvata, creane una nuova
    const now = new Date();
    return {
      workoutId: DEFAULT_WORKOUT.id,
      workoutName: DEFAULT_WORKOUT.name,
      startedAt: now.toISOString(),
      // per ogni esercizio creiamo un array di serie con rep/weight vuoti
      exercises: DEFAULT_WORKOUT.exercises.map((ex) => ({
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
  });

  // Timer di recupero
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  const [isRestRunning, setIsRestRunning] = useState(false);
  const [lastCompletedExercise, setLastCompletedExercise] = useState(null);
  const [lastCompletedSetIndex, setLastCompletedSetIndex] = useState(null);

  // Timer globale allenamento (solo display)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Effetto: salva la sessione ogni volta che cambia
  useEffect(() => {
    saveSessionToStorage(session);
  }, [session]);

  // Effetto: timer globale allenamento
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

  // Effetto: timer di recupero
  useEffect(() => {
    if (!isRestRunning || restSecondsLeft <= 0) return;

    const id = setInterval(() => {
      setRestSecondsLeft((prev) => {
        if (prev <= 1) {
          // Timer finito
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

    // Avvia timer recupero se stai segnando come completata (non se deselezioni)
    const exerciseConfig = DEFAULT_WORKOUT.exercises.find((e) => e.id === exerciseId);
    const rest = exerciseConfig?.defaultRestSeconds || DEFAULT_WORKOUT.defaultRestSeconds || 90;

    setLastCompletedExercise(exerciseId);
    setLastCompletedSetIndex(setIndex);
    setRestSecondsLeft(rest);
    setIsRestRunning(true);
  }

  function handleResetSession() {
    if (!window.confirm("Vuoi davvero resettare la sessione corrente?")) return;

    const now = new Date();
    const fresh = {
      workoutId: DEFAULT_WORKOUT.id,
      workoutName: DEFAULT_WORKOUT.name,
      startedAt: now.toISOString(),
      exercises: DEFAULT_WORKOUT.exercises.map((ex) => ({
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

  return (
    <div className="app-container">
      <div className="top-bar">
        <div>
          <div className="app-title">Gym Tracker</div>
          <div className="small-text">{session.workoutName}</div>
        </div>
        <div>
          <div className={`timer-display ${elapsedSeconds > 0 ? "timer-running" : "timer-idle"}`}>
            ⏱ {formatSeconds(elapsedSeconds)}
          </div>
          <div className="small-text">Durata allenamento</div>
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className={`timer-display ${isRestRunning ? "timer-running" : "timer-idle"}`}>
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

      {/* Card progressi rapidi */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Riepilogo sessione</div>
        </div>
        <div className="session-summary">
          Volume totale completato: <strong>{Number.isNaN(totalVolume) ? 0 : totalVolume} kg</strong>
        </div>
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
                Serie: {exercise.sets.length} | Target reps: {exercise.sets[0]?.targetReps}
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
                          handleSetFieldChange(exercise.id, set.index, "reps", e.target.value)
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
                          handleSetFieldChange(exercise.id, set.index, "weight", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <div className="set-label">Done</div>
                      <button
                        className={`button button-full ${
                          set.done ? "button-primary" : "button-secondary"
                        }`}
                        onClick={() => handleToggleSetDone(exercise.id, set.index)}
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

      <button className="button button-danger button-full" onClick={handleResetSession}>
        Reset sessione
      </button>
    </div>
  );
}

export default App;
