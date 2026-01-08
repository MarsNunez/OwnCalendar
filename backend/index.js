import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 3002;
const mongoUrl = process.env.MONGO_URL || process.env.MONGO_URI || "";
const mongoDbName = process.env.MONGO_DB;

const startServer = async () => {
  try {
    if (!mongoUrl) {
      throw new Error("Falta la variable de entorno MONGO_URL o MONGO_URI");
    }

    await mongoose.connect(mongoUrl, {
      dbName: mongoDbName,
    });
    console.log("✅ Conectado a MongoDB");

    app.listen(PORT, () => {
      console.log(`🟢 Server escuchando en el puerto ${PORT}`);
    });

    const shutdown = async () => {
      console.log("\n[server] Cerrando...");
      await mongoose.disconnect();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    process.on("unhandledRejection", (err) => {
      console.error("[server] Unhandled rejection:", err);
      shutdown();
    });
  } catch (error) {
    console.error("❌ Error al conectar MongoDB:", error.message);
    process.exit(1);
  }
};

startServer();
