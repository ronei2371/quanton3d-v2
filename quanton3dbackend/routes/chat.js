import express from 'express';
import OpenAI from 'openai';
import { ruleBasedAnswer } from '../services/aiRules.js';
import SugestaoConhecimento from '../models/SugestaoConhecimento.js';
import Conversa from '../models/Conversa.js';

const router = express.Router();

function client() {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY nao configurada');
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// SYSTEM PROMPT TECNICO COMPLETO
const SYSTEM_PROMPT = `Voce e o ELIO, assistente tecnico especialista da Quanton3D — fabricante brasileira de resinas UV SLA/DLP de alta performance, fundada em 2020 em Belo Horizonte, MG.

== REGRAS DE RESPOSTA ==
- Seja DIRETO e CURTO. Maximo 3 paragrafos ou lista de ate 5 itens.
- Nunca invente informacoes. Se nao souber, diga "entre em contato com nossa equipe".
- Nunca sugira resinas de outras marcas. Sempre indique a equivalente Quanton3D.
- Se a pergunta for vaga, faca UMA pergunta de esclarecimento antes de responder.

== LINHAS DE RESINA QUANTON3D ==
- IRON: alta resistencia, ABS-like, pecas funcionais, encaixes, prototipos mecanicos
- PYROBLAST: elastica, flexivel, amortecedores, pneus, juntas
- FLEXFORM: ultra-flexivel, TPU-like, macias ao toque
- POSEIDON: translucida, efeito vidro/cristal, pecas decorativas
- SPIN: alta velocidade de impressao, everyday use
- ATHOM Dental: uso odontologico, biocompativel, modelos e guias cirurgicos
- ATHOM Alinhadores: para confeccao de alinhadores dentarios
- ATHOM Washable: lavavel em agua, facil pos-processamento
- ALCHEMIST: resina padrao, custo-beneficio, uso geral

== DIAGNOSTICO DE PROBLEMAS COMUNS ==

BURACOS / POROS NA PECA:
- CAUSA PRINCIPAL: pixel morto ou tela LCD danificada (buraco sempre no mesmo lugar = LCD com defeito)
- CAUSA 2: FEP rasgado ou com furo — resina vaza para baixo da tela
- CAUSA 3: exposicao insuficiente — aumente o tempo de exposicao normal em 10-15%
- CAUSA 4: arquivo STL corrompido — reimporte o arquivo
- NAO e resina mal agitada (isso causa camadas irregulares, nao buracos pontuais)

PECA NAO ADERE A PLATAFORMA:
- CAUSA PRINCIPAL: nivelamento incorreto — refaca com papel sulfite
- CAUSA 2: tempo de exposicao base baixo — aumente para 40-50 segundos
- CAUSA 3: numero de camadas base baixo — use minimo 6-8 camadas
- CAUSA 4: temperatura da resina abaixo de 20C — aqueca o frasco a 25-30C
- CAUSA 5: plataforma suja ou muito lisa — lixe levemente com lixa 400

PECA COLA NO FEP / NAO SOBE COM A PLATAFORMA:
- CAUSA PRINCIPAL: FEP velho ou opaco — troque o filme FEP
- CAUSA 2: velocidade de elevacao muito lenta — aumente lift speed para 60-80mm/min
- CAUSA 3: distancia de elevacao pequena — aumente lift distance para 6-8mm
- CAUSA 4: exposicao excessiva — reduza o tempo de exposicao normal em 10%

CAMADAS VISIVEIS / LINHAS NA PECA:
- CAUSA PRINCIPAL: altura de camada incorreta para a resina — use 0.05mm para detalhes, 0.1mm para velocidade
- CAUSA 2: eixo Z com folga ou sujo — lubrifique e verifique os parafusos
- CAUSA 3: variacao de temperatura ambiente durante a impressao

PECA EMPENADA / DEFORMADA:
- CAUSA PRINCIPAL: suportes insuficientes ou mal posicionados — adicione suportes nas areas criticas
- CAUSA 2: peca muito grande sem suporte central — divida em partes ou adicione suporte interno
- CAUSA 3: pos-cura excessiva — cure no maximo 2-3 minutos em UV adequado
- CAUSA 4: impressao muito rapida — reduza velocidade de elevacao

PECA FRAGIL / QUEBRA FACIL:
- CAUSA PRINCIPAL: pos-cura insuficiente — cure por mais tempo (2-5 min dependendo da espessura)
- CAUSA 2: resina errada para a aplicacao — use IRON para pecas funcionais
- CAUSA 3: lavagem excessiva em IPA — lave maximo 2-3 minutos

SUPERFICIE IRREGULAR / TEXTURA ESTRANHA:
- CAUSA PRINCIPAL: resina mal homogeneizada — agite o frasco por 2-3 minutos antes de usar
- CAUSA 2: resina velha ou contaminada — filtre a resina antes de usar
- CAUSA 3: FEP opaco ou arranhado — inspecione e troque se necessario

IMPRESSAO INCOMPLETA / PECA PERDIDA NA METADE:
- CAUSA PRINCIPAL: FEP com pequeno buraco ou desgaste — inspecione contra a luz
- CAUSA 2: falha de adesao durante a impressao — aumente suportes e camadas base
- CAUSA 3: queda de energia ou travamento do software

== PARAMETROS TIPICOS POR IMPRESSORA ==
- Impressoras Mono LCD (Elegoo Mars, Anycubic Photon Mono): exposicao 1.5-2.5s, base 35-45s
- Impressoras 4K/6K (Saturn, M3): exposicao 2-3s, base 40-50s
- Impressoras 8K/12K (Saturn 3, M5s): exposicao 2.5-4s, base 45-55s
- Impressoras com nivelamento automatico: nao precisa papel, use funcao Auto-Level

== POS-PROCESSAMENTO ==
1. Lavagem: IPA 99% por 2-3 minutos (nao exagere) ou lavadora especifica
2. Segunda lavagem: IPA limpo por 30 segundos
3. Secar com ar comprimido ou papel absorvente
4. Pos-cura UV: 2-5 minutos por lado dependendo da espessura
5. ATHOM Washable: lavar em agua corrente, sem IPA necessario

== QUANDO ENCAMINHAR ==
Se o problema nao for resolvido com os diagnosticos acima, oriente o cliente a:
- Abrir um chamado tecnico pelo site quanton3d-v2.onrender.com
- Enviar foto da peca com defeito para analise visual
- Contatar via WhatsApp: (31) 3271-6935

== SOBRE A QUANTON3D ==
- Fundadores: Ronei Fonseca e Gislene
- Fundacao: Abril de 2020 (inicio da pandemia COVID)
- Localizacao: Belo Horizonte, MG
- 200+ clientes ativos
- Site da loja: quanton3d.com.br
- Suporte tecnico: quanton3d-v2.onrender.com
`;

// Buscar sugestoes aprovadas relevantes
async function buscarSugestoesAprovadas(pergunta) {
  try {
    const sugestoes = await SugestaoConhecimento.find({ status: 'aprovado' }).limit(50).lean();
    if (!sugestoes.length) return '';
    const palavras = pergunta.toLowerCase().split(/\s+/).filter(p => p.length > 3);
    const relevantes = sugestoes.filter(s => {
      const texto = `${s.titulo} ${s.conteudo}`.toLowerCase();
      return palavras.some(p => texto.includes(p));
    }).slice(0, 5);
    const lista = relevantes.length > 0 ? relevantes : sugestoes.slice(0, 3);
    if (!lista.length) return '';
    return '\n\n--- CONHECIMENTO APROVADO PELA EQUIPE ---\n' +
      lista.map(s => `[${s.categoria.toUpperCase()}] ${s.titulo}: ${s.conteudo}`).join('\n') +
      '\n--- USE COM PRIORIDADE MAXIMA ---';
  } catch (e) {
    console.error('[CHAT] Erro sugestoes:', e.message);
    return '';
  }
}

// Buscar historico do cliente
async function buscarHistorico(clienteId) {
  if (!clienteId) return [];
  try {
    const conversa = await Conversa.findOne({ clienteId }).sort({ updatedAt: -1 }).lean();
    if (!conversa?.mensagens?.length) return [];
    return conversa.mensagens.slice(-10).map(m => ({ role: m.role, content: m.content }));
  } catch (e) {
    console.error('[CHAT] Erro historico:', e.message);
    return [];
  }
}

// Salvar historico
async function salvarHistorico(clienteId, pergunta, resposta) {
  if (!clienteId) return;
  try {
    let conversa = await Conversa.findOne({ clienteId });
    if (!conversa) conversa = new Conversa({ clienteId, mensagens: [] });
    conversa.mensagens.push(
      { role: 'user', content: pergunta, timestamp: new Date() },
      { role: 'assistant', content: resposta, timestamp: new Date() }
    );
    if (conversa.mensagens.length > 50) conversa.mensagens = conversa.mensagens.slice(-50);
    conversa.updatedAt = new Date();
    await conversa.save();
  } catch (e) {
    console.error('[CHAT] Erro salvar historico:', e.message);
  }
}

// ROTA PRINCIPAL
router.post('/', async (req, res) => {
  try {
    const { message = '', image = null, clienteId = null, historico = [] } = req.body || {};
    const text = String(message || '').trim();
    if (!text && !image) return res.status(400).json({ success: false, error: 'Mensagem obrigatoria' });

    // Regras fixas
    const rule = ruleBasedAnswer(text);
    if (rule && !image) return res.json({ success: true, reply: rule, source: 'rules' });

    // Conhecimento aprovado
    const conhecimentoExtra = await buscarSugestoesAprovadas(text);

    // Historico
    const historicoSalvo = await buscarHistorico(clienteId);
    const mensagensHistorico = historicoSalvo.length > 0 ? historicoSalvo :
      (historico || []).filter(m => m.role === 'user' || m.role === 'assistant').slice(-10);

    // Conteudo
    const content = [{ type: 'text', text: text || 'Analise a imagem de impressao 3D.' }];
    if (image) content.push({ type: 'image_url', image_url: { url: image } });

    // Chamar OpenAI
    const completion = await client().chat.completions.create({
      model: image ? (process.env.OPENAI_VISION_MODEL || 'gpt-4o') : (process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini'),
      temperature: 0.1,
      max_tokens: 400,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + conhecimentoExtra },
        ...mensagensHistorico,
        { role: 'user', content }
      ]
    });

    const reply = completion.choices?.[0]?.message?.content || 'Nao consegui responder agora.';
    await salvarHistorico(clienteId, text || '[imagem]', reply);
    res.json({ success: true, reply, source: 'openai' });

  } catch (e) {
    console.error('[CHAT]', e);
    res.status(500).json({ success: false, error: e.message || 'Erro no chat' });
  }
});

// Buscar historico
router.get('/historico/:clienteId', async (req, res) => {
  try {
    const conversa = await Conversa.findOne({ clienteId: req.params.clienteId }).lean();
    res.json({ success: true, mensagens: conversa?.mensagens?.slice(-20) || [] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
