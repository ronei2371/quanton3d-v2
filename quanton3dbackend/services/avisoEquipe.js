// Aviso para a equipe quando chega algo novo pelo site (chamado, mensagem, formulacao,
// foto da galeria, parceria).
// 1) No ADM: o painel pergunta a cada minuto (GET /api/admin/novidades) e mostra o aviso.
// 2) No celular (opcional): se o Render tiver NTFY_TOPIC, manda uma notificacao pelo app
//    gratuito ntfy (ntfy.sh). Sem NTFY_TOPIC nao faz nada. O aviso NAO leva nome, telefone
//    nem e-mail do cliente: so o assunto, e o detalhe fica no ADM.

export const TIPOS_AVISO = {
  chamado:    { titulo: 'Chamado técnico novo',          tag: 'wrench',    aba: 'chamados' },
  mensagem:   { titulo: 'Mensagem nova no site',         tag: 'envelope',  aba: 'mensagens' },
  formulacao: { titulo: 'Pedido de formulação novo',     tag: 'test_tube', aba: 'formulacoes' },
  galeria:    { titulo: 'Foto nova para aprovar',        tag: 'camera',    aba: 'galeria' },
  parceria:   { titulo: 'Pedido de parceria novo',       tag: 'handshake', aba: 'parceiros' },
};

const TOPICO_VALIDO = /^[A-Za-z0-9_-]{8,64}$/;

function curto(valor, max = 120) {
  const t = String(valor ?? '').replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

// Monta a notificacao (separado para os testes).
export function montarAviso(tipo, detalhe = '', env = process.env) {
  const info = TIPOS_AVISO[tipo];
  const topic = String(env.NTFY_TOPIC || '').trim();
  if (!info || !TOPICO_VALIDO.test(topic)) return null;
  const site = String(env.SITE_URL || 'https://quanton3d-v2.onrender.com').replace(/\/+$/, '');
  return {
    url: String(env.NTFY_URL || 'https://ntfy.sh').replace(/\/+$/, ''),
    corpo: {
      topic,
      title: info.titulo,
      message: `${curto(detalhe) || 'Veja os detalhes no ADM.'}\nAbra o ADM do site para responder.`,
      tags: [info.tag],
      priority: tipo === 'chamado' ? 4 : 3,
      click: site,
    },
  };
}

// Nunca trava nem derruba o pedido do cliente: erro so vai para o log.
export async function avisarEquipe(tipo, detalhe = '') {
  const aviso = montarAviso(tipo, detalhe);
  if (!aviso) return false;
  try {
    const r = await fetch(aviso.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aviso.corpo),
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) console.error('[AVISO EQUIPE]', r.status);
    return r.ok;
  } catch (err) {
    console.error('[AVISO EQUIPE]', err.message);
    return false;
  }
}

// Detalhe de cada tipo (sem dado pessoal).
export function detalheChamado(t = {}) {
  return [t.problema, t.resina || 'resina não informada', t.impressora || 'impressora não informada'].filter(Boolean).join(' · ');
}
