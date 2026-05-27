import mongoose from "mongoose";

const PartnerPhotoSchema = new mongoose.Schema(
  {
    nomeOriginal: {
      type: String,
      default: "",
    },
    nomeArquivo: {
      type: String,
      default: "",
    },
    url: {
      type: String,
      default: "",
    },
    mimeType: {
      type: String,
      default: "",
    },
    tamanho: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const PartnerRequestSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: true,
      trim: true,
    },
    telefone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    instagram: {
      type: String,
      trim: true,
      default: "",
    },
    site: {
      type: String,
      trim: true,
      default: "",
    },
    tipo: {
      type: String,
      required: true,
      trim: true,
      default: "Quero ser parceiro",
    },
    titulo: {
      type: String,
      required: true,
      trim: true,
    },
    descricao: {
      type: String,
      required: true,
      trim: true,
    },
    categoria: {
      type: String,
      trim: true,
      default: "Parceiro",
    },
    cidade: {
      type: String,
      trim: true,
      default: "",
    },
    estado: {
      type: String,
      trim: true,
      default: "",
    },
    portfolio: {
      type: String,
      trim: true,
      default: "",
    },
    origem: {
      type: String,
      trim: true,
      default: "site",
    },
    status: {
      type: String,
      enum: ["pendente", "aprovado", "rejeitado"],
      default: "pendente",
    },
    observacaoAdmin: {
      type: String,
      trim: true,
      default: "",
    },
    fotos: {
      type: [PartnerPhotoSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

PartnerRequestSchema.index({ status: 1, createdAt: -1 });

const PartnerRequest =
  mongoose.models.PartnerRequest ||
  mongoose.model("PartnerRequest", PartnerRequestSchema);

export default PartnerRequest;
