// Diagnostico rapido de falhas (Atendimento > Diagnóstico rápido). Nao usa IA: e uma arvore
// de perguntas com as mesmas regras que a IAQ3D ja segue (prompt do bot, respostas fixas e
// gabarito Quanton3D). Numeros so os oficiais (gabarito e validade). Para mudar um texto,
// edite aqui; cada resultado aponta os guias (chaves de data/guides.js), a calculadora e o
// tipo de problema que ja vem preenchido no chamado tecnico.

export const GABARITO_QUANTON =
  "Gabarito Quanton3D (teste do pino): o alvo é a posição 3. Pino na 1: +0,3 s · na 2: +0,2 s · na 3: não mexa · na 4: −0,2 s · na 5: −0,3 s (sempre na exposição normal).";

export const SINTOMAS = [
  {
    id: "nao_grudou",
    titulo: "A peça não grudou ou caiu no tanque",
    inicio: "o_que_ficou",
    perguntas: {
      o_que_ficou: {
        texto: "O que ficou na plataforma?",
        opcoes: [
          { rotulo: "Nada, a plataforma saiu limpa", proxima: "frio" },
          { rotulo: "A base ficou, mas o modelo ficou grudado no filme (FEP)", resultado: "suporte_fraco" },
        ],
      },
      frio: {
        texto: "O ambiente ou a resina estão frios?",
        opcoes: [
          { rotulo: "Sim, está frio", resultado: "frio" },
          { rotulo: "Não / não sei", resultado: "aderencia" },
        ],
      },
    },
  },
  {
    id: "mesmo_lugar",
    titulo: "Falha sempre no mesmo lugar da plataforma",
    inicio: "posicao",
    perguntas: {
      posicao: {
        texto: "Você já imprimiu a mesma peça em outra posição da plataforma?",
        opcoes: [
          { rotulo: "Ainda não", resultado: "mudar_posicao" },
          { rotulo: "Sim, e a falha continuou no mesmo lugar", resultado: "tela_fep" },
          { rotulo: "Sim, e a falha foi junto com a peça", resultado: "geometria" },
        ],
      },
    },
  },
  {
    id: "camadas",
    titulo: "Linhas marcadas ou camadas separando",
    inicio: "altura",
    perguntas: {
      altura: {
        texto: "A marca aparece sempre na mesma altura, em todas as peças?",
        opcoes: [
          { rotulo: "Sim, sempre na mesma altura", resultado: "mecanica" },
          { rotulo: "Não, muda de lugar", resultado: "processo_camadas" },
        ],
      },
    },
  },
  {
    id: "medida",
    titulo: "Medida ou encaixe errado",
    inicio: "como",
    perguntas: {
      como: {
        texto: "Como saíram as medidas?",
        opcoes: [
          { rotulo: "Menor por fora e furos/encaixes mais largos", resultado: "exp_baixa" },
          { rotulo: "Maior por fora e furos/encaixes apertados", resultado: "exp_alta" },
          { rotulo: "Tudo menor por igual (os furos também apertados)", resultado: "escala" },
          { rotulo: "Certa ao sair da impressora, muda depois da pós-cura", resultado: "contracao" },
        ],
      },
    },
  },
  {
    id: "acabamento",
    titulo: "Peça pegajosa ou branca depois da lavagem/cura",
    inicio: "qual",
    perguntas: {
      qual: {
        texto: "O que aconteceu com a peça?",
        opcoes: [
          { rotulo: "Continua pegajosa", resultado: "pegajosa" },
          { rotulo: "Ficou branca / esbranquiçada", resultado: "branca" },
        ],
      },
    },
  },
  {
    id: "empenou",
    titulo: "Peça empenada ou torta",
    inicio: "quando",
    perguntas: {
      quando: {
        texto: "Ela já sai torta da impressora ou entorta depois?",
        opcoes: [
          { rotulo: "Já sai torta da impressora", resultado: "empeno_impressao" },
          { rotulo: "Entorta depois da pós-cura", resultado: "empeno_cura" },
        ],
      },
    },
  },
  {
    id: "suporte",
    titulo: "Suporte difícil de remover",
    resultadoDireto: "suporte_duro",
  },
  {
    id: "trocou",
    titulo: "Troquei alguma coisa e começou a falhar",
    inicio: "o_que",
    perguntas: {
      o_que: {
        texto: "O que você trocou?",
        opcoes: [
          { rotulo: "O filme (FEP)", resultado: "fep_novo" },
          { rotulo: "A tela LCD", resultado: "tela_nova" },
          { rotulo: "Lote ou frasco novo de resina", resultado: "lote_novo" },
        ],
      },
    },
  },
];

export const RESULTADOS = {
  aderencia: {
    titulo: "Aderência da base na plataforma",
    passos: [
      "Refaça o nivelamento e limpe bem a plataforma (sem resina curada nem gordura).",
      "Confira se a exposição de base e o número de camadas de base são os do perfil oficial Quanton3D da sua resina e impressora.",
      "Veja o estado do filme (FEP) e a temperatura da resina antes de mexer em qualquer exposição.",
    ],
    aviso: "Não aumente a exposição de base às cegas: sucção, elevação rápida ou pouco suporte dão o mesmo sintoma.",
    extra: "Antes de imprimir de novo, tire da cuba os pedaços curados (filtre a resina) para não furar o filme.",
    guias: ["nivelamento"],
    parametros: true,
    chamado: "Peça não adere à plataforma",
  },
  frio: {
    titulo: "Resina ou ambiente frio",
    passos: [
      "Aqueça o ambiente e a resina até a temperatura de trabalho indicada na ficha da resina antes de imprimir.",
      "Agite bem o frasco antes de colocar na cuba.",
      "Se ainda precisar compensar o frio, use a Calculadora de Exposição (ajuste por temperatura) em vez de somar segundos por conta própria.",
    ],
    aviso: "Resina gelada fica mais grossa e cura menos: o primeiro passo é a temperatura, não a exposição.",
    guias: ["nivelamento"],
    calculadora: "exposicao",
    chamado: "Peça não adere à plataforma",
  },
  suporte_fraco: {
    titulo: "Suporte fraco ou força de separação alta",
    passos: [
      "Reforce os suportes nas regiões que ficaram no filme: mais pontos e pontas um pouco mais grossas.",
      "Revise ilhas e a orientação da peça no fatiador.",
      "Reduza a velocidade de elevação. Só depois confira a exposição normal com o perfil oficial.",
    ],
    aviso: "Se a base grudou na plataforma, o problema não é camada base nem nivelamento.",
    extra: "Antes de imprimir de novo, tire da cuba os pedaços curados (filtre a resina) para não furar o filme.",
    guias: ["suportes", "overhangs"],
    parametros: true,
    chamado: "Outro problema",
  },
  mudar_posicao: {
    titulo: "Primeiro passo: mudar a peça de lugar",
    passos: [
      "Imprima a mesma peça em outra posição da plataforma, sem mudar mais nada.",
      "Se a falha continuar no mesmo lugar da plataforma, o problema está na máquina (tela, filme ou cuba).",
      "Se a falha for junto com a peça, o problema está no arquivo (suporte, orientação ou geometria).",
    ],
    aviso: "Nivelamento só é suspeito quando a base não gruda de um lado logo nas primeiras camadas.",
    guias: ["diagnostico"],
    chamado: "Outro problema",
  },
  tela_fep: {
    titulo: "Tela LCD, filme (FEP) ou sujeira na cuba",
    passos: [
      "Filtre a resina e limpe o fundo da cuba: resina curada grudada bloqueia a luz sempre no mesmo ponto.",
      "Veja se o filme está marcado, opaco ou furado naquele ponto.",
      "Faça o teste de tela da impressora para ver se aquela área da LCD acende por igual.",
    ],
    aviso: "No teste de tela use óculos de proteção UV. Nunca olhe a luz UV sem proteção.",
    guias: ["manutencao"],
    chamado: "Tela LCD com manchas",
  },
  geometria: {
    titulo: "Suporte, orientação ou geometria da peça",
    passos: [
      "Reforce os suportes na região que falha.",
      "Mude a orientação para diminuir áreas grandes na mesma camada.",
      "Procure ilhas sem apoio e cavidades fechadas (efeito de sucção).",
    ],
    guias: ["suportes", "overhangs", "succao"],
    chamado: "Outro problema",
  },
  mecanica: {
    titulo: "Parte mecânica (eixo Z)",
    passos: [
      "Confira o fuso e o eixo Z: sujeira, folga e lubrificação conforme o manual da impressora.",
      "Aperte bem a plataforma e a cuba.",
      "Veja se o arquivo tem mudança brusca de seção ou alguma pausa exatamente naquela altura.",
    ],
    aviso: "Impressora de resina não tem correia nem bico: marca sempre na mesma altura é mecânica ou arquivo.",
    guias: ["manutencao"],
    chamado: "Linhas visíveis entre camadas",
  },
  processo_camadas: {
    titulo: "Temperatura, mistura ou força de separação",
    passos: [
      "Agite bem a resina e mantenha na temperatura de trabalho da ficha.",
      "Reforce os suportes e procure sucção em cavidades fechadas.",
      "Reduza a velocidade de elevação.",
    ],
    aviso: "Não altere exposição e velocidade ao mesmo tempo: assim você não descobre qual das duas resolveu.",
    guias: ["velocidade", "succao"],
    chamado: "Delaminação (camadas separando)",
  },
  exp_baixa: {
    titulo: "Exposição normal baixa",
    passos: [
      "Confira se está usando o perfil oficial da sua resina e impressora.",
      "Calibre com o gabarito de encaixe Quanton3D e ajuste conforme o número do pino.",
      "Reimprima o mesmo corpo de prova depois de cada ajuste.",
    ],
    gabarito: true,
    aviso: "Não use escala nem compensação XY para esconder exposição descalibrada.",
    guias: ["calibracao"],
    calculadora: "tolerancia",
    parametros: true,
    chamado: "Outro problema",
  },
  exp_alta: {
    titulo: "Exposição normal alta",
    passos: [
      "Confira se está usando o perfil oficial da sua resina e impressora.",
      "Calibre com o gabarito de encaixe Quanton3D e ajuste conforme o número do pino.",
      "Outros sinais de exposição alta: perda de detalhe fino e suporte difícil de remover.",
    ],
    gabarito: true,
    aviso: "Mude uma coisa por vez e reimprima o mesmo corpo de prova.",
    guias: ["calibracao"],
    calculadora: "tolerancia",
    parametros: true,
    chamado: "Outro problema",
  },
  escala: {
    titulo: "Escala, unidade ou compensação XY (não é exposição)",
    passos: [
      "Confira escala e unidade (mm ou polegada) entre o arquivo e o fatiador.",
      "Veja se já existe compensação XY ativa no fatiador.",
      "Meça a peça antes e depois da pós-cura para ver se ela encolhe só na cura.",
    ],
    aviso: "Exposição baixa deixaria a peça menor por fora, mas abriria os furos. Quando tudo diminui junto, a causa é outra.",
    guias: ["intensidade"],
    calculadora: "encolhimento",
    chamado: "Outro problema",
  },
  contracao: {
    titulo: "Contração na pós-cura",
    passos: [
      "Meça antes e depois da cura para confirmar quanto muda.",
      "Siga o ciclo de pós-cura validado da resina, sem exagerar no tempo ou na potência de UV.",
      "Se a contração for sempre a mesma, compense com a Calculadora de Encolhimento.",
    ],
    guias: ["otimizacao"],
    calculadora: "encolhimento",
    chamado: "Outro problema",
  },
  pegajosa: {
    titulo: "Lavagem, secagem ou pós-cura incompleta",
    passos: [
      "Lave de novo com solvente limpo (o indicado para a sua resina).",
      "Seque a peça por completo antes da pós-cura.",
      "Aplique só o ciclo de pós-cura validado da resina.",
    ],
    aviso: "Aumentar UV sem controle pode esconder o problema. Se continuar, compare com solvente novo.",
    guias: ["otimizacao"],
    chamado: "Outro problema",
  },
  branca: {
    titulo: "Solvente que não secou ou solvente saturado",
    passos: [
      "Seque a peça por completo antes da pós-cura: solvente preso na superfície fica branco com a luz UV.",
      "Troque o solvente se ele estiver sujo ou saturado.",
      "Não deixe a peça de molho no solvente mais tempo que o necessário.",
    ],
    guias: ["otimizacao"],
    chamado: "Peça ficou branca / opaca após cura",
  },
  empeno_impressao: {
    titulo: "Área grande por camada, orientação ou pouco suporte",
    passos: [
      "Incline a peça para diminuir a área de cada camada.",
      "Distribua apoios nas bordas e nas partes planas.",
      "Procure sucção em cavidades fechadas.",
    ],
    aviso: "IRON e 70/30 são mais flexíveis: em asas grandes ou partes finas inclinadas podem entortar.",
    guias: ["suportes", "tensaotermica"],
    chamado: "Warping / empenamento",
  },
  empeno_cura: {
    titulo: "Cura desigual ou tensão na pós-cura",
    passos: [
      "Cure girando ou virando a peça para ela receber luz por igual.",
      "Siga o ciclo de pós-cura validado, sem excesso de UV ou calor.",
      "Peças finas: cure apoiadas numa superfície plana.",
    ],
    guias: ["tensaotermica", "otimizacao"],
    chamado: "Warping / empenamento",
  },
  suporte_duro: {
    titulo: "Contato grande demais ou exposição acima do necessário",
    passos: [
      "Diminua o diâmetro e a profundidade da ponta de contato do suporte.",
      "Confira a exposição normal com o perfil oficial.",
      "Remova os suportes depois de lavar e secar, antes da pós-cura final (quando a resina permitir).",
    ],
    guias: ["contatosuporte"],
    parametros: true,
    chamado: "Suporte difícil de remover",
  },
  fep_novo: {
    titulo: "Filme (FEP) novo mal esticado ou mal preso",
    passos: [
      "Confira se o filme ficou bem esticado, sem rugas e sem vazamento, seguindo o manual da impressora.",
      "Aperte bem a cuba na impressora.",
      "Faça uma peça pequena de teste antes da impressão grande.",
    ],
    guias: ["manutencao"],
    chamado: "FEP danificado",
  },
  tela_nova: {
    titulo: "Tela nova pode ter outra intensidade de luz",
    passos: [
      "Comece pelo perfil oficial da sua resina e impressora.",
      "Refaça a calibração com o gabarito de encaixe Quanton3D e ajuste conforme o número do pino.",
      "Faça o teste de tela para ver se ela acende por igual.",
    ],
    gabarito: true,
    aviso: "No teste de tela use óculos de proteção UV.",
    guias: ["calibracao"],
    parametros: true,
    chamado: "Tela LCD com manchas",
  },
  lote_novo: {
    titulo: "Frasco novo: mistura e conferência do encaixe",
    passos: [
      "Agite muito bem o frasco novo antes de usar (o pigmento assenta no fundo).",
      "Confira o encaixe com o gabarito Quanton3D e só ajuste se o resultado mudar.",
      "Veja a validade no rótulo: 12 meses a partir da fabricação.",
    ],
    gabarito: true,
    guias: ["calibracao"],
    chamado: "Outro problema",
  },
};
