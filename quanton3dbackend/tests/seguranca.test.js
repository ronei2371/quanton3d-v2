import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import jwt from 'jsonwebtoken';
import { authAdminCompleto } from '../middlewares/authAdmin.js';
import { criarLimite } from '../middlewares/limiteTaxa.js';

process.env.ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'segredo-de-teste';

function resposta() {
  const r = { statusCode: 200, body: null, headers: {} };
  r.status = (c) => { r.statusCode = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  return r;
}

test('ADM completo: sem token 401, token falso 401, administrador passa', async () => {
  let passou = false;
  const semToken = resposta();
  await authAdminCompleto({ headers: {} }, semToken, () => { passou = true; });
  assert.equal(semToken.statusCode, 401);

  const falso = resposta();
  await authAdminCompleto({ headers: { authorization: 'Bearer ' + jwt.sign({ user: 'x', role: 'superadmin' }, 'outro-segredo') } }, falso, () => { passou = true; });
  assert.equal(falso.statusCode, 401);
  assert.equal(passou, false);

  const adm = resposta();
  await authAdminCompleto({ headers: { authorization: 'Bearer ' + jwt.sign({ user: 'adm', role: 'superadmin' }, process.env.ADMIN_JWT_SECRET) } }, adm, () => { passou = true; });
  assert.equal(passou, true);
});

test('token sem papel (nem administrador nem atendente) e barrado', async () => {
  let passou = false;
  const r = resposta();
  await authAdminCompleto({ headers: { authorization: 'Bearer ' + jwt.sign({ qualquer: 1 }, process.env.ADMIN_JWT_SECRET) } }, r, () => { passou = true; });
  assert.equal(passou, false);
  assert.equal(r.statusCode, 403);
});

test('nenhuma rota confere o token sozinha (sem checar o papel)', () => {
  // Antes, varias rotas faziam so jwt.verify: qualquer atendente passava no ADM.
  for (const nome of readdirSync(new URL('../routes/', import.meta.url))) {
    const fonte = readFileSync(new URL('../routes/' + nome, import.meta.url), 'utf8');
    const verificacoes = fonte.match(/jwt\.verify\(/g) || [];
    if (nome === 'admin.js') {
      assert.equal(verificacoes.length, 1, 'admin.js so pode ter o jwt.verify do soAdmin');
      assert.match(fonte, /role !== 'superadmin'/);
    } else {
      assert.equal(verificacoes.length, 0, `${nome} deve usar o middleware central de autorizacao`);
    }
  }
});

test('limpeza de dados e backup: so o administrador', () => {
  const fonte = readFileSync(new URL('../routes/admin.js', import.meta.url), 'utf8');
  assert.match(fonte, /router\.delete\('\/limpar-testes', soAdmin/);
  assert.match(fonte, /router\.get\('\/backup', soAdmin/);
});

test('limite de tentativas: bloqueia depois do maximo, por IP', () => {
  const limite = criarLimite({ nome: 't', max: 3, janelaMs: 60000 });
  const pedido = (ip) => ({ ip, headers: {} });
  let passou = 0;
  for (let i = 0; i < 3; i++) limite(pedido('1.1.1.1'), resposta(), () => { passou += 1; });
  const quarta = resposta();
  limite(pedido('1.1.1.1'), quarta, () => { passou += 1; });
  assert.equal(passou, 3);
  assert.equal(quarta.statusCode, 429);
  let outroIp = false;
  limite(pedido('2.2.2.2'), resposta(), () => { outroIp = true; });
  assert.equal(outroIp, true);
});

test('cadastro nao devolve o cadastro de outra pessoa so pelo e-mail', () => {
  const fonte = readFileSync(new URL('../controllers/clientesController.js', import.meta.url), 'utf8');
  assert.doesNotMatch(fonte, /\$regex/);
  assert.match(fonte, /soDigitos\(existente\.telefone\) === soDigitos\(telefone\)/);
});

test('IP: usa o CF-Connecting-IP (Cloudflare) e ignora o X-Forwarded-For do visitante', async () => {
  const { ipDoPedido } = await import('../middlewares/limiteTaxa.js');
  assert.equal(ipDoPedido({ headers: { 'cf-connecting-ip': '200.1.1.1', 'x-forwarded-for': '9.9.9.9' }, ip: '10.0.0.1' }), '200.1.1.1');
  assert.equal(ipDoPedido({ headers: { 'x-forwarded-for': '9.9.9.9' }, ip: '10.0.0.1' }), '10.0.0.1');
});
