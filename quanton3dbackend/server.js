import * as Sentry from "@sentry/node";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import contactMessagesRoutes from "./routes/contactMessages.js";
import clientesRoutes from "./routes/clientes.js";
import partnerRequestsRoutes from "./routes/partnerRequests.js";
import parametrosRoutes from "./routes/parametros.js";
import formulacoesRoutes from "./routes/formulacoes.js";
import galleryRoutes from "./routes/gallery.js";
import chatRoutes from "./routes/chat.js";
import adminRoutes from "./routes/admin.js";
import botTicketsRoutes from "./routes/botTickets.js";
import conversasRoutes from "./routes/conversas.js";
import visitasRoutes from "./routes/visitas.js";
import atendentesRoutes from "./routes/atendentes.js";
import sugestoesConhecimentoRoutes from "./routes/sugestoesConhecimento.js";
import feedbackParametrosRoutes from "./routes/feedbackParametros.js";
import { auditLog } from "./services/auditLog.js";
import { limiteLogin, limiteFormulario, limiteUpload, limiteChave } from "./middlewares/limiteTaxa.js";

dotenv.config();

Sentry.init({
dsn: process.env.SENTRY_DSN,
tracesSampleRate: 1.0,
});

const app = express();
// O Render fica na frente do app (1 proxy): assim req.ip e o IP real do visitante.
app.set("trust proxy", 1);
const PORT = Number(process.env.PORT || 10000);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
.split(",")
.map((x) => x.trim())
.filter(Boolean);

app.use(
cors({
origin(origin, cb) {
if (!origin) return cb(null, true);
if (allowedOrigins.length === 0) return cb(new Error('CORS: ALLOWED_ORIGINS nao configurado'));
if (allowedOrigins.includes(origin)) return cb(null, true);
return cb(new Error('CORS: origin nao permitida: ' + origin));
},
credentials: true,
})
);

// 10 MB cobre a maior foto do site (feedback do chat, limite de ~7 MB em texto).
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Historico de acoes do ADM (admin e atendentes)
app.use(auditLog);

// Limite de tentativas por IP (middlewares/limiteTaxa.js): login da equipe e formularios publicos.
app.post("/api/admin/login", limiteLogin);
app.post("/api/atendentes/login", limiteLogin);
app.post("/api/clientes", limiteFormulario);
app.post("/api/clientes/:id/chave", limiteChave); // impede tentar adivinhar o telefone
app.post("/api/contact-messages", limiteFormulario);
app.post("/api/formulacoes", limiteFormulario);
app.post("/api/feedback-parametros", limiteFormulario);
app.post("/api/bot-tickets", limiteUpload);
app.post("/api/gallery", limiteUpload);
app.post("/api/partner-requests", limiteUpload);
app.patch("/api/conversas/:id/feedback", limiteUpload);

// O endereco quanton3d-v2.onrender.com e o endereco oficial do site: o Google pode indexar.
app.use("/uploads", express.static("uploads"));
app.use("/api/bot-tickets", botTicketsRoutes);

// Servir arquivos estáticos do Frontend
const frontendBuildPath = path.join(__dirname, "../quanton3dfrontend/dist");
app.use(express.static(frontendBuildPath));

app.get("/api-status", (_req, res) => {
res.json({
success: true,
message: "Quanton3D Final Backend online",
});
});

// Monitor do site (UptimeRobot / Render): 200 so se o servidor E o banco estiverem ok.
// Se o MongoDB cair, responde 503 e o monitor avisa (antes dizia "ok" mesmo sem banco).
app.get("/health", (_req, res) => {
const bancoOk = mongoose.connection.readyState === 1;
res.status(bancoOk ? 200 : 503).json({
success: bancoOk,
status: bancoOk ? "ok" : "sem-banco",
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
app.use("/api/conversas", conversasRoutes);
app.use("/api/visitas", visitasRoutes);
app.use("/api/atendentes", atendentesRoutes);
app.use("/api/contact-messages", contactMessagesRoutes);
app.use("/api/sugestoes-conhecimento", sugestoesConhecimentoRoutes);
app.use("/api/feedback-parametros", feedbackParametrosRoutes);

// Rota coringa para o Frontend (Single Page Application)
// As paginas do site ja sao servidas como arquivos (dist/<pagina>/index.html). O que chega
// aqui e endereco que nao existe: responde 404 e o site mostra "Pagina nao encontrada".
app.get("*", (req, res, next) => {
if (req.path.startsWith("/api/")) return next();
res.status(404).sendFile(path.join(frontendBuildPath, "index.html"));
});

Sentry.setupExpressErrorHandler(app);

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
