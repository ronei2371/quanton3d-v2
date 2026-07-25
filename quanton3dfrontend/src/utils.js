/* Utilitarios compartilhados entre componentes Quanton3D */

export function limparTexto(valor) { return String(valor || "").trim(); }

export function corrigirNomeResina(nome) {
  return limparTexto(nome)
    .replace(/^FERRO\s*70\/30\b/i, "IRON 70/30")
    .replace(/^FERRO\s*7030\b/i, "IRON 7030")
    .replace(/^FERRO\b/i, "IRON")
    .replace(/^Iron\b/i, "IRON")
    .replace(/^iron\b/i, "IRON");
}

export function chaveResina(nome) { return corrigirNomeResina(nome).toUpperCase(); }

export function formatarDataHora(data) {
  if (!data) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(data));
}

export function escaparHtml(texto) {
  const mapa = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return texto.replace(/[&<>"']/g, (c) => mapa[c]);
}

export function formatarMarkdown(texto) {
  const seguro = escaparHtml(texto);
  return seguro
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code style="background:rgba(255,255,255,0.12);padding:2px 6px;border-radius:4px;font-size:0.88em">$1</code>')
    .replace(/\n{2,}/g, '</p><p style="margin:8px 0">')
    .replace(/\n/g, "<br/>");
}

export const RESINAS_BOT = [
  "ALCHEMIST","IRON","IRON 70/30","FLEXFORM","ATHOM DENTAL","ATHOM ALINHADORES",
  "ATHOM WASHABLE","POSEIDON","PYROBLAST","VULCAN CAST","SPIN","SPARK","LOW SMELL","VELVET SKIN","Nao sei / Outra"
];

export const CAMPOS_CONFIGURACAO_GALERIA = [
  { name: "alturaCamada", label: "Altura camada", placeholder: "Ex.: 0,050 mm" },
  { name: "camadasBase", label: "Camadas de base", placeholder: "Ex.: 4" },
  { name: "exposicaoNormal", label: "Tempo exposicao", placeholder: "Ex.: 2,100 s" },
  { name: "exposicaoBase", label: "Tempo exposicao base", placeholder: "Ex.: 37,000 s" },
  { name: "contagemTransicao", label: "Contagem de transicao", placeholder: "Ex.: 0" },
  { name: "tipoTransicao", label: "Tipo de transicao", placeholder: "Ex.: Linear" },
  { name: "retardoDesligarUV", label: "Retardo desligar UV", placeholder: "Ex.: 2,000 s" },
  { name: "distElevacaoInferior", label: "Dist. elevacao inferior", placeholder: "Ex.: 11,000 mm" },
  { name: "distElevacao", label: "Distancia elevacao", placeholder: "Ex.: 11,000 mm" },
  { name: "distRetracao", label: "Distancia de retracao", placeholder: "Ex.: 11,000 mm" },
  { name: "velElevacaoInferior", label: "Vel. elevacao inferior", placeholder: "Ex.: 140,000 mm/min" },
  { name: "velElevacao", label: "Vel. elevacao", placeholder: "Ex.: 140,000 mm/min" },
  { name: "velRetracaoInferior", label: "Vel. retracao inferior", placeholder: "Ex.: 135,000 mm/min" },
  { name: "velRetracao", label: "Vel. retracao", placeholder: "Ex.: 135,000 mm/min" },
];

export function criarConfiguracaoVazia() {
  return CAMPOS_CONFIGURACAO_GALERIA.reduce((acc, campo) => { acc[campo.name] = ""; return acc; }, {});
}
