import { useEffect, useState } from "react";
import "./App.css";
import Papa from "papaparse";
import { supabase } from "./supabaseClient";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import "drag-drop-touch";
import ProgressStats from "./ProgressStats";

const SESSION_KEY_BASE = "gym-tracker-session-v3";
const HISTORY_KEY_BASE = "gym-tracker-history-v1";
const WORKOUTS_KEY_BASE = "gym-tracker-workouts-v1";

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
  } catch {}
}

function playStartBeep() {
  try {
    const audio = new Audio("/start-beep.mp3");
    audio.currentTime = 0;
    audio.play();
  } catch {}
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

async function bootstrapDefaultWorkoutsForUser(userId) {
  if (!userId) return;

  const workoutRows = DEFAULT_WORKOUTS.map((w) => ({
    user_id: userId,
    slug: w.id,
    name: w.name,
    default_rest_seconds: w.defaultRestSeconds || 90,
  }));

  const { data: insertedWorkouts, error: insertWorkoutsError } = await supabase
    .from("workouts")
    .insert(workoutRows)
    .select("id, slug");

  if (insertWorkoutsError) {
    console.warn("Errore inserimento default workouts:", insertWorkoutsError);
    return null;
  }

  const slugToId = {};
  insertedWorkouts.forEach((w) => {
    slugToId[w.slug] = w.id;
  });

  const exerciseRows = [];

  DEFAULT_WORKOUTS.forEach((w) => {
    const dbWorkoutId = slugToId[w.id];
    if (!dbWorkoutId) return;

    w.exercises.forEach((ex, idx) => {
      exerciseRows.push({
        workout_id: dbWorkoutId,
        exercise_id: ex.id,
        name: ex.name,
        target_sets: ex.targetSets,
        target_reps: ex.targetReps,
        default_weight: ex.defaultWeight,
        position: idx,
      });
    });
  });

  if (exerciseRows.length > 0) {
    const { error: insertExError } = await supabase
      .from("workout_exercises")
      .insert(exerciseRows);

    if (insertExError) {
      console.warn(
        "Errore inserimento esercizi per default workouts:",
        insertExError
      );
    }
  }

  return insertedWorkouts;
}

function App() {
  const [sessionSupabase, setSessionSupabase] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionSupabase(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionSupabase(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="app-container">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

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

  return <AppContent userId={sessionSupabase.user.id} />;
}

function AppContent({ userId }) {
  const [dataLoading, setDataLoading] = useState(true);
  const [workouts, setWorkouts] = useState([]);
  const [csvError, setCsvError] = useState("");
  const [history, setHistory] = useState([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(null);
  const [session, setSession] = useState(null);

  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  const [isRestRunning, setIsRestRunning] = useState(false);
  const [lastCompletedExercise, setLastCompletedExercise] = useState(null);
  const [lastCompletedSetIndex, setLastCompletedSetIndex] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorWorkoutId, setEditorWorkoutId] = useState(null);
  const [draggedExerciseId, setDraggedExerciseId] = useState(null);
  const [dragOverExerciseId, setDragOverExerciseId] = useState(null);

  const [showStats, setShowStats] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  useEffect(() => {
    async function loadWorkoutsFromDb() {
      setDataLoading(true);

      try {
        let { data: dbWorkouts, error: workoutsError } = await supabase
          .from("workouts")
          .select("*")
          .eq("user_id", userId);

        if (workoutsError) {
          console.warn("Errore caricamento workouts:", workoutsError);
          setWorkouts(DEFAULT_WORKOUTS);
          setSelectedWorkoutId(DEFAULT_WORKOUTS[0].id);
          setSession(buildEmptySessionFromWorkout(DEFAULT_WORKOUTS[0]));
          setDataLoading(false);
          return;
        }

        if (!dbWorkouts || dbWorkouts.length === 0) {
          const insertedDefaults = await bootstrapDefaultWorkoutsForUser(
            userId
          );

          if (!insertedDefaults) {
            setWorkouts(DEFAULT_WORKOUTS);
            setSelectedWorkoutId(DEFAULT_WORKOUTS[0].id);
            setSession(buildEmptySessionFromWorkout(DEFAULT_WORKOUTS[0]));
            setDataLoading(false);
            return;
          }

          const resAfterBootstrap = await supabase
            .from("workouts")
            .select("*")
            .eq("user_id", userId);

          if (resAfterBootstrap.error) {
            console.warn(
              "Errore ricaricamento workouts dopo bootstrap:",
              resAfterBootstrap.error
            );
            setWorkouts(DEFAULT_WORKOUTS);
            setSelectedWorkoutId(DEFAULT_WORKOUTS[0].id);
            setSession(buildEmptySessionFromWorkout(DEFAULT_WORKOUTS[0]));
            setDataLoading(false);
            return;
          }

          dbWorkouts = resAfterBootstrap.data || [];
        }

        const loadedWorkouts = await Promise.all(
          dbWorkouts.map(async (w) => {
            const { data: exercises, error: exError } = await supabase
              .from("workout_exercises")
              .select("*")
              .eq("workout_id", w.id)
              .order("position", { ascending: true });

            if (exError) {
              console.warn("Errore caricamento esercizi:", exError);
              return null;
            }

            return {
              id: w.slug,
              name: w.name,
              defaultRestSeconds: w.default_rest_seconds || 90,
              exercises: exercises.map((ex) => ({
                id: ex.exercise_id,
                name: ex.name,
                targetSets: ex.target_sets,
                targetReps: ex.target_reps,
                defaultWeight: ex.default_weight,
              })),
            };
          })
        );

        const validWorkouts = loadedWorkouts.filter((w) => w !== null);

        if (validWorkouts.length > 0) {
          setWorkouts(validWorkouts);
          setSelectedWorkoutId(validWorkouts[0].id);
          setSession(buildEmptySessionFromWorkout(validWorkouts[0]));
        } else {
          setWorkouts(DEFAULT_WORKOUTS);
          setSelectedWorkoutId(DEFAULT_WORKOUTS[0].id);
          setSession(buildEmptySessionFromWorkout(DEFAULT_WORKOUTS[0]));
        }

        const { data: dbSessions, error: sessionsError } = await supabase
          .from("sessions")
          .select("*")
          .eq("user_id", userId)
          .order("started_at", { ascending: false })
          .limit(20);

        if (!sessionsError && dbSessions) {
          const formattedHistory = dbSessions.map((s) => ({
            id: s.id,
            workoutId: s.workout_id,
            workoutName: s.workout_name,
            startedAt: s.started_at,
            finishedAt: s.finished_at,
            volume: s.volume,
            totalSetsDone: s.total_sets_done,
          }));
          setHistory(formattedHistory);
        }
      } catch (error) {
        console.error("Errore generale caricamento:", error);
        setWorkouts(DEFAULT_WORKOUTS);
        setSelectedWorkoutId(DEFAULT_WORKOUTS[0].id);
        setSession(buildEmptySessionFromWorkout(DEFAULT_WORKOUTS[0]));
      } finally {
        setDataLoading(false);
      }
    }

    if (userId) {
      loadWorkoutsFromDb();
    }
  }, [userId]);

  useEffect(() => {
    if (session) {
      const key = userScopedKey(SESSION_KEY_BASE, userId);
      try {
        window.localStorage.setItem(key, JSON.stringify(session));
      } catch {}
    }
  }, [session, userId]);

  useEffect(() => {
    const key = userScopedKey(HISTORY_KEY_BASE, userId);
    try {
      window.localStorage.setItem(key, JSON.stringify(history));
    } catch {}
  }, [history, userId]);

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

  async function syncWorkoutToDb(workout) {
    if (!userId) return;

    const { data: existing, error: fetchError } = await supabase
      .from("workouts")
      .select("id")
      .eq("user_id", userId)
      .eq("slug", workout.id)
      .maybeSingle();

    if (fetchError) {
      console.warn("Supabase fetch workout error:", fetchError);
      return;
    }

    let dbWorkoutId = null;

    if (existing?.id) {
      dbWorkoutId = existing.id;

      const { error: updateError } = await supabase
        .from("workouts")
        .update({
          name: workout.name,
          default_rest_seconds: workout.defaultRestSeconds || 90,
        })
        .eq("id", dbWorkoutId)
        .eq("user_id", userId);

      if (updateError) {
        console.warn("Supabase update workout error:", updateError);
        return;
      }
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("workouts")
        .insert({
          user_id: userId,
          slug: workout.id,
          name: workout.name,
          default_rest_seconds: workout.defaultRestSeconds || 90,
        })
        .select("id")
        .single();

      if (insertError) {
        console.warn("Supabase insert workout error:", insertError);
        return;
      }

      dbWorkoutId = inserted.id;
    }

    const { error: deleteError } = await supabase
      .from("workout_exercises")
      .delete()
      .eq("workout_id", dbWorkoutId);

    if (deleteError) {
      console.warn("Supabase delete workout_exercises error:", deleteError);
      return;
    }

    if (workout.exercises.length > 0) {
      const rows = workout.exercises.map((ex, idx) => ({
        workout_id: dbWorkoutId,
        exercise_id: ex.id,
        name: ex.name,
        target_sets: ex.targetSets,
        target_reps: ex.targetReps,
        default_weight: ex.defaultWeight,
        position: idx,
      }));

      const { error: insertError } = await supabase
        .from("workout_exercises")
        .insert(rows);

      if (insertError) {
        console.warn("Supabase insert workout_exercises error:", insertError);
      }
    }
  }

  if (dataLoading) {
    return (
      <div className="app-container">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Caricamento workout...</div>
          </div>
          <div style={{ padding: "20px", textAlign: "center" }}>
            <p>Sto caricando i tuoi dati dal database...</p>
          </div>
        </div>
      </div>
    );
  }

  function handleSetFieldChange(exerciseId, setIndex, field, value) {
    setSession((prev) => {
      const updatedExercises = prev.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const updatedSets = ex.sets.map((s) => {
          if (s.index !== setIndex) return s;
          return { ...s, [field]: value };
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
          return { ...s, done: !s.done };
        });
        return { ...ex, sets: updatedSets };
      });
      return { ...prev, exercises: updatedExercises };
    });

    const currentWorkout = findWorkoutById(workouts, selectedWorkoutId);
    const exerciseConfig = currentWorkout.exercises.find(
      (e) => e.id === exerciseId
    );
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

    const currentWorkout = findWorkoutById(workouts, selectedWorkoutId);
    const fresh = buildEmptySessionFromWorkout(currentWorkout);

    setSession(fresh);
    setElapsedSeconds(0);
    setIsRestRunning(false);
    setRestSecondsLeft(0);
    setLastCompletedExercise(null);
    setLastCompletedSetIndex(null);
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

    const { data: insertedSession, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        user_id: userId,
        workout_id: session.workoutId,
        workout_name: session.workoutName,
        started_at: session.startedAt,
        finished_at: finishedAt,
        volume,
        total_sets_done: completedSets.length,
      })
      .select("id")
      .single();

    if (sessionError) {
      console.warn("Errore salvataggio sessione:", sessionError);
      alert("Errore nel salvataggio della sessione");
      return;
    }

    const sessionId = insertedSession.id;

    if (completedSets.length > 0) {
      const setsToInsert = completedSets.map((set) => ({
        session_id: sessionId,
        exercise_name: set.exName,
        set_index: set.index,
        reps: Number(set.reps),
        weight: Number(set.weight),
        done: true,
      }));

      const { error: setsError } = await supabase
        .from("session_sets")
        .insert(setsToInsert);

      if (setsError) {
        console.warn("Errore salvataggio set:", setsError);
      }
    }

    const completedSession = {
      id: sessionId,
      workoutId: session.workoutId,
      workoutName: session.workoutName,
      startedAt: session.startedAt,
      finishedAt,
      volume,
      totalSetsDone: completedSets.length,
    };

    setHistory((prev) => [completedSession, ...prev]);

    const currentWorkout = findWorkoutById(workouts, selectedWorkoutId);
    const fresh = buildEmptySessionFromWorkout(currentWorkout);
    setSession(fresh);
    setElapsedSeconds(0);
    setIsRestRunning(false);
    setRestSecondsLeft(0);
    setLastCompletedExercise(null);
    setLastCompletedSetIndex(null);
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
    setWorkouts((prev) => {
      const next = prev.map((w) =>
        w.id === workoutId
          ? {
              ...w,
              [field]:
                field === "defaultRestSeconds" ? Number(value) || 0 : value,
            }
          : w
      );

      const updated = next.find((w) => w.id === workoutId);
      if (updated) {
        syncWorkoutToDb(updated);
      }

      return next;
    });
  }

  function handleExerciseFieldChange(workoutId, exerciseId, field, value) {
    setWorkouts((prev) => {
      const next = prev.map((w) => {
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
      });

      const updated = next.find((w) => w.id === workoutId);
      if (updated) {
        syncWorkoutToDb(updated);
      }

      return next;
    });
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
        syncWorkoutToDb(updated);
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
        syncWorkoutToDb(updated);
      }

      return next;
    });
  }

  function handleReorderExercises(workoutId, fromExerciseId, toExerciseId) {
    if (!fromExerciseId || !toExerciseId || fromExerciseId === toExerciseId)
      return;

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
        syncWorkoutToDb(updated);
      }

      return next;
    });

    setDraggedExerciseId(null);
    setDragOverExerciseId(null);
  }

  function handleDeleteWorkout(workoutId) {
    if (!window.confirm("Vuoi davvero eliminare questo workout?")) return;

    if (userId) {
      supabase
        .from("workouts")
        .delete()
        .eq("user_id", userId)
        .eq("slug", workoutId)
        .then((result) => {
          if (result.error) {
            console.warn("Errore eliminazione workout da Supabase:", result.error);
          }
        });
    }

    setWorkouts((prev) => {
      const filtered = prev.filter((w) => w.id !== workoutId);

      if (filtered.length === 0) {
        const fallback = DEFAULT_WORKOUTS;
        setSelectedWorkoutId(fallback[0].id);
        setSession(buildEmptySessionFromWorkout(fallback[0]));
        setIsEditorOpen(false);
        setEditorWorkoutId(null);
        return fallback;
      }

      setSelectedWorkoutId((currentSelectedId) => {
        if (currentSelectedId === workoutId) {
          const newSelectedId = filtered[0].id;
          const newWorkout = filtered[0];
          setSession(buildEmptySessionFromWorkout(newWorkout));
          return newSelectedId;
        }
        return currentSelectedId;
      });

      setIsEditorOpen(false);
      setEditorWorkoutId(null);

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

    const reader = new FileReader();

    reader.onload = (e) => {
      let text = e.target.result;

      text = text
        .split("\n")
        .map((line) => line.replace(/^"|"$/g, ""))
        .join("\n");

      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors && results.errors.length > 0) {
            console.error(results.errors);
            setCsvError("Errore nel parsing del CSV. Controlla il file.");
            return;
          }

          const rows = results.data;
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

          const importedWorkouts = Object.values(byWorkout);

          if (!importedWorkouts.length) {
            setCsvError("Nessun workout valido trovato nel CSV.");
            return;
          }

          setWorkouts((prev) => {
            const map = new Map(prev.map((w) => [w.id, w]));
            importedWorkouts.forEach((w) => {
              map.set(w.id, w);
            });
            const next = Array.from(map.values());

            importedWorkouts.forEach((w) => {
              syncWorkoutToDb(w);
            });

            return next;
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
    };

    reader.readAsText(file);
  }

  const currentWorkout = findWorkoutById(workouts, selectedWorkoutId);
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
      {/* Top bar */}
      <div className="top-bar">
        <div>
          <div className="app-title">Gym Bro Tracker</div>
          <div className="small-text">Workout selezionato</div>
          <select
            value={selectedWorkoutId}
            onChange={(e) => {
              const newId = e.target.value;
              setSelectedWorkoutId(newId);

              const newWorkout = findWorkoutById(workouts, newId);
              if (newWorkout) {
                setSession(buildEmptySessionFromWorkout(newWorkout));
                setElapsedSeconds(0);
                setIsRestRunning(false);
                setRestSecondsLeft(0);
                setLastCompletedExercise(null);
                setLastCompletedSetIndex(null);
              }
            }}
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
              onClick={() => {
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

                syncWorkoutToDb(newWorkout);
              }}
            >
              + Nuovo workout
            </button>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => setShowStats(!showStats)}
            >
              📊 Statistiche
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

      {/* Info workout */}
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

      {/* Timer recupero */}
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

      {/* Riepilogo */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Riepilogo sessione</div>
        </div>
        <div className="session-summary">
          Volume totale completato:{" "}
          <strong>{Number.isNaN(totalVolume) ? 0 : totalVolume} kg</strong>
        </div>
      </div>

      {/* Storico */}
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
                    cursor: "pointer",
                    padding: "8px",
                    borderRadius: 8,
                    background: selectedSessionId === h.id ? "#111827" : "transparent",
                  }}
                  onClick={() => setSelectedSessionId(h.id)}
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

      {/* Dettagli sessione selezionata */}
      {selectedSessionId && (
        <SessionDetails
          sessionId={selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
        />
      )}

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

      {/* Pulsanti azione */}
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

      {/* EDITOR WORKOUT */}
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
              Template colonne: workout_id, workout_name, default_rest_seconds,
              exercise_id, exercise_name, target_sets, target_reps,
              default_weight.
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

      {/* Statistiche e Progressi */}
      {showStats && (
        <ProgressStats userId={userId} onClose={() => setShowStats(false)} />
      )}
    </div>
  );
}

function SessionDetails({ sessionId, onClose }) {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSets() {
      const { data, error } = await supabase
        .from("session_sets")
        .select("*")
        .eq("session_id", sessionId)
        .order("exercise_name", { ascending: true })
        .order("set_index", { ascending: true });

      if (error) {
        console.error("Errore caricamento set:", error);
      } else {
        setSets(data || []);
      }
      setLoading(false);
    }

    loadSets();
  }, [sessionId]);

  if (loading) {
    return <div className="card">Caricamento...</div>;
  }

  const byExercise = {};
  sets.forEach((set) => {
    if (!byExercise[set.exercise_name]) {
      byExercise[set.exercise_name] = {
        name: set.exercise_name,
        sets: [],
      };
    }
    byExercise[set.exercise_name].sets.push(set);
  });

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="card-header">
        <div className="card-title">Dettagli sessione</div>
        <button className="button button-secondary" onClick={onClose}>
          Chiudi
        </button>
      </div>

      {Object.values(byExercise).map((ex) => (
        <div key={ex.name} style={{ marginBottom: 16 }}>
          <div className="exercise-name">{ex.name}</div>
          <div style={{ fontSize: "0.85rem" }}>
            {ex.sets.map((set) => (
              <div
                key={set.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 10px",
                  marginBottom: 4,
                  borderRadius: 8,
                  background: "#111827",
                }}
              >
                <span>Set {set.set_index}</span>
                <span>
                  {set.reps} reps × {set.weight} kg ={" "}
                  <strong>{set.reps * set.weight} kg</strong>
                </span>
              </div>
            ))}
          </div>
          <div className="small-text" style={{ marginTop: 4 }}>
            Volume esercizio:{" "}
            <strong>
              {ex.sets.reduce((sum, s) => sum + s.reps * s.weight, 0)} kg
            </strong>
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;