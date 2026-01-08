import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URL || process.env.MONGO_URI || "";
const MONGO_DB = process.env.MONGO_DB;

let cached = globalThis.__MONGO_CONN__;

if (!cached) {
  cached = { conn: null, promise: null };
  globalThis.__MONGO_CONN__ = cached;
}

export async function connectToDatabase() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    if (!MONGO_URI) {
      throw new Error("Falta la variable de entorno MONGO_URL o MONGO_URI");
    }

    cached.promise = mongoose.connect(MONGO_URI, {
      dbName: MONGO_DB,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
