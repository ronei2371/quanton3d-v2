import mongoose from 'mongoose';

const ParametrosSchema = new mongoose.Schema(
  {
    alturaCamada: String,
    exposicaoNormal: String,
    exposicaoBase: String,
    camadasBase: String,
    velocidadeElevacao: String,
    distanciaElevacao: String,
  },
  { _id: false }
);

const Schema = new mongoose.Schema(
  {
    nome: String,
    telefone: String,
    email: String,
    clienteId: String,
    resina: String,
    impressora: String,
    imagem: String,
    observacao: String,
    parametros: ParametrosSchema,
    status: {
      type: String,
      enum: ['pendente', 'aprovado', 'recusado'],
      default: 'pendente',
    },
  },
  { timestamps: true }
);

Schema.index({ status: 1, createdAt: -1 });

export default mongoose.model('GalleryItem', Schema);
