import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

export default function ProgressStats({ userId, onBack }) {
  const [completedSessions, setCompletedSessions] = useState([]);
  const [sessionSets, setSessionSets] = useState([]);
  const [exerciseStats, setExerciseStats] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [userId]);

  async function loadStats() {
    setLoading(true);
    try {
      // 1. Carica tutte le sessioni completate
      const {  sessions, error: sessionsError } = await supabase
        .from("workout_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("completed", true)
        .order("completed_at", { ascending: false });

      if (sessionsError) throw sessionsError;

      setCompletedSessions(sessions || []);

      // 2. Carica tutti i set completati per queste sessioni
      const sessionIds = (sessions || []).map(s => s.id);
      
      if (sessionIds.length > 0) {
        const {  sets, error: setsError } = await supabase
          .from("session_sets")
          .select("*")
          .in("session_id", sessionIds)
          .eq("done", true)
          .order("session_id", { ascending: false });

        if (setsError) throw setsError;
        setSessionSets(sets || []);

        // 3. Calcola statistiche per esercizio
        const stats = calculateExerciseStats(sessions || [], sets || []);
        setExerciseStats(stats);
      }

    } catch (error) {
      console.error("Errore caricamento statistiche:", error);
    } finally {
      setLoading(false);
    }
  }

  function calculateExerciseStats(sessions, sets) {
    const exerciseMap = {};

    // Crea una mappa session_id -> data completamento
    const sessionDateMap = {};
    sessions.forEach(session => {
      sessionDateMap[session.id] = session.completed_at;
    });

    // Processa ogni set
    sets.forEach(set => {
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
          history: []
        };
      }

      const stat = exerciseMap[exerciseName];
      
      // Traccia sessioni uniche
      stat.totalSessions.add(set.session_id);
      
      // Calcola stats
      stat.totalSets += 1;
      stat.totalReps += set.reps || 0;
      
      const volume = (set.reps || 0) * (set.weight || 0);
      stat.totalVolume += volume;

      if ((set.weight || 0) > stat.maxWeight) {
        stat.maxWeight = set.weight || 0;
      }

      // Aggiorna ultima esecuzione
      if (!stat.lastPerformed || sessionDate > stat.lastPerformed) {
        stat.lastPerformed = sessionDate;
      }

      // Aggiungi allo storico
      stat.history.push({
        date: sessionDate,
        weight: set.weight || 0,
        reps: set.reps || 0,
        volume: volume
      });
    });

    // Converti in array e calcola medie
    return Object.values(exerciseMap).map(stat => ({
      ...stat,
      totalSessions: stat.totalSessions.size,
      avgWeightPerSet: stat.totalSets > 0 ? stat.totalVolume / stat.totalReps : 0,
      // Ordina storico per data
      history: stat.history.sort((a, b) => new Date(a.date) - new Date(b.date))
    }))
    .sort((a, b) => b.totalVolume - a.totalVolume);
  }

  if (loading) {
    return (
      <div className="app-container">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Caricamento statistiche...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">📊 Statistiche Dettagliate</div>
          <button className="button button-secondary" onClick={onBack}>
            Indietro
          </button>
        </div>
      </div>

      {/* Riepilogo generale */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Riepilogo Generale</div>
        </div>
        <div style={{ padding: "16px" }}>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
            gap: "16px" 
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#10b981" }}>
                {completedSessions.length}
              </div>
              <div className="small-text">Sessioni Completate</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#3b82f6" }}>
                {exerciseStats.length}
              </div>
              <div className="small-text">Esercizi Diversi</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#f59e0b" }}>
                {sessionSets.length}
              </div>
              <div className="small-text">Serie Totali</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#ef4444" }}>
                {Math.round(exerciseStats.reduce((sum, ex) => sum + ex.totalVolume, 0))} kg
              </div>
              <div className="small-text">Volume Totale</div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiche per esercizio */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Statistiche per Esercizio</div>
        </div>
        <div style={{ padding: "16px" }}>
          {exerciseStats.length === 0 ? (
            <div className="small-text">Nessun esercizio completato ancora.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {exerciseStats.map((stat, idx) => (
                <ExerciseStatCard 
                  key={idx} 
                  stat={stat}
                  isSelected={selectedExercise === stat.name}
                  onToggle={() => setSelectedExercise(
                    selectedExercise === stat.name ? null : stat.name
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente per card esercizio con grafici
function ExerciseStatCard({ stat, isSelected, onToggle }) {
  return (
    <div
      className="card"
      style={{ 
        padding: "12px", 
        cursor: "pointer",
        border: isSelected ? "2px solid #3b82f6" : "1px solid #374151"
      }}
      onClick={onToggle}
    >
      {/* Header Card */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
            {stat.name}
          </div>
          <div className="small-text" style={{ marginTop: "4px" }}>
            {stat.totalSessions} sessioni • {stat.totalSets} serie • {stat.totalReps} ripetizioni
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#10b981" }}>
            {Math.round(stat.totalVolume)} kg
          </div>
          <div className="small-text">Volume totale</div>
          <div style={{ fontSize: "1rem", fontWeight: "bold", color: "#f59e0b", marginTop: "4px" }}>
            Max: {stat.maxWeight} kg
          </div>
        </div>
      </div>

      {/* Dettagli espansi con grafici */}
      {isSelected && (
        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #374151" }}>
          <div style={{ marginBottom: "12px" }}>
            <strong>Ultima esecuzione:</strong>{" "}
            {new Date(stat.lastPerformed).toLocaleDateString("it-IT")}
          </div>
          
          <div style={{ marginBottom: "12px" }}>
            <strong>Media per sessione:</strong>
            <div className="small-text">
              • {Math.round(stat.totalSets / stat.totalSessions)} serie
              <br />
              • {Math.round(stat.totalVolume / stat.totalSessions)} kg volume
            </div>
          </div>

          {/* Grafico Volume nel Tempo */}
          <div style={{ marginTop: "20px", marginBottom: "20px" }}>
            <strong>📈 Volume nel Tempo</strong>
            <VolumeChart history={stat.history} />
          </div>

          {/* Grafico Peso Massimo nel Tempo */}
          <div style={{ marginTop: "20px", marginBottom: "20px" }}>
            <strong>💪 Progressione Peso</strong>
            <WeightProgressChart history={stat.history} />
          </div>

          {/* Storico recente */}
          <div style={{ marginTop: "20px" }}>
            <strong>Storico ultimi 10 set:</strong>
            <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
              {stat.history.slice(-10).reverse().map((entry, i) => (
                <div key={i} className="small-text" style={{ 
                  padding: "6px 10px", 
                  backgroundColor: "#1f2937",
                  borderRadius: "4px",
                  display: "flex",
                  justifyContent: "space-between"
                }}>
                  <span>{new Date(entry.date).toLocaleDateString("it-IT")}</span>
                  <span>{entry.weight} kg × {entry.reps} reps = <strong>{entry.volume} kg</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Grafico Volume nel Tempo
function VolumeChart({ history }) {
  if (history.length === 0) return <div className="small-text">Nessun dato disponibile</div>;

  // Raggruppa per sessione (data) e somma il volume
  const volumeByDate = {};
  history.forEach(entry => {
    const date = new Date(entry.date).toLocaleDateString("it-IT");
    if (!volumeByDate[date]) {
      volumeByDate[date] = 0;
    }
    volumeByDate[date] += entry.volume;
  });

  const dates = Object.keys(volumeByDate);
  const volumes = Object.values(volumeByDate);
  const maxVolume = Math.max(...volumes);

  return (
    <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
      {dates.map((date, idx) => {
        const vol = volumes[idx];
        const percentage = maxVolume > 0 ? (vol / maxVolume) * 100 : 0;
        
        return (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="small-text" style={{ minWidth: "80px", fontSize: "0.75rem" }}>
              {date}
            </div>
            <div style={{ 
              flex: 1, 
              height: "24px", 
              backgroundColor: "#1f2937",
              borderRadius: "4px",
              overflow: "hidden"
            }}>
              <div style={{
                width: `${percentage}%`,
                height: "100%",
                backgroundColor: "#10b981",
                transition: "width 0.3s ease",
                display: "flex",
                alignItems: "center",
                paddingLeft: "8px",
                fontSize: "0.75rem",
                fontWeight: "bold"
              }}>
                {Math.round(vol)} kg
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Grafico Peso Massimo per Sessione
function WeightProgressChart({ history }) {
  if (history.length === 0) return <div className="small-text">Nessun dato disponibile</div>;

  // Raggruppa per data e trova peso massimo
  const maxWeightByDate = {};
  history.forEach(entry => {
    const date = new Date(entry.date).toLocaleDateString("it-IT");
    if (!maxWeightByDate[date] || entry.weight > maxWeightByDate[date]) {
      maxWeightByDate[date] = entry.weight;
    }
  });

  const dates = Object.keys(maxWeightByDate);
  const weights = Object.values(maxWeightByDate);
  const maxWeight = Math.max(...weights);

  return (
    <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
      {dates.map((date, idx) => {
        const weight = weights[idx];
        const percentage = maxWeight > 0 ? (weight / maxWeight) * 100 : 0;
        
        return (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="small-text" style={{ minWidth: "80px", fontSize: "0.75rem" }}>
              {date}
            </div>
            <div style={{ 
              flex: 1, 
              height: "24px", 
              backgroundColor: "#1f2937",
              borderRadius: "4px",
              overflow: "hidden"
            }}>
              <div style={{
                width: `${percentage}%`,
                height: "100%",
                backgroundColor: "#f59e0b",
                transition: "width 0.3s ease",
                display: "flex",
                alignItems: "center",
                paddingLeft: "8px",
                fontSize: "0.75rem",
                fontWeight: "bold"
              }}>
                {weight} kg
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
