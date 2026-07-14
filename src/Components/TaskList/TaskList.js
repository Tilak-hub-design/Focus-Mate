import React, { useEffect, useMemo, useState } from "react";
import "./TaskList.css";

const STORAGE_KEY = "focusMateTasks";

function TaskList() {
  const [tasks, setTasks] = useState(() => {
    try {
      const savedTasks = localStorage.getItem(STORAGE_KEY);
      return savedTasks ? JSON.parse(savedTasks) : [];
    } catch (error) {
      console.error("Unable to load saved tasks:", error);
      return [];
    }
  });

  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "Medium",
    category: "Academics",
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (filter === "pending") return tasks.filter((task) => !task.completed);
    if (filter === "completed") return tasks.filter((task) => task.completed);
    return tasks;
  }, [tasks, filter]);

  const completedCount = tasks.filter((task) => task.completed).length;

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) {
      alert("Please enter a task title.");
      return;
    }

    const newTask = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`,
      title: trimmedTitle,
      description: form.description.trim(),
      dueDate: form.dueDate,
      priority: form.priority,
      category: form.category,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setTasks((currentTasks) => [newTask, ...currentTasks]);
    setForm({
      title: "",
      description: "",
      dueDate: "",
      priority: "Medium",
      category: "Academics",
    });
  }

  function toggleTask(taskId) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  }

  function deleteTask(taskId) {
    const shouldDelete = window.confirm("Are you sure you want to delete this task?");
    if (!shouldDelete) return;
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
  }

  return (
    <main className="task-page">
      <section className="task-page-header">
        <div>
          <p className="task-page-label">Focus Mate</p>
          <h1>My Tasks</h1>
          <p>Add assignments, keep track of deadlines, and mark completed work.</p>
        </div>

        <div className="task-summary" aria-label="Task summary">
          <div><strong>{tasks.length}</strong><span>Total</span></div>
          <div><strong>{completedCount}</strong><span>Completed</span></div>
          <div><strong>{tasks.length - completedCount}</strong><span>Pending</span></div>
        </div>
      </section>

      <div className="task-layout">
        <section className="task-form-card">
          <h2>Create New Task</h2>
          <form onSubmit={handleSubmit}>
            <label htmlFor="title">Task Title
              <input id="title" name="title" type="text" value={form.title} onChange={handleChange} placeholder="Example: Study for CSCE quiz" maxLength={100} required />
            </label>

            <label htmlFor="description">Description
              <textarea id="description" name="description" value={form.description} onChange={handleChange} placeholder="Add details about the task" rows={4} maxLength={400} />
            </label>

            <label htmlFor="dueDate">Due Date
              <input id="dueDate" name="dueDate" type="date" value={form.dueDate} onChange={handleChange} />
            </label>

            <div className="task-form-row">
              <label htmlFor="priority">Priority
                <select id="priority" name="priority" value={form.priority} onChange={handleChange}>
                  <option>Low</option><option>Medium</option><option>High</option>
                </select>
              </label>

              <label htmlFor="category">Category
                <select id="category" name="category" value={form.category} onChange={handleChange}>
                  <option>Academics</option><option>Study Session</option><option>Project</option><option>Personal</option><option>Other</option>
                </select>
              </label>
            </div>

            <button className="task-primary-button" type="submit">Add Task</button>
          </form>
        </section>

        <section className="task-list-card">
          <div className="task-list-heading">
            <div><h2>Task List</h2><p>{filteredTasks.length} task(s) shown</p></div>
            <div className="task-filters" aria-label="Filter tasks">
              <button type="button" className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All</button>
              <button type="button" className={filter === "pending" ? "active" : ""} onClick={() => setFilter("pending")}>Pending</button>
              <button type="button" className={filter === "completed" ? "active" : ""} onClick={() => setFilter("completed")}>Completed</button>
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="task-empty-state"><h3>No tasks here yet</h3><p>Add a task or choose another filter.</p></div>
          ) : (
            <ul className="task-items">
              {filteredTasks.map((task) => (
                <li className={`task-item ${task.completed ? "completed" : ""}`} key={task.id}>
                  <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} aria-label={`Mark ${task.title} as ${task.completed ? "pending" : "completed"}`} />
                  <div className="task-item-content">
                    <div className="task-item-title-row">
                      <h3>{task.title}</h3>
                      <span className={`task-priority ${task.priority.toLowerCase()}`}>{task.priority}</span>
                    </div>
                    {task.description && <p>{task.description}</p>}
                    <div className="task-meta">
                      <span>{task.category}</span>
                      <span>{task.dueDate ? `Due: ${new Date(`${task.dueDate}T00:00:00`).toLocaleDateString()}` : "No due date"}</span>
                      <span>{task.completed ? "Completed" : "Pending"}</span>
                    </div>
                  </div>
                  <button type="button" className="task-delete-button" onClick={() => deleteTask(task.id)} aria-label={`Delete ${task.title}`}>Delete</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

export default TaskList;
