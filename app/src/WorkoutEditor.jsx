import { useState,useEffect } from "react";
import { supabase } from "./supabaseClient";
import "drag-drop-touch";
import { EXERCISES_IT } from "./exercisesList"

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

function WorkoutEditor({ 
  userId, 
  workoutId, 
  workouts, 
  setWorkouts, 
  onClose,
  onSelectWorkout,
  setSession,
  selectedWorkoutId
}) {
  const [draggedExerciseId, setDraggedExerciseId] = useState(null);
  const [dragOverExerciseId, setDragOverExerciseId] = useState(null);
  const [exerciseSuggestions, setExerciseSuggestions] = useState([]);
  const [focusedExerciseId, setFocusedExerciseId] = useState(null);


  const workoutBeingEdited = workouts.find((w) => w.id === workoutId);

  function searchExercises(query) {
    console.log("Cercando:", query); // ← AGGIUNGI QUESTO
    console.log("Suggerimenti trovati:", filtered.length); // ← E QUESTO

    if (query.length < 2) {
      setExerciseSuggestions([]);
      return;
    }

    const filtered = EXERCISES_IT
      .filter(name => name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 10)
      .map(name => ({ id: name, name }));

    setExerciseSuggestions(filtered);
  }

  if (!workoutBeingEdited) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">Workout non trovato</div>
        </div>
        <button className="button button-secondary" onClick={onClose}>
          Chiudi
        </button>
      </div>
    );
  }

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

  function handleWorkoutFieldChange(field, value) {
    setWorkouts((prev) =>
      prev.map((w) =>
        w.id === workoutId
          ? {
              ...w,
              [field]: field === "defaultRestSeconds" ? Number(value) : value,
            }
          : w
      )
    );
  }

  function handleExerciseFieldChange(exerciseId, field, value) {
    setWorkouts((prev) =>
      prev.map((w) =>
        w.id === workoutId
          ? {
              ...w,
              exercises: w.exercises.map((ex) =>
                ex.id === exerciseId
                  ? {
                      ...ex,
                      [field]:
                        field === "targetSets" ||
                        field === "targetReps" ||
                        field === "defaultWeight"
                          ? Number(value)
                          : value,
                    }
                  : ex
              ),
            }
          : w
      )
    );
  }

  function handleAddExercise() {
    const newId = `ex-${Date.now()}`;
    setWorkouts((prev) =>
      prev.map((w) =>
        w.id === workoutId
          ? {
              ...w,
              exercises: [
                ...w.exercises,
                {
                  id: newId,
                  name: "Nuovo esercizio",
                  targetSets: 3,
                  targetReps: 10,
                  defaultWeight: 0,
                },
              ],
            }
          : w
      )
    );
  }

  function handleRemoveExercise(exerciseId) {
    setWorkouts((prev) =>
      prev.map((w) =>
        w.id === workoutId
          ? {
              ...w,
              exercises: w.exercises.filter((ex) => ex.id !== exerciseId),
            }
          : w
      )
    );
  }

  function handleReorderExercises(draggedId, targetId) {
    if (!draggedId || !targetId || draggedId === targetId) return;

    setWorkouts((prev) =>
      prev.map((w) => {
        if (w.id !== workoutId) return w;
        const copy = [...w.exercises];
        const fromIndex = copy.findIndex((ex) => ex.id === draggedId);
        const toIndex = copy.findIndex((ex) => ex.id === targetId);
        if (fromIndex < 0 || toIndex < 0) return w;

        const [moved] = copy.splice(fromIndex, 1);
        copy.splice(toIndex, 0, moved);
        return { ...w, exercises: copy };
      })
    );
  }

  async function handleDeleteWorkout() {
      if (!window.confirm("Sei sicuro di voler eliminare questo workout?")) {
        return;
      }

      // 1. PRIMA elimina dal database
      if (userId) {
        const { data: existing, error: fetchError } = await supabase
          .from("workouts")
          .select("id")
          .eq("user_id", userId)
          .eq("slug", workoutId)
          .maybeSingle();

        if (!fetchError && existing?.id) {
          const dbWorkoutId = existing.id;

          await supabase
            .from("workout_exercises")
            .delete()
            .eq("workout_id", dbWorkoutId);

          await supabase
            .from("workouts")
            .delete()
            .eq("id", dbWorkoutId);
        }
      }

      // 2. POI aggiorna lo stato locale
      const DEFAULT_WORKOUTS = [
        {
          id: "fullbody-a",
          name: "Full Body A",
          defaultRestSeconds: 90,
          exercises: [],
        }
      ];

      const filtered = workouts.filter((w) => w.id !== workoutId);

      if (filtered.length === 0) {
        setWorkouts(DEFAULT_WORKOUTS);
        onSelectWorkout(DEFAULT_WORKOUTS[0].id);
        setSession(buildEmptySessionFromWorkout(DEFAULT_WORKOUTS[0]));
      } else {
        setWorkouts(filtered);
        
        if (selectedWorkoutId === workoutId) {
          onSelectWorkout(filtered[0].id);
          setSession(buildEmptySessionFromWorkout(filtered[0]));
        }
      }

      // 3. INFINE chiudi l'editor
      onClose();
    }


  function searchExercises(query) {
    if (query.length < 2) {
      setExerciseSuggestions([]);
      return;
    }

    const filtered = EXERCISES_IT
      .filter(name => name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 10)
      .map(name => ({ id: name, name }));

    setExerciseSuggestions(filtered);
  }


  return (
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
          onChange={(e) => handleWorkoutFieldChange("name", e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div className="set-label">Rest default (secondi)</div>
        <input
          type="number"
          min="0"
          value={workoutBeingEdited.defaultRestSeconds}
          onChange={(e) =>
            handleWorkoutFieldChange("defaultRestSeconds", e.target.value)
          }
        />
      </div>

      <div className="card-header" style={{ marginTop: 16 }}>
        <div className="card-title">Esercizi</div>
        <button
          className="button button-secondary"
          onClick={handleAddExercise}
        >
          + Aggiungi esercizio
        </button>
      </div>

      {workoutBeingEdited.exercises.map((ex) => (
        <div
          key={ex.id}
          draggable
          onDragStart={() => setDraggedExerciseId(ex.id)}
          onDragEnd={() => {
            setDraggedExerciseId(null);
            setDragOverExerciseId(null);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverExerciseId(ex.id);
          }}
          onDrop={(e) => {
            e.preventDefault();
            handleReorderExercises(draggedExerciseId, ex.id);
            setDraggedExerciseId(null);
            setDragOverExerciseId(null);
          }}
          style={{
            padding: 12,
            marginBottom: 8,
            borderRadius: 8,
            border:
              dragOverExerciseId === ex.id
                ? "2px dashed #3b82f6"
                : "1px solid #374151",
            backgroundColor: draggedExerciseId === ex.id ? "#1e293b" : "#0f172a",
            cursor: "grab",
          }}
        >
          <div style={{ marginBottom: 8, position: "relative" }}>
            <div className="set-label">Nome esercizio</div>
            <input
              type="text"
              value={ex.name}
              onChange={(e) => {
                const value = e.target.value;
                handleExerciseFieldChange(ex.id, "name", value);
                searchExercises(value);
              }}
              placeholder="Es: squat, panca, trazioni..."
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #374151",
                backgroundColor: "#020617",
                color: "#e5e7eb",
              }}
            />
            
            {/* DROPDOWN SUGGERIMENTI */}
            {exerciseSuggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  marginTop: "4px",
                  backgroundColor: "#111827",
                  border: "1px solid #374151",
                  borderRadius: "4px",
                  maxHeight: "200px",
                  overflowY: "auto",
                  zIndex: 100,
                }}
              >
                {exerciseSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    onClick={() => {
                      handleExerciseFieldChange(ex.id, "name", suggestion.name);
                      setExerciseSuggestions([]); // Chiudi dropdown
                    }}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      borderBottom: "1px solid #374151",
                      fontSize: "0.85rem",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#1f2937";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div style={{ fontWeight: 500 }}>{suggestion.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                      {suggestion.target}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <div>
              <div className="set-label">Serie target</div>
              <input
                type="number"
                min="1"
                value={ex.targetSets}
                onChange={(e) =>
                  handleExerciseFieldChange(ex.id, "targetSets", e.target.value)
                }
              />
            </div>
            <div>
              <div className="set-label">Reps target</div>
              <input
                type="number"
                min="1"
                value={ex.targetReps}
                onChange={(e) =>
                  handleExerciseFieldChange(ex.id, "targetReps", e.target.value)
                }
              />
            </div>
            <div>
              <div className="set-label">Peso default</div>
              <input
                type="number"
                min="0"
                value={ex.defaultWeight}
                onChange={(e) =>
                  handleExerciseFieldChange(
                    ex.id,
                    "defaultWeight",
                    e.target.value
                  )
                }
              />
            </div>
          </div>

          <button
            className="button button-secondary button-full"
            onClick={() => handleRemoveExercise(ex.id)}
          >
            Rimuovi esercizio
          </button>
        </div>
      ))}

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button
          className="button button-primary button-full"
          onClick={async () => {
            await syncWorkoutToDb(workoutBeingEdited);
            alert("Workout salvato!");
          }}
        >
          Salva modifiche
        </button>
        <button
          className="button button-secondary"
          onClick={handleDeleteWorkout}
        >
          Elimina workout
        </button>
        <button className="button button-secondary" onClick={onClose}>
          Chiudi
        </button>
      </div>
    </div>
  );
}

export default WorkoutEditor;
