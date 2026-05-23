import mongoose from 'mongoose';

const Schema = new mongoose.Schema({
  resina: { type: String, required: true, trim: true },
  impressora: { type: String, required: true, trim: true },
  marca: { type: String, trim: true },
  alturaCamada: String,
  exposicaoNormal: String,
  exposicaoBase: String,
  camadasBase: String,
  retardoUV: String,
  retardoUVBase: String,
  descansoAntesElevacao: String,
  descansoAposElevacao: String,
  descansoAposRetracao: String,
  potenciaUV: String,
  liftDistance: String,
  liftSpeed: String,
  retractSpeed: String
}, { timestamps: true });

export default mongoose.model('Parametro', Schema);
