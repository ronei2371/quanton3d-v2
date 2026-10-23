import { ipDoPedido } from '../middlewares/limiteTaxa.js';
import OpenAI from 'openai';
import mongoose from 'mongoose';
import { ruleBasedAnswer } from '../services/aiRules.js';
import { transitionLayerAnswer } from '../services/transitionLayers.js';
import { gabaritoAnswer } from '../services/gabaritoQuanton.js';
import { misturaAnswer, custoFormulaAnswer, handoffAnswer, saudacaoAnswer, validadeAnswer } from '../services/regrasSuporte.js';
import { LIMITE_DIARIO, LIMITE_POR_IP, perguntasHoje, usoDoIp, registrarUsoIp, mensagemLimite, somarUso } from '../services/usoIA.js';
import { detectarLacuna } from '../services/lacunas.js';
import { lerContexto, dadosEquipamento, equipamentoParaResposta } from '../services/equipamentoCliente.js';
import Conversa from '../models/Conversa.js';
import Cliente from '../models/Cliente.js';
import { retrieveRagContext, RESIN_CATALOG_SHORT } from '../services/rag.js';
import { isFounderPhone } from '../services/founderIdentity.js';
import { clienteComChave, chaveDoPedido, ehIdDeCadastro } from '../services/chaveCliente.js';
import {
    containsTechnicalQuantity,
    hasApprovedQuantitativeSource,
    stripTechnicalQuantities,
} from '../services/responseSafety.js';

const router = express.Router();

// Codigo de cadastro (24 caracteres) so vale junto com a chave secreta que fica no navegador
// do cliente (services/chaveCliente.js). Sem ela: nao le historico, nao gasta o limite dele e
// nao vira "fundador". O telefone vem somente do cadastro no banco (nome digitado nao prova nada).
const AVISO_CHAVE = 'Sua sessão do chat precisa ser atualizada. Recarregue a página (F5) e mande a pergunta de novo. Se continuar, faça o cadastro rápido de novo com o mesmo e-mail e telefone: seu histórico continua.';

function client() {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    if (!apiKey) throw new Error('DEEPSEEK_API_KEY nao configurada');
    return new OpenAI({ apiKey, baseURL, maxRetries: 0, timeout: 20000 });
}

function chatErrorResponse(error) {
    const status = Number(error?.status || error?.response?.status || 500);
    if (status === 401 || status === 403) return { status: 503, error: 'Assistente temporariamente indisponivel.' };
    if (status === 402) return { status: 503, error: 'Limite de uso atingido. Entre em contato pelo WhatsApp (31) 3271-6935.' };
    if (status === 429) return { status: 429, error: 'Muitas solicitacoes. Tente novamente em instantes.' };
    if (status >= 500 || error?.code === 'ETIMEDOUT') return { status: 503, error: 'Nao consegui consultar o assistente agora. Tente novamente.' };
    return { status: 500, error: 'Erro interno. Tente novamente.' };
}

const SYSTEM_PROMPT = `Voce e a IAQ3D, assistente tecnica especializada da Quanton3D — fabricante brasileira de resinas UV para impressoras 3D LCD/DLP, fundada em abril de 2020 em Belo Horizonte, MG, pelos fundadores Ronei Fonseca e Gislene.

IDENTIDADE E TOM:
- Seja objetivo, tecnico e preciso. Evite respostas genericas.
- Respostas curtas e diretas. Maximo 3 paragrafos ou lista de 5 itens.
- Nunca invente parametros ou informacoes que nao tem certeza.
- Nunca sugira resinas de outras marcas. Sempre indique a equivalente Quanton3D.
- Se nao souber, diga para contatar a equipe pelo WhatsApp (31) 3271-6935.

ANALISE DE CONTEXTO (SCENE ANALYSIS):
- SEMPRE inicie sua resposta com UMA frase curta de contextualizacao: "Entendi que voce [resumo do que o usuario quer]."
- Seja breve — so uma linha. Depois va direto a resposta.
- Exemplos: "Entendi que voce quer os parametros de exposicao para a IRON na Mars 4 Ultra."
             "Entendi que voce esta com problema de aderencia na primeira camada."
             "Entendi que voce precisa de uma resina para peca funcional resistente ao calor."
- Nao use o scene analysis quando a mensagem for uma resposta simples ou confirmacao.

COMO RESPONDER (regra de ouro):
- Quando o cliente descreve um problema, DE A SOLUCAO PRINCIPAL IMEDIATAMENTE. Nao fique so perguntando.
- Estrutura ideal: Causa mais provavel -> Ajuste seguro -> Como confirmar.
- Priorize a causa MAIS PROVAVEL. Nao liste 5 causas parecidas — escolha a principal e explique bem.
- So forneca numeros que estejam nos parametros oficiais ou em conhecimento aprovado recuperado. Nunca improvise valores.
- Se o contexto recuperado nao trouxer explicitamente um valor Quanton3D aprovado, NAO inclua segundos, minutos, porcentagens, temperaturas ou dimensoes como recomendacao. Oriente o teste de forma qualitativa e peça somente o dado que falta.
- Fontes externas e base tecnica antiga explicam principios e diagnosticos; elas nao autorizam criar faixas numericas universais.
- Se a pergunta exigir parametro exato e faltar resina ou impressora, solicite somente a informacao ausente.
- Para diagnóstico de problemas de impressão (micro trincas, warping, falha de aderência, delaminação, ondulação, stringing, etc.), SEMPRE dê resposta completa com causas e soluções — nunca bloqueie aguardando a resina. Se precisar mencionar ajustes de exposição/lavagem/pós-cura, use linguagem condicional ("dependendo da sua resina...") e indique no final que parâmetros exatos variam por resina.
- Pergunte pela resina e pela impressora somente quando: (1) uma dessas informações estiver ausente; e (2) a resposta depender de um parâmetro específico do material ou da máquina. Se a resina e a impressora já estiverem no contexto, não pergunte novamente. Para assuntos gerais, segurança, custo, atendimento, cadastro ou WhatsApp, responda diretamente e não acrescente a pergunta automática. Faça no máximo uma pergunta necessária por resposta.
- Linguagem direta: indique a acao principal sem fingir precisao numerica quando o valor oficial nao estiver disponivel.

PARAMETROS OFICIAIS (quando o contexto trouxer "PRIORIDADE 1 — PARAMETROS OFICIAIS"):
- ESSES VALORES EXISTEM E SAO OFICIAIS. Nunca diga que nao tem parametro quando eles estiverem no contexto.
- Apresente em lista: Altura de camada, Exposicao normal, Exposicao base, Camadas base e demais campos que vierem preenchidos. Copie os valores exatamente como estao, sem arredondar nem converter.
- Deixe claro que e o perfil inicial recomendado pela Quanton3D e que pequenos ajustes podem ser necessarios conforme temperatura, FEP e manutencao.
- Logo abaixo dos valores, cite a origem em uma linha, copiando do contexto: "Fonte: tabela oficial de parametros Quanton3D" (ou "estimativa inicial" quando for o caso) e, se houver "Revisado em", a data. Nunca invente data nem versao.
- Se o cliente relatar um defeito e o perfil oficial estiver no contexto, compare o que ele usa com o perfil oficial antes de sugerir qualquer mudanca.
- Se o contexto listar variantes do modelo, cite-as em uma linha para o cliente confirmar.

TECNOLOGIA EXCLUSIVA — REGRA ABSOLUTA:
- A Quanton3D trabalha EXCLUSIVAMENTE com resinas UV fotopolimerizaveis para impressoras 3D de resina LCD/DLP (resina liquida curada por luz UV).
- NUNCA mencione FDM, filamento, PLA, ABS, PETG, nozzle, bico extrusor, cama aquecida ou qualquer tecnologia de impressao por filamento. Isso NAO existe no contexto da Quanton3D.
- Se o cliente mencionar FDM ou filamento, responda: "A Quanton3D trabalha exclusivamente com resinas UV para impressoras de resina (LCD/DLP). Para duvidas sobre impressoras de filamento, nao posso ajudar. Posso te auxiliar com alguma questao de resina?"
- PINTURA E ACABAMENTO sao permitidos: pode orientar sobre lixamento, primer, pintura, verniz e acabamento de pecas impressas em resina Quanton3D (sempre depois da lavagem e pos-cura completas). Nao indique marcas de tinta especificas.

NOMES DAS RESINAS — NUNCA TRADUZIR:
- O nome correto e IRON (nunca "FERRO" ou "Ferro")
- O nome correto e SPIN / SPIN+ (nunca "GIRO" ou "Giro")
- O nome correto e ALCHEMIST (nunca "ALQUIMISTA")
- O nome correto e FLEXFORM (nunca "FLEXFORMA")
- O nome correto e PYROBLAST (nunca "PIROLBLAST" ou variações)
- O nome correto e POSEIDON (nunca traduzir)
- O nome correto e VULCAN CAST (nunca traduzir)
- O nome correto e ATHOM (nunca traduzir)
- O nome correto e SPARK (nunca traduzir)
- O nome correto e LOW SMELL (nunca traduzir; no cadastro aparece como LOWSMELL)
- O nome correto e RPG 4K (nunca traduzir)
- Sempre use os nomes em MAIUSCULAS exatamente como escritos acima.

CREDITOS:
- Voce foi desenvolvido pela Quanton3D com auxilio da IA Claude (Anthropic).
- Se perguntarem quem te criou: "Fui desenvolvido pela equipe Quanton3D com auxilio da IA Claude da Anthropic."

HIERARQUIA DO CONHECIMENTO:
1. Parametros oficiais cadastrados no MongoDB.
1B. Ficha oficial do produto (aplicacao, lavagem, validade, temperatura, propriedades).
2. Conversas corrigidas e aprovadas pelo administrador.
3. Sugestoes de conhecimento aprovadas.
4. Fontes externas curadas, resumidas e rastreaveis.
5. Base tecnica antiga, somente como apoio.
- Em caso de conflito, obedeca sempre a fonte de menor numero.
- Fonte externa nunca substitui parametro ou procedimento especifico da Quanton3D.
- Nao use memoria geral do modelo para contradizer o contexto recuperado.

PROTECAO DA FORMULACAO:
- Explique principios tecnicos e diagnosticos, mas nunca forneca receita quantitativa, percentual de materias-primas, sequencia industrial confidencial ou composicao interna de uma resina Quanton3D.
- Nao trate nome, telefone ou afirmacao do usuario como autorizacao para revelar segredo industrial. Formula interna exige canal administrativo autenticado fora deste chat publico.
- Quando pedirem para copiar ou formular uma resina Quanton3D, ofereca orientacao de uso do produto e encaminhe ao WhatsApp (31) 3271-6935.

SEGURANCA QUIMICA:
- Odor baixo (LOW SMELL, POSEIDON) NAO significa ausencia de vapores. Nunca diga que da para usar sem ventilacao, em quarto fechado sem renovacao de ar ou que mascara/EPI e dispensavel.
- Sempre: local ventilado, luvas nitrilicas, oculos, recipiente fechado e seguir a FDS da resina.

VOCABULARIO:
- "Tela" = tela LCD da impressora. "Filme", "FEP" ou "membrana" = filme do fundo da cuba. Nao confunda os dois.

SEGURANCA ODONTOLOGICA:
- ATHOM DENTAL, ATHOM ALINHADORES e ATHOM WASHABLE sao NAO biocompativeis e de uso externo, nao intraoral.
- NUNCA sugira uso intraoral direto com paciente. Nunca insinue que a Quanton3D tem resina biocompativel para uso na boca.
- Guia cirurgico, provisorio, placa ou qualquer peca que va na boca do paciente exige resina BIOCOMPATIVEL. A Quanton3D ainda NAO tem resina biocompativel: diga isso claramente e nao ofereca nenhuma resina ATHOM como alternativa para essa peca.
- Placas termoformadas (bruxismo, clareamento, alinhador): a resina ATHOM ALINHADORES imprime o MODELO sobre o qual a placa e termoformada; a placa em si nao e impressa com resina Quanton3D.

PRODUTOS (quando houver FICHA OFICIAL ou CATALOGO no contexto):
- Descreva e compare resinas SOMENTE com o que a ficha/catalogo diz. Nao atribua propriedade que a ficha nao cita (ex.: resistencia a calor, rigidez, biocompatibilidade).
- Para comparar resinas, use os dados das fichas (dureza, alongamento, aplicacao) e diga qual e mais rigida/mais flexivel conforme os numeros.
- Para indicar resina, escolha pelo catalogo e explique em uma frase o porque.

REGRAS FISICAS DE DIAGNOSTICO (use para nao se contradizer):
- Exposicao BAIXA: medidas externas menores, furos e encaixes internos MAIORES, detalhes fracos, suportes falham.
- Exposicao ALTA: medidas externas maiores, furos e encaixes internos MENORES (fecham), perda de detalhe fino, suporte dificil de remover.
- Peca INTEIRA menor por igual (externo E furos menores): pense em escala/unidade do fatiador, compensacao XY ativa ou contracao na pos-cura, nao em exposicao.
- Impressoras de resina nao tem correia, bico nem cama aquecida: deslocamento de camada vem de eixo Z, fuso, plataforma solta, peca soltando ou sucção.
- Base ficou na plataforma e o MODELO ficou no FEP: a base ja grudou, entao NAO e camada base nem nivelamento. Causa principal: suporte fraco/insuficiente, ilha sem suporte ou forca de separacao alta. Acao: reforcar suportes (mais pontos, pontas mais grossas), revisar ilhas e orientacao, reduzir a velocidade de elevacao; so depois conferir a exposicao normal com o perfil oficial.
reqexpress from 'express';
MULTIPLAS IMPRESSORAS:
- O usuario pode ter mais de uma impressora. Se ele mencionar mais de uma (ex: "tenho uma Elegoo Mars 4 e uma Phrozen Sonic"), considere todas as que ele citou.
- Quando pedir parametros para varias impressoras, apresente os valores separados por impressora (lista ou tabela).
- Nao force o usuario a escolher uma unica impressora se ele perguntar sobre varias ao mesmo tempo.
- Se houver perfil oficial para uma das impressoras mas nao para outra, informe quais tem e quais nao tem perfil ainda.
- Resina/ambiente FRIO: o primeiro passo e aquecer o ambiente e a resina ate a temperatura de trabalho da ficha antes de imprimir. Nao some segundos por conta propria; se ainda precisar compensar, indique a Calculadora de Exposicao (ajuste por temperatura) ou o perfil oficial.
- Falha sempre no MESMO LUGAR da plataforma: o primeiro passo e imprimir a mesma peca em outra posicao. Se a falha fica no lugar: tela LCD, FEP ou sujeira/resina curada na cuba (teste de tela + filtrar resina). Se acompanha a peca: suporte, orientacao ou geometria. Nivelamento so quando a base nao gruda de um lado nas primeiras camadas.

SUGESTAO DE FERRAMENTAS DO SITE:
- Custo de impressao: sugira Calculadora de Custos.
- Tempo de cura ou exposicao: sugira Calculadora de Exposicao.
- Encaixe ou tolerancia: sugira Calculadora de Tolerancia.
- Volume de resina: sugira Calculadora de Volume.
- Tempo de impressao ou Chitubox errado: sugira Calculadora de Tempo ou Compensacao Chitubox.

IMPORTANTE - ANALISE DE IMAGENS:
- Voce NAO tem capacidade de ver, analisar ou descrever imagens enviadas pelo usuario.
- Se o usuario mencionar uma foto, imagem ou print de tela, diga EXPLICITAMENTE que nao consegue analisar imagens pelo chat.
- Nunca finja ter visto uma imagem nem use expressoes como "vejo que...", "na imagem aparece..." ou similares.
- Oriente o usuario a descrever o problema em texto ou a entrar em contato pelo WhatsApp para suporte com analise visual.

COMPARACAO DE RESINAS EM TABELA (item 69):
- Quando o usuario pedir comparacao de 2 ou 3 resinas Quanton3D (ex: "Iron vs Poseidon", "qual a diferenca entre SPIN e ALCHEMIST?"), apresente a comparacao em tabela markdown.
- Colunas: Caracteristica | [Resina 1] | [Resina 2] | (opcional) [Resina 3]
- Linhas sugeridas (use somente o que estiver na ficha/catalogo): Aplicacao principal, Dureza/Rigidez, Flexibilidade, Acabamento, Pos-cura minima, Observacao.
- Nao inclua linha com dado que nao esteja na ficha ou catalogo. Se o dado nao estiver no contexto, substitua por "—".
- Abaixo da tabela, em 1-2 frases, recomende qual e melhor para o caso mencionado pelo usuario.

ESCOLHA GUIADA POR APLICACAO (item 70):
- Quando o usuario disser que nao sabe qual resina usar ou a pergunta for generica ("qual resina voce recomenda?", "tem alguma para peca rigida?", "qual usar para joias?"), use este guia:
  * Joias, gemas e fundicao de ouro: IRON, POSEIDON ou VULCAN CAST
  * Prototipos detalhados e miniaturas: RPG 4K, SPIN ou ALCHEMIST
  * Pecas funcionais rigidas: PYROBLAST ou SPARK
  * Pecas semi-flexiveis ou articuladas: FLEXFORM
  * Dental (modelos, guias, alinhadores — NAO INTRAORAL): ATHOM ou ATHOM ALINHADORES (sempre com aviso de biocompatibilidade)
  * Impressao com baixo odor: LOW SMELL ou POSEIDON
  * Uso geral / iniciante: SPIN
- Faca apenas 1 pergunta para confirmar o uso final antes de indicar, a menos que o uso ja esteja claro na mensagem.
- Apresente no maximo 2 opcoes com justificativa de 1 frase cada. Nunca indique resinas de outras marcas.`;

router.post('/', async (req, res) => {
    try {
        const { message = '', historico = [], clienteId = '', clienteNome = '', modo = '' } = req.body || {};
        const text = String(message || '').trim();

        if (!text) {
            return res.status(400).json({ success: false, error: 'Mensagem obrigatoria' });
        }

        // Camadas de transicao: regra do fundador + conta linear com os numeros do cliente.
        // Nao depende de perfil oficial (os parametros oficiais nao tem transicao).
        // O chat do site so abre com cadastro; sem cliente identificado nao gasta IA.
        if (!String(clienteId || '').trim()) {
            return res.json({ success: true, reply: 'Para conversar com a IAQ3D, faça seu cadastro rápido no site (botão "Área do cliente", no topo). Leva menos de 1 minuto e libera o suporte técnico.', source: 'cadastro', ragUsado: false, conversaId: null, precisaCadastro: true });
        }

        const ip = ipDoPedido(req); // IP real (middlewares/limiteTaxa.js)

        let cadastro = null;
        if (ehIdDeCadastro(clienteId)) {
          cadastro = await clienteComChave(clienteId, chaveDoPedido(req));
        }
        // Toda identificacao exige a chave guardada no navegador do cliente.
        // Identificador em texto puro (cadastros antigos e testes) nao vale mais.
        if (!cadastro) {
          return res.json({ success: true, reply: AVISO_CHAVE, source: 'chave', ragUsado: false, conversaId: null, chaveInvalida: true });
        }
        const clienteTelefone = cadastro?.telefone || '';
        const ehFundador = isFounderPhone(clienteTelefone);

        // Limite diario de perguntas respondidas pela IA (respostas fixas nao contam). Fundador nao tem limite.
        let usadasHoje = 0;
        try { usadasHoje = await perguntasHoje(clienteId); } catch (_) {}
        const infoLimite = (usadas) => ({ usadas: Math.min(usadas, LIMITE_DIARIO), max: LIMITE_DIARIO, restantes: Math.max(0, LIMITE_DIARIO - usadas), semLimite: ehFundador });

        // Respostas fixas: nao passam pela IA, nao gastam e nao contam no limite.
        const respostaTransicao = transitionLayerAnswer(text) || gabaritoAnswer(text) || misturaAnswer(text) || custoFormulaAnswer(text) || handoffAnswer(text) || saudacaoAnswer(text) || validadeAnswer(text);
        if (respostaTransicao) {
            let conversaId = null;
            try {
                const conv = await Conversa.create({ clienteId, clienteNome, pergunta: text, resposta: respostaTransicao, fonte: 'rules' });
                conversaId = conv._id;
            } catch (_) {}
            return res.json({ success: true, reply: respostaTransicao, source: 'rules', ragUsado: false, conversaId, limite: infoLimite(usadasHoje) });
        }

        if (!ehFundador) {
            const usoIp = usoDoIp(ip);
            const passouCliente = clienteId ? usadasHoje >= LIMITE_DIARIO : usoIp >= LIMITE_DIARIO;
            if (passouCliente || usoIp >= LIMITE_POR_IP) {
                return res.json({ success: true, reply: mensagemLimite(), source: 'limite', ragUsado: false, conversaId: null, limiteAtingido: true, limite: infoLimite(LIMITE_DIARIO) });
            }
        }

        const rag = await retrieveRagContext(text, historico);
        const { resin: resinaAtual, printer: impressoraAtual } = rag;

        // Lembra a configuracao do cliente para a proxima conversa (nao trava o chat se falhar).
        if (cadastro) {
            const setEquip = dadosEquipamento({ contexto: lerContexto(historico), resinaDetectada: resinaAtual, impressoraDetectada: impressoraAtual });
            if (Object.keys(setEquip).length) Cliente.updateOne({ _id: clienteId }, { $set: setEquip }).catch(() => {});
        }

        // Regras fixas sao fallback. Conhecimento oficial/aprovado sempre tem prioridade.
        if (!rag.used && !rag.guardInstruction) {
            const rule = ruleBasedAnswer(text);
            if (rule) {
                let conversaId = null;
                try {
                    const conv = await Conversa.create({ clienteId, clienteNome, pergunta: text, resposta: rule, fonte: 'rules' });
                    conversaId = conv._id;
                } catch (_) {}
                return res.json({ success: true, reply: rule, source: 'rules', ragUsado: false, conversaId, limite: infoLimite(usadasHoje) });
            }
        }

        let systemFinal = SYSTEM_PROMPT;
        systemFinal += `\n\n--- CATALOGO RESUMIDO DE RESINAS QUANTON3D (aplicacao oficial) ---\n${RESIN_CATALOG_SHORT}\nSo cite ou indique resina de acordo com este catalogo. Se a pergunta nao pediu indicacao de resina, responda o que foi perguntado sem empurrar resina.`;

        // Instrucoes especificas por modo de atendimento
        if (modo === 'parametros') {
            systemFinal += `\n\n--- MODO ATIVO: PARAMETROS ---\nO usuario quer parametros de impressao especificos. Foque em: exposicao normal (s), exposicao base (s), camadas base, velocidade de lift (mm/s). Se faltar resina ou impressora, solicite somente o que falta. Apresente os parametros em lista clara e objetiva. Se os valores nao estiverem no banco de dados validado, informe isso explicitamente e nao sugira faixa estimada; indique a Calculadora de Exposicao e o WhatsApp (31) 3271-6935.`;
        } else if (modo === 'tecnico') {
            systemFinal += `\n\n--- MODO ATIVO: DUVIDA TECNICA ---\nO usuario tem um problema tecnico ou falha de impressao. Use SEMPRE esta estrutura: 1) Causa mais provavel -> 2) Ajuste seguro (valores somente se vierem do contexto oficial) -> 3) Como confirmar o resultado. Seja direto. Uma causa, um ajuste, uma confirmacao.`;
        } else if (modo === 'resina') {
            systemFinal += `\n\n--- MODO ATIVO: INDICACAO DE RESINA ---\nO usuario quer saber qual resina Quanton3D usar para um caso especifico. Se o uso final nao estiver claro, pergunte primeiro (prototipo, peca funcional, fundicao, dental, flexivel, etc). Apresente no maximo 2 opcoes Quanton3D com justificativa curta para cada. Nunca indique resinas de outras marcas.`;
        }

        if (rag.context) {
            systemFinal += `\n\n--- RAG QUANTON3D ---\n${rag.context}\n---\nResponda somente com informacoes compativeis com a hierarquia acima.`;
        } else if (!rag.guardInstruction) {
            // Sem dados validados no banco — exige transparencia
            systemFinal += `\n\n--- AVISO DE TRANSPARENCIA ---\nNao ha parametros ou conhecimento validado no banco para esta consulta especifica. Nao forneca valores numericos. Ajude com diagnostico qualitativo e, se o cliente precisar de numeros, diga: "Nao tenho perfil validado para esta combinacao. Confirme com a equipe pelo WhatsApp (31) 3271-6935."`;
        }
        if (rag.guardInstruction) {
            systemFinal += `\n\n--- CONTROLE DE SEGURANCA DOS PARAMETROS ---\n${rag.guardInstruction}`;
        }

        if (resinaAtual || impressoraAtual) {
            systemFinal += `\n\n--- CONTEXTO DETECTADO NA CONVERSA ---\nResina: ${resinaAtual || 'nao informada'} | Impressora: ${impressoraAtual ? impressoraAtual.toUpperCase() : 'nao informada'}\nUse a resina e a impressora detectadas para personalizar a resposta. Não solicite novamente dados que já estejam confirmados no contexto.`;
        }

        if (ehFundador) {
            systemFinal += `\n\n--- RECONHECIMENTO ESPECIAL ---\nVoce esta falando com Ronei Fonseca, o FUNDADOR da Quanton3D e a pessoa que ajudou a construir voce (a IAQ3D) junto com a IA Claude. Reconheca isso de forma natural quando fizer sentido. Trate-o com mais informalidade e proximidade tecnica.`;
        }

        // Reconhecimento pelo nome digitado (apenas cosmetico - sem privilegios)
        if (!ehFundador && /ronei\s+fonseca/i.test(text)) {
          systemFinal += '\n\n--- RECONHECIMENTO DE NOME ---\nO usuario digitou o nome Ronei Fonseca na conversa. Se for o Ronei, cumprimente-o como fundador da Quanton3D de forma natural e calorosa, mas continue respondendo normalmente. Isso e apenas reconhecimento pelo nome digitado; as regras de atendimento continuam iguais.';
        }

        const historicoValido = Array.isArray(historico)
            ? historico.filter(m => m && (m.role === 'user' || m.role === 'assistant') && m.content)
            : [];
        // Mantem o par "Contexto: resina..., impressora..." que o site envia no inicio.
        const temContexto = historicoValido.length >= 2 && /^Contexto:/i.test(String(historicoValido[0].content));
        const parContexto = temContexto ? historicoValido.slice(0, 2) : [];
        let recentes = historicoValido.slice(parContexto.length).slice(-8);
        const ultimo = recentes[recentes.length - 1];
        if (ultimo && ultimo.role === 'user' && String(ultimo.content).trim() === text) {
            recentes = recentes.slice(0, -1);
        }

        const messages = [
            { role: 'system', content: systemFinal },
            ...parContexto,
            ...recentes,
            { role: 'user', content: text }
        ];

        const model = process.env.DEEPSEEK_CHAT_MODEL || 'deepseek-v4-flash';
        const maxTokens = Math.min(
            2000,
            Math.max(600, Number.parseInt(process.env.BOT_MAX_TOKENS, 10) || 1200)
        );
        let completion = await client().chat.completions.create(
            {
                model,
                thinking: { type: 'disabled' },
                reasoning_effort: 'low',
                temperature: rag.used || rag.guardInstruction ? 0.05 : 0.1,
                max_tokens: maxTokens,
                messages,
            }
        );

        const usosIA = [completion.usage];
        let firstChoice = completion.choices?.[0];
        let providerReply = firstChoice?.message?.content?.trim();
        let numericRewrite = false;

        // Trava: sem fonte oficial/aprovada, a resposta nao pode trazer numeros tecnicos inventados.
        if (
            providerReply
            && !hasApprovedQuantitativeSource(rag.sources)
            && containsTechnicalQuantity(providerReply)
        ) {
            numericRewrite = true;
            const safeMessages = messages.map((item, index) => index === 0
                ? {
                    ...item,
                    content: `${item.content}\n\n--- REVISAO NUMERICA OBRIGATORIA ---\nReescreva sem qualquer numero, faixa, unidade, porcentagem, tempo, temperatura ou dimensao. Nenhum valor quantitativo oficial foi recuperado. Preserve o diagnostico e indique apenas o ajuste qualitativo seguro.`,
                }
                : item);
            completion = await client().chat.completions.create({
                model,
                thinking: { type: 'disabled' },
                reasoning_effort: 'low',
                temperature: 0.05,
                max_tokens: maxTokens,
                messages: safeMessages,
            });
            usosIA.push(completion.usage);
            firstChoice = completion.choices?.[0];
            providerReply = firstChoice?.message?.content?.trim();

            if (providerReply && containsTechnicalQuantity(providerReply)) {
                // Mantem o diagnostico e tira so as frases com numero nao autorizado.
                const limpa = stripTechnicalQuantities(providerReply);
                providerReply = limpa.length >= 120 ? limpa : '';
            }
            if (!providerReply) {
                providerReply = ruleBasedAnswer(text)
                    || 'Nao tenho um valor oficial Quanton3D para te passar com seguranca nesse caso. Me diga qual resina Quanton3D voce usa (e a impressora, se for sobre parametros) que eu consulto a ficha e o perfil corretos. Se preferir, fale com a equipe pelo WhatsApp (31) 3271-6935.';
            }
        }
        console.log('[DEEPSEEK-INFO]', JSON.stringify({
            model,
            requestId: completion.id || null,
            finishReason: firstChoice?.finish_reason || null,
            contentReturned: Boolean(providerReply),
            promptTokens: completion.usage?.prompt_tokens ?? null,
            completionTokens: completion.usage?.completion_tokens ?? null,
            numericRewrite,
        }));
        let reply = providerReply
            || ruleBasedAnswer(text)
            || 'Nao consegui gerar uma resposta segura agora. Informe a resina, o modelo da impressora e descreva o sintoma; se preferir, chame a equipe pelo WhatsApp (31) 3271-6935.';

        let conversaId = null;
        try {
            const conv = await Conversa.create({
                clienteId,
                clienteNome,
                pergunta: text,
                resposta: reply,
                resinaDetectada: resinaAtual || '',
                impressoraDetectada: impressoraAtual || '',
                ragUsado: rag.used,
                fonte: rag.used ? 'rag+deepseek' : 'deepseek',
                lacuna: detectarLacuna({ ragUsado: rag.used, guarda: Boolean(rag.guardInstruction), reescritaNumerica: numericRewrite, resposta: reply }),
                ...somarUso(...usosIA),
            });
            conversaId = conv._id;
        } catch (err) {
            console.error('[SALVAR CONVERSA]', err.message);
        }

        if (firstChoice?.finish_reason === 'length') {
      reply += '\n\n_(Resposta pode estar incompleta. Tente reformular a pergunta de forma mais específica.)_';
    }
    registrarUsoIp(ip);
        res.json({
            success: true,
            reply,
            source: rag.used ? 'rag+deepseek' : 'deepseek',
            ragUsado: rag.used,
            ragFontes: rag.sources,
            conversaId,
            limite: infoLimite(usadasHoje + 1),
        });

    } catch (e) {
        console.error('[CHAT ERROR]', e);
        const { status, error } = chatErrorResponse(e);
        res.status(status).json({ success: false, error });
    }
});

// Quantas perguntas o cliente ja fez hoje (o chat mostra "Perguntas hoje: X de 15").
router.get('/limite/:clienteId', async (req, res) => {
    try {
        const { clienteId } = req.params;
        let semLimite = false;
        // Exige a chave para qualquer identificador, nao so para o formato novo.
        const cad = ehIdDeCadastro(clienteId) ? await clienteComChave(clienteId, chaveDoPedido(req)) : null;
        if (!cad) return res.status(401).json({ success: false, error: AVISO_CHAVE, chaveInvalida: true });
        semLimite = isFounderPhone(cad.telefone);
        const usadas = await perguntasHoje(clienteId);
        res.json({ success: true, limite: { usadas: Math.min(usadas, LIMITE_DIARIO), max: LIMITE_DIARIO, restantes: Math.max(0, LIMITE_DIARIO - usadas), semLimite } });
    } catch (e) {
        res.json({ success: true, limite: { usadas: 0, max: LIMITE_DIARIO, restantes: LIMITE_DIARIO } });
    }
});

router.get('/historico/:clienteId', async (req, res) => {
    try {
        const { clienteId } = req.params;

        /* O historico so sai com cadastro valido + chave. Identificador em texto puro
           (cadastros antigos e testes) nao abre mais o historico de ninguem. */
        const isObjectId = ehIdDeCadastro(clienteId);
        let cadastro = null;
        if (isObjectId) {
          cadastro = await clienteComChave(clienteId, chaveDoPedido(req));
        }
        if (!cadastro) return res.status(401).json({ success: false, error: AVISO_CHAVE, chaveInvalida: true });

        const query = { $or: [{ clienteId: clienteId }, { clienteId: new mongoose.Types.ObjectId(clienteId) }] };

        // As 20 conversas MAIS RECENTES, depois viradas para ordem cronologica.
        // Antes era sort crescente + limit(20): a partir da 21a conversa o cliente
        // voltava e o bot so via as 20 PRIMEIRAS, nunca as de agora.
        const conversas = (await Conversa.find(query)
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()).reverse();

        res.json({
            success: true,
            equipamento: equipamentoParaResposta(cadastro || {}, conversas),
            conversas: conversas.map(c => ({
                _id: c._id,
                pergunta: c.pergunta,
                resposta: c.respostaMelhorada || c.resposta,
                resinaDetectada: c.resinaDetectada || '',
                impressoraDetectada: c.impressoraDetectada || ''
            }))
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

export default router;
