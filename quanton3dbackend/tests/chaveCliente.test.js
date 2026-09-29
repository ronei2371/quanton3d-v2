import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gerarChave, hashChave, ehIdDeCadastro, chaveDoPedido, clienteComChave } from '../services/chaveCliente.js';

const ler = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('chave do cliente: aleatoria, longa e guardada so como hash', () => {
  const a = gerarChave();
  const b = gerarChave();
  assert.notEqual(a, b);
  assert.ok(a.length >= 32);
  assert.match(hashChave(a), /^[0-9a-f]{64}$/);
  assert.notEqual(hashChave(a), hashChave(b));
  assert.match(ler('models/Cliente.js'), /chavesHash:.*select:false/);
});

test('chave do cliente: so codigo de cadastro de 24 caracteres exige chave', async () => {
  assert.equal(ehIdDeCadastro('0123456789abcdef01234567'), true);
  assert.equal(ehIdDeCadastro('homologacao-iaq3d-1'), false);
  assert.equal(chaveDoPedido({ headers: { 'x-cliente-chave': ' abc ' } }), 'abc');
  assert.equal(await clienteComChave('0123456789abcdef01234567', ''), null);
  assert.equal(await clienteComChave('homologacao-iaq3d-1', 'x'), null);
});

test('chat, historico e contador conferem a chave antes de usar o codigo do cliente', () => {
  const chat = ler('routes/chat.js');
  assert.doesNotMatch(chat, /telefoneDoCadastro/);
  // Os tres pontos publicos que recebem clienteId conferem a chave.
  assert.equal((chat.match(/clienteComChave\(clienteId, chaveDoPedido\(req\)\)/g) || []).length, 3);
  assert.match(chat, /chaveInvalida: true/);
});

test('cadastro devolve a chave e a rota de chave exige codigo + telefone com limite', () => {
  const ctrl = ler('controllers/clientesController.js');
  assert.equal((ctrl.match(/emitirChave\(/g) || []).length, 3);
  assert.match(ctrl, /soDigitos\(cad\.telefone\) !== telefone/);
  assert.match(ler('routes/clientes.js'), /router\.post\('\/:id\/chave', emitirChaveCliente\)/);
  assert.match(ler('server.js'), /app\.post\("\/api\/clientes\/:id\/chave", limiteChave\)/);
});
