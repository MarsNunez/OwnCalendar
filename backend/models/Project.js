import { Schema, model } from "mongoose";

const gridSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    rows: { type: Number, default: 4 },
    cols: { type: Number, default: 7 },
    cells: { type: [Boolean], default: [] },
  },
  { _id: false },
);

const projectSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    grids: { type: [gridSchema], default: [] },
  },
  { timestamps: true },
);

export default model("Project", projectSchema);
