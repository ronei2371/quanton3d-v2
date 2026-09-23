import assert from 'node:assert/strict';
import test from 'node:test';
import { describeAction } from '../services/auditLog.js';

const ID = '66f1a2b3c4d5e6f7a8b9c0d1';

test('descreve acoes do painel ADM', () => {
  assert.deepEqual(describeAction('POST', '/api/admin/login', { user: 'x', password: 'segredo' }), { modulo: 'auth', acao: 'LOGIN', detalhe: '', alvo: '' });
  assert.equal(describeAction('PATCH', `/api/bot-tickets/${ID}/status`, { status: 'fechado' }).detalhe, 'status: fechado');
  assert.equal(describeAction('PATCH', `/api/conversas/${ID}/aprovar`, {}).acao, 'APROVAR');
  assert.equal(describeAction('PATCH', `/api/conversas/${ID}/aprovar`, {}).alvo, ID);
  assert.equal(describeAction('DELETE', `/api/parametros/${ID}`).acao, 'EXCLUIR');
  assert.equal(describeAction('POST', '/api/parametros', { resina: 'IRON', impressora: 'Mars 5' }).detalhe, 'IRON + Mars 5');
  assert.equal(describeAction('DELETE', '/api/admin/limpar-testes', { colecoes: ['conversas', 'clientes'] }).detalhe, 'Colecoes: conversas, clientes');
  assert.equal(describeAction('DELETE', '/api/clientes/lote', { ids: ['a', 'b'] }).detalhe, '2 registro(s)');
});

test('nunca grava senha no detalhe', () => {
  const info = describeAction('PATCH', `/api/atendentes/${ID}/senha`, { senha: 'minhaSenha123' });
  assert.equal(info.acao, 'TROCAR_SENHA');
  assert.doesNotMatch(JSON.stringify(info), /minhaSenha123/);
});

test('ignora rotas publicas e de leitura fora do painel', () => {
  assert.equal(describeAction('POST', '/api/chat', {}), null);
  assert.equal(describeAction('POST', '/api/visitas', {}), null);
});
