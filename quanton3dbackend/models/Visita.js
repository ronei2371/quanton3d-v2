import mongoose from 'mongoose';

const VisitaSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true },
    pagina: { type: String, default: '/' },
    origem: { type: String, default: '' }, // referrer, se disponível
  },
  { timestamps: true }
);

VisitaSchema.index({ createdAt: -1 });
VisitaSchema.index({ sessionId: 1, createdAt: -1 });

export default mongoose.model('Visita', VisitaSchema);
