// Limite de tentativas por IP (em memoria: zera a cada deploy; e uma rede de seguranca).
// Protege o login do ADM contra tentativa de senha sem parar e os formularios publicos
// contra envio em massa (que encheria o banco de 512 MB).

// IP de quem fez o pedido. O site passa pelo Cloudflare antes do Render: o Cloudflare grava o
// IP real em CF-Connecting-IP e apaga o que o visitante mandar nesse cabecalho, entao ele nao
// pode ser inventado. O X-Forwarded-For NAO serve: o visitante coloca o valor que quiser
// (testado no ar em 29/09: com ele, trocar o IP falso a cada pedido furava o limite).
export function ipDoPedido(req) {
  const cf = String(req.headers?.['cf-connecting-ip'] || '').trim();
  return cf || req.ip || req.socket?.remoteAddress || 'sem-ip';
}

export function criarLimite({ max, janelaMs, mensagem, nome = 'geral' }) {
  const registros = new Map(); // chave -> [instantes]
  const middleware = (req, res, next) => {
    const agora = Date.now();
    const chave = `${nome}:${ipDoPedido(req)}`;
    const recentes = (registros.get(chave) || []).filter((t) => agora - t < janelaMs);
    if (recentes.length >= max) {
      const esperarS = Math.ceil((janelaMs - (agora - recentes[0])) / 1000);
      res.setHeader('Retry-After', String(esperarS));
      return res.status(429).json({ success: false, error: mensagem || 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' });
    }
    recentes.push(agora);
    registros.set(chave, recentes);
    if (registros.size > 50000) registros.clear();
    return next();
  };
  middleware.limpar = () => registros.clear();
  return middleware;
}

const MIN = 60 * 1000;

// Login da equipe (ADM e atendentes): 10 tentativas a cada 15 minutos por IP.
export const limiteLogin = criarLimite({ nome: 'login', max: 10, janelaMs: 15 * MIN, mensagem: 'Muitas tentativas de login. Aguarde 15 minutos e tente de novo.' });

// Formularios publicos (cadastro, chamado, parceiro, galeria, contato, formulacao, feedback).
export const limiteFormulario = criarLimite({ nome: 'form', max: 30, janelaMs: 60 * MIN, mensagem: 'Muitos envios seguidos. Aguarde um pouco e tente de novo.' });

// Envio com foto (pesa no banco/disco): 10 por hora por IP.
export const limiteUpload = criarLimite({ nome: 'upload', max: 10, janelaMs: 60 * MIN, mensagem: 'Muitos envios com foto seguidos. Aguarde um pouco e tente de novo.' });
