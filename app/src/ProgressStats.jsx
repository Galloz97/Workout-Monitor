import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabaseClient";

function formatDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function formatDateTime(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProgressStats({ userId, workoutId, onClose }) {
  const [completedSessions, setCompletedSessions] = useState([]);
  const [sessionSets, setSessionSets] = useState([]);
  const [exerciseStats, setExerciseStats] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId && workoutId) {
      loadStats();
    } else {
      setCompletedSessions([]);
      setSessionSets([]);
      setExerciseStats([]);
      setSelectedExercise(null);
      setLoading(false);
    }
  }, [userId, workoutId]);

  async function loadStats() {
    setLoading(true);

    try {
      const { data: sessions, error: sessionsError } = await supabase
        .from("sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("workout_id", workoutId)
        .not("finished_at", "is", null)
        .order("finished_at", { ascending: false });

      if (sessionsError) throw sessionsError;

      const safeSessions = sessions || [];
      setCompletedSessions(safeSessions);

      const sessionIds = safeSessions.map((s) => s.id);

      if (sessionIds.length === 0) {
        setSessionSets([]);
        setExerciseStats([]);
        setSelectedExercise(null);
        return;
      }

      const { data: sets, error: setsError } = await supabase
        .from("session_sets")
        .select("*")
        .in("session_id", sessionIds)
        .eq("done", true)
        .order("session_id", { ascending: false });

      if (setsError) throw setsError;

      const safeSets = sets || [];
      setSessionSets(safeSets);

      const stats = calculateExerciseStats(safeSessions, safeSets);
      setExerciseStats(stats);

      if (stats.length === 0) {
        setSelectedExercise(null);
      } else if (!selectedExercise) {
        setSelectedExercise(stats[0]);
      } else {
        const updatedSelected = stats.find((ex) => ex.name === selectedExercise.name);
        setSelectedExercise(updatedSelected || stats[0]);
      }
    } catch (error) {
      console.error("Errore caricamento statistiche:", error);
      setCompletedSessions([]);
      setSessionSets([]);
      setExerciseStats([]);
      setSelectedExercise(null);
    } finally {
      setLoading(false);
    }
  }

  function calculateExerciseStats(sessions, sets) {
    const exerciseMap = {};
    const sessionDateMap = {};

    sessions.forEach((session) => {
      sessionDateMap[session.id] = {
        date: session.finished_at || session.started_at,
        workoutName: session.workout_name,
      };
    });

    sets.forEach((set) => {
      const exerciseName = set.exercise_name;
      const sessionMeta = sessionDateMap[set.session_id];

      if (!exerciseName || !sessionMeta?.date) return;

      if (!exerciseMap[exerciseName]) {
        exerciseMap[exerciseName] = {
          name: exerciseName,
          totalSessions: new Set(),
          totalSets: 0,
          totalReps: 0,
          totalVolume: 0,
          maxWeight: 0,
          avgWeightPerSet: 0,
          lastPerformed: null,
          history: [],
        };
      }

      const stat = exerciseMap[exerciseName];
      const reps = Number(set.reps) || 0;
      const weight = Number(set.weight) || 0;
      const volume = reps * weight;

      stat.totalSessions.add(set.session_id);
      stat.totalSets += 1;
      stat.totalReps += reps;
      stat.totalVolume += volume;

      if (weight > stat.maxWeight) {
        stat.maxWeight = weight;
      }

      if (!stat.lastPerformed || new Date(sessionMeta.date) > new Date(stat.lastPerformed)) {
        stat.lastPerformed = sessionMeta.date;
      }

      stat.history.push({
        sessionId: set.session_id,
        date: sessionMeta.date,
        reps,
        weight,
        volume,
      });
    });

    return Object.values(exerciseMap)
      .map((stat) => {
        const sortedHistory = stat.history.sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );

        return {
          ...stat,
          totalSessions: stat.totalSessions.size,
          avgWeightPerSet: stat.totalSets > 0 ? stat.totalVolume / Math.max(stat.totalReps, 1) : 0,
          history: sortedHistory,
          firstWeight: sortedHistory.length > 0 ? sortedHistory[0].weight : 0,
          lastWeight:
            sortedHistory.length > 0
              ? sortedHistory[sortedHistory.length - 1].weight
              : 0,
          weightChange:
            sortedHistory.length > 1
              ? (sortedHistory[sortedHistory.length - 1].weight || 0) -
                (sortedHistory[0].weight || 0)
              : 0,
        };
      })
      .sort((a, b) => b.totalVolume - a.totalVolume);
  }

  const totals = useMemo(() => {
    const totalVolume = exerciseStats.reduce((sum, ex) => sum + ex.totalVolume, 0);
    const totalSets = exerciseStats.reduce((sum, ex) => sum + ex.totalSets, 0);
    const totalReps = exerciseStats.reduce((sum, ex) => sum + ex.totalReps, 0);

    return {
      totalVolume,
      totalSets,
      totalReps,
    };
  }, [exerciseStats]);

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">Statistiche workout</div>
          <button className="button button-secondary" type="button" onClick={onClose}>
            Chiudi
          </button>
        </div>
        <div style={{ padding: 16 }}>Caricamento statistiche...</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Statistiche workout</div>
        <button className="button button-secondary" type="button" onClick={onClose}>
          Chiudi
        </button>
      </div>

      <div style={{ padding: 16 }}>
        <div className="session-summary" style={{ marginBottom: 16 }}>
          <div>
            Sessioni completate <strong>{completedSessions.length}</strong>
          </div>
          <div>
            Esercizi tracciati <strong>{exerciseStats.length}</strong>
          </div>
          <div>
            Serie completate <strong>{totals.totalSets}</strong>
          </div>
          <div>
            Reps totali <strong>{totals.totalReps}</strong>
          </div>
          <div>
            Volume totale <strong>{totals.totalVolume} kg</strong>
          </div>
        </div>

        {exerciseStats.length === 0 ? (
          <div className="small-text">
            Nessuna statistica disponibile per il workout selezionato.
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <div className="small-text" style={{ marginBottom: 8 }}>
                Seleziona esercizio
              </div>
              <select
                value={selectedExercise?.name || ""}
                onChange={(e) => {
                  const found = exerciseStats.find((ex) => ex.name === e.target.value);
                  setSelectedExercise(found || null);
                }}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #374151",
                  backgroundColor: "#020617",
                  color: "#e5e7eb",
                  fontSize: "0.95rem",
                }}
              >
                {exerciseStats.map((exercise) => (
                  <option key={exercise.name} value={exercise.name}>
                    {exercise.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
              {exerciseStats.map((exercise) => {
                const isSelected = selectedExercise?.name === exercise.name;

                return (
                  <button
                    key={exercise.name}
                    type="button"
                    className="button button-secondary"
                    onClick={() => setSelectedExercise(exercise)}
                    style={{
                      textAlign: "left",
                      padding: 12,
                      border: isSelected ? "1px solid #22c55e" : "1px solid #374151",
                      background: isSelected ? "#111827" : "#0f172a",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "flex-start",
                      }}
                    >
                      <div>
                        <div className="exercise-name">{exercise.name}</div>
                        <div className="small-text">
                          Ultima esecuzione: {formatDate(exercise.lastPerformed)}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div className="small-text">
                          Peso max <strong>{exercise.maxWeight} kg</strong>
                        </div>
                        <div className="small-text">
                          Delta{" "}
                          <strong>
                            {exercise.weightChange > 0 ? "+" : ""}
                            {exercise.weightChange} kg
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="session-summary" style={{ marginTop: 10 }}>
                      <div>Sessioni {exercise.totalSessions}</div>
                      <div>Serie {exercise.totalSets}</div>
                      <div>Reps {exercise.totalReps}</div>
                      <div>Volume {exercise.totalVolume} kg</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedExercise && (
              <div className="card" style={{ padding: 16 }}>
                <div className="card-header">
                  <div className="card-title">{selectedExercise.name}</div>
                </div>

                <div className="session-summary" style={{ marginBottom: 16 }}>
                  <div>
                    Sessioni <strong>{selectedExercise.totalSessions}</strong>
                  </div>
                  <div>
                    Serie <strong>{selectedExercise.totalSets}</strong>
                  </div>
                  <div>
                    Reps <strong>{selectedExercise.totalReps}</strong>
                  </div>
                  <div>
                    Peso max <strong>{selectedExercise.maxWeight} kg</strong>
                  </div>
                  <div>
                    Primo peso <strong>{selectedExercise.firstWeight} kg</strong>
                  </div>
                  <div>
                    Ultimo peso <strong>{selectedExercise.lastWeight} kg</strong>
                  </div>
                  <div>
                    Incremento{" "}
                    <strong>
                      {selectedExercise.weightChange > 0 ? "+" : ""}
                      {selectedExercise.weightChange} kg
                    </strong>
                  </div>
                </div>

                <div className="small-text" style={{ marginBottom: 8 }}>
                  Storico set completati
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  {selectedExercise.history.length === 0 ? (
                    <div className="small-text">Nessuno storico disponibile.</div>
                  ) : (
                    selectedExercise.history
                      .slice()
                      .reverse()
                      .map((entry, index) => (
                        <div
                          key={`${entry.sessionId}-${entry.date}-${index}`}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "8px 10px",
                            borderRadius: 8,
                            background: "#111827",
                            gap: 12,
                          }}
                        >
                          <span className="small-text">{formatDateTime(entry.date)}</span>
                          <span>
                            {entry.reps} reps × {entry.weight} kg ={" "}
                            <strong>{entry.volume} kg</strong>
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
