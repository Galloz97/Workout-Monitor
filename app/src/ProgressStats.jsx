import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

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

      if (sessionIds.length > 0) {
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

        if (selectedExercise) {
          const stillExists = stats.find((ex) => ex.name === selectedExercise.name);
          setSelectedExercise(stillExists || null);
        }
      } else {
        setSessionSets([]);
        setExerciseStats([]);
        setSelectedExercise(null);
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
      sessionDateMap[session.id] = session.finished_at || session.started_at;
    });

    sets.forEach((set) => {
      const exerciseName = set.exercise_name;
      const sessionDate = sessionDateMap[set.session_id];

      if (!exerciseName || !sessionDate) return;

      if (!exerciseMap[exerciseName]) {
        exerciseMap[exerciseName] = {
          name: exerciseName,
          totalSessions: new Set(),
          totalSets: 0,
          totalReps: 0,
          totalVolume: 0,
          maxWeight: 0,
          lastPerformed: null,
          history: [],
        };
      }

      const stat = exerciseMap[exerciseName];
      stat.totalSessions.add(set.session_id);
      stat.totalSets += 1;
      stat.totalReps += Number(set.reps) || 0;

      const reps = Number(set.reps) || 0;
      const weight = Number(set.weight) || 0;
      const volume = reps * weight;

      stat.totalVolume += volume;

      if (weight > stat.maxWeight) {
        stat.maxWeight = weight;
      }

      if (!stat.lastPerformed || new Date(sessionDate) > new Date(stat.lastPerformed)) {
        stat.lastPerformed = sessionDate;
      }

      stat.history.push({
        date: sessionDate,
        weight,
        reps,
        volume,
      });
    });

    return Object.values(exerciseMap)
      .map((stat) => ({
        ...stat,
        totalSessions: stat.totalSessions.size,
        avgWeightPerSet: stat.totalSets > 0 ? stat.totalVolume / stat.totalReps : 0,
        history: stat.history.sort((a, b) => new Date(a.date) - new Date(b.date)),
      }))
      .sort((a, b) => b.totalVolume - a.totalVolume);
  }

  function formatDate(dateString) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">Statistiche</div>
          <button className="button button-secondary" onClick={onClose}>
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
        <div className="card-title">Statistiche</div>
        <button className="button button-secondary" onClick={onClose}>
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
            Serie registrate <strong>{sessionSets.length}</strong>
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
                Seleziona un esercizio
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
                <option value="">-- Seleziona esercizio --</option>
                {exerciseStats.map((exercise) => (
                  <option key={exercise.name} value={exercise.name}>
                    {exercise.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {exerciseStats.map((exercise) => (
                <div
                  key={exercise.name}
                  className="card"
                  style={{
                    padding: 12,
                    cursor: "pointer",
                    border:
                      selectedExercise?.name === exercise.name
                        ? "1px solid #22c55e"
                        : "1px solid transparent",
                  }}
                  onClick={() => setSelectedExercise(exercise)}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
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
                        Volume <strong>{exercise.totalVolume} kg</strong>
                      </div>
                    </div>
                  </div>

                  <div
                    className="session-summary"
                    style={{ marginTop: 10, fontSize: "0.9rem" }}
                  >
                    <div>Sessioni {exercise.totalSessions}</div>
                    <div>Serie {exercise.totalSets}</div>
                    <div>Reps {exercise.totalReps}</div>
                  </div>
                </div>
              ))}
            </div>

            {selectedExercise && (
              <div className="card" style={{ marginTop: 16, padding: 16 }}>
                <div className="card-header" style={{ marginBottom: 12 }}>
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
                    Reps totali <strong>{selectedExercise.totalReps}</strong>
                  </div>
                  <div>
                    Peso max <strong>{selectedExercise.maxWeight} kg</strong>
                  </div>
                </div>

                <div className="small-text" style={{ marginBottom: 8 }}>
                  Storico esercizio
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  {selectedExercise.history.map((entry, index) => (
                    <div
                      key={`${entry.date}-${index}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 10px",
                        borderRadius: 8,
                        background: "#111827",
                      }}
                    >
                      <span>{formatDate(entry.date)}</span>
                      <span>
                        {entry.reps} reps x {entry.weight} kg ={" "}
                        <strong>{entry.volume} kg</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
