import { useState, useEffect } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const PRIORITY_COLORS = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
};

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_URL}/tasks`);
      const data = await res.json();
      setTasks(data);
    } catch {
      setError("Не вдалось завантажити завдання");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const createTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, priority }),
    });
    setTitle(""); setDescription(""); setPriority("medium");
    fetchTasks();
  };

  const toggleTask = async (task) => {
    await fetch(`${API_URL}/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !task.completed }),
    });
    fetchTasks();
  };

  const deleteTask = async (id) => {
    await fetch(`${API_URL}/tasks/${id}`, { method: "DELETE" });
    fetchTasks();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "2rem 1rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.25rem", color: "#f8fafc" }}>
          📋 Task Manager
        </h1>
        <p style={{ color: "#64748b", marginBottom: "2rem" }}>Лабораторна робота з DevOps</p>

        {/* Form */}
        <form onSubmit={createTask} style={{ background: "#1e293b", borderRadius: 12, padding: "1.5rem", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "#94a3b8" }}>НОВЕ ЗАВДАННЯ</h2>
          <input
            type="text"
            placeholder="Назва завдання *"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            style={{ width: "100%", padding: "0.75rem", borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0", marginBottom: "0.75rem", boxSizing: "border-box" }}
          />
          <input
            type="text"
            placeholder="Опис (необов'язково)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ width: "100%", padding: "0.75rem", borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0", marginBottom: "0.75rem", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              style={{ flex: 1, padding: "0.75rem", borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0" }}
            >
              <option value="low">🟢 Низький пріоритет</option>
              <option value="medium">🟡 Середній пріоритет</option>
              <option value="high">🔴 Високий пріоритет</option>
            </select>
            <button type="submit" style={{ padding: "0.75rem 1.5rem", borderRadius: 8, background: "#6366f1", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}>
              + Додати
            </button>
          </div>
        </form>

        {/* Tasks list */}
        {loading && <p style={{ color: "#64748b" }}>Завантаження...</p>}
        {error && <p style={{ color: "#ef4444" }}>{error}</p>}
        {!loading && tasks.length === 0 && (
          <p style={{ color: "#64748b", textAlign: "center", padding: "2rem" }}>Завдань поки немає. Додайте перше! 👆</p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {tasks.map(task => (
            <div key={task.id} style={{
              background: "#1e293b", borderRadius: 10, padding: "1rem 1.25rem",
              display: "flex", alignItems: "flex-start", gap: "1rem",
              borderLeft: `4px solid ${PRIORITY_COLORS[task.priority]}`,
              opacity: task.completed ? 0.6 : 1,
            }}>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task)}
                style={{ marginTop: 4, cursor: "pointer", width: 18, height: 18 }}
              />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600, textDecoration: task.completed ? "line-through" : "none", color: "#f1f5f9" }}>
                  {task.title}
                </p>
                {task.description && <p style={{ margin: "0.25rem 0 0", color: "#64748b", fontSize: "0.875rem" }}>{task.description}</p>}
                <p style={{ margin: "0.25rem 0 0", color: "#475569", fontSize: "0.75rem" }}>
                  {new Date(task.created_at).toLocaleString("uk-UA")}
                </p>
              </div>
              <button onClick={() => deleteTask(task.id)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "1.25rem", lineHeight: 1 }}>✕</button>
            </div>
          ))}
        </div>

        {tasks.length > 0 && (
          <p style={{ textAlign: "center", color: "#475569", marginTop: "1.5rem", fontSize: "0.875rem" }}>
            Всього: {tasks.length} | Виконано: {tasks.filter(t => t.completed).length}
          </p>
        )}
      </div>
    </div>
  );
}
