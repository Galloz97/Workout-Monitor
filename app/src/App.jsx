// FILE: src/App.jsx
import { useEffect, useState } from "react";
import "./App.css";
import Papa from "papaparse";
import { supabase } from "./supabaseClient";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

const SESSION_KEY_BASE = "gym-tracker-session-v3";
const HISTORY_KEY_BASE = "gym-tracker-history-v1";
const WORKOUTS_KEY_BASE = "gym-tracker-workouts-v1";

/**
 * Workout di default se non esiste nulla in localStorage
 */
const DEFAULT_WORKOUTS = [
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

function userScopedKey(base, userId) {
  return `${base}-${userId || "anon"}`;
}

function loadWorkoutsGlobal() {
  try {
    const raw = window.localStorage.getItem(WORKOUTS_KEY_BASE);
    if (!raw) return DEFAULT_WORKOUTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_WORKOUTS;
  } catch {
    return DEFAULT_WORKOUTS;
  }
}

function saveWorkoutsGlobal(workouts) {
  try {
    window.localStorage.setItem(WORKOUTS_KEY_BASE, JSON.stringify(workouts));
  } catch {
    // ignore
  }
}

function findWorkoutById(workouts, id) {
  return workouts.find((w) => w.id === id) || workouts[0];
}

function buildEmptySessionFromWorkout(workout) {
  const now = new Date();

  return {
    workoutId: workout.id,
    workoutName: workout.name,
    startedAt: now.toISOString(),
    exercises: workout.exercises.map((ex) => ({
      id: ex.id,
      name: ex.name,
      sets: Array.from({ length: ex.targetSets || 3 }, (_, idx) => ({
        index: idx + 1,
        targetReps: ex.targetReps || 8,
        reps: "",
        weight: ex.defaultWeight || "",
        done: false,
      })),
    })),
  };
}

function loadSessionFromStorage(userId) {
  try {
    const key = userScopedKey(SESSION_KEY_BASE, userId);
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSessionToStorage(session, userId) {
  try {
    const key = userScopedKey(SESSION_KEY_BASE, userId);
    window.localStorage.setItem(key, JSON.stringify(session));
  } catch {
    // ignore
  }
}

function loadHistoryFromStorage(userId) {
  try {
    const key = userScopedKey(HISTORY_KEY_BASE, userId);
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistoryToStorage(history, userId) {
  try {
    const key = userScopedKey(HISTORY_KEY_BASE, userId);
    window.localStorage.setItem(key, JSON.stringify(history));
  } catch {
    // ignore
  }
}

function formatSeconds(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

function playBeep() {
  try {
    const audio = new Audio("/beep.mp3");
    audio.currentTime = 0;
    audio.play();
  } catch {
    // ignore
  }
}

function playStartBeep() {
  try {
    const audio = new Audio("/start-beep.mp3");
    audio.currentTime = 0;
    audio.play();
  } catch {
    // ignore
  }
}

async function getDbWorkoutIdBySlug(slug, userId, supabaseClient) {
  const { data, error } = await supabaseClient
    .from("workouts")
    .select("id")
    .eq("user_id", userId)
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.warn("getDbWorkoutIdBySlug error:", error);
    return null;
  }
  return data?.id || null;
}

function workoutsFromCsvRows(rows) {
  const byWorkout = {};

  rows.forEach((row) => {
    const workoutId = String(row.workout_id || "").trim();
    const workoutName = String(row.workout_name || "").trim();
    if (!workoutId || !workoutName) return;

    const rest = Number(row.default_rest_seconds) || 90;
    const exId = String(row.exercise_id || "").trim();
    const exName = String(row.exercise_name || "").trim();
    const targetSets = Number(row.target_sets) || 3;
    const targetReps = Number(row.target_reps) || 8;
    const defaultWeight = Number(row.default_weight) || 0;

    if (!byWorkout[workoutId]) {
      byWorkout[workoutId] = {
        id: workoutId,
        name: workoutName,
        defaultRestSeconds: rest,
        exercises: [],
      };
    }

    if (exId && exName) {
      byWorkout[workoutId].exercises.push({
        id: exId,
        name: exName,
        targetSets,
        targetReps,
        defaultWeight,
      });
    }
  });

  return Object.values(byWorkout);
}

function App() {
  // Logging sessione utente
  const [sessionSupabase, setSessionSupabase] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionSupabase(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionSupabase(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const userId = sessionSupabase?.user?.id || null;

  // Caricamento iniziale dei workouts dal localStorage per-user (fallback a global/default)
  const [workouts, setWorkouts] = useState(() => {
    const uid = userId;
    try {
      const key = userScopedKey(WORKOUTS_KEY_BASE, uid);
      const raw = window.localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return loadWorkoutsGlobal();
  });

  // Errore di import csv workout
  const [csvError, setCsvError] = useState("");

  // Storico sessioni completate
  const [history, setHistory] = useState(() => loadHistoryFromStorage(userId));

  // Selezione workout
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(() => {
    const stored = loadSessionFromStorage(userId);
    if (stored?.workoutId) {
      const exists = workouts.some((w) => w.id === stored.workoutId);
      if (exists) return stored.workoutId;
    }
    return workouts[0].id;
  });

  // Sessione corrente
  const [session, setSession] = useState(() => {
    const stored = loadSessionFromStorage(userId);
    if (stored && workouts.some((w) => w.id === stored.workoutId)) {
      return stored;
    }
    const workout = workouts[0];
    return buildEmptySessionFromWorkout(workout);
  });

  // Timer di recupero
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  const [isRestRunning, setIsRestRunning] = useState(false);
  const [lastCompletedExercise, setLastCompletedExercise] = useState(null);
  const [lastCompletedSetIndex, setLastCompletedSetIndex] = useState(null);

  // Timer globale allenamento
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Stato UI editor workout
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorWorkoutId, setEditorWorkoutId] = useState(null);

  // Stato drag & drop esercizi (solo per editor)
  const [draggedExerciseId, setDraggedExerciseId] = useState(null);
  const [dragOverExerciseId, setDragOverExerciseId] = useState(null);

  // Gate login: se non c'è sessione, mostra solo Auth
  if (!sessionSupabase) {
    return (
      <div className="app-container">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Gym Bro Tracker - Login</div>
          </div>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
          />
        </div>
      </div>
    );
  }

  // Effetto: salva workouts per user corrente
  useEffect(() => {
    const uid = userId;
    try {
      const key = userScopedKey(WORKOUTS_KEY_BASE, uid);
      window.localStorage.setItem(key, JSON.stringify(workouts));
    } catch {
      // ignore
    }
    saveWorkoutsGlobal(workouts);
  }, [workouts, userId]);

  // Effetto: sincronizza sessione quando cambiano workouts o selectedWorkoutId
  useEffect(() => {
    const currentWorkout = findWorkoutById(workouts, selectedWorkoutId);
    const stored = loadSessionFromStorage(userId);

    if (stored && stored.workoutId === currentWorkout.id) {
      setSession(stored);
      return;
    }

    const fresh = buildEmptySessionFromWorkout(currentWorkout);
    setSession(fresh);
    setElapsedSeconds(0);
    setIsRestRunning(false);
    setRestSecondsLeft(0);
    setLastCompletedExercise(null);
    setLastCompletedSetIndex(null);
    saveSessionToStorage(fresh, userId);
  }, [workouts, selectedWorkoutId, userId]);

  // Effetto: salva sessione
  useEffect(() => {
    if (session) {
      saveSessionToStorage(session, userId);
    }
  }, [session, userId]);

  // Effetto: salva storico
  useEffect(() => {
    saveHistoryToStorage(history, userId);
  }, [history, userId]);

  // Effetto: carica storico da Supabase
  useEffect(() => {
    const fetchSessions = async () => {
      if (!sessionSupabase?.user?.id) return;
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("user_id", sessionSupabase.user.id)
        .order("started_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        setHistory(
          data.map((s) => ({
            id: s.id,
            workoutId: s.workout_id,
            workoutName: s.workout_name,
            startedAt: s.started_at,
            finishedAt: s.finished_at,
            volume: Number(s.volume) || 0,
            totalSetsDone: s.total_sets_done || 0,
          }))
        );
      } else if (error) {
        console.warn("Supabase fetch sessions error:", error);
      }
    };

    fetchSessions();
  }, [sessionSupabase?.user?.id]);

  // Timer globale
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
          playBeep();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [isRestRunning, restSecondsLeft]);

  const currentWorkout = findWorkoutById(workouts, selectedWorkoutId);

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

    const exerciseConfig = currentWorkout.exercises.find((e) => e.id === exerciseId);
    const rest =
      exerciseConfig?.defaultRestSeconds ||
      currentWorkout.defaultRestSeconds ||
      90;

    setLastCompletedExercise(exerciseId);
    setLastCompletedSetIndex(setIndex);
    setRestSecondsLeft(rest);
    setIsRestRunning(true);
    playStartBeep();
  }

  function handleResetSession() {
    if (!window.confirm("Vuoi davvero resettare la sessione corrente?")) return;

    const fresh = buildEmptySessionFromWorkout(currentWorkout);

    setSession(fresh);
    setElapsedSeconds(0);
    setIsRestRunning(false);
    setRestSecondsLeft(0);
    setLastCompletedExercise(null);
    setLastCompletedSetIndex(null);
    saveSessionToStorage(fresh, userId);
  }

  async function handleCompleteSession() {
    if (!session) return;

    const now = new Date();
    const finishedAt = now.toISOString();

    const allSets = session.exercises.flatMap((ex) =>
      ex.sets.map((s) => ({ exId: ex.id, exName: ex.name, ...s }))
    );

    const completedSets = allSets.filter((s) => s.done && s.reps && s.weight);
    const volume = completedSets.reduce(
      (sum, s) => sum + Number(s.reps) * Number(s.weight),
      0
    );

    if (sessionSupabase?.user?.id) {
      const { error } = await supabase.from("sessions").insert({
        user_id: sessionSupabase.user.id,
        workout_id: null,
        workout_name: session.workoutName,
        started_at: session.startedAt,
        finished_at: finishedAt,
        volume,
        total_sets_done: completedSets.length,
      });
      if (error) console.warn("Supabase sessions error:", error);
    }

    const completedSession = {
      id: `${session.workoutId}-${session.startedAt}`,
      workoutId: session.workoutId,
      workoutName: session.workoutName,
      startedAt: session.startedAt,
      finishedAt,
      volume,
      totalSetsDone: completedSets.length,
    };

    setHistory((prev) => [completedSession, ...prev]);

    const fresh = buildEmptySessionFromWorkout(currentWorkout);
    setSession(fresh);
    setElapsedSeconds(0);
    setIsRestRunning(false);
    setRestSecondsLeft(0);
    setLastCompletedExercise(null);
    setLastCompletedSetIndex(null);
    saveSessionToStorage(fresh, userId);
  }

  async function syncExercisesToDb(workout) {
    if (!sessionSupabase?.user?.id) return;

    let dbWorkoutId = await getDbWorkoutIdBySlug(
      workout.id,
      sessionSupabase.user.id,
      supabase
    );

    if (!dbWorkoutId) {
      const { data, error } = await supabase
        .from("workouts")
        .upsert({
          user_id: sessionSupabase.user.id,
          slug: workout.id,
          name: workout.name,
          default_rest_seconds: workout.defaultRestSeconds || 90,
        })
        .select("id")
        .single();
      if (error) return;
      dbWorkoutId = data.id;
    }

    await supabase.from("workout_exercises").delete().eq("workout_id", dbWorkoutId);
    if (workout.exercises.length > 0) {
      await supabase.from("workout_exercises").insert(
        workout.exercises.map((ex, idx) => ({
          workout_id: dbWorkoutId,
          exercise_id: ex.id,
          name: ex.name,
          target_sets: ex.targetSets,
          target_reps: ex.targetReps,
          default_weight: ex.defaultWeight,
          position: idx,
        }))
      );
    }
  }

  function handleReorderExercises(workoutId, fromExerciseId, toExerciseId) {
    if (!fromExerciseId || !toExerciseId || fromExerciseId === toExerciseId) return;

    setWorkouts((prev) => {
      const next = prev.map((w) => {
        if (w.id !== workoutId) return w;

        const current = [...w.exercises];
        const fromIndex = current.findIndex((ex) => ex.id === fromExerciseId);
        const toIndex = current.findIndex((ex) => ex.id === toExerciseId);
        if (fromIndex === -1 || toIndex === -1) return w;

        const [moved] = current.splice(fromIndex, 1);
        current.splice(toIndex, 0, moved);

        return { ...w, exercises: current };
      });

      const updated = next.find((w) => w.id === workoutId);
      if (updated) {
        syncExercisesToDb(updated);
      }
      return next;
    });

    setDraggedExerciseId(null);
    setDragOverExerciseId(null);
  }

  function handleOpenEditor(workoutId) {
    setEditorWorkoutId(workoutId);
    setIsEditorOpen(true);
  }

  function handleCloseEditor() {
    setIsEditorOpen(false);
    setEditorWorkoutId(null);
  }

  function handleWorkoutFieldChange(workoutId, field, value) {
    setWorkouts((prev) =>
      prev.map((w) =>
        w.id === workoutId
          ? {
              ...w,
              [field]:
                field === "defaultRestSeconds" ? Number(value) || 0 : value,
            }
          : w
      )
    );

    if (sessionSupabase?.user?.id) {
      const updated = workouts.find((w) => w.id === workoutId);
      if (!updated) return;
      const next = {
        ...updated,
        [field]:
          field === "defaultRestSeconds" ? Number(value) || 0 : value,
      };
      supabase.from("workouts").upsert({
        user_id: sessionSupabase.user.id,
        slug: next.id,
        name: next.name,
        default_rest_seconds: next.defaultRestSeconds || 90,
      });
    }
  }

  function handleExerciseFieldChange(workoutId, exerciseId, field, value) {
    setWorkouts((prev) =>
      prev.map((w) => {
        if (w.id !== workoutId) return w;
        const updatedExercises = w.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          let parsedValue = value;
          if (["targetSets", "targetReps", "defaultWeight"].includes(field)) {
            parsedValue = Number(value) || 0;
          }
          return { ...ex, [field]: parsedValue };
        });
        return { ...w, exercises: updatedExercises };
      })
    );
  }

  function handleAddExercise(workoutId) {
    setWorkouts((prev) => {
      const next = prev.map((w) => {
        if (w.id !== workoutId) return w;
        const newEx = {
          id: `ex-${Date.now()}`,
          name: "Nuovo esercizio",
          targetSets: 3,
          targetReps: 8,
          defaultWeight: 0,
        };
        return { ...w, exercises: [...w.exercises, newEx] };
      });

      const updated = next.find((w) => w.id === workoutId);
      if (updated) {
        syncExercisesToDb(updated);
      }
      return next;
    });
  }

  function handleRemoveExercise(workoutId, exerciseId) {
    if (!window.confirm("Rimuovere questo esercizio dal workout?")) return;

    setWorkouts((prev) => {
      const next = prev.map((w) => {
        if (w.id !== workoutId) return w;
        return {
          ...w,
          exercises: w.exercises.filter((ex) => ex.id !== exerciseId),
        };
      });

      const updated = next.find((w) => w.id === workoutId);
      if (updated) {
        syncExercisesToDb(updated);
      }
      return next;
    });
  }

  async function handleAddWorkout() {
    const newId = `workout-${Date.now()}`;
    const newWorkout = {
      id: newId,
      name: "Nuovo workout",
      defaultRestSeconds: 90,
      exercises: [],
    };

    setWorkouts((prev) => [...prev, newWorkout]);
    setSelectedWorkoutId(newId);
    setEditorWorkoutId(newId);
    setIsEditorOpen(true);

    if (sessionSupabase?.user?.id) {
      await supabase.from("workouts").upsert({
        user_id: sessionSupabase.user.id,
        slug: newWorkout.id,
        name: newWorkout.name,
        default_rest_seconds: newWorkout.defaultRestSeconds || 90,
      });
    }
  }

  function handleDeleteWorkout(workoutId) {
    if (!window.confirm("Vuoi davvero eliminare questo workout?")) return;

    setWorkouts((prev) => {
      const filtered = prev.filter((w) => w.id !== workoutId);
      if (filtered.length === 0) {
        return DEFAULT_WORKOUTS;
      }
      if (selectedWorkoutId === workoutId) {
        setSelectedWorkoutId(filtered[0].id);
      }
      return filtered;
    });
  }

  function handleCsvFileChange(event) {
    setCsvError("");
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setCsvError("Per favore carica un file CSV (.csv).");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          console.error(results.errors);
          setCsvError("Errore nel parsing del CSV. Controlla il file.");
          return;
        }

        const rows = results.data;
        const importedWorkouts = workoutsFromCsvRows(rows);

        if (!importedWorkouts.length) {
          setCsvError("Nessun workout valido trovato nel CSV.");
          return;
        }

        setWorkouts((prev) => {
          const map = new Map(prev.map((w) => [w.id, w]));
          importedWorkouts.forEach((w) => {
            map.set(w.id, w);
          });
          return Array.from(map.values());
        });

        const firstImported = importedWorkouts[0];
        setSelectedWorkoutId(firstImported.id);
        setCsvError("");
        event.target.value = "";
      },
      error: () => {
        setCsvError("Errore nella lettura del file CSV.");
      },
    });
  }

  const totalVolume = session.exercises
    .flatMap((ex) => ex.sets.map((s) => ({ exName: ex.name, ...s })))
    .filter((s) => s.done && s.reps && s.weight)
    .reduce((sum, s) => sum + Number(s.reps) * Number(s.weight), 0);

  const workoutBeingEdited =
    editorWorkoutId != null
      ? workouts.find((w) => w.id === editorWorkoutId)
      : null;

  return (
    <div className="app-container">
      {/* Top bar con selezione workout */}
      <div className="top-bar">
        <div>
          <div className="app-title">Gym Bro Tracker</div>
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
            {workouts.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => handleOpenEditor(selectedWorkoutId)}
            >
              Modifica workout
            </button>
            <button
              className="button button-secondary"
              type="button"
              onClick={handleAddWorkout}
            >
              + Nuovo workout
            </button>
          </div>
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
          <button
            className="button button-secondary"
            style={{ marginTop: 8 }}
            onClick={async () => {
              await supabase.auth.signOut();
            }}
          >
            Logout
          </button>
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

      {/* Pulsanti azione sessione */}
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

      {/* EDITOR WORKOUT (inline, sotto) */}
      {isEditorOpen && workoutBeingEdited && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <div className="card-title">Editor workout</div>
            <span className="badge">ID: {workoutBeingEdited.id}</span>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div className="set-label">Nome workout</div>
            <input
              type="text"
              value={workoutBeingEdited.name}
              onChange={(e) =>
                handleWorkoutFieldChange(
                  workoutBeingEdited.id,
                  "name",
                  e.target.value
                )
              }
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div className="set-label">Rest default (secondi)</div>
            <input
              type="number"
              min="0"
              value={workoutBeingEdited.defaultRestSeconds}
              onChange={(e) =>
                handleWorkoutFieldChange(
                  workoutBeingEdited.id,
                  "defaultRestSeconds",
                  e.target.value
                )
              }
            />
          </div>

          {/* Import CSV intero workout */}
          <div
            style={{
              marginBottom: 12,
              padding: 8,
              borderRadius: 8,
              border: "1px dashed #374151",
              backgroundColor: "#020617",
            }}
          >
            <div className="set-label" style={{ marginBottom: 4 }}>
              Importa workout da CSV
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvFileChange}
              style={{ marginBottom: 4 }}
            />
            <div className="small-text">
              Template colonne: workout_id, workout_name,
              default_rest_seconds, exercise_id, exercise_name,
              target_sets, target_reps, default_weight.
            </div>
            {csvError && (
              <div
                style={{
                  marginTop: 4,
                  color: "#f97373",
                  fontSize: "0.75rem",
                }}
              >
                {csvError}
              </div>
            )}
          </div>

          <div className="section-title" style={{ marginTop: 12 }}>
            Esercizi del workout
          </div>

          {workoutBeingEdited.exercises.length === 0 && (
            <div className="small-text" style={{ marginBottom: 8 }}>
              Nessun esercizio. Aggiungine uno con il pulsante sotto.
            </div>
          )}

          {workoutBeingEdited.exercises.map((ex) => (
            <div
              key={ex.id}
              draggable
              onDragStart={() => setDraggedExerciseId(ex.id)}
              onDragEnter={() => setDragOverExerciseId(ex.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() =>
                handleReorderExercises(
                  workoutBeingEdited.id,
                  draggedExerciseId,
                  ex.id
                )
              }
              onDragEnd={() => {
                setDraggedExerciseId(null);
                setDragOverExerciseId(null);
              }}
              style={{
                border: "1px solid #1f2937",
                borderRadius: 8,
                padding: 8,
                marginBottom: 8,
                cursor: "grab",
                backgroundColor: "#020617",
                outline:
                  dragOverExerciseId === ex.id ? "1px solid #22c55e" : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <div className="exercise-name">{ex.name}</div>
                <button
                  className="button button-danger"
                  type="button"
                  onClick={() =>
                    handleRemoveExercise(workoutBeingEdited.id, ex.id)
                  }
                >
                  Rimuovi
                </button>
              </div>
              <div className="set-label" style={{ marginBottom: 4 }}>
                Nome esercizio
              </div>
              <input
                type="text"
                value={ex.name}
                onChange={(e) =>
                  handleExerciseFieldChange(
                    workoutBeingEdited.id,
                    ex.id,
                    "name",
                    e.target.value
                  )
                }
                style={{ marginBottom: 6 }}
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 8,
                }}
              >
                <div>
                  <div className="set-label">Serie</div>
                  <input
                    type="number"
                    min="1"
                    value={ex.targetSets}
                    onChange={(e) =>
                      handleExerciseFieldChange(
                        workoutBeingEdited.id,
                        ex.id,
                        "targetSets",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div>
                  <div className="set-label">Reps</div>
                  <input
                    type="number"
                    min="1"
                    value={ex.targetReps}
                    onChange={(e) =>
                      handleExerciseFieldChange(
                        workoutBeingEdited.id,
                        ex.id,
                        "targetReps",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div>
                  <div className="set-label">Peso def. (kg)</div>
                  <input
                    type="number"
                    min="0"
                    value={ex.defaultWeight}
                    onChange={(e) =>
                      handleExerciseFieldChange(
                        workoutBeingEdited.id,
                        ex.id,
                        "defaultWeight",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            className="button button-secondary button-full"
            type="button"
            style={{ marginTop: 8 }}
            onClick={() => handleAddExercise(workoutBeingEdited.id)}
          >
            + Aggiungi esercizio
          </button>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              className="button button-secondary button-full"
              type="button"
              onClick={handleCloseEditor}
            >
              Chiudi editor
            </button>
            <button
              className="button button-danger button-full"
              type="button"
              onClick={() => handleDeleteWorkout(workoutBeingEdited.id)}
            >
              Elimina workout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
