import mongoose from 'mongoose';

const ParametrosSchema = new mongoose.Schema(
  {
    alturaCamada: String,
    camadasBase: String,
    exposicaoNormal: String,
    exposicaoBase: String,
    contagemTransicao: String,
    tipoTransicao: String,
    retardoDesligarUV: String,
    distElevacaoInferior: String,
    distElevacao: String,
    distRetracao: String,
    velElevacaoInferior: String,
    velElevacao: String,
    velRetracaoInferior: String,
    velRetracao: String,
  },
  { _id: false }
);

// Redes sociais do cliente — usado para marcar/creditar ao divulgar a peça aprovada
const RedesSociaisSchema = new mongoose.Schema(
  {
    instagram: { type: String, default: '' },
    tiktok: { type: String, default: '' },
    facebook: { type: String, default: '' },
    youtube: { type: String, default: '' },
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
    redesSociais: RedesSociaisSchema,
    autorizaDivulgacao: { type: Boolean, default: false },
    status: { type: String, default: 'pendente' },
  },
  { timestamps: true }
);

Schema.index({ status: 1, createdAt: -1 });

export default mongoose.model('GalleryItem', Schema);
