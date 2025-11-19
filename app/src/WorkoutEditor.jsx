import { useState } from "react";
import { supabase } from "./supabaseClient";
import "drag-drop-touch";

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

  const workoutBeingEdited = workouts.find((w) => w.id === workoutId);

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

    const DEFAULT_WORKOUTS = [
      {
        id: "fullbody-a",
        name: "Full Body A",
        defaultRestSeconds: 90,
        exercises: [],
      }
    ];

    setWorkouts((prev) => {
      const filtered = prev.filter((w) => w.id !== workoutId);

      if (filtered.length === 0) {
        const fallback = DEFAULT_WORKOUTS;
        onSelectWorkout(fallback[0].id);
        setSession(buildEmptySessionFromWorkout(fallback[0]));
        onClose();
        return fallback;
      }

      if (selectedWorkoutId === workoutId) {
        const newSelected = filtered[0];
        onSelectWorkout(newSelected.id);
        setSession(buildEmptySessionFromWorkout(newSelected));
      }

      onClose();
      return filtered;
    });

    const { data: existing, error: fetchError } = await supabase
      .from("workouts")
      .select("id")
      .eq("user_id", userId)
      .eq("slug", workoutId)
      .maybeSingle();

    if (fetchError) return;
    if (!existing?.id) return;

    const dbWorkoutId = existing.id;

    await supabase.from("workout_exercises").delete().eq("workout_id", dbWorkoutId);
    await supabase.from("workouts").delete().eq("id", dbWorkoutId);
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
          <div style={{ marginBottom: 8 }}>
            <div className="set-label">Nome esercizio</div>
            <input
              type="text"
              value={ex.name}
              onChange={(e) =>
                handleExerciseFieldChange(ex.id, "name", e.target.value)
              }
            />
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
