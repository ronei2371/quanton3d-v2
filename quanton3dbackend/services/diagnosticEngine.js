import mongoose from "mongoose";

const PROBLEM_CATALOG = [
  {
    category: "cura_acabamento",
    title: "Problemas de Cura e Acabamento",
    items: [
      {
        id: "peca_branca_opaca",
        label: "Peças ficando brancas / opacas após cura UV",
        kind: "processo",
        keywords: ["branca", "opaca", "esbranquiçada", "white", "cura uv", "alcool", "lavagem"],
        guidedQuestions: [
          "Você deixou o álcool evaporar completamente antes da cura UV?",
          "Qual o tempo de cura UV que está usando?",
          "As peças ficam brancas em toda superfície ou só em pontos?",
          "Qual a pureza do álcool usado?",
          "Quantas vezes você reutiliza o álcool de lavagem?"
        ],
        technicalFields: ["tempoCuraUv", "secagemAntesCura", "alcoolPureza", "alcoolReuso"],
        causes: [
          "Álcool residual na superfície antes da cura UV.",
          "Álcool de lavagem saturado ou com baixa pureza.",
          "Tempo de cura UV acima do necessário."
        ],
        checklist: [
          "Deixe a peça secar completamente antes da cura UV.",
          "Troque ou filtre o álcool se ele já estiver muito reutilizado.",
          "Reduza o tempo de cura e teste em ciclos curtos."
        ],
        prevention: [
          "Padronize lavagem, secagem e cura em etapas curtas.",
          "Mantenha dois banhos: álcool sujo e álcool limpo."
        ]
      },
      {
        id: "resina_nao_cura_bem",
        label: "Resina não cura bem (fica mole, pegajosa ou borracha)",
        kind: "parametro",
        keywords: ["mole", "pegajosa", "borracha", "nao cura", "sticky", "soft"],
        guidedQuestions: [
          "A resina foi bem agitada antes do uso?",
          "Temperatura ambiente da sala?",
          "A resina está nova ou velha?"
        ],
        technicalFields: ["exposicaoNormal", "exposicaoBase", "camadasBase", "temperaturaAmbiente", "resinaCondicao"],
        causes: [
          "Exposição abaixo do necessário.",
          "Resina fria, mal homogeneizada ou envelhecida.",
          "Pós-cura insuficiente."
        ],
        checklist: [
          "Agite bem a resina antes de usar.",
          "Aqueça levemente o ambiente se a sala estiver fria.",
          "Aumente a exposição em pequenos passos e repita um teste curto."
        ],
        prevention: [
          "Armazene a resina longe de luz e calor excessivo.",
          "Registre parâmetros que funcionaram por resina e impressora."
        ]
      },
      {
        id: "cura_irregular",
        label: "Cura irregular (algumas partes curam, outras não)",
        kind: "processo",
        keywords: ["cura irregular", "cura desigual", "algumas partes", "nao cura em partes"],
        guidedQuestions: [
          "A peça tem áreas grossas e finas?",
          "Você usa filtro UV na cabine de cura?",
          "Distância entre a peça e a lâmpada UV?"
        ],
        technicalFields: ["tempoCuraUv"],
        causes: [
          "Distribuição irregular da luz UV.",
          "Geometria da peça com áreas espessas ou sombreadas.",
          "Tempo de cura inadequado para o volume da peça."
        ],
        checklist: [
          "Gire a peça durante a cura para expor todas as faces.",
          "Ajuste a distância da peça até a fonte UV.",
          "Faça cura em duas etapas curtas em vez de uma longa."
        ],
        prevention: ["Padronize distância e tempo por tamanho de peça."]
      },
      {
        id: "amarelada_pos_cura",
        label: "Peças amareladas ou com cor alterada após cura",
        kind: "processo",
        keywords: ["amarelada", "amarela", "mudou cor", "alterou cor", "yellowing"],
        guidedQuestions: [
          "Quanto tempo está curando?",
          "A peça ficou muito perto da fonte UV?",
          "A peça passou muito tempo ao sol?"
        ],
        technicalFields: ["tempoCuraUv"],
        causes: [
          "Sobrecura UV.",
          "Fonte UV muito próxima ou muito forte.",
          "Exposição prolongada ao sol."
        ],
        checklist: [
          "Reduza o tempo de cura.",
          "Afaste a peça da fonte UV.",
          "Evite exposição ao sol após a cura."
        ],
        prevention: ["Padronize o tempo de cura por resina e tamanho de peça."]
      },
      {
        id: "superficie_rugosa_laranja",
        label: "Superfície rugosa ou com textura de laranja",
        kind: "processo",
        keywords: ["rugosa", "textura de laranja", "casca de laranja", "granulada"],
        guidedQuestions: [
          "A peça foi bem lavada antes da cura?",
          "A resina estava homogênea?",
          "A temperatura do ambiente estava baixa?"
        ],
        technicalFields: ["exposicaoNormal", "temperaturaAmbiente"],
        causes: [
          "Lavagem insuficiente.",
          "Resina mal misturada.",
          "Exposição inadequada ou ambiente frio."
        ],
        checklist: [
          "Lave melhor a peça antes da cura.",
          "Agite bem a resina.",
          "Reavalie o tempo de exposição e a temperatura do ambiente."
        ],
        prevention: ["Mantenha a resina homogênea e a lavagem padronizada."]
      }
    ]
  },
  {
    category: "adesao_suportes",
    title: "Problemas de Adesão e Suportes",
    items: [
      {
        id: "peca_soltando_suportes",
        label: "Peças soltando dos suportes durante a impressão",
        kind: "parametro",
        keywords: ["solta do suporte", "soltando dos suportes", "suporte soltou", "fell off supports"],
        guidedQuestions: [
          "A peça está reta ou com angulação?",
          "Qual diâmetro dos suportes?",
          "A peça é grande, pesada ou tem overhangs grandes?"
        ],
        technicalFields: ["exposicaoNormal", "diametroSuporte", "contatoSuporte", "angulacaoPeca", "momentoFalha", "localFalha", "liftSpeed"],
        causes: [
          "Suportes subdimensionados para o peso da peça.",
          "Orientação ruim aumentando a força de peel.",
          "Exposição normal insuficiente."
        ],
        checklist: [
          "Aumente diâmetro e densidade dos suportes.",
          "Reoriente a peça para reduzir força de peel.",
          "Reveja a exposição normal da combinação."
        ],
        prevention: ["Sempre revise suportes em regiões pesadas e overhangs."]
      },
      {
        id: "falha_adesao_plataforma",
        label: "Falha de adesão na plataforma (primeiras camadas não grudam)",
        kind: "parametro",
        keywords: ["nao gruda", "adesao", "primeiras camadas", "base nao cola", "plataforma"],
        guidedQuestions: [
          "Você fez nivelamento recentemente?",
          "A plataforma está limpa e sem resíduos?",
          "Quantas camadas base está usando?",
          "Temperatura ambiente?"
        ],
        technicalFields: ["exposicaoBase", "camadasBase", "alturaCamada", "temperaturaAmbiente", "nivelamentoRecente", "momentoFalha"],
        causes: [
          "Tempo de base insuficiente.",
          "Plataforma desnivelada ou contaminada.",
          "Temperatura baixa da sala ou da resina."
        ],
        checklist: [
          "Refaça o nivelamento da plataforma.",
          "Limpe bem a plataforma e o tanque.",
          "Aumente tempo e/ou quantidade de camadas base."
        ],
        prevention: ["Revise nivelamento periodicamente.", "Evite imprimir com resina fria."]
      },
      {
        id: "suportes_frageis",
        label: "Suportes muito frágeis ou quebrando facilmente",
        kind: "parametro",
        keywords: ["suportes frageis", "quebrando suportes", "fragile supports"],
        guidedQuestions: [
          "Densidade de suportes?",
          "Velocidade de elevação da impressora?",
          "A peça tem muitos overhangs?"
        ],
        technicalFields: ["exposicaoNormal", "diametroSuporte", "contatoSuporte", "liftSpeed", "angulacaoPeca"],
        causes: [
          "Diâmetro ou densidade de suportes insuficiente.",
          "Velocidade de elevação alta demais para a peça.",
          "Peça pesada demais para os suportes escolhidos."
        ],
        checklist: [
          "Aumente o diâmetro e a densidade dos suportes.",
          "Reduza a velocidade de elevação em testes curtos.",
          "Reoriente a peça para reduzir carga nos suportes."
        ],
        prevention: ["Padronize presets de suporte por tamanho e peso da peça."]
      },
      {
        id: "marcas_profundas_suportes",
        label: "Suportes deixando marcas profundas na peça",
        kind: "processo",
        keywords: ["marcas profundas", "suportes marcam", "cicatriz"],
        guidedQuestions: [
          "Qual o tamanho das pontas de contato?",
          "A peça foi orientada para esconder marcas?",
          "Você remove os suportes antes ou depois da cura?"
        ],
        technicalFields: ["contatoSuporte", "angulacaoPeca"],
        causes: [
          "Pontas de contato grandes demais.",
          "Orientação ruim deixando marcas em área visível.",
          "Remoção tardia, com a peça já muito rígida."
        ],
        checklist: [
          "Reduza o tamanho das pontas de contato.",
          "Reoriente a peça para esconder marcas.",
          "Remova suportes antes da cura total, com cuidado."
        ],
        prevention: ["Faça testes com presets de suporte para acabamento."]
      },
      {
        id: "delaminacao_camadas",
        label: "Delaminação de camadas (camadas se separando)",
        kind: "parametro",
        keywords: ["delaminacao", "camadas se separando", "layer separation"],
        guidedQuestions: [
          "Velocidade de elevação?",
          "Temperatura da resina?"
        ],
        technicalFields: ["exposicaoNormal", "liftSpeed", "temperaturaAmbiente", "alturaCamada"],
        causes: [
          "Exposição baixa ou ambiente frio.",
          "Velocidade de elevação inadequada.",
          "Tensão mecânica entre camadas."
        ],
        checklist: [
          "Aumente a exposição normal em pequenos passos.",
          "Revise a velocidade de elevação.",
          "Garanta temperatura estável da resina."
        ],
        prevention: ["Evite grandes variações de temperatura."]
      }
    ]
  },
  {
    category: "impressao",
    title: "Problemas durante a Impressão",
    items: [
      {
        id: "bolhas_ou_furos",
        label: "Peças com bolhas ou furos internos",
        kind: "parametro",
        keywords: ["bolhas", "furos", "bubbles", "holes"],
        guidedQuestions: [
          "Bolhas aparecem na resina ou só durante impressão?",
          "Você agita bem a resina antes de usar?",
          "Resina nova ou reutilizada por muito tempo?"
        ],
        technicalFields: ["temperaturaAmbiente", "resinaCondicao", "exposicaoNormal"],
        causes: [
          "Resina mal misturada ou com bolhas incorporadas.",
          "Resina reutilizada por muito tempo.",
          "Fluxo de resina ruim por baixa temperatura."
        ],
        checklist: [
          "Misture a resina e deixe descansar alguns minutos.",
          "Filtre a resina se houver partículas.",
          "Aqueça levemente o ambiente se estiver frio."
        ],
        prevention: ["Evite agitação agressiva imediatamente antes da impressão."]
      },
      {
        id: "resina_vazando_lcd",
        label: "Resina vazando pela tela LCD",
        kind: "hardware",
        keywords: ["vazando", "vazamento", "lcd", "fep rasgado", "leak"],
        guidedQuestions: [
          "O tanque está bem encaixado?",
          "A tela FEP está danificada?",
          "Você apertou demais os parafusos?"
        ],
        technicalFields: [],
        causes: [
          "FEP perfurado ou mal tensionado.",
          "Tanque mal encaixado.",
          "Dano físico no conjunto do tanque."
        ],
        checklist: [
          "Pare a impressão imediatamente.",
          "Remova o tanque e inspecione o FEP.",
          "Não volte a imprimir até limpar e reparar a área."
        ],
        prevention: ["Inspecione o FEP a cada troca de tanque ou falha séria."]
      },
      {
        id: "impressao_para_no_meio",
        label: "Impressão parando no meio",
        kind: "processo",
        keywords: ["parando no meio", "parou no meio", "travou", "freeze"],
        guidedQuestions: [
          "A energia está estável?",
          "O arquivo foi fatiado novamente?",
          "O pendrive/cartão está íntegro?",
          "A impressora mostra algum erro na tela?"
        ],
        technicalFields: [],
        causes: [
          "Arquivo corrompido ou mídia defeituosa.",
          "Travamento da impressora.",
          "Falha de energia ou instabilidade."
        ],
        checklist: [
          "Refatie o arquivo e exporte novamente.",
          "Troque pendrive/cartão.",
          "Verifique mensagens de erro na impressora."
        ],
        prevention: ["Use mídia confiável e mantenha firmware estável."]
      },
      {
        id: "peca_deformada_derretida",
        label: "Peças saindo deformadas ou derretidas",
        kind: "parametro",
        keywords: ["deformada", "derretida", "warped", "melted"],
        guidedQuestions: [
          "A peça tem paredes finas?",
          "Como foi a pós-cura?",
          "A temperatura ambiente estava alta?"
        ],
        technicalFields: ["exposicaoNormal", "exposicaoBase", "alturaCamada", "temperaturaAmbiente"],
        causes: [
          "Exposição ou pós-cura inadequada.",
          "Geometria muito fina sem suporte adequado.",
          "Temperatura alta causando deformação."
        ],
        checklist: [
          "Revise exposição normal e base.",
          "Reforce a peça com melhor orientação e suportes.",
          "Reduza a intensidade da pós-cura."
        ],
        prevention: ["Padronize o pós-processo para peças finas."]
      },
      {
        id: "resina_muito_viscosa",
        label: "Resina muito viscosa / difícil de fluir",
        kind: "processo",
        keywords: ["viscosa", "grossa", "dificil de fluir", "fria"],
        guidedQuestions: [
          "A resina ficou parada por muito tempo?",
          "Você agitou bem antes de usar?"
        ],
        technicalFields: ["temperaturaAmbiente", "resinaCondicao"],
        causes: [
          "Temperatura baixa.",
          "Resina parada por muito tempo.",
          "Pigmento sedimentado."
        ],
        checklist: [
          "Aqueça levemente o ambiente ou a resina.",
          "Agite e homogenize bem antes do uso.",
          "Faça um teste curto antes da peça final."
        ],
        prevention: ["Armazene a resina em temperatura estável."]
      }
    ]
  },
  {
    category: "configuracao_manutencao",
    title: "Problemas de Configuração e Manutenção",
    items: [
      {
        id: "nivelamento_plataforma",
        label: "Problemas de nivelamento da plataforma",
        kind: "hardware",
        keywords: ["nivelamento", "plataforma desnivelada", "leveling"],
        guidedQuestions: [
          "Qual método você usa (papel, home, sensor)?",
          "A tela LCD está limpa?",
          "A plataforma tem arranhões ou marcas?",
          "Qual erro aparece na tela?"
        ],
        technicalFields: [],
        causes: [
          "Procedimento de nivelamento incorreto.",
          "Resíduo entre plataforma e LCD.",
          "Folga mecânica ou aperto irregular."
        ],
        checklist: [
          "Limpe LCD e plataforma.",
          "Refaça o nivelamento com o método correto para a máquina.",
          "Aperte os parafusos em cruz e teste novamente."
        ],
        prevention: ["Revise nivelamento a cada poucas impressões ou após impactos."]
      },
      {
        id: "lcd_manchas",
        label: "Tela LCD com manchas ou marcas permanentes",
        kind: "hardware",
        keywords: ["manchas na lcd", "marcas na lcd", "lcd queimada", "ghost", "burn in"],
        guidedQuestions: [
          "As manchas aparecem no teste de exposição da tela?",
          "Houve vazamento de resina?",
          "A mancha afeta toda impressão ou só partes?",
          "A tela já foi limpa com produto agressivo?"
        ],
        technicalFields: [],
        causes: [
          "Resina vazada ou curada sobre a LCD ou no protetor.",
          "Dano permanente na LCD, no polarizador ou no protetor da tela.",
          "Marca visível no teste de exposição indicando dano físico ou desgaste óptico."
        ],
        checklist: [
          "Faça o teste de exposição da tela sem o tanque para ver se a marca aparece diretamente na LCD.",
          "Confirme se a mancha está apenas no protetor/película ou se aparece na própria LCD.",
          "Se a mancha aparece no teste da LCD, não trate como sujeira: programe a troca da LCD ou do conjunto afetado.",
          "Se estiver somente no protetor/película, substitua o protetor antes de voltar a imprimir.",
          "Não raspe, não force limpeza e não use produto agressivo sobre a tela."
        ],
        prevention: [
          "Nunca imprima após vazamento sem revisar a área da LCD.",
          "Use protetor de tela adequado e substitua a película quando houver dano."
        ]
      },
      {
        id: "resina_cristalizando",
        label: "Resina cristalizando ou endurecendo no tanque",
        kind: "processo",
        keywords: ["cristalizando", "endurecendo no tanque", "resina dura", "solidificando"],
        guidedQuestions: [
          "A resina ficou exposta à luz ambiente?",
          "A temperatura estava muito baixa?",
          "Houve mistura com resina diferente?"
        ],
        technicalFields: ["temperaturaAmbiente", "resinaCondicao"],
        causes: [
          "Exposição indevida à luz.",
          "Temperatura baixa demais.",
          "Contaminação ou mistura de resinas."
        ],
        checklist: [
          "Filtre a resina e descarte partes solidificadas.",
          "Evite deixar o tanque exposto à luz.",
          "Não misture resinas diferentes sem teste controlado."
        ],
        prevention: ["Armazene e manipule a resina em ambiente controlado."]
      },
      {
        id: "cheiro_forte_fumaca",
        label: "Cheiro muito forte ou fumaça durante impressão",
        kind: "hardware",
        keywords: ["cheiro forte", "fumaça", "fumaca", "smoke", "odor forte"],
        guidedQuestions: [
          "O ambiente está ventilado?",
          "Há aquecimento anormal na impressora?",
          "Alguma peça eletrônica está aquecendo demais?"
        ],
        technicalFields: [],
        causes: [
          "Ventilação insuficiente.",
          "Aquecimento anormal de componentes.",
          "Problema elétrico ou eletrônico."
        ],
        checklist: [
          "Interrompa a impressão se houver fumaça real.",
          "Ventile o ambiente imediatamente.",
          "Inspecione fonte, placa e ventoinhas antes de usar novamente."
        ],
        prevention: ["Faça manutenção preventiva e nunca ignore fumaça real."]
      },
      {
        id: "linhas_horizontais_ruins",
        label: "Impressões saindo com linhas horizontais ruins",
        kind: "hardware",
        keywords: ["linhas horizontais", "banding", "layer lines", "riscas horizontais"],
        guidedQuestions: [
          "A haste do eixo Z está limpa e lubrificada?",
          "Há folga mecânica no eixo?"
        ],
        technicalFields: ["alturaCamada", "exposicaoNormal"],
        causes: [
          "Problema mecânico no eixo Z.",
          "Altura de camada ou exposição inadequada.",
          "Folga mecânica ou falta de lubrificação."
        ],
        checklist: [
          "Limpe e lubrifique o eixo Z.",
          "Verifique folga mecânica.",
          "Reavalie altura de camada e exposição."
        ],
        prevention: ["Inclua manutenção do eixo Z na rotina periódica."]
      }
    ]
  },
  {
    category: "outros",
    title: "Outros",
    items: [
      {
        id: "outro_problema",
        label: "Outros problemas",
        kind: "processo",
        keywords: [],
        guidedQuestions: [
          "Descreva o problema em detalhes.",
          "Qual impressora?",
          "Qual resina?",
          "Quais parâmetros está usando?",
          "Pode enviar foto?"
        ],
        technicalFields: ["exposicaoNormal", "exposicaoBase", "camadasBase", "alturaCamada", "temperaturaAmbiente"],
        causes: ["Problema ainda não classificado com segurança."],
        checklist: ["Descreva com mais detalhes e envie foto, se possível."],
        prevention: ["Registre a combinação e o sintoma para análise futura."]
      }
    ]
  }
];

function normalizeText(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueStrings(values = []) {
  return [...new Set(values.filter(Boolean).map((item) => String(item).trim()))];
}

function toNumber(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).replace(",", ".").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function flattenProblemCatalog() {
  return PROBLEM_CATALOG.flatMap((group) =>
    group.items.map((item) => ({
      ...item,
      category: group.category,
      categoryTitle: group.title,
    }))
  );
}

function scoreProblem(problem, inputText) {
  const haystack = normalizeText(inputText);
  if (!haystack) return 0;

  let score = 0;
  const labelText = normalizeText(problem.label);
  if (labelText && haystack.includes(labelText)) score += 10;

  for (const keyword of problem.keywords || []) {
    const word = normalizeText(keyword);
    if (word && haystack.includes(word)) score += 4;
  }

  return score;
}

function detectProblem(problemInput, descriptionInput) {
  const catalog = flattenProblemCatalog();
  const combined = `${problemInput || ""} ${descriptionInput || ""}`.trim();

  let best = null;
  for (const item of catalog) {
    const score = scoreProblem(item, combined);
    if (!best || score > best.score) best = { ...item, score };
  }

  if (!best || best.score <= 0) {
    return catalog.find((item) => item.id === "outro_problema");
  }

  return best;
}

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getParametrosCollection() {
  return mongoose.connection.db.collection("parametros");
}

async function findBestParameterMatch({ detectedProblem, resina, impressora }) {
  const relevant = new Set([
    "resina_nao_cura_bem",
    "peca_soltando_suportes",
    "falha_adesao_plataforma",
    "suportes_frageis",
    "delaminacao_camadas",
    "bolhas_ou_furos",
    "peca_deformada_derretida"
  ]);

  if (!detectedProblem || !relevant.has(detectedProblem.id)) return null;
  if (!resina || !impressora) return null;

  const collection = await getParametrosCollection();

  const exact = await collection.findOne({
    resina: { $regex: `^${escapeRegex(String(resina).trim())}$`, $options: "i" },
    impressora: { $regex: `^${escapeRegex(String(impressora).trim())}$`, $options: "i" },
  });
  if (exact) return exact;

  const partial = await collection.findOne({
    resina: { $regex: escapeRegex(String(resina).trim()), $options: "i" },
    impressora: { $regex: escapeRegex(String(impressora).trim()), $options: "i" },
  });
  return partial || null;
}

function addExposureInsights(problemId, tech, parameterMatch, causes, checklist, used) {
  const normal = toNumber(tech.exposicaoNormal);
  const base = toNumber(tech.exposicaoBase);
  const layers = toNumber(tech.camadasBase);
  const refNormal = toNumber(parameterMatch?.exposicaoNormal);
  const refBase = toNumber(parameterMatch?.exposicaoBase);
  const refLayers = toNumber(parameterMatch?.camadasBase);

  if (normal !== null) used.push("Exposição normal");
  if (base !== null) used.push("Exposição base");
  if (layers !== null) used.push("Camadas base");

  if (problemId === "peca_soltando_suportes" || problemId === "suportes_frageis" || problemId === "delaminacao_camadas" || problemId === "resina_nao_cura_bem") {
    if (refNormal !== null && normal !== null) {
      if (normal < refNormal * 0.9) {
        causes.push(`Sua exposição normal (${normal}s) está abaixo da referência (${refNormal}s).`);
        checklist.push("Aumente a exposição normal em pequenos passos e teste novamente.");
      } else if (normal > refNormal * 1.15) {
        causes.push(`Sua exposição normal (${normal}s) está acima da referência (${refNormal}s), o que pode endurecer demais a peça.`);
        checklist.push("Reduza a exposição normal em pequenos passos e compare o resultado.");
      }
    } else if (normal !== null && normal < 1.5) {
      causes.push(`A exposição normal informada (${normal}s) parece baixa para falha de suporte/delaminação.`);
      checklist.push("Teste aumentar a exposição normal de forma gradual.");
    }
  }

  if (problemId === "falha_adesao_plataforma") {
    if (refBase !== null && base !== null && base < refBase * 0.9) {
      causes.push(`Sua exposição base (${base}s) está abaixo da referência (${refBase}s).`);
      checklist.push("Aumente a exposição base e repita um teste curto de adesão.");
    } else if (base !== null && base < 20) {
      causes.push(`A exposição base informada (${base}s) parece baixa para adesão na plataforma.`);
      checklist.push("Teste aumentar a exposição base em etapas.");
    }

    if (refLayers !== null && layers !== null && layers < refLayers) {
      causes.push(`Você está usando menos camadas base (${layers}) do que a referência (${refLayers}).`);
      checklist.push("Aumente a quantidade de camadas base.");
    } else if (layers !== null && layers < 5) {
      causes.push("A quantidade de camadas base parece baixa para garantir adesão.");
      checklist.push("Use mais camadas base para o teste.");
    }
  }
}

function addSupportInsights(problemId, tech, causes, checklist, used) {
  const diametro = normalizeText(tech.diametroSuporte);
  const contato = normalizeText(tech.contatoSuporte);
  const angulacao = normalizeText(tech.angulacaoPeca);
  const localFalha = normalizeText(tech.localFalha);
  const momentoFalha = normalizeText(tech.momentoFalha);

  if (diametro) used.push("Diâmetro do suporte");
  if (contato) used.push("Contato do suporte");
  if (angulacao) used.push("Angulação da peça");
  if (localFalha) used.push("Onde o problema aparece");
  if (momentoFalha) used.push("Momento da falha");

  if (problemId === "peca_soltando_suportes" || problemId === "suportes_frageis") {
    if (diametro.includes("fino")) {
      causes.push("Os suportes informados parecem finos para esse tipo de falha.");
      checklist.push("Use suportes mais robustos nas regiões críticas.");
    }
    if (contato.includes("baixo") || contato.includes("pequeno") || contato.includes("pouco")) {
      causes.push("A profundidade/contato do suporte parece baixa.");
      checklist.push("Aumente a profundidade de contato dos suportes.");
    }
    if (angulacao.includes("reta") || angulacao.includes("sem angulo")) {
      causes.push("A peça pode estar pouco angulada, aumentando a força de peel.");
      checklist.push("Reoriente a peça com mais angulação para reduzir esforço.");
    }
    if (momentoFalha.includes("meio")) {
      causes.push("Falha no meio da impressão costuma indicar carga excessiva, peel alto ou suporte insuficiente.");
    }
    if (localFalha.includes("suporte")) {
      causes.push("O problema foi identificado na região de suporte, reforçando falha estrutural de suporte.");
    }
  }
}

function addProcessInsights(problemId, tech, causes, checklist, used) {
  const temp = normalizeText(tech.temperaturaAmbiente);
  const nivelamento = normalizeText(tech.nivelamentoRecente);
  const resina = normalizeText(tech.resinaCondicao);
  const tempoCuraUv = toNumber(tech.tempoCuraUv);
  const secagem = normalizeText(tech.secagemAntesCura);
  const alcoolPureza = normalizeText(tech.alcoolPureza);
  const alcoolReuso = normalizeText(tech.alcoolReuso);

  if (temp) used.push("Temperatura ambiente");
  if (nivelamento) used.push("Nivelamento recente");
  if (resina) used.push("Condição da resina");
  if (tempoCuraUv !== null) used.push("Tempo de cura UV");
  if (secagem) used.push("Secagem antes da cura");
  if (alcoolPureza) used.push("Pureza do álcool");
  if (alcoolReuso) used.push("Reuso do álcool");

  if (problemId === "falha_adesao_plataforma") {
    if (temp.includes("abaixo") || temp.includes("fria") || temp.includes("20")) {
      causes.push("Temperatura ambiente baixa prejudica a adesão inicial.");
      checklist.push("Aqueça levemente o ambiente ou a resina antes do teste.");
    }
    if (nivelamento.includes("nao") || nivelamento.includes("não")) {
      causes.push("Nivelamento desatualizado aumenta a chance de falha nas primeiras camadas.");
      checklist.push("Refaça o nivelamento antes do próximo teste.");
    }
  }

  if (problemId === "resina_nao_cura_bem" || problemId === "bolhas_ou_furos") {
    if (resina.includes("usada") || resina.includes("velha")) {
      causes.push("A resina informada não está nova, o que pode piorar a falha.");
      checklist.push("Filtre a resina ou teste com resina nova.");
    }
    if (temp.includes("abaixo") || temp.includes("fria")) {
      causes.push("Ambiente frio reduz a resposta da resina.");
      checklist.push("Faça um teste com a resina em temperatura mais estável.");
    }
  }

  if (problemId === "peca_branca_opaca") {
    if (secagem.includes("nao") || secagem.includes("não") || secagem.includes("parcial")) {
      causes.push("A peça possivelmente entrou na cura UV ainda com álcool residual.");
      checklist.push("Seque completamente a peça antes da cura UV.");
    }
    if (tempoCuraUv !== null && tempoCuraUv > 8) {
      causes.push(`O tempo de cura UV informado (${tempoCuraUv} min) parece alto para esse sintoma.`);
      checklist.push("Reduza o tempo de cura UV e repita o teste.");
    }
    if (alcoolPureza.includes("95") || alcoolPureza.includes("menor")) {
      causes.push("A pureza do álcool pode estar baixa para uma lavagem limpa.");
      checklist.push("Prefira álcool de alta pureza para a lavagem final.");
    }
    if (alcoolReuso.includes("muitas")) {
      causes.push("Álcool muito reutilizado favorece manchas e opacidade.");
      checklist.push("Troque o álcool ou use lavagem em duas etapas.");
    }
  }
}

function buildUsedFieldsSummary(used) {
  return uniqueStrings(used).slice(0, 12);
}

function buildProbableCauses({ detectedProblem, tech, parameterMatch }) {
  const causes = [...(detectedProblem?.causes || [])];
  const checklist = [...(detectedProblem?.checklist || [])];
  const used = [];

  addExposureInsights(detectedProblem?.id, tech, parameterMatch, causes, checklist, used);
  addSupportInsights(detectedProblem?.id, tech, causes, checklist, used);
  addProcessInsights(detectedProblem?.id, tech, causes, checklist, used);

  return {
    causes: uniqueStrings(causes).slice(0, 6),
    checklist: uniqueStrings(checklist).slice(0, 8),
    usedFields: buildUsedFieldsSummary(used),
  };
}

function buildPreventionTips({ detectedProblem }) {
  return uniqueStrings(detectedProblem?.prevention || []).slice(0, 4);
}

function countRelevantInputs(problem, tech, guidedAnswers) {
  const fields = new Set(problem?.technicalFields || []);
  let count = 0;

  for (const key of fields) {
    if (String(tech?.[key] || "").trim()) count += 1;
  }

  for (const value of Object.values(guidedAnswers || {})) {
    if (String(value || "").trim()) count += 1;
  }

  return count;
}

function buildConfidence({ detectedProblem, parameterMatch, relevantInputs, problem, description }) {
  let score = 45;

  if (detectedProblem && detectedProblem.id !== "outro_problema") score += 20;
  if (parameterMatch) score += 10;
  if (problem) score += 5;
  if (description && String(description).trim().length >= 15) score += 5;

  score += Math.min(relevantInputs * 2, 10);

  if (detectedProblem?.kind === "hardware") score += 5;
  if (detectedProblem?.id === "outro_problema") score -= 10;

  return Math.max(35, Math.min(95, score));
}

function buildFinalAnswer({
  detectedProblem,
  probableCauses,
  checklist,
  preventionTips,
  parameterMatch,
  confidence,
  usedFields,
  relevantInputs,
}) {
  const parts = [];
  parts.push(`Diagnóstico provável: ${detectedProblem?.label || "Problema não classificado"} (${confidence}% de confiança).`);

  if (usedFields.length > 0) {
    parts.push(`Entradas consideradas: ${usedFields.join(", ")}.`);
  } else if ((detectedProblem?.technicalFields || []).length > 0) {
    parts.push("Entradas consideradas: descrição principal e seleção do problema. Os campos técnicos não foram preenchidos o suficiente para refinar mais a análise.");
  }

  if (probableCauses.length > 0) {
    parts.push(`Causas mais prováveis: ${probableCauses.join(" ")}`);
  }

  if (parameterMatch) {
    parts.push(
      `Parâmetro de referência encontrado para ${parameterMatch.resina} em ${parameterMatch.impressora}: altura ${parameterMatch.alturaCamada}, exposição normal ${parameterMatch.exposicaoNormal}, exposição base ${parameterMatch.exposicaoBase}, camadas base ${parameterMatch.camadasBase}.`
    );
  }

  if (checklist.length > 0) {
    parts.push(`O que testar agora: ${checklist.join(" ")}`);
  }

  if (detectedProblem?.id === "lcd_manchas") {
    parts.push("Conclusão prática: mancha permanente que aparece no teste da LCD não se corrige com limpeza; a solução é troca da LCD, do polarizador ou do protetor afetado, conforme onde o dano estiver.");
  }

  if (detectedProblem?.kind === "hardware") {
    parts.push("O que não adianta tentar: trocar resina, mexer em tempo de base ou alterar exposição não resolve dano físico de LCD, vazamento, eixo, ventilação ou falha elétrica.");
  }

  if ((detectedProblem?.technicalFields || []).length > 0 && relevantInputs === 0 && detectedProblem?.kind === "parametro") {
    parts.push("Atenção: como os parâmetros técnicos ficaram em branco, esta resposta ainda é inicial. Preencher exposição, camadas, suporte ou temperatura melhora bastante a precisão.");
  }

  if (preventionTips.length > 0) {
    parts.push(`Prevenção: ${preventionTips.join(" ")}`);
  }

  return parts.join(" ");
}

export async function diagnoseTechnicalIssue(payload = {}) {
  const problem = String(payload.problem || "").trim();
  const description = String(payload.description || "").trim();
  const resina = String(payload.resina || "").trim();
  const impressora = String(payload.impressora || "").trim();

  const tech = {
    exposicaoNormal: String(payload.exposicaoNormal || "").trim(),
    exposicaoBase: String(payload.exposicaoBase || "").trim(),
    camadasBase: String(payload.camadasBase || "").trim(),
    alturaCamada: String(payload.alturaCamada || "").trim(),
    liftSpeed: String(payload.liftSpeed || "").trim(),
    temperaturaAmbiente: String(payload.temperaturaAmbiente || "").trim(),
    nivelamentoRecente: String(payload.nivelamentoRecente || "").trim(),
    resinaCondicao: String(payload.resinaCondicao || "").trim(),
    momentoFalha: String(payload.momentoFalha || "").trim(),
    localFalha: String(payload.localFalha || "").trim(),
    diametroSuporte: String(payload.diametroSuporte || "").trim(),
    contatoSuporte: String(payload.contatoSuporte || "").trim(),
    angulacaoPeca: String(payload.angulacaoPeca || "").trim(),
    tempoCuraUv: String(payload.tempoCuraUv || "").trim(),
    secagemAntesCura: String(payload.secagemAntesCura || "").trim(),
    alcoolPureza: String(payload.alcoolPureza || "").trim(),
    alcoolReuso: String(payload.alcoolReuso || "").trim(),
  };

  const guidedAnswers = payload.guidedAnswers || {};
  const detectedProblem = detectProblem(problem, description);

  const parameterMatch = await findBestParameterMatch({
    detectedProblem,
    resina,
    impressora,
  });

  const combined = buildProbableCauses({
    detectedProblem,
    tech,
    parameterMatch,
  });

  const preventionTips = buildPreventionTips({ detectedProblem });
  const relevantInputs = countRelevantInputs(detectedProblem, tech, guidedAnswers);
  const confidence = buildConfidence({
    detectedProblem,
    parameterMatch,
    relevantInputs,
    problem,
    description,
  });

  const finalAnswer = buildFinalAnswer({
    detectedProblem,
    probableCauses: combined.causes,
    checklist: combined.checklist,
    preventionTips,
    parameterMatch,
    confidence,
    usedFields: combined.usedFields,
    relevantInputs,
  });

  return {
    detectedProblem: {
      id: detectedProblem?.id || "outro_problema",
      label: detectedProblem?.label || "Outros problemas",
      category: detectedProblem?.category || "outros",
      categoryTitle: detectedProblem?.categoryTitle || "Outros",
      guidedQuestions: detectedProblem?.guidedQuestions || [],
      technicalFields: detectedProblem?.technicalFields || [],
      kind: detectedProblem?.kind || "processo",
    },
    confidence,
    probableCauses: combined.causes,
    checklist: combined.checklist,
    preventionTips,
    usedFields: combined.usedFields,
    parameterMatch: parameterMatch
      ? {
          resina: parameterMatch.resina || "",
          impressora: parameterMatch.impressora || "",
          alturaCamada: parameterMatch.alturaCamada || "",
          exposicaoNormal: parameterMatch.exposicaoNormal || "",
          exposicaoBase: parameterMatch.exposicaoBase || "",
          camadasBase: parameterMatch.camadasBase || "",
          retardoUV: parameterMatch.retardoUV || "",
          retardoUVBase: parameterMatch.retardoUVBase || "",
          descansoAntesElevacao: parameterMatch.descansoAntesElevacao || "",
          descansoAposElevacao: parameterMatch.descansoAposElevacao || "",
          descansoAposRetracao: parameterMatch.descansoAposRetracao || "",
          potenciaUV: parameterMatch.potenciaUV || "",
        }
      : null,
    knowledgeMatch: null,
    finalAnswer,
    shouldEscalateToAdmin:
      confidence < 60 ||
      detectedProblem?.kind === "hardware" ||
      detectedProblem?.id === "outro_problema",
  };
}

export function getProblemCatalog() {
  return PROBLEM_CATALOG;
}
