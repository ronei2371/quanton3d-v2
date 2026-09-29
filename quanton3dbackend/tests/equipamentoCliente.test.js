import test from 'node:test';
import assert from 'node:assert/strict';
import { lerContexto, dadosEquipamento, equipamentoParaResposta } from '../services/equipamentoCliente.js';

const ctx = (texto) => [{ role: 'user', content: texto }, { role: 'assistant', content: 'Contexto registrado.' }];

test('le o contexto que o site envia', () => {
  assert.deepEqual(
    lerContexto(ctx('Contexto: resina IRON, impressora Saturn 4 Ultra, altura camada 0.05mm')),
    { resina: 'IRON', impressora: 'Saturn 4 Ultra', altura: '0.05' },
  );
});

test('"nao informada" e "Nao sei / Outra" nao viram equipamento', () => {
  assert.deepEqual(
    lerContexto(ctx('Contexto: resina não informada, impressora Não sei / Outra, altura camada 0.05mm')),
    { resina: '', impressora: '', altura: '0.05' },
  );
  assert.deepEqual(lerContexto([{ role: 'user', content: 'oi' }]), {});
});

test('grava resina detectada e impressora com o nome da lista do site', () => {
  const set = dadosEquipamento({ contexto: { resina: 'IRON', impressora: 'Saturn 4 Ultra', altura: '0.05' }, resinaDetectada: 'IRON', impressoraDetectada: 'saturn 4 ultra' });
  assert.equal(set.resinaAtual, 'IRON');
  assert.equal(set.impressoraAtual, 'Saturn 4 Ultra');
  assert.equal(set.alturaAtual, '0.05');
  assert.ok(set.equipamentoEm instanceof Date);
});

test('cliente fala de outra impressora na conversa: grava a nova', () => {
  const set = dadosEquipamento({ contexto: { impressora: 'Saturn 4 Ultra' }, impressoraDetectada: 'mars 5 ultra' });
  assert.equal(set.impressoraAtual, 'mars 5 ultra');
});

test('sem nada informado nao grava nada (nao apaga o que ja tinha)', () => {
  assert.deepEqual(dadosEquipamento({ contexto: {} }), {});
});

test('resposta do historico usa o cadastro e completa com as conversas', () => {
  assert.deepEqual(equipamentoParaResposta({ resinaAtual: 'SPIN', alturaAtual: '0.05' }, [{ impressoraDetectada: 'mars 4' }, { resinaDetectada: 'IRON' }]),
    { resina: 'SPIN', impressora: 'mars 4', altura: '0.05' });
  assert.equal(equipamentoParaResposta({}, []), null);
});
