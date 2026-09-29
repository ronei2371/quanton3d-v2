import test from 'node:test';
import assert from 'node:assert/strict';
import { classificarPergunta, periodoSemana, ranking, temasDasPerguntas, nomeImpressora, nomeResina, variacao } from '../services/relatorioSemanal.js';

test('classifica as perguntas mais comuns', () => {
  assert.equal(classificarPergunta('Minha peça não grudou na plataforma'), 'aderencia');
  assert.equal(classificarPergunta('A base ficou mas o modelo ficou no FEP'), 'aderencia');
  assert.equal(classificarPergunta('Camadas separando no meio da peça'), 'camadas');
  assert.equal(classificarPergunta('O encaixe ficou apertado'), 'medida');
  assert.equal(classificarPergunta('Peça ficou branca depois da cura'), 'acabamento');
  assert.equal(classificarPergunta('A peça empenou'), 'empeno');
  assert.equal(classificarPergunta('Suporte difícil de tirar'), 'suporte');
  assert.equal(classificarPergunta('Qual a exposição da IRON na Saturn 4 Ultra?'), 'parametros');
  assert.equal(classificarPergunta('Qual resina para miniatura?'), 'indicacao');
  assert.equal(classificarPergunta('Lowsmell pode usar sem ventilação?'), 'seguranca');
  assert.equal(classificarPergunta('Troquei a tela LCD'), 'maquina');
  assert.equal(classificarPergunta('Bom dia'), 'outros');
});

test('periodo de 7 dias e semanas anteriores', () => {
  const agora = new Date('2026-09-29T12:00:00Z');
  const p0 = periodoSemana(0, agora);
  assert.equal(p0.fim.toISOString(), '2026-09-29T12:00:00.000Z');
  assert.equal(p0.inicio.toISOString(), '2026-09-22T12:00:00.000Z');
  const p1 = periodoSemana(1, agora);
  assert.equal(p1.fim.toISOString(), p0.inicio.toISOString());
  assert.equal(periodoSemana(-3, agora).semana, 0);
});

test('ranking junta nomes iguais e ignora "nao sei"', () => {
  const r = ranking(['saturn 4 ultra', 'Saturn 4 Ultra', 'mars 4', '', 'Não sei / Outra'], 8, nomeImpressora);
  assert.deepEqual(r, [{ nome: 'Saturn 4 Ultra', total: 2 }, { nome: 'Mars 4', total: 1 }]);
  assert.deepEqual(ranking(['iron', 'IRON', 'spin'], 1, nomeResina), [{ nome: 'IRON', total: 2 }]);
});

test('temas com exemplos, "outros" por ultimo', () => {
  const t = temasDasPerguntas([
    { pergunta: 'bom dia tudo bem com voces' },
    { pergunta: 'peça descolou da plataforma' },
    { pergunta: 'peça soltou no meio' },
    { pergunta: 'peça descolou da plataforma' },
  ]);
  assert.equal(t[0].id, 'aderencia');
  assert.equal(t[0].total, 3);
  assert.equal(t[0].exemplos.length, 2);
  assert.equal(t[t.length - 1].id, 'outros');
});

test('variacao em porcentagem', () => {
  assert.equal(variacao(15, 10), 50);
  assert.equal(variacao(5, 10), -50);
  assert.equal(variacao(3, 0), null);
  assert.equal(variacao(0, 0), 0);
});
