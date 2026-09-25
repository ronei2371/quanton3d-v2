import test from "node:test";
import assert from "node:assert/strict";
import { dadosNovaSugestao, dadosAtualizacaoSugestao } from "../services/sugestaoConhecimento.js";

test("admin com aprovarDireto cria já aprovado", () => {
  const { dados, erro } = dadosNovaSugestao({ categoria: "dica", titulo: "  Camadas de transição ", conteudo: " Use o mesmo número das camadas de base. ", aprovarDireto: true }, { tipo: "superadmin" });
  assert.equal(erro, undefined);
  assert.equal(dados.status, "aprovado");
  assert.equal(dados.titulo, "Camadas de transição");
  assert.equal(dados.conteudo, "Use o mesmo número das camadas de base.");
  assert.equal(dados.codigoAtendente, "ADMIN");
});

test("atendente nunca aprova direto e usa o próprio código", () => {
  const { dados } = dadosNovaSugestao({ titulo: "t", conteudo: "c", aprovarDireto: true, codigoAtendente: "OUTRO" }, { tipo: "atendente", cod: "AT01", nome: "Ana" });
  assert.equal(dados.status, undefined);
  assert.equal(dados.codigoAtendente, "AT01");
  assert.equal(dados.nomeAtendente, "Ana");
});

test("sem aprovarDireto o admin cria pendente (comportamento antigo)", () => {
  const { dados } = dadosNovaSugestao({ titulo: "t", conteudo: "c" }, { tipo: "superadmin" });
  assert.equal(dados.status, undefined);
});

test("valida campos vazios, categoria e tamanho", () => {
  assert.ok(dadosNovaSugestao({ titulo: " ", conteudo: "c" }, { tipo: "superadmin" }).erro);
  assert.ok(dadosNovaSugestao({ titulo: "t", conteudo: "x".repeat(8001) }, { tipo: "superadmin" }).erro);
  assert.equal(dadosNovaSugestao({ titulo: "t", conteudo: "c", categoria: "hack" }, { tipo: "superadmin" }).dados.categoria, "outro");
});

test("aprovar com edição agora grava o texto editado", () => {
  const { dados } = dadosAtualizacaoSugestao({ status: "aprovado", conteudo: " texto novo " });
  assert.equal(dados.conteudo, "texto novo");
  assert.equal(dados.status, "aprovado");
  assert.equal("observacaoAdmin" in dados, false);
});

test("atualização rejeita status inválido e conteúdo vazio", () => {
  assert.ok(dadosAtualizacaoSugestao({ status: "x" }).erro);
  assert.ok(dadosAtualizacaoSugestao({ status: "aprovado", conteudo: "  " }).erro);
  assert.equal(dadosAtualizacaoSugestao({ status: "rejeitado", observacaoAdmin: "removido" }).dados.observacaoAdmin, "removido");
});
