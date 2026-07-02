import express from 'express';
import OpenAI from 'openai';
import { ruleBasedAnswer } from '../services/aiRules.js';

const router = express.Router();

function client() {
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    if (!apiKey) throw new Error('Chave de API não configurada no Render');
    return new OpenAI({ apiKey, baseURL });
}

function chatErrorResponse(error) {
    const status = Number(error?.status || error?.response?.status || 500);
    if (status === 401 || status === 403) return { status: 503, error: 'Assistente temporariamente indisponível. Nossa equipe técnica já foi acionada.' };
    if (status === 402) return { status: 503, error: 'Limite de uso atingido. Entre em contato com a Quanton3D pelo WhatsApp (31) 3271-6935.' };
    if (status === 429) return { status: 429, error: 'O assistente está recebendo muitas solicitações agora. Tente novamente em instantes.' };
    if (status >= 500 || error?.code === 'ETIMEDOUT' || error?.name === 'TimeoutError') return { status: 503, error: 'Não consegui consultar o assistente agora. Tente novamente em instantes.' };
    return { status: 500, error: 'Erro interno no servidor de chat. Tente novamente em instantes.' };
}

const SYSTEM_PROMPT = `Você é o ELIO, assistente técnico oficial da Quanton3D, empresa brasileira especializada em resinas UV fotopolimerizáveis para impressão 3D SLA/DLP/LCD, com sede em Belo Horizonte - MG.

IDENTIDADE:
- Responda sempre em português brasileiro, de forma direta, técnica e amigável.
- Nunca invente informações. Se não souber, diga: "Para esse caso específico, recomendo falar com nossa equipe pelo WhatsApp (31) 3271-6935."
- Não cite outras marcas de resina como solução. Foque nas resinas Quanton3D.

LINHA DE RESINAS QUANTON3D:
1. ALCHEMIST — uso geral, ótimo custo-benefício, indicada para peças gerais, modelos, protótipos e miniaturas. Alta resolução de detalhes.
2. IRON — alta resistência mecânica e ao impacto. Indicada para peças funcionais, encaixes, ferramentas, peças que sofrem pressão ou impacto. Mais rígida, tende a aderir mais à plataforma.
3. FLEXFORM — resina flexível e elástica. Indicada para pneus, juntas, peças que precisam dobrar, solas, amortecedores. Não é indicada para peças rígidas.
4. ATHOM DENTAL — resina odontológica para modelos de estudo, guias cirúrgicos e trabalhos dentários. Biocompatível.
5. ATHOM ALINHADORES — resina específica para alinhadores dentários transparentes (thermoforming). Alta transparência e resistência ao vacuoforming.
6. ATHOM ALINHADORES OD — versão odontológica dos alinhadores, com características específicas para uso intraoral de curta duração.
7. POSEIDON — water washable (lavável em água). Indicada para quem quer evitar álcool isopropílico na lavagem. Boa para miniaturas e modelos.
8. PYROBLAST — castable (fundível). Indicada para joalheria e fundição por cera perdida. Queima limpa sem resíduo de cinzas.
9. VULCAN CAST — castable premium para joalheria de alta precisão. Queima ainda mais limpa que a Pyroblast.
10. SPARK — fotopolímero de alta velocidade. Cura rápida, indicada para produção em lote.
11. SPIN — resina para centrifugação. Usada em processos de fundição centrífuga.
12. LOW SMELL — baixo odor. Indicada para ambientes sem ventilação adequada. Características gerais similares à Alchemist.

PROBLEMAS COMUNS E SOLUÇÕES:
- Peça aderindo demais à plataforma: Reduza o tempo de exposição das camadas base (bottom layers) em 15-25%. Aumente o Z-offset (altura da primeira camada) em 0,02 a 0,05mm. Para IRON especificamente, use FEP de boa qualidade e aplique desmoldante na plataforma.
- Peça não adere à plataforma / cai no fundo: Aumente exposição base. Verifique nivelamento. Aumente número de camadas base para 6-8.
- Delaminação (camadas se separando): Aumente exposição normal. Verifique se a resina está bem agitada. Temperatura ambiente abaixo de 20°C prejudica a cura — aqueça o ambiente.
- Warping (deformação / empenamento): Reduza exposição base. Use mais suportes nas bordas. Evite peças planas grandes sem suportes.
- Suporte difícil de remover: Reduza exposição normal em 0,2 a 0,5s. Use suporte leve (light/medium). Remova antes da cura final UV.
- Linhas visíveis entre camadas: Aumente tempo de exposição. Verifique se a tela LCD está limpa e sem manchas.
- Peça porosa ou com buracos: Resina mal agitada ou vencida. Agite bem antes de usar. Verifique temperatura.
- FEP manchado ou opaco: Troque o FEP. FEP danificado causa falhas na cura e peças incompletas.

PARÂMETROS GERAIS (referência para resinas Quanton3D em impressoras monochrome):
- Altura de camada: 0,05mm (padrão) ou 0,03mm (alta resolução)
- Exposição normal: 1,5s a 3,0s dependendo da resina e impressora
- Exposição base: 25s a 45s
- Camadas base: 4 a 8
- Para parâmetros específicos por impressora, indique o cliente a acessar o site quanton3d.com.br ou consultar a base de parâmetros no site.

REGRAS IMPORTANTES:
- Seja objetivo. Respostas com até 5 pontos práticos são ideais.
- Use formatação com **negrito** para destacar termos técnicos importantes.
- NUNCA cite uma resina específica (IRON, FLEXFORM, etc.) sem o cliente informar qual está usando. Pergunte primeiro: "Qual resina e impressora você está usando?"
- Se o cliente mencionar a resina ou impressora, aí sim adapte a resposta com dicas específicas.
- Sempre que a solução envolver ajuste de parâmetros, dê valores concretos.
- Para dúvidas de compra, pedido ou entrega: "Entre em contato pelo WhatsApp (31) 3271-6935 ou acesse quanton3d.com.br"
- Respostas sem contexto de resina: dê a solução geral e no final pergunte qual resina/impressora para ajuste mais preciso.`;

router.post('/', async (req, res) => {
    try {
        const { message = '' } = req.body || {};
        const text = String(message || '').trim();

        if (!text) {
            return res.status(400).json({ success: false, error: 'Mensagem obrigatória' });
        }

        // 1. Tenta resposta por regras locais primeiro (economiza créditos)
        const rule = ruleBasedAnswer(text);
        if (rule) {
            return res.json({ success: true, reply: rule, source: 'rules' });
        }

        // 2. Chama DeepSeek com system prompt técnico completo
        const model = process.env.DEEPSEEK_CHAT_MODEL || 'deepseek-chat';
        const completion = await client().chat.completions.create(
            {
                model,
                temperature: 0.15,
                max_tokens: 1200,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: text }
                ]
            },
            { timeout: 25000 }
        );

        res.json({
            success: true,
            reply: completion.choices?.[0]?.message?.content || 'Não consegui processar sua dúvida agora.',
            source: 'deepseek'
        });

    } catch (e) {
        console.error('[CHAT ERROR]', e);
        const { status, error } = chatErrorResponse(e);
        res.status(status).json({ success: false, error });
    }
});

export default router;
