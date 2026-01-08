import dotenv from "dotenv";
import app from "./app.js";
import { connectToDatabase } from "./lib/db.js";

dotenv.config();

const PORT = process.env.PORT || 3002;

const startServer = async () => {
  try {
    await connectToDatabase();
    console.log("✅ Conectado a MongoDB");

    app.listen(PORT, () => {
      console.log(`🟢 Server escuchando en el puerto ${PORT}`);
    });

    const shutdown = async () => {
      console.log("\n[server] Cerrando...");
      const mongoose = await import("mongoose");
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
