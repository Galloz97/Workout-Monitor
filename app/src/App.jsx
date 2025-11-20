import { useEffect, useState } from "react";
import "./App.css";
import Papa from "papaparse";
import { supabase } from "./supabaseClient";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import ProgressStats from "./ProgressStats";
import WorkoutEditor from "./WorkoutEditor";


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
  const [currentView, setCurrentView] = useState("home");
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(null);
  const [editorWorkoutId, setEditorWorkoutId] = useState(null); 
  const [workouts, setWorkouts] = useState([]); 
  const [session, setSession] = useState(null); 

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
      <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '30px 20px' }}>
          <img 
            src="/vite.png" 
            alt="Logo" 
            style={{ 
              height: 200, 
              width: "auto",
              marginBottom: '20px'
            }} 
          />
          <h1 style={{ fontSize: '2rem', margin: '10px 0' }}>
            GYMBRO Tracker
          </h1>
        </div>
        <div style={{ padding: '0 20px 20px' }}>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
          />
        </div>
      </div>
    </div>
  );
}


  const userId = sessionSupabase.user.id;

  // PAGINA STATISTICHE
  if (currentView === "stats") {
    return (
      <div className="app-container">
        <img src="/vite.png" alt="Logo" style={{ height: 200, width: "auto", marginLeft: "auto", marginRight: "auto"}} />
        <div className="top-bar">
          <div>
            <div className="small-text">Statistiche</div>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => setCurrentView("home")}
              style={{ marginTop: 8 }}
            >
              ← Torna all'allenamento
            </button>
          </div>
          <div>
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

        <ProgressStats
          userId={userId}
          workoutId={selectedWorkoutId}
          onClose={() => setCurrentView("home")}
        />
      </div>
    );
  } // ← QUESTA CHIUDE IL BLOCCO STATS

  // PAGINA EDITOR
  if (currentView === "editor") {
    return (
      <div className="app-container">
        <img src="/vite.png" alt="Logo" style={{ height: 200, width: "auto", marginLeft: "auto", marginRight: "auto"}} />
        <div className="top-bar">
          <div>
            <div className="small-text">Editor Workout</div>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => setCurrentView("home")}
              style={{ marginTop: 8 }}
            >
              ← Torna all'allenamento
            </button>
          </div>
          <div>
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

        <WorkoutEditor
          userId={userId}
          workoutId={editorWorkoutId}
          workouts={workouts}
          setWorkouts={setWorkouts}
          onClose={() => setCurrentView("home")}
          onSelectWorkout={setSelectedWorkoutId}
          setSession={setSession}
          selectedWorkoutId={selectedWorkoutId}
        />
      </div>
    );
  } // ← QUESTA CHIUDE IL BLOCCO EDITOR

  // PAGINA ALLENAMENTO (DEFAULT)
  return (
  <AppContent
    userId={userId}
    selectedWorkoutId={selectedWorkoutId}
    onSelectWorkout={setSelectedWorkoutId}
    onOpenStats={() => setCurrentView("stats")}
    onOpenEditor={(workoutId) => {
      setEditorWorkoutId(workoutId);
      setCurrentView("editor");
    }}
    workouts={workouts}
    setWorkouts={setWorkouts}
    session={session}
    setSession={setSession}
  />
);
}


function AppContent({ 
  userId, 
  selectedWorkoutId, 
  onSelectWorkout, 
  onOpenStats, 
  onOpenEditor,
  workouts,
  setWorkouts,
  session,
  setSession
}) {

  const [dataLoading, setDataLoading] = useState(true);
  const [csvError, setCsvError] = useState("");
  const [history, setHistory] = useState([]);

  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  const [isRestRunning, setIsRestRunning] = useState(false);
  const [lastCompletedExercise, setLastCompletedExercise] = useState(null);
  const [lastCompletedSetIndex, setLastCompletedSetIndex] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [selectedSessionId, setSelectedSessionId] = useState(null);
  
  const [exerciseInfo, setExerciseInfo] = useState(null); 
  const [showExerciseModal, setShowExerciseModal] = useState(false);

  async function fetchExerciseInfo(exerciseId, exerciseName) {
      try {
        // Ricerca su WGER API in italiano
        const response = await fetch(
          `https://wger.de/api/v2/exercise/?language=2&limit=50`
        );
        const data = await response.json();
  
        // Cerca esercizio per nome (case-insensitive)
        const found = data.results.find(
          ex => ex.name.toLowerCase() === exerciseName.toLowerCase()
        );
  
        if (found) {
          setExerciseInfo({
            name: found.name,
            description: found.description || "Nessuna descrizione disponibile",
            muscles: found.muscles || [],
          });
        } else {
          setExerciseInfo({
            name: exerciseName,
            description: "Esercizio non trovato nel database WGER. Prova con un nome più comune (es: Squat, Panca piana, Stacco).",
            muscles: [],
          });
        }
        
        setShowExerciseModal(true);
      } catch (error) {
        console.error("Errore ricerca WGER:", error);
        setExerciseInfo({
          name: exerciseName,
          description: "Errore nel caricamento delle informazioni. Verifica la connessione internet.",
          muscles: [],
        });
        setShowExerciseModal(true);
      }
    }


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
          onSelectWorkout(DEFAULT_WORKOUTS[0].id);
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
            onSelectWorkout(DEFAULT_WORKOUTS[0].id);
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
            onSelectWorkout(DEFAULT_WORKOUTS[0].id);
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
          const initialId = selectedWorkoutId || validWorkouts[0].id;
          onSelectWorkout(initialId);
          const initialWorkout =
            validWorkouts.find((w) => w.id === initialId) || validWorkouts[0];
          setSession(buildEmptySessionFromWorkout(initialWorkout));
        } else {
          setWorkouts(DEFAULT_WORKOUTS);
          onSelectWorkout(DEFAULT_WORKOUTS[0].id);
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
        onSelectWorkout(DEFAULT_WORKOUTS[0].id);
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

  function handleSetFieldChange(exerciseId, setIndex, field, value) {
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((ex) =>
          ex.id === exerciseId
            ? {
                ...ex,
                sets: ex.sets.map((s) =>
                  s.index === setIndex ? { ...s, [field]: value } : s
                ),
              }
            : ex
        ),
      };
    });
  }

  function handleToggleSetDone(exerciseId, setIndex) {
    setSession((prev) => {
      if (!prev) return prev;

      let updated = null;
      const newExercises = prev.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;

        const newSets = ex.sets.map((s) => {
          if (s.index !== setIndex) return s;
          const newDone = !s.done;

          if (newDone) {
            setLastCompletedExercise(ex.name);
            setLastCompletedSetIndex(setIndex);
            setRestSecondsLeft(
              currentWorkout?.defaultRestSeconds || 90
            );
            setIsRestRunning(true);
            playStartBeep();
          }

          updated = {
            ...s,
            done: newDone,
          };
          return updated;
        });

        return { ...ex, sets: newSets };
      });

      return {
        ...prev,
        exercises: newExercises,
      };
    });
  }

  function handleResetSession() {
    if (!workouts || workouts.length === 0 || !selectedWorkoutId) return;
    const w = findWorkoutById(workouts, selectedWorkoutId);

    setSession(buildEmptySessionFromWorkout(w));
    setElapsedSeconds(0);
    setIsRestRunning(false);
    setRestSecondsLeft(0);
    setLastCompletedExercise(null);
    setLastCompletedSetIndex(null);
  }

  async function handleCompleteSession() {
    if (!session || !userId) return;

    const allSets = session.exercises.flatMap((ex) =>
      ex.sets.map((s) => ({
        exerciseId: ex.id,
        exerciseName: ex.name,
        ...s,
      }))
    );

    const completedSets = allSets.filter(
      (s) => s.done && s.reps && s.weight
    );

    if (completedSets.length === 0) {
      alert("Completa almeno una serie con reps e peso per salvare la sessione.");
      return;
    }

    const volume = completedSets.reduce(
      (sum, s) => sum + Number(s.reps) * Number(s.weight),
      0
    );

    const finishedAt = new Date().toISOString();

    const { data: insertedSession, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        user_id: userId,
        workout_id: session.workoutId, // slug del workout
        workout_name: session.workoutName,
        started_at: session.startedAt,
        finished_at: finishedAt,
        volume,
        total_sets_done: completedSets.length,
      })
      .select("id")
      .single();

    if (sessionError) {
      console.error("Errore salvataggio sessione:", sessionError);
      alert("Errore nel salvataggio della sessione.");
      return;
    }

    const sessionId = insertedSession.id;

    const setsPayload = completedSets.map((s) => ({
      session_id: sessionId,
      exercise_id: s.exerciseId,
      exercise_name: s.exerciseName,
      set_index: s.index,
      reps: Number(s.reps),
      weight: Number(s.weight),
    }));

    const { error: setsError } = await supabase
      .from("session_sets")
      .insert(setsPayload);

    if (setsError) {
      console.error("Errore salvataggio set:", setsError);
      alert("Sessione salvata ma errore nel salvataggio delle serie.");
    }

    const newHistoryEntry = {
      id: sessionId,
      workoutId: session.workoutId,
      workoutName: session.workoutName,
      startedAt: session.startedAt,
      finishedAt,
      volume,
      totalSetsDone: completedSets.length,
    };

    setHistory((prev) => [newHistoryEntry, ...prev]);

    handleResetSession();
    alert("Allenamento completato e salvato!");
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

  const currentWorkout = findWorkoutById(workouts, selectedWorkoutId);
  const totalVolume = session.exercises
    .flatMap((ex) => ex.sets.map((s) => ({ exName: ex.name, ...s })))
    .filter((s) => s.done && s.reps && s.weight)
    .reduce(
      (sum, s) => sum + Number(s.reps) * Number(s.weight),
      0
    );

  async function fetchExerciseInfo(exerciseId, exerciseName) {
    try {
      // Ricerca su WGER per nome
      const response = await fetch(
        `https://wger.de/api/v2/exercise/?language=2&search=${exerciseName}&limit=1`
      );
      const data = await response.json();
  
      if (data.results && data.results.length > 0) {
        const exercise = data.results[0];
        setExerciseInfo({
          name: exercise.name,
          description: exercise.description || "Nessuna descrizione disponibile",
          muscles: exercise.muscles || [],
        });
        setShowExerciseModal(true);
      } else {
        setExerciseInfo({
          name: exerciseName,
          description: "Esercizio non trovato nel database WGER",
          muscles: [],
        });
        setShowExerciseModal(true);
      }
    } catch (error) {
      console.error("Errore ricerca WGER:", error);
      alert("Errore nel caricamento delle info");
    }
  }

  return (
    <div className="app-container">
      <img src="/vite.png" alt="Logo" style={{ height: 200, width: "auto", marginLeft: "auto", marginRight: "auto"}} />
      {/* Top bar */}
      <div className="top-bar">
        <div>
          <div className="small-text">Workout selezionato</div>
          <select
            value={selectedWorkoutId}
            onChange={(e) => {
              const newId = e.target.value;
              onSelectWorkout(newId);

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
              onClick={() => onOpenEditor(selectedWorkoutId)}
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
                onSelectWorkout(newId);
                syncWorkoutToDb(newWorkout);
                onOpenEditor(newId);
              }}
            >
              + Nuovo workout
            </button>
            <button
              className="button button-secondary"
              type="button"
              onClick={onOpenStats}
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
                    background:
                      selectedSessionId === h.id ? "#111827" : "transparent",
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="exercise-name">{exercise.name}</div>
                <button
                  className="button button-secondary"
                  style={{ padding: '4px 8px', fontSize: '0.9rem', cursor: 'pointer' }}
                  onClick={() => fetchExerciseInfo(exercise.id, exercise.name)}
                  title="Info esercizio"
                >
                  ?
                </button>
              </div>
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
      
      {showExerciseModal && exerciseInfo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="card-header">
              <div className="card-title">{exerciseInfo.name}</div>
              <button
                className="button button-secondary"
                onClick={() => setShowExerciseModal(false)}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '16px' }}>
              <p style={{ marginBottom: '12px', fontWeight: 'bold' }}>
                Descrizione:
              </p>
              <div 
                style={{ 
                  fontSize: '0.9rem', 
                  lineHeight: '1.6',
                  marginBottom: '16px' 
                }}
                dangerouslySetInnerHTML={{ __html: exerciseInfo.description }}
              />
              {exerciseInfo.muscles && exerciseInfo.muscles.length > 0 && (
                <>
                  <p style={{ marginTop: '16px', marginBottom: '8px', fontWeight: 'bold' }}>
                    Muscoli coinvolti:
                  </p>
                  <div style={{ fontSize: '0.85rem' }}>
                    {exerciseInfo.muscles.map((muscleId, idx) => (
                      <div key={idx} style={{ padding: '4px 0' }}>
                        • Muscolo ID: {muscleId}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
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
