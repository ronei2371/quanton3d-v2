// Camadas de transicao (Chitubox/Lychee, tipo Linear).
// Regra passada pelo fundador (25/09): comecar com o MESMO numero de camadas de
// transicao que as camadas de base. Os tempos de cada camada de transicao sao so
// a conta linear feita com os numeros do proprio cliente (nao e parametro de resina).

const PERGUNTA_TRANSICAO = /transi[cç][aã]o|transi[cç][oõ]es|transition/i;

function numero(texto) {
  return Number(String(texto).replace(',', '.'));
}

function fmt(valor) {
  return (Math.round(valor * 10) / 10).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
}

// Extrai da mensagem: quantidade de camadas de base e os dois tempos (base e normal).
export function extrairNumerosTransicao(message = '') {
  const t = String(message).toLowerCase();

  let camadasBase = null;
  let baseDepoisDaPalavra = false;
  const mAntes = t.match(/(\d{1,2})\s*camadas?\s*(?:de\s*)?(?:base|fundo|inferior|bottom)/);
  const mDepois = t.match(/(?:camadas?\s*(?:de\s*)?(?:base|bottom)|bottom\s*layers?)\s*(?:=|:)?\s*(\d{1,2})(?![.,]\d)(?!\s*(?:s\b|seg))/);
  if (mAntes) camadasBase = Number(mAntes[1]);
  else if (mDepois) { camadasBase = Number(mDepois[1]); baseDepoisDaPalavra = true; }

  let transicoesPedidas = null;
  const mTrans = t.match(/(\d{1,2})\s*camadas?\s*(?:de\s*)?transi/);
  if (mTrans) transicoesPedidas = Number(mTrans[1]);

  // Tempos: numeros que NAO sao contagem de camadas, altura de camada (mm) ou %
  const candidatos = [];
  const re = /(\d+(?:[.,]\d+)?)(\s*(?:s|seg|segundos?)\b|\s*mm\b|\s*camadas?\b|\s*%)?/g;
  let m;
  while ((m = re.exec(t)) !== null) {
    const sufixo = (m[2] || '').trim();
    if (/^camada|^mm|^%/.test(sufixo)) continue;
    const valor = numero(m[1]);
    // abaixo de 0,3 e altura de camada (0,05 mm), nao tempo
    if (!Number.isFinite(valor) || valor < 0.3 || valor > 300) continue;
    candidatos.push(valor);
  }
  if (baseDepoisDaPalavra) {
    const i = candidatos.indexOf(camadasBase);
    if (i >= 0) candidatos.splice(i, 1);
  }

  let exposicaoBase = null;
  let exposicaoNormal = null;
  if (candidatos.length >= 2) {
    exposicaoBase = Math.max(...candidatos);
    exposicaoNormal = Math.min(...candidatos);
    if (!(exposicaoBase > exposicaoNormal && exposicaoNormal <= 20)) {
      exposicaoBase = null;
      exposicaoNormal = null;
    }
  }

  return { camadasBase, transicoesPedidas, exposicaoBase, exposicaoNormal };
}

export function temposTransicao(exposicaoBase, exposicaoNormal, quantidade) {
  const passo = (exposicaoBase - exposicaoNormal) / (quantidade + 1);
  return { passo, tempos: Array.from({ length: quantidade }, (_, i) => exposicaoBase - passo * (i + 1)) };
}

const QUANDO_AJUSTAR = [
  '**Quando mudar a quantidade:**',
  '- **Mais transições (8 a 10):** peça grande ou pesada que descola logo depois que a base termina. O degrau de cura fica mais suave.',
  '- **Menos transições (0 a 3):** se o pé de elefante incomodar ou o raft ficar duro de soltar, porque a parte de baixo recebe menos cura.',
  '- Se a peça vai em **suportes com raft**, as transições ficam dentro do raft e não aparecem na peça.',
].join('\n');

export function transitionLayerAnswer(message = '') {
  const texto = String(message);
  if (!PERGUNTA_TRANSICAO.test(texto)) return null;
  // So responde quando a pessoa quer saber quantas/qual valor usar (nao sequestra outras duvidas)
  if (!/quant|n[uú]mero|calcul|conta|qual|coloc|usar|uso|devo|config|recomend|\?/i.test(texto)) return null;

  const { camadasBase, transicoesPedidas, exposicaoBase, exposicaoNormal } = extrairNumerosTransicao(message);
  const quantidade = transicoesPedidas || camadasBase || 5;

  const partes = [];
  partes.push('Não existe um número único de camadas de transição: é uma escolha. A recomendação da Quanton3D é **começar com o mesmo número das camadas de base**'
    + (camadasBase ? ` — no seu caso, **${camadasBase} camadas de transição**.` : ' (ex.: 5 camadas de base → 5 de transição).'));

  if (exposicaoBase && exposicaoNormal) {
    const { passo, tempos } = temposTransicao(exposicaoBase, exposicaoNormal, quantidade);
    partes.push(`Com o tipo de transição **Linear**, o fatiador faz a conta sozinho: a exposição desce em degraus iguais da base até a normal.\n`
      + `Passo = (base − normal) ÷ (transições + 1) = (${fmt(exposicaoBase)} − ${fmt(exposicaoNormal)}) ÷ ${quantidade + 1} ≈ **${fmt(passo)} s**.\n`
      + `Com ${quantidade} transições, as camadas ficam em torno de: **${tempos.map(fmt).join(' → ')} s**.`);
  } else {
    partes.push('Com o tipo de transição **Linear**, o fatiador faz a conta sozinho: a exposição desce em degraus iguais da base até a normal.\n'
      + 'Passo = (exposição da base − exposição normal) ÷ (nº de transições + 1). Se você me disser os tempos de base e normal, eu mostro o tempo de cada camada de transição.');
  }

  partes.push(QUANDO_AJUSTAR);
  partes.push('Os tempos de **base** e **normal** devem vir do perfil oficial da sua resina com a sua impressora (página **Parâmetros**); a transição só faz a ponte entre eles.');

  return partes.join('\n\n');
}

export default transitionLayerAnswer;
