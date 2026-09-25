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
