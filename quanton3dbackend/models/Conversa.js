import mongoose from 'mongoose';

const ConversaSchema = new mongoose.Schema(
  {
    clienteId: { type: String, default: '' },
    clienteNome: { type: String, default: '' },
    pergunta: { type: String, required: true, trim: true },
    resposta: { type: String, required: true },
    resinaDetectada: { type: String, default: '' },
    impressoraDetectada: { type: String, default: '' },
    ragUsado: { type: Boolean, default: false },
    fonte: { type: String, default: 'deepseek' }, // 'rules' | 'deepseek' | 'rag+deepseek'
    // Campos de curadoria admin
    respostaMelhorada: { type: String, default: '' },
    aprovado: { type: Boolean, default: false },
    revisadoPor: { type: String, default: '' },
  },
  { timestamps: true }
);

ConversaSchema.index({ createdAt: -1 });
ConversaSchema.index({ aprovado: 1, resinaDetectada: 1 });

export default mongoose.model('Conversa', ConversaSchema);
