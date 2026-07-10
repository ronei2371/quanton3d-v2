import Cliente from '../models/Cliente.js';

function validarTelefone(tel) {
  const digitos = String(tel || '').replace(/\D/g, '');
  if (digitos.length < 10 || digitos.length > 11) return false;
  const ddd = parseInt(digitos.slice(0, 2), 10);
  if (ddd < 11 || ddd > 99) return false;
  if (/^(\d)\1+$/.test(digitos)) return false;
  if (digitos === '12345678900' || digitos === '1234567890') return false;
  return true;
}

function validarEmail(email) {
  const e = String(email || '').trim();
  const regex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(e)) return false;
  const dominiosInvalidos = ['teste.com', 'test.com', 'email.com', 'exemplo.com', 'asdf.com', 'xxx.com'];
  const dominio = e.split('@')[1]?.toLowerCase();
  if (dominiosInvalidos.includes(dominio)) return false;
  return true;
}

export async function criarCliente(req, res) {
  const { nome, telefone, email, origem, observacao } = req.body || {};

  if (!nome || !telefone) {
    return res.status(400).json({ success: false, error: 'Nome e telefone são obrigatórios' });
  }

  if (String(nome).trim().length < 2) {
    return res.status(400).json({ success: false, error: 'Nome inválido.' });
  }

  if (!validarTelefone(telefone)) {
    return res.status(400).json({ success: false, error: 'Telefone inválido. Use DDD + número (ex: 31987654321).' });
  }

  if (email && !validarEmail(email)) {
    return res.status(400).json({ success: false, error: 'E-mail inválido.' });
  }

  const cliente = await Cliente.create({ nome: nome.trim(), telefone, email, origem, observacao });
  res.status(201).json({ success: true, data: cliente });
}

export async function listarClientes(req, res) {
  const { startDate, endDate, search } = req.query || {};
  const limite = Math.min(500, Math.max(1, Number.parseInt(req.query?.limit, 10) || 200));
  const f = {};
  if (startDate || endDate) {
    f.createdAt = {};
    if (startDate) f.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
    if (endDate) f.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
  }
  if (search) {
    const r = new RegExp(String(search), 'i');
    f.$or = [{ nome: r }, { telefone: r }, { email: r }, { origem: r }];
  }
  const [total, clientes] = await Promise.all([
    Cliente.countDocuments(f),
    Cliente.find(f).sort({ createdAt: -1 }).limit(limite).lean(),
  ]);
  res.json({ success: true, data: clientes, total });
}

// Excluir cliente — usado na limpeza de dados de teste
export async function excluirCliente(req, res) {
  try {
    const { id } = req.params;
    const deletado = await Cliente.findByIdAndDelete(id);
    if (!deletado) return res.status(404).json({ success: false, error: 'Cliente não encontrado' });
    res.json({ success: true, message: 'Cliente excluído' });
  } catch (err) {
    console.error('[EXCLUIR CLIENTE]', err);
    res.status(500).json({ success: false, error: 'Erro ao excluir cliente' });
  }
}

// Excluir múltiplos clientes de uma vez — limpeza em lote
export async function excluirClientesEmLote(req, res) {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ success: false, error: 'Lista de IDs vazia' });
    }
    const resultado = await Cliente.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, excluidos: resultado.deletedCount });
  } catch (err) {
    console.error('[EXCLUIR CLIENTES LOTE]', err);
    res.status(500).json({ success: false, error: 'Erro ao excluir clientes' });
  }
}
