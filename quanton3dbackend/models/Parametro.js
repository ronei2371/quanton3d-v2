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
lightOffDelay: String,
codigoChitubox: String,
observacoes: String,
fotoImpressora: String,
// Selo de confiança do parâmetro — ajuda o cliente a saber se é testado ou estimado
confianca: {
type: String,
enum: ['oficial', 'estimado'],
default: 'oficial', // Se cadastrado manualmente pela Quanton3D, assume oficial por padrão
},
// Índice de confiança detalhado (p2-3)
versao: { type: String, default: null }, // ex: "1.0", "1.2" — versão do perfil
metodoValidacao: {
type: String,
enum: ['teste-fisico', 'calculado', 'fornecedor', null],
default: null, // ex: 'teste-fisico' = validado com impressão real
},
},
{ timestamps: true }
);

Schema.index({ resina: 1, impressora: 1 });

export default mongoose.model('Parametro', Schema);
