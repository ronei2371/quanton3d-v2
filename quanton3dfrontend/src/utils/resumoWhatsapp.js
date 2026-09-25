// Monta o texto que vai pronto para o WhatsApp do suporte quando o cliente pede uma pessoa.
// Assim o técnico já recebe resina, impressora, camada e o que foi conversado,
// e o cliente não precisa repetir nada. Só usa o que o próprio cliente digitou/escolheu.
import { WHATSAPP_SUPORTE_URL } from "../data/contact";

const LIMITE_TOTAL = 1500;
const LIMITE_MENSAGEM = 220;

function limparMarkdown(texto = "") {
  return String(texto)
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function cortar(texto, limite) {
  const t = limparMarkdown(texto);
  return t.length > limite ? t.slice(0, limite - 1).trimEnd() + "…" : t;
}

function informado(valor) {
  const v = String(valor || "").trim();
  return v && !/^n[aã]o sei/i.test(v) && !/n[aã]o informad/i.test(v) ? v : "";
}

export function montarResumoWhatsapp({ cliente = {}, ctx = {}, mensagens = [] } = {}) {
  const linhas = ["Olá! Vim do assistente técnico IAQ3D do site Quanton3D e preciso de ajuda da equipe."];
  if (cliente?.nome) linhas.push(`Nome: ${cliente.nome}`);

  const config = [
    informado(ctx.resina) && `Resina: ${ctx.resina}`,
    informado(ctx.impressora) && `Impressora: ${ctx.impressora}`,
    (informado(ctx.resina) || informado(ctx.impressora)) && ctx.altura && `Camada: ${ctx.altura} mm`,
  ].filter(Boolean);
  if (config.length) linhas.push(config.join(" | "));

  // Mensagens do cliente (as mais recentes), sem as de boas-vindas/contexto do sistema
  const perguntas = mensagens.filter((m) => !m.isBot && String(m.text || "").trim()).slice(-4);
  if (perguntas.length) {
    linhas.push("", "O que eu perguntei:");
    for (const p of perguntas) linhas.push(`- ${cortar(p.text, LIMITE_MENSAGEM)}`);
  }

  const ultimaResposta = [...mensagens].reverse().find((m) => m.isBot && m.conversaId);
  if (ultimaResposta) {
    linhas.push("", `Última orientação do assistente: ${cortar(ultimaResposta.text, 300)}`);
  }

  let texto = linhas.join("\n");
  if (texto.length > LIMITE_TOTAL) texto = texto.slice(0, LIMITE_TOTAL - 1) + "…";
  return texto;
}

export function linkWhatsappComResumo(dados) {
  return `${WHATSAPP_SUPORTE_URL}?text=${encodeURIComponent(montarResumoWhatsapp(dados))}`;
}
