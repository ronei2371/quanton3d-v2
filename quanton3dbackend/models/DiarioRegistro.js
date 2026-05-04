import mongoose from "mongoose";

const DiarioRegistroSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    resina: { type: String, required: true, trim: true },
    impressora: { type: String, default: "", trim: true },
    exposicao: { type: String, default: "", trim: true },
    bottom: { type: String, default: "", trim: true },
    liftSpeed: { type: String, default: "", trim: true },
    camada: { type: String, default: "", trim: true },
    status: { type: String, required: true, trim: true },
    problemas: { type: [String], default: [] },
    observacoes: { type: String, default: "", trim: true },
    tempoMin: { type: String, default: "", trim: true },
    fotoUrl: { type: String, default: "", trim: true },
    data: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("DiarioRegistro", DiarioRegistroSchema);
