import test from 'node:test';
import assert from 'node:assert/strict';
import { detectarLacuna, filtroLacunas, motivoDaConversa, FRASES_SEM_RESPOSTA } from '../services/lacunas.js';

test('resposta com base da Quanton3D nao e lacuna', () => {
  assert.equal(detectarLacuna({ ragUsado: true, resposta: 'Entendi que voce quer os parametros da IRON. Exposicao normal: 1,5 s.' }), '');
});

test('sem nada na base vira sem_base', () => {
  assert.equal(detectarLacuna({ ragUsado: false, guarda: false, resposta: 'Entendi que voce quer saber sobre a cura.' }), 'sem_base');
});

test('guarda de parametros (perfil em revisao) nao conta como sem_base', () => {
  assert.equal(detectarLacuna({ ragUsado: false, guarda: true, resposta: 'Esse perfil esta em revisao.' }), '');
});

test('frases de "nao sei" viram nao_soube, mesmo com RAG', () => {
  assert.equal(detectarLacuna({ ragUsado: true, resposta: 'Nao tenho perfil validado para esta combinacao. Confirme com a equipe pelo WhatsApp.' }), 'nao_soube');
  assert.equal(detectarLacuna({ ragUsado: true, resposta: 'Não tenho um valor oficial Quanton3D para te passar com segurança.' }), 'nao_soube');
  assert.equal(detectarLacuna({ ragUsado: true, resposta: 'Nao consegui gerar uma resposta segura agora.' }), 'nao_soube');
});

test('reescrita numerica que terminou em "nao tenho valor" vira sem_valor_oficial', () => {
  assert.equal(detectarLacuna({ ragUsado: true, reescritaNumerica: true, resposta: 'Nao tenho um valor oficial Quanton3D para te passar com seguranca nesse caso.' }), 'sem_valor_oficial');
});

test('indicar o WhatsApp como opcao normal nao e "nao sei"', () => {
  assert.equal(FRASES_SEM_RESPOSTA.test('Reforce os suportes. Se preferir, fale com a equipe pelo WhatsApp (31) 3271-6935.'), false);
});

test('filtro deixa de fora aprovadas, resolvidas e a homologacao', () => {
  const f = filtroLacunas();
  assert.deepEqual(f.aprovado, { $ne: true });
  assert.deepEqual(f.lacunaResolvida, { $ne: true });
  assert.ok(f.clienteId.$not.test('homologacao-iaq3d-12'));
  assert.equal(f.$or.length, 3);
});

test('motivo de conversa antiga (sem o campo) sai da fonte ou do texto', () => {
  assert.equal(motivoDaConversa({ fonte: 'deepseek', resposta: 'Resposta qualquer' }), 'sem_base');
  assert.equal(motivoDaConversa({ fonte: 'rag+deepseek', resposta: 'Nao tenho perfil validado para esta combinacao.' }), 'nao_soube');
  assert.equal(motivoDaConversa({ lacuna: 'sem_valor_oficial' }), 'sem_valor_oficial');
});
