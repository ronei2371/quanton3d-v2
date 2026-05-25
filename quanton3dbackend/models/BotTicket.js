import mongoose from "mongoose";

const BotPhotoSchema = new mongoose.Schema(
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

const BotTicketSchema = new mongoose.Schema(
  {
    clienteId: {
      type: String,
      default: "",
      trim: true,
    },
    nome: {
      type: String,
      required: true,
      trim: true,
    },
    telefone: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    resina: {
      type: String,
      default: "",
      trim: true,
    },
    impressora: {
      type: String,
      default: "",
      trim: true,
    },
    problema: {
      type: String,
      required: true,
      trim: true,
    },
    descricao: {
      type: String,
      required: true,
      trim: true,
    },
    parametrosInformados: {
      type: String,
      default: "",
      trim: true,
    },
    respostaBot: {
      type: String,
      default: "",
      trim: true,
    },
    confiancaBot: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    precisaHumano: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["novo", "em_analise", "respondido", "encaminhado", "fechado"],
      default: "novo",
    },
    feedbackCliente: {
      type: String,
      enum: ["", "ajudou", "nao_ajudou"],
      default: "",
    },
    observacaoAdmin: {
      type: String,
      default: "",
      trim: true,
    },
    fotos: {
      type: [BotPhotoSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const BotTicket =
  mongoose.models.BotTicket ||
  mongoose.model("BotTicket", BotTicketSchema);

export default BotTicket;