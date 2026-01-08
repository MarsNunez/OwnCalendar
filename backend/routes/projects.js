import { Router } from "express";
import Project from "../models/Project.js";

const router = Router();

const DEFAULT_ROWS = 4;
const DEFAULT_COLS = 7;

const buildCells = (cells = [], rows = DEFAULT_ROWS, cols = DEFAULT_COLS) => {
  const total = rows * cols;
  return Array.from({ length: total }, (_, idx) => Boolean(cells[idx]) || false);
};

const buildGrid = (grid = {}, index = 0) => {
  const rows = Number(grid.rows) || DEFAULT_ROWS;
  const cols = Number(grid.cols) || DEFAULT_COLS;

  return {
    label: grid.label?.trim() || `Cuadrilla ${index + 1}`,
    rows,
    cols,
    cells: buildCells(grid.cells, rows, cols),
  };
};

router.get("/", async (_req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener proyectos." });
  }
});

router.post("/", async (req, res) => {
  const { title, description, grids } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "El título es obligatorio." });
  }

  const normalizedGrids =
    Array.isArray(grids) && grids.length > 0
      ? grids.map((grid, index) => buildGrid(grid, index))
      : [buildGrid({}, 0)];

  try {
    const project = await Project.create({
      title: title.trim(),
      description: description?.trim() || "",
      grids: normalizedGrids,
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: "Error al crear el proyecto." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Proyecto no encontrado." });
    }
    res.json(project);
  } catch (error) {
    res.status(400).json({ error: "ID inválido." });
  }
});

router.patch("/:id", async (req, res) => {
  const { title, description, grids } = req.body;

  const update = {};
  if (typeof title === "string") update.title = title.trim();
  if (typeof description === "string") update.description = description.trim();
  if (Array.isArray(grids)) {
    update.grids = grids.map((grid, index) => buildGrid(grid, index));
  }

  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true },
    );

    if (!project) {
      return res.status(404).json({ error: "Proyecto no encontrado." });
    }

    res.json(project);
  } catch (error) {
    res.status(400).json({ error: "ID inválido." });
  }
});

router.post("/:id/grids", async (req, res) => {
  const { label, rows, cols, cells } = req.body || {};

  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Proyecto no encontrado." });
    }

    const gridIndex = project.grids.length;
    const newGrid = buildGrid(
      { label, rows, cols, cells },
      gridIndex,
    );

    project.grids.push(newGrid);
    await project.save();

    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ error: "ID inválido." });
  }
});

router.patch("/:id/grids/:gridIndex", async (req, res) => {
  const index = Number(req.params.gridIndex);
  const { label, rows, cols, cells } = req.body || {};

  if (Number.isNaN(index)) {
    return res.status(400).json({ error: "Índice de cuadrilla inválido." });
  }

  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Proyecto no encontrado." });
    }

    if (index < 0 || index >= project.grids.length) {
      return res.status(404).json({ error: "Cuadrilla no encontrada." });
    }

    const currentGrid = project.grids[index];

    const nextRows = rows ? Number(rows) : currentGrid.rows;
    const nextCols = cols ? Number(cols) : currentGrid.cols;
    const nextLabel = typeof label === "string" ? label.trim() : currentGrid.label;

    project.grids[index] = {
      label: nextLabel || `Cuadrilla ${index + 1}`,
      rows: nextRows,
      cols: nextCols,
      cells: buildCells(cells ?? currentGrid.cells, nextRows, nextCols),
    };

    await project.save();

    res.json(project);
  } catch (error) {
    res.status(400).json({ error: "ID inválido." });
  }
});

export default router;
