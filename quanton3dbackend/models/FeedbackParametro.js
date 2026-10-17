import mongoose from 'mongoose';

const Schema = new mongoose.Schema(
  {
    resina: { type: String, required: true, trim: true },
    impressora: { type: String, required: true, trim: true },
    voto: { type: String, enum: ['positivo', 'negativo'], required: true },
    observacao: { type: String, maxlength: 500, default: '' },
    ip: { type: String, default: '' },
    origem: { type: String, default: 'site' },
    alteracoes: { type: Number, default: 0 },
    ultimaAlteracao: { type: Date, default: null },
  },
  { timestamps: true }
);

Schema.index({ resina: 1, impressora: 1 });
Schema.index({ ip: 1, resina: 1, impressora: 1, createdAt: 1 });

export default mongoose.model('FeedbackParametro', Schema);
