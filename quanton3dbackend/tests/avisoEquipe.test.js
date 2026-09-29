import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { montarAviso, detalheChamado, avisarEquipe } from '../services/avisoEquipe.js';

const ler = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('aviso no celular: sem NTFY_TOPIC (ou topico curto/estranho) nao manda nada', async () => {
  assert.equal(montarAviso('chamado', 'x', {}), null);
  assert.equal(montarAviso('chamado', 'x', { NTFY_TOPIC: 'curto' }), null);
  assert.equal(montarAviso('chamado', 'x', { NTFY_TOPIC: 'tem espaco no nome' }), null);
  assert.equal(montarAviso('tipo-que-nao-existe', 'x', { NTFY_TOPIC: 'quanton3d-equipe-123' }), null);
  const antes = process.env.NTFY_TOPIC; delete process.env.NTFY_TOPIC;
  assert.equal(await avisarEquipe('chamado', 'x'), false);
  if (antes !== undefined) process.env.NTFY_TOPIC = antes;
});

test('aviso no celular: chamado vai com assunto, resina e impressora, sem dado pessoal', () => {
  const ticket = { nome: 'Maria Silva', telefone: '31988887777', email: 'm@gmail.com', problema: 'Descolando da plataforma', resina: 'IRON', impressora: 'Saturn 3' };
  const a = montarAviso('chamado', detalheChamado(ticket), { NTFY_TOPIC: 'quanton3d-equipe-123' });
  assert.equal(a.url, 'https://ntfy.sh');
  assert.equal(a.corpo.topic, 'quanton3d-equipe-123');
  assert.equal(a.corpo.title, 'Chamado técnico novo');
  assert.match(a.corpo.message, /Descolando da plataforma · IRON · Saturn 3/);
  const tudo = JSON.stringify(a);
  assert.doesNotMatch(tudo, /Maria|31988887777|m@gmail\.com/);
  assert.equal(detalheChamado({ problema: 'Peça falhou' }), 'Peça falhou · resina não informada · impressora não informada');
});

test('aviso: rotas publicas avisam a equipe e o ADM consulta novidades', () => {
  assert.match(ler('routes/botTickets.js'), /avisarEquipe\("chamado"/);
  assert.match(ler('routes/contactMessages.js'), /avisarEquipe\("mensagem"/);
  assert.match(ler('routes/partnerRequests.js'), /avisarEquipe\("parceria"/);
  assert.match(ler('controllers/formulacoesController.js'), /avisarEquipe\('formulacao'/);
  assert.match(ler('controllers/galleryController.js'), /avisarEquipe\('galeria'/);
  assert.match(ler('routes/admin.js'), /router\.get\('\/novidades', authAdminOuAtendente/);
  // Mensagens: atendente tambem le (o painel do atendente carrega chamados E mensagens).
  assert.match(ler('routes/contactMessages.js'), /router\.get\("\/", authAdminOuAtendente/);
});
