import test from 'node:test';
import assert from 'node:assert/strict';
import { itemPublicoGaleria } from '../services/galleryPublic.js';

const base = {
  _id: 'x1', nome: 'Carol', telefone: '31999999999', email: 'carol@exemplo.com', clienteId: 'c1',
  resina: 'IRON', impressora: 'Saturn 3 Ultra', imagem: 'data:image/jpeg;base64,AAA', observacao: 'ok',
  parametros: { exposicaoNormal: '2 s' }, redesSociais: { tiktok: '@carolottolini', instagram: '' },
  status: 'aprovado',
};

test('galeria publica nunca expoe telefone, e-mail ou id do cliente', () => {
  for (const autoriza of [true, false]) {
    const p = itemPublicoGaleria({ ...base, autorizaDivulgacao: autoriza });
    assert.equal(p.telefone, undefined);
    assert.equal(p.email, undefined);
    assert.equal(p.clienteId, undefined);
    assert.equal(p.status, undefined);
    assert.equal(p.resina, 'IRON');
  }
});

test('credito (nome e redes) so aparece com autorizacao', () => {
  const sem = itemPublicoGaleria({ ...base, autorizaDivulgacao: false });
  assert.equal(sem.autor, undefined);
  assert.equal(sem.redesSociais, undefined);
  const com = itemPublicoGaleria({ ...base, autorizaDivulgacao: true });
  assert.equal(com.autor, 'Carol');
  assert.deepEqual(com.redesSociais, { tiktok: '@carolottolini' });
});

test('a foto nao vai embutida: sai o endereco, nunca o base64', () => {
  const p = itemPublicoGaleria(base);
  assert.equal(p.imagem, undefined, 'o base64 nao pode sair na listagem');
  assert.match(p.imagemUrl, /^\/gallery\/x1\/imagem\?v=\d+$/);
});

test('endereco da foto muda quando o item e atualizado (cache do navegador)', () => {
  const antes = itemPublicoGaleria({ ...base, updatedAt: new Date('2026-10-01T00:00:00Z') });
  const depois = itemPublicoGaleria({ ...base, updatedAt: new Date('2026-10-06T00:00:00Z') });
  assert.notEqual(antes.imagemUrl, depois.imagemUrl);
  assert.ok(antes.imagemUrl.endsWith(String(new Date('2026-10-01T00:00:00Z').getTime())));
});

test('listagem sem base64 (temImagem da agregacao) continua gerando o endereco', () => {
  const { imagem, ...semBase64 } = base; // eslint-disable-line no-unused-vars
  const p = itemPublicoGaleria({ ...semBase64, temImagem: true });
  assert.match(p.imagemUrl, /^\/gallery\/x1\/imagem\?v=/);
});

test('peca sem foto nao ganha endereco de foto', () => {
  const { imagem, ...semFoto } = base; // eslint-disable-line no-unused-vars
  assert.equal(itemPublicoGaleria(semFoto).imagemUrl, undefined);
  assert.equal(itemPublicoGaleria({ ...semFoto, imagem: '' }).imagemUrl, undefined);
  assert.equal(itemPublicoGaleria({ ...semFoto, temImagem: false }).imagemUrl, undefined);
});
