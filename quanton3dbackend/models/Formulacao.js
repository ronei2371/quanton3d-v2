import mongoose from "mongoose";

const Schema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    telefone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    caracteristica: { type: String, required: true, trim: true },
    cor: { type: String, default: "", trim: true },
    aplicacao: { type: String, default: "", trim: true },
    dureza: { type: String, default: "", trim: true },
    flexibilidade: { type: String, default: "", trim: true },
    resistencia: { type: String, default: "", trim: true },
    detalhes: { type: String, default: "", trim: true },
    status: { type: String, default: "pendente" },
  },
  { timestamps: true }
);

export default mongoose.model("Formulacao", Schema);
