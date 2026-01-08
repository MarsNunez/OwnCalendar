import app from "../../../../../app.js";
import { connectToDatabase } from "../../../../../lib/db.js";

export default async function handler(req, res) {
  await connectToDatabase();
  return app(req, res);
}
