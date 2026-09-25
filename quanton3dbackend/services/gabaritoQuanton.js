// Gabarito Quanton3D (teste do pino) — regra oficial do guia de calibracao do site:
// o alvo e a posicao 3 e cada numero contado ate o 3 vale 0,1 s na exposicao NORMAL.
// 1: +0,3 s | 2: +0,2 s | 3: nao altera | 4: -0,2 s | 5: -0,3 s
// Resposta deterministica (conta feita em codigo, nao pelo modelo).

const FALA_DO_GABARITO = /\b(pino|gabarito|calibrador)\b/i;
const POSICAO = /(?:encaix\w*|entr\w*|coube|ficou|deu|parou|posi[cç][aã]o|n[uú]mero|furo)\s*(?:no|na|em|o|a)?\s*(?:posi[cç][aã]o|n[uú]mero|furo)?\s*(?:n[ºo°.]?\s*)?(\d{1,2})\b/i;

const AJUSTES = {
  1: { acao: 'adicionar 0,3 s', caminho: '1 → 2 → 3' },
  2: { acao: 'adicionar 0,2 s', caminho: '2 → 3' },
  3: { acao: null, caminho: '3' },
  4: { acao: 'retirar 0,2 s', caminho: '4 → 3' },
  5: { acao: 'retirar 0,3 s', caminho: '5 → 4 → 3' },
};

export function posicaoDoGabarito(message = '') {
  const t = String(message);
  if (!FALA_DO_GABARITO.test(t)) return null;
  const m = t.match(POSICAO);
  if (!m) return null;
  return Number(m[1]);
}

export function gabaritoAnswer(message = '') {
  const pos = posicaoDoGabarito(message);
  if (pos === null) return null;

  if (!AJUSTES[pos]) {
    return 'Entendi que você fez o teste do pino no gabarito Quanton3D.\n\n'
      + 'O gabarito tem as posições de 1 a 5, e o alvo é a **posição 3**. Me confirma em qual número o pino entrou sem forçar (1, 2, 3, 4 ou 5) que eu te digo o ajuste da exposição normal.';
  }

  if (pos === 3) {
    return 'Entendi que o pino encaixou na posição 3 do gabarito Quanton3D.\n\n'
      + '**Alvo atingido: não altere a exposição normal.** Esse é o seu perfil calibrado para essa resina, cor, impressora e altura de camada. Anote a exposição usada e a temperatura do dia para repetir depois.';
  }

  const a = AJUSTES[pos];
  const sentido = pos < 3
    ? 'O pino entrou abaixo do alvo: a exposição está um pouco baixa.'
    : 'O pino entrou acima do alvo: a exposição está um pouco alta.';
  return `Entendi que o pino encaixou na posição ${pos} do gabarito Quanton3D.\n\n`
    + `${sentido} Pela regra Quanton3D, cada número contado até o 3 vale 0,1 s (${a.caminho}): **${a.acao} na exposição normal**.\n\n`
    + 'Como confirmar:\n'
    + '1. Mude só a exposição normal (não mexa em base, lift nem temperatura nesta rodada).\n'
    + '2. Reimprima o gabarito, lave, seque, faça a pós-cura e espere esfriar.\n'
    + '3. Teste o pino de novo sem forçar, começando pela posição 3.\n\n'
    + 'Quando encaixar no 3, pare de ajustar e anote o perfil (resina, cor, impressora, altura de camada e temperatura). O passo a passo completo está no Guia de Calibração do site.';
}
