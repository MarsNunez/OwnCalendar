"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Theme = "light" | "dark";

type Grid = {
  label: string;
  rows: number;
  cols: number;
  cells: boolean[];
};

type Project = {
  _id: string;
  title: string;
  description: string;
  grids: Grid[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";
const THEME_KEY = "calendar-theme";

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string | undefined;

  const [project, setProject] = useState<Project | null>(null);
  const [activeGrid, setActiveGrid] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem(THEME_KEY);
    return stored === "dark" || stored === "light" ? stored : "light";
  });

  const isDark = theme === "dark";

  const activeGridTitle = useMemo(() => {
    if (activeGrid === null) return "";
    return `Cuadrilla ${activeGrid + 1}`;
  }, [activeGrid]);

  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/projects/${projectId}`);
      if (!res.ok) throw new Error("No se pudo cargar el proyecto");
      const data = (await res.json()) as Project;
      setProject(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar el proyecto",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  const handleAddGrid = async () => {
    if (!projectId || !project) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/projects/${projectId}/grids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: `Cuadrilla ${project.grids.length + 1}`,
          rows: 4,
          cols: 7,
        }),
      });
      if (!res.ok) throw new Error("No se pudo agregar la cuadrilla");
      const data = (await res.json()) as Project;
      setProject(data);
      setActiveGrid(data.grids.length - 1);
      setModalOpen(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al agregar cuadrilla",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleCell = async (index: number) => {
    if (activeGrid === null || !project || !projectId) return;
    const grid = project.grids[activeGrid];
    const total = grid.rows * grid.cols;
    const nextCells = Array.from({ length: total }, (_, idx) =>
      idx === index ? !grid.cells[idx] : Boolean(grid.cells[idx]),
    );

    setProject({
      ...project,
      grids: project.grids.map((g, idx) =>
        idx === activeGrid ? { ...g, cells: nextCells } : g,
      ),
    });

    try {
      const res = await fetch(
        `${API_URL}/projects/${projectId}/grids/${activeGrid}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: grid.label,
            rows: grid.rows,
            cols: grid.cols,
            cells: nextCells,
          }),
        },
      );
      if (!res.ok) throw new Error("No se pudo actualizar la cuadrilla");
      const updated = (await res.json()) as Project;
      setProject(updated);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al actualizar cuadrilla",
      );
      // re-fetch to sync state in caso de error
      fetchProject();
    }
  };

  const currentGrids = project?.grids ?? [];

  return (
    <div
      className={
        isDark
          ? "min-h-screen bg-slate-950 text-slate-100"
          : "min-h-screen bg-gradient-to-b from-slate-50 via-white to-white text-slate-900"
      }
    >
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-4 py-14 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1
              className={`text-3xl font-semibold tracking-tight ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              {project?.title || "Cargando..."}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={toggleTheme}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isDark
                    ? "border border-slate-700 bg-slate-900 text-slate-100 hover:border-slate-500"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 shadow-sm"
                }`}
              >
                {isDark ? "Tema claro" : "Tema oscuro"}
              </button>
              <button
                onClick={() => router.push("/")}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  isDark
                    ? "border-slate-700 text-slate-100 hover:border-slate-500 hover:bg-slate-800"
                    : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                Volver
              </button>
            </div>
          </div>
          {project && (
            <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              {project.description || "Sin descripción."}
            </p>
          )}
          {loading && (
            <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Cargando proyecto...
            </p>
          )}
          {error && (
            <p className={`text-sm ${isDark ? "text-red-400" : "text-red-600"}`}>
              {error}
            </p>
          )}
        </header>

        <section className="space-y-3">
          <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            Abre la cuadrícula (7 columnas x 4 filas) para marcar días
            completados.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {currentGrids.map((gridItem, index) => (
              <button
                key={gridItem.label + index}
                onClick={() => {
                  setActiveGrid(index);
                  setModalOpen(true);
                }}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  isDark
                    ? "border-slate-700 text-slate-100 hover:border-emerald-400 hover:text-emerald-200"
                    : "border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
                }`}
              >
                Cuadrilla {index + 1}
              </button>
            ))}
            <button
              onClick={handleAddGrid}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              + Agregar cuadrilla
            </button>
          </div>
        </section>
      </main>

      {modalOpen && activeGrid !== null && project && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div
            className={`w-full max-w-3xl rounded-2xl border p-6 shadow-xl ${
              isDark
                ? "border-slate-700 bg-slate-900 text-slate-100"
                : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                  Progreso diario
                </p>
                <h2
                  className={`text-xl font-semibold ${
                    isDark ? "text-slate-100" : "text-slate-900"
                  }`}
                >
                  {activeGridTitle}
                </h2>
                <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  Haz click en las casillas (7 columnas x 4 filas) para alternar
                  entre pendiente (blanco) y completado (verde).
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className={`rounded-full p-2 text-slate-500 transition ${
                  isDark
                    ? "hover:bg-slate-800 hover:text-slate-200"
                    : "hover:bg-slate-100 hover:text-slate-700"
                }`}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <div
              className={`mt-6 rounded-2xl border p-4 ${
                isDark
                  ? "border-slate-700 bg-slate-900/70"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div
                className={`grid gap-2`}
                style={{
                  gridTemplateColumns: `repeat(${project.grids[activeGrid]?.cols || 7}, minmax(0, 1fr))`,
                }}
              >
                {project.grids[activeGrid]?.cells.map((active, index) => (
                  <button
                    key={index}
                    onClick={() => toggleCell(index)}
                    className={`aspect-square rounded-md border transition duration-150 ${
                      active
                        ? "border-emerald-500 bg-emerald-500 shadow-sm shadow-emerald-200"
                        : isDark
                          ? "border-slate-700 bg-slate-900 hover:border-emerald-400"
                          : "border-slate-200 bg-white hover:border-emerald-300"
                    }`}
                    aria-label={`Día ${index + 1} ${
                      active ? "completado" : "pendiente"
                    }`}
                    title={`Día ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
