import parametrosLegadoHtml from "../data/parametros-legado.html?raw";

let cacheParametros;

function limparTexto(valor = "") {
  return String(valor).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function extrairResina(titulo = "") {
  return limparTexto(titulo).match(/RESINA\s+(.+?)\s+-\s+/i)?.[1]?.trim() || "";
}

function comSegundos(valor = "") {
  const texto = limparTexto(valor);
  return texto && !/s$/i.test(texto) ? `${texto}s` : texto;
}

function extrairParametros(html) {
  const documento = new DOMParser().parseFromString(html, "text/html");
  const parametros = [];
  let resinaAtual = "";

  documento.querySelectorAll("tr").forEach((linha) => {
    const celulas = [...linha.querySelectorAll("td")].map((celula) => limparTexto(celula.textContent));
    if (!celulas.length) return;

    const textoLinha = celulas.join(" ");
    if (/PAR.{0,5}METROS DE IMPRESS.{0,5}O/i.test(textoLinha)) {
      resinaAtual = extrairResina(celulas[0]);
      return;
    }

    if (
      !resinaAtual ||
      celulas.length < 6 ||
      /MARCA/i.test(celulas[0]) ||
      /MODELO/i.test(celulas[1])
    ) return;

    const [marca, impressora, alturaCamada, camadasBase, exposicaoNormal, exposicaoBase, retardoUV = "", retardoUVBase = "", descansoAntesElevacao = "", descansoAposElevacao = "", descansoAposRetracao = "", potenciaUV = ""] = celulas;

    if (!marca || !impressora || (!alturaCamada && !camadasBase && !exposicaoNormal && !exposicaoBase)) return;

    parametros.push({
      resina: resinaAtual,
      marca,
      impressora,
      alturaCamada,
      camadasBase,
      exposicaoNormal: comSegundos(exposicaoNormal),
      exposicaoBase: comSegundos(exposicaoBase),
      retardoUV,
      retardoUVBase,
      descansoAntesElevacao,
      descansoAposElevacao,
      descansoAposRetracao,
      potenciaUV,
      confianca: "oficial",
      origem: "base-legada",
    });
  });

  return parametros;
}

export async function carregarParametrosFallback() {
  if (!cacheParametros) {
    cacheParametros = extrairParametros(parametrosLegadoHtml);
  }

  return cacheParametros;
}

export function listarResinasFallback(parametros) {
  return [...new Set(parametros.map((item) => item.resina).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function listarImpressorasFallback(parametros) {
  return [...new Set(parametros.map((item) => item.impressora).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
}
