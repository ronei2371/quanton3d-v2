// models/LogAcao.js — Auditoria completa de todas as ações dos atendentes
import mongoose from 'mongoose';

const LogAcaoSchema = new mongoose.Schema({
  // Quem fez
  tipo:         { type: String, enum: ['superadmin', 'atendente'], required: true },
  atendenteId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Atendente', default: null },
  atendenteCod: { type: String, default: 'SUPERADMIN' },
  atendenteNome:{ type: String, default: 'Super Admin' },

  // O que fez
  acao:     { type: String, required: true }, // ex: 'LOGIN', 'VER_CLIENTES', 'MUDAR_STATUS_CHAMADO'
  modulo:   { type: String, required: true }, // ex: 'clientes', 'chamados', 'mensagens'
  detalhe:  { type: String, default: '' },    // ex: 'Status alterado para RESOLVIDO no chamado #123'
  alvo:     { type: String, default: '' },    // ID do item afetado
  bloqueada:{ type: Boolean, default: false }, // Ação foi bloqueada por falta de permissão?
  
  // Contexto técnico
  ip:       { type: String, default: '' },
  userAgent:{ type: String, default: '' },
}, { timestamps: true });

// Index para busca rápida por atendente e data
LogAcaoSchema.index({ atendenteId: 1, createdAt: -1 });
LogAcaoSchema.index({ modulo: 1, createdAt: -1 });
LogAcaoSchema.index({ bloqueada: 1, createdAt: -1 });

export default mongoose.model('LogAcao', LogAcaoSchema);
