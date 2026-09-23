import jwt from 'jsonwebtoken';
import Atendente from '../models/Atendente.js';
import LogAcao from '../models/LogAcao.js';

// Registra no "Historico de Acoes" do ADM tudo o que o administrador ou um
// atendente altera no painel (criar, editar, aprovar, mudar status, excluir, limpar).
// Acoes publicas do site (cadastro, chat, envio de foto) nao entram no log.

const MODULOS = {
  admin: 'admin',
  parametros: 'parametros',
  conversas: 'conversas',
  clientes: 'clientes',
  'bot-tickets': 'chamados',
  'contact-messages': 'mensagens',
  formulacoes: 'formulacoes',
  gallery: 'galeria',
  'partner-requests': 'parceiros',
  'sugestoes-conhecimento': 'sugestoes',
  atendentes: 'atendentes',
};

const ACOES_ADMIN = {
  'sugerir-melhoria': ['SUGERIR_COM_IA', 'Resposta sugerida pela IA'],
  'sugerir-resposta-ticket': ['SUGERIR_COM_IA', 'Resposta de chamado sugerida pela IA'],
  'migrar-fotos-impressoras': ['MIGRAR_FOTOS', 'Migracao de fotos das impressoras'],
  'importar-catalogo-impressoras': ['IMPORTAR_CATALOGO', 'Importacao do catalogo de impressoras'],
  'fix-fotos-catalogo': ['CORRIGIR_FOTOS', 'Correcao de fotos do catalogo'],
  'limpar-testes': ['LIMPEZA_DE_DADOS', ''],
};

const OBJECT_ID = /^[a-f0-9]{24}$/i;

function texto(valor, max = 140) {
  const t = String(valor ?? '').replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max)}...` : t;
}

// Descreve a acao a partir do metodo, da rota e do corpo (sem senhas).
export function describeAction(method, url, body = {}) {
  const partes = String(url || '').split('?')[0].split('/').filter(Boolean); // ['api', 'modulo', ...]
  if (partes[0] !== 'api' || !MODULOS[partes[1]]) return null;
  const base = partes[1];
  const modulo = MODULOS[base];
  const resto = partes.slice(2);
  const alvo = resto.find((p) => OBJECT_ID.test(p)) || '';
  const sub = resto.filter((p) => !OBJECT_ID.test(p)).join('/');
  const b = body && typeof body === 'object' ? body : {};

  if (sub === 'login') return { modulo: 'auth', acao: 'LOGIN', detalhe: '', alvo: '' };

  if (base === 'admin' && ACOES_ADMIN[sub]) {
    const [acao, detalhe] = ACOES_ADMIN[sub];
    const extra = sub === 'limpar-testes' && Array.isArray(b.colecoes) ? `Colecoes: ${b.colecoes.join(', ')}` : detalhe;
    return { modulo, acao, detalhe: extra, alvo };
  }

  if (sub === 'status') {
    const novo = b.status !== undefined ? `status: ${texto(b.status, 40)}` : (b.ativo !== undefined ? `ativo: ${b.ativo}` : '');
    const obs = b.observacaoAdmin ? `observacao: ${texto(b.observacaoAdmin, 80)}` : '';
    return { modulo, acao: 'MUDAR_STATUS', detalhe: [novo, obs].filter(Boolean).join(' | '), alvo };
  }
  const nomes = {
    aprovar: 'APROVAR',
    desaprovar: 'DESAPROVAR',
    recusar: 'RECUSAR',
    'salvar-melhoria': 'SALVAR_MELHORIA',
    'revisar-feedback': 'REVISAR_FEEDBACK',
    feedback: 'REGISTRAR_FEEDBACK',
    permissoes: 'MUDAR_PERMISSOES',
    senha: 'TROCAR_SENHA',
    perfil: 'EDITAR_PERFIL',
    lote: 'EXCLUIR_EM_LOTE',
  };
  if (nomes[sub]) {
    const detalhe = sub === 'lote' && Array.isArray(b.ids) ? `${b.ids.length} registro(s)` : '';
    return { modulo, acao: nomes[sub], detalhe, alvo };
  }

  const verbo = method === 'DELETE' ? 'EXCLUIR' : method === 'POST' ? 'CRIAR' : 'EDITAR';
  let detalhe = '';
  if (base === 'parametros' && (b.resina || b.impressora)) detalhe = texto(`${b.resina || ''} + ${b.impressora || ''}`);
  if (base === 'atendentes' && b.nome) detalhe = texto(b.nome);
  if (base === 'sugestoes-conhecimento' && b.titulo) detalhe = texto(b.titulo);
  return { modulo, acao: verbo, detalhe, alvo };
}

function identificar(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.ADMIN_JWT_SECRET);
  } catch {
    return null;
  }
}

export function auditLog(req, res, next) {
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) return next();
  const url = req.originalUrl || req.url || '';
  const info = describeAction(req.method, url, req.body);
  if (!info) return next();

  const isLogin = info.acao === 'LOGIN';
  // Login de atendente ja e registrado na propria rota.
  if (isLogin && url.includes('/api/atendentes/')) return next();
  const quem = identificar(req);
  if (!quem && !isLogin) return next();

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';
  const userAgent = req.headers['user-agent'] || '';

  res.on('finish', async () => {
    const falhou = res.statusCode >= 400;
    if (falhou && !isLogin) return;
    try {
      const atendente = quem?.role === 'atendente';
      let nome = 'Administrador';
      let codigo = 'SUPERADMIN';
      if (atendente) {
        codigo = quem.codigo || 'ATENDENTE';
        const at = await Atendente.findById(quem.atendenteId).select('nome codigo').lean().catch(() => null);
        nome = at?.nome || codigo;
      }
      await LogAcao.create({
        tipo: atendente ? 'atendente' : 'superadmin',
        atendenteId: atendente ? quem.atendenteId : null,
        atendenteCod: codigo,
        atendenteNome: nome,
        acao: isLogin && falhou ? 'LOGIN_RECUSADO' : info.acao,
        modulo: info.modulo,
        detalhe: isLogin && falhou ? 'Senha ou usuario incorretos' : info.detalhe,
        alvo: info.alvo,
        bloqueada: isLogin && falhou,
        ip,
        userAgent,
      });
    } catch (err) {
      console.error('[AUDIT-LOG]', err.message);
    }
  });
  return next();
}
