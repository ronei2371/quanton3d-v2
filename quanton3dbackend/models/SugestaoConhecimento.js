import mongoose from "mongoose";

const SugestaoConhecimentoSchema = new mongoose.Schema(
  {
    codigoAtendente: { type: String, required: true, trim: true },
    nomeAtendente: { type: String, default: "", trim: true },
    categoria: {
      type: String,
      enum: ["resina", "impressora", "problema", "dica", "outro"],
      default: "outro",
    },
    titulo: { type: String, required: true, trim: true },
    conteudo: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pendente", "aprovado", "rejeitado"],
      default: "pendente",
    },
    observacaoAdmin: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

SugestaoConhecimentoSchema.index({ status: 1, createdAt: -1 });

const SugestaoConhecimento =
  mongoose.models.SugestaoConhecimento ||
  mongoose.model("SugestaoConhecimento", SugestaoConhecimentoSchema);

export default SugestaoConhecimento;
