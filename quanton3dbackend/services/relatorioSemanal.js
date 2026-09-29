// Relatorio da semana do ADM: agrupa as perguntas do bot por assunto (defeito, parametro,
// indicacao...), conta resinas/impressoras citadas e resume o suporte da semana.
// Nao usa IA: so le o que ja esta no banco.

export const TEMAS = [
  { id: 'aderencia', rotulo: 'Peça não gruda / descola', re: /(nao|n) ?(grud\w*|ader\w*|col(ou|a|ava)|fix(a|ou))|descol|soltou|soltando|solta da plataforma|caiu no tanque|ficou no (fep|filme)|plataforma limpa|aderen|base (nao|n) (pega|gruda)/ },
  { id: 'camadas', rotulo: 'Camadas separando / linhas', re: /delamin|camadas? (separ|abrindo|abriu|soltando)|linhas? (na|nas|entre|horizonta)|marcas? (na|nas|entre) camada|layer|deslocamento de camada|camada deslocada/ },
  { id: 'medida', rotulo: 'Medida / encaixe', re: /medida|dimens|encaixe|encaix|toleranc|furo|encolh|contra[cç]|gabarito|pino|(saiu|ficou|esta|está) (menor|maior)/ },
  { id: 'acabamento', rotulo: 'Lavagem / pós-cura / aspecto', re: /pegajos|grudent|melad|branc|opac|esbranqui|amarel|lavag|lavar|lavei|p[oó]s.?cura|curar|cura uv|alcool|isopropil|solvente/ },
  { id: 'empeno', rotulo: 'Empenamento / deformação', re: /empen|torto|torta|entort|warp|deform|curvou|curvando/ },
  { id: 'suporte', rotulo: 'Suportes', re: /suporte/ },
  { id: 'quebra', rotulo: 'Quebra / resistência', re: /quebr|trinc|rach|fragil|resisten|flexib|dureza/ },
  { id: 'maquina', rotulo: 'Impressora / FEP / tela', re: /\bfep\b|filme|\btela\b|\blcd\b|nivel|fuso|eixo ?z|\bcuba\b|luz uv|\bled\b/ },
  { id: 'parametros', rotulo: 'Parâmetros de impressão', re: /parametr|par[aâ]metro|exposi|tempo de (cura|exposi)|camadas? (de )?base|perfil|lift|velocidade|altura de camada|transi[cç]/ },
  { id: 'indicacao', rotulo: 'Qual resina usar', re: /qual resina|melhor resina|indica|recomend|serve (pra|para)|qual (usar|uso)|para (miniatura|joia|dente|odont)|misturar/ },
  { id: 'seguranca', rotulo: 'Segurança / cheiro / descarte', re: /cheiro|odor|ventila|mascara|máscara|luva|toxic|t[oó]xic|pele|alergi|descart|biocompat/ },
];

export const TEMA_OUTROS = { id: 'outros', rotulo: 'Outros assuntos' };

function normalizar(texto) {
  return String(texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function classificarPergunta(texto) {
  const t = normalizar(texto);
  const tema = TEMAS.find((x) => x.re.test(t));
  return tema ? tema.id : TEMA_OUTROS.id;
}

// Janela de 7 dias. semana=0: os ultimos 7 dias ate agora; 1: os 7 dias antes disso...
export function periodoSemana(semana = 0, agora = new Date()) {
  const n = Math.max(0, Math.min(52, Number.parseInt(semana, 10) || 0));
  const fim = new Date(agora.getTime() - n * 7 * 86400000);
  const inicio = new Date(fim.getTime() - 7 * 86400000);
  return { inicio, fim, semana: n };
}

// Conta valores repetidos (ignora vazios) e devolve os mais citados.
export function ranking(valores = [], limite = 8, normalizarValor = (v) => v) {
  const mapa = new Map();
  for (const v of valores) {
    const chave = normalizarValor(String(v || '').trim());
    if (!chave || /^(n[aã]o (sei|informad[ao])|outra|-)/i.test(chave)) continue;
    mapa.set(chave, (mapa.get(chave) || 0) + 1);
  }
  return [...mapa.entries()].map(([nome, total]) => ({ nome, total })).sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome)).slice(0, limite);
}

export function nomeImpressora(v) {
  return String(v || '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

export function nomeResina(v) {
  return String(v || '').trim().toUpperCase().replace(/\s+/g, ' ');
}

// Agrupa as perguntas por tema, com ate 2 exemplos recentes (sem repetir texto).
export function temasDasPerguntas(conversas = []) {
  const grupos = new Map();
  for (const c of conversas) {
    const id = classificarPergunta(c.pergunta);
    if (!grupos.has(id)) grupos.set(id, { total: 0, exemplos: [] });
    const g = grupos.get(id);
    g.total += 1;
    const texto = String(c.pergunta || '').trim().slice(0, 160);
    if (g.exemplos.length < 2 && texto.length > 8 && !g.exemplos.includes(texto)) g.exemplos.push(texto);
  }
  const rotulos = Object.fromEntries([...TEMAS, TEMA_OUTROS].map((t) => [t.id, t.rotulo]));
  return [...grupos.entries()]
    .map(([id, g]) => ({ id, rotulo: rotulos[id], total: g.total, exemplos: g.exemplos }))
    .sort((a, b) => (a.id === 'outros') - (b.id === 'outros') || b.total - a.total);
}

export function variacao(atual, anterior) {
  if (!anterior) return atual ? null : 0;
  return Math.round(((atual - anterior) / anterior) * 100);
}
