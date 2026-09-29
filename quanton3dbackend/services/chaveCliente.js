// Chave secreta do cliente. Antes, quem soubesse o codigo (clienteId) de um cliente lia o
// historico do chat dele, gastava as 15 perguntas dele e, se fosse o codigo do fundador,
// usava a IA sem limite. Agora o cadastro devolve uma chave que so fica no navegador do
// cliente; o banco guarda apenas o hash dela. Chat, historico e contador exigem a chave.
import crypto from 'crypto';
import mongoose from 'mongoose';
import Cliente from '../models/Cliente.js';

export const MAX_CHAVES = 5; // aparelhos ao mesmo tempo (celular, computador...)
export const CABECALHO_CHAVE = 'x-cliente-chave';

export function hashChave(chave) {
  return crypto.createHash('sha256').update(String(chave || '')).digest('hex');
}

export function gerarChave() {
  return crypto.randomBytes(24).toString('base64url');
}

export function ehIdDeCadastro(clienteId) {
  return mongoose.Types.ObjectId.isValid(clienteId) && String(clienteId).length === 24;
}

function mesmoHash(a, b) {
  const x = Buffer.from(String(a || ''), 'hex');
  const y = Buffer.from(String(b || ''), 'hex');
  return x.length === 32 && x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Cria uma chave nova para o cadastro e guarda o hash (mantem as ultimas MAX_CHAVES).
export async function emitirChave(clienteId) {
  const chave = gerarChave();
  await Cliente.updateOne(
    { _id: clienteId },
    { $push: { chavesHash: { $each: [hashChave(chave)], $slice: -MAX_CHAVES } } }
  );
  return chave;
}

export function chaveDoPedido(req) {
  return String(req.headers?.[CABECALHO_CHAVE] || '').trim();
}

// Devolve o cadastro (telefone e equipamento) se a chave confere; senao null.
export async function clienteComChave(clienteId, chave) {
  if (!ehIdDeCadastro(clienteId) || !chave) return null;
  try {
    const cad = await Cliente.findById(clienteId)
      .select('+chavesHash telefone resinaAtual impressoraAtual alturaAtual')
      .lean();
    if (!cad) return null;
    const h = hashChave(chave);
    return (cad.chavesHash || []).some((x) => mesmoHash(x, h)) ? cad : null;
  } catch (_) {
    return null;
  }
}
