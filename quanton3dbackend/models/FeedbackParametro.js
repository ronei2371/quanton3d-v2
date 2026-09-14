import mongoose from 'mongoose';

const Schema = new mongoose.Schema(
  {
    resina:     { type: String, required: true, trim: true },
    impressora: { type: String, required: true, trim: true },
    voto:       { type: String, enum: ['positivo', 'negativo'], required: true },
    observacao: { type: String, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

Schema.index({ resina: 1, impressora: 1 });

export default mongoose.model('FeedbackParametro', Schema);
