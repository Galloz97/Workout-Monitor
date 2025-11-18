import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "./supabaseClient";

function ProgressStats({ userId, onClose }) {
  const [sessions, setSessions] = useState([]);
  const [sessionSets, setSessionSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exercises, setExercises] = useState([]);

  useEffect(() => {
  async function loadData() {
    setLoading(true);

    // Per ora senza filtro sui 90 giorni
    const { data: sessionsData, error: sessionsError } = await supabase
      .from("sessions")
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: true });

    console.log("Sessions for stats:", sessionsData, sessionsError);

    if (sessionsError) {
      console.error("Errore sessions stats:", sessionsError);
      setLoading(false);
      return;
    }

    setSessions(sessionsData || []);

    if (!sessionsData || sessionsData.length === 0) {
      setSessionSets([]);
      setLoading(false);
      return;
    }

    const sessionIds = sessionsData.map((s) => s.id);

    const { data: setsData, error: setsError } = await supabase
      .from("session_sets")
      .select("*")
      .in("session_id", sessionIds)
      .order("exercise_name", { ascending: true })
      .order("set_index", { ascending: true });

    console.log("Session sets for stats:", setsData, setsError);

    if (setsError) {
      console.error("Errore session_sets stats:", setsError);
      setLoading(false);
      return;
    }

    setSessionSets(setsData || []);

    // Lista esercizi
    if (setsData && setsData.length > 0) {
      const uniqueExercises = [
        ...new Set(setsData.map((s) => s.exercise_name)),
      ].sort();
      setExercises(uniqueExercises);
      if (!selectedExercise && uniqueExercises.length > 0) {
        setSelectedExercise(uniqueExercises[0]);
      }
    }

    setLoading(false);
  }

  if (userId) {
    loadData();
  }
}, [userId]);


  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">Statistiche e Progressi</div>
          <button className="button button-secondary" onClick={onClose}>
            Chiudi
          </button>
        </div>
        <div style={{ padding: 20, textAlign: "center" }}>
          Caricamento dati...
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">Statistiche e Progressi</div>
          <button className="button button-secondary" onClick={onClose}>
            Chiudi
          </button>
        </div>
        <div style={{ padding: 20, textAlign: "center" }}>
          Nessuna sessione negli ultimi 90 giorni
        </div>
      </div>
    );
  }

  // Prepara dati per grafico volume totale nel tempo
  const volumeData = sessions.map((s) => ({
    data: new Date(s.started_at).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
    }),
    volume: s.volume,
    serie: s.total_sets_done,
  }));

  // Prepara dati per grafico frequenza allenamenti (sessioni per settimana)
  const weeklyFrequency = {};
  sessions.forEach((s) => {
    const date = new Date(s.started_at);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
    });

    if (!weeklyFrequency[weekKey]) {
      weeklyFrequency[weekKey] = 0;
    }
    weeklyFrequency[weekKey]++;
  });

  const frequencyData = Object.entries(weeklyFrequency).map(
    ([week, count]) => ({
      settimana: week,
      allenamenti: count,
    })
  );

  // Prepara dati per progressione esercizio specifico
  let exerciseProgressData = [];
  if (selectedExercise) {
    const exerciseSets = sessionSets.filter(
      (s) => s.exercise_name === selectedExercise
    );

    // Raggruppa per sessione e calcola peso massimo e volume
    const bySession = {};
    exerciseSets.forEach((set) => {
      if (!bySession[set.session_id]) {
        const session = sessions.find((s) => s.id === set.session_id);
        bySession[set.session_id] = {
          date: session
            ? new Date(session.started_at).toLocaleDateString("it-IT", {
                day: "2-digit",
                month: "2-digit",
              })
            : "",
          maxWeight: 0,
          totalVolume: 0,
          totalReps: 0,
        };
      }

      bySession[set.session_id].maxWeight = Math.max(
        bySession[set.session_id].maxWeight,
        set.weight
      );
      bySession[set.session_id].totalVolume += set.reps * set.weight;
      bySession[set.session_id].totalReps += set.reps;
    });

    exerciseProgressData = Object.values(bySession).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  }

// DEBUG: verifica che il render parta
  console.log("Render ProgressStats OK", {
    sessionsLength: sessions.length,
    sessionSetsLength: sessionSets.length,
    exercises,
    selectedExercise,
  });


  return (
    <div style={{ marginTop: 16 }}>
      <div className="card">
        <div className="card-header">
          <div className="card-title">📊 Statistiche e Progressi</div>
          <button className="button button-secondary" onClick={onClose}>
            Chiudi
          </button>
        </div>
      </div>

      {/* Grafico Volume Totale */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title" style={{ marginBottom: 12 }}>
          Volume Totale per Sessione
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={volumeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="data" stroke="#9ca3af" style={{ fontSize: 12 }} />
            <YAxis stroke="#9ca3af" style={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: 8,
                color: "#e5e7eb",
              }}
            />
            <Legend wrapperStyle={{ color: "#e5e7eb" }} />
            <Line
              type="monotone"
              dataKey="volume"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ fill: "#22c55e", r: 4 }}
              name="Volume (kg)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Grafico Frequenza Allenamenti */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title" style={{ marginBottom: 12 }}>
          Frequenza Allenamenti (per settimana)
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={frequencyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="settimana"
              stroke="#9ca3af"
              style={{ fontSize: 12 }}
            />
            <YAxis stroke="#9ca3af" style={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: 8,
                color: "#e5e7eb",
              }}
            />
            <Bar dataKey="allenamenti" fill="#22c55e" name="Allenamenti" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Progressione Esercizio Specifico */}
      {exercises.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>
            Progressione Esercizio
          </div>

          <select
            value={selectedExercise || ""}
            onChange={(e) => setSelectedExercise(e.target.value)}
            style={{
              width: "100%",
              marginBottom: 16,
              padding: "8px",
              borderRadius: 8,
              border: "1px solid #374151",
              backgroundColor: "#020617",
              color: "#e5e7eb",
            }}
          >
            {exercises.map((ex) => (
              <option key={ex} value={ex}>
                {ex}
              </option>
            ))}
          </select>

          {exerciseProgressData.length > 0 && (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={exerciseProgressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  style={{ fontSize: 12 }}
                />
                <YAxis stroke="#9ca3af" style={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: 8,
                    color: "#e5e7eb",
                  }}
                />
                <Legend wrapperStyle={{ color: "#e5e7eb" }} />
                <Line
                  type="monotone"
                  dataKey="maxWeight"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 4 }}
                  name="Peso Max (kg)"
                />
                <Line
                  type="monotone"
                  dataKey="totalVolume"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: "#22c55e", r: 4 }}
                  name="Volume (kg)"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Statistiche Generali */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title" style={{ marginBottom: 12 }}>
          Statistiche Generali (ultimi 90 giorni)
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
          }}
        >
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: "#111827",
              textAlign: "center",
            }}
          >
            <div className="small-text">Sessioni Totali</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
              {sessions.length}
            </div>
          </div>

          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: "#111827",
              textAlign: "center",
            }}
          >
            <div className="small-text">Volume Totale</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
              {sessions.reduce((sum, s) => sum + s.volume, 0).toLocaleString()}{" "}
              kg
            </div>
          </div>

          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: "#111827",
              textAlign: "center",
            }}
          >
            <div className="small-text">Serie Totali</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
              {sessions.reduce((sum, s) => sum + s.total_sets_done, 0)}
            </div>
          </div>

          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: "#111827",
              textAlign: "center",
            }}
          >
            <div className="small-text">Volume Medio</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
              {Math.round(
                sessions.reduce((sum, s) => sum + s.volume, 0) / sessions.length
              ).toLocaleString()}{" "}
              kg
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgressStats;
