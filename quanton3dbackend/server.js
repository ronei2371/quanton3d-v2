import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import contactMessagesRoutes from "./routes/contactMessages.js";
import clientesRoutes from "./routes/clientes.js";
import partnerRequestsRoutes from "./routes/partnerRequests.js";
import parametrosRoutes from "./routes/parametros.js";
import formulacoesRoutes from "./routes/formulacoes.js";
import galleryRoutes from "./routes/gallery.js";
import chatRoutes from "./routes/chat.js";
import adminRoutes from "./routes/admin.js";
import botTicketsRoutes from "./routes/botTickets.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 10000);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((x) => x.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (
        !origin ||
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin)
      ) {
        return cb(null, true);
      }

      return cb(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use("/uploads", express.static("uploads"));
app.use("/api/bot-tickets", botTicketsRoutes);

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Quanton3D Final Backend online",
  });
});

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/clientes", clientesRoutes);
app.use("/api/parametros", parametrosRoutes);
app.use("/api/partner-requests", partnerRequestsRoutes);
app.use("/api/formulacoes", formulacoesRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact-messages", contactMessagesRoutes);

app.use((err, _req, res, _next) => {
  console.error("[SERVER]", err);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Erro interno",
  });
});

await connectDB();

app.listen(PORT, () => {
  console.log(`🚀 Quanton3D Final Backend rodando na porta ${PORT}`);
});