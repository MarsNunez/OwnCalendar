"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

type Project = {
  _id: string;
  title: string;
  description: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";
const THEME_KEY = "calendar-theme";

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem(THEME_KEY);
    return stored === "dark" || stored === "light" ? stored : "light";
  });
  const router = useRouter();

  const canSave = useMemo(() => title.trim().length > 0, [title]);
  const isDark = theme === "dark";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/projects`);
        if (!res.ok) throw new Error("No se pudieron cargar los proyectos");
        const data = await res.json();
        setProjects(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar proyectos."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const resetForm = () => {
    setTitle("");
    setNote("");
  };

  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  const handleAddProject = async () => {
    if (!canSave) return;

    try {
      const res = await fetch(`${API_URL}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: note.trim(),
        }),
      });

      if (!res.ok) throw new Error("No se pudo crear el proyecto");
      const project: Project = await res.json();

      setProjects((prev) => [project, ...prev]);
      resetForm();
      setModalOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al crear el proyecto"
      );
    }
  };

  const handleOpenProject = (project: Project) => {
    router.push(`/projects/${project._id}`);
  };

  return (
    <div
      className={
        isDark
          ? "min-h-screen bg-slate-950 text-slate-100"
          : "min-h-screen bg-gradient-to-b from-slate-50 via-white to-white text-slate-900"
      }
    >
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-12 px-4 py-14 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1
            className={`text-4xl font-semibold tracking-tight ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Calendar
          </h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={toggleTheme}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                isDark
                  ? "border border-slate-700 bg-slate-900 text-slate-100 hover:border-slate-500"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 shadow-sm"
              }`}
            >
              {isDark ? "Tema claro" : "Tema oscuro"}
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
            >
              <span className="text-lg leading-none">+</span>
              Nuevo proyecto
            </button>
          </div>
        </header>

        <section className="space-y-4">
          <h2
            className={`text-sm font-semibold uppercase tracking-[0.1em] ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            Proyectos
          </h2>

          {error && (
            <p
              className={`text-sm ${isDark ? "text-red-400" : "text-red-600"}`}
            >
              {error}
            </p>
          )}

          {loading && (
            <p
              className={`text-sm ${
                isDark ? "text-slate-300" : "text-slate-600"
              }`}
            >
              Cargando proyectos...
            </p>
          )}

          {projects.length === 0 && !loading ? (
            <div
              className={`rounded-xl border border-dashed px-5 py-8 shadow-sm backdrop-blur ${
                isDark
                  ? "border-slate-700 bg-slate-900/60 text-slate-200"
                  : "border-slate-200 bg-white/70 text-slate-600"
              }`}
            >
              <p
                className={`text-base sm:text-lg ${
                  isDark ? "text-slate-200" : "text-slate-600"
                }`}
              >
                Aún no hay proyectos. Crea uno para empezar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {projects.map((project) => (
                <button
                  key={project._id}
                  onClick={() => handleOpenProject(project)}
                  className={`flex w-full flex-col items-start gap-2 rounded-xl border px-4 py-3 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md ${
                    isDark
                      ? "border-slate-700 bg-slate-900 text-slate-100"
                      : "border-slate-200 bg-white text-slate-900"
                  }`}
                >
                  <p
                    className={`text-lg font-semibold ${
                      isDark ? "text-slate-100" : "text-slate-900"
                    }`}
                  >
                    {project.title}
                  </p>
                  {project.description && (
                    <p
                      className={`max-h-14 overflow-hidden text-sm leading-relaxed ${
                        isDark ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      {project.description}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-xl ${
              isDark
                ? "border-slate-700 bg-slate-900 text-slate-100"
                : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Nuevo proyecto
                </p>
                <h2
                  className={`text-2xl font-semibold ${
                    isDark ? "text-slate-100" : "text-slate-900"
                  }`}
                >
                  Añadir proyecto
                </h2>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setModalOpen(false);
                }}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label
                className={`block space-y-2 text-sm ${
                  isDark ? "text-slate-200" : "text-slate-700"
                }`}
              >
                <span>Título</span>
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 ${
                    isDark
                      ? "border-slate-700 bg-slate-900 text-slate-100"
                      : "border-slate-200 bg-white text-slate-900"
                  }`}
                  placeholder="Ej. Lanzamiento de landing"
                />
              </label>

              <label
                className={`block space-y-2 text-sm ${
                  isDark ? "text-slate-200" : "text-slate-700"
                }`}
              >
                <span>Descripción / Nota</span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className={`w-full rounded-lg border px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 ${
                    isDark
                      ? "border-slate-700 bg-slate-900 text-slate-100"
                      : "border-slate-200 bg-white text-slate-900"
                  }`}
                  placeholder="Qué necesitas lograr o recordar"
                />
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  resetForm();
                  setModalOpen(false);
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isDark
                    ? "text-slate-200 hover:bg-slate-800"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleAddProject}
                disabled={!canSave}
                className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
