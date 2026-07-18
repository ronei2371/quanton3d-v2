// models/Atendente.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const AtendenteSchema = new mongoose.Schema({
  codigo:   { type: String, required: true, unique: true, uppercase: true, trim: true },
  nome:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  senha:    { type: String, required: true },
  ativo:    { type: Boolean, default: true },
  permissoes: {
    acessoAdmCompleto:    { type: Boolean, default: false },
    mudarStatusChamados:  { type: Boolean, default: true },
    sugerirConhecimento:  { type: Boolean, default: true },
    aprovarGaleria:       { type: Boolean, default: false },
    acessarMetricas:      { type: Boolean, default: false },
    verClientes:          { type: Boolean, default: true },
    verChamados:          { type: Boolean, default: true },
    verMensagens:         { type: Boolean, default: true },
    verFormulacoes:       { type: Boolean, default: true },
    verConversas:         { type: Boolean, default: true },
    excluirClientes:      { type: Boolean, default: false },
    editarKnowledge:      { type: Boolean, default: false },
    editarParametros:     { type: Boolean, default: false },
  },
  ultimoAcesso: { type: Date, default: null },
  criadoPor:    { type: String, default: 'superadmin' },
}, { timestamps: true });

// Hash da senha antes de salvar
AtendenteSchema.pre('save', async function(next) {
  if (!this.isModified('senha')) return next();
  this.senha = await bcrypt.hash(this.senha, 12);
  next();
});

AtendenteSchema.methods.verificarSenha = function(senha) {
  return bcrypt.compare(senha, this.senha);
};

export default mongoose.model('Atendente', AtendenteSchema);
