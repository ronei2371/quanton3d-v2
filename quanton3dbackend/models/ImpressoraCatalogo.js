// models/ImpressoraCatalogo.js
// Catálogo de impressoras (sem parâmetros de impressão)
// Alimentado via importação do Photocura — nome único + foto
import mongoose from 'mongoose';

const ImpressoraCatalogoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    index: true,
  },
  fotoImpressora: {
    type: String,
    default: '',
  },
  origem: {
    type: String,
    default: 'photocura',
  },
}, { timestamps: true });

export default mongoose.model('ImpressoraCatalogo', ImpressoraCatalogoSchema);
