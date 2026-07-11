import mongoose from 'mongoose';

const Schema = new mongoose.Schema(
  {
    resina: { type: String, required: true, trim: true },
    impressora: { type: String, required: true, trim: true },
    alturaCamada: String,
    exposicaoNormal: String,
    exposicaoBase: String,
    camadasBase: String,
    liftDistance: String,
    liftSpeed: String,
    retractSpeed: String,
    // Selo de confiança do parâmetro — ajuda o cliente a saber se é testado ou estimado
    confianca: {
      type: String,
      enum: ['oficial', 'estimado'],
      default: 'oficial', // Se cadastrado manualmente pela Quanton3D, assume oficial por padrão
    },
  },
  { timestamps: true }
);

Schema.index({ resina: 1, impressora: 1 });

export default mongoose.model('Parametro', Schema);
