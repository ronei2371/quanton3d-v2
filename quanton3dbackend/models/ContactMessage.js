import mongoose from "mongoose";

const ContactMessageSchema = new mongoose.Schema(
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
    assunto: {
      type: String,
      required: true,
      trim: true,
    },
    mensagem: {
      type: String,
      required: true,
      trim: true,
    },
    origem: {
      type: String,
      default: "site",
      trim: true,
    },
    status: {
      type: String,
      enum: ["nova", "lida", "respondida", "arquivada"],
      default: "nova",
    },
    observacaoAdmin: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

ContactMessageSchema.index({ status: 1, createdAt: -1 });

const ContactMessage =
  mongoose.models.ContactMessage ||
  mongoose.model("ContactMessage", ContactMessageSchema);

export default ContactMessage;
