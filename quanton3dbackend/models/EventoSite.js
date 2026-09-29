import mongoose from 'mongoose';

// Eventos simples do site que o ADM conta no relatorio da semana
// (hoje: resultado do Diagnostico rapido). Nada de dado pessoal.
const EventoSiteSchema = new mongoose.Schema(
  {
    tipo: { type: String, required: true }, // 'diagnostico'
    sintoma: { type: String, default: '' },
    resultado: { type: String, default: '' },
  },
  { timestamps: true }
);

EventoSiteSchema.index({ tipo: 1, createdAt: -1 });
// Guarda 1 ano (o relatorio olha semanas).
EventoSiteSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 86400 });

export default mongoose.model('EventoSite', EventoSiteSchema);
