// Regras de criacao/edicao das sugestoes de conhecimento do IAQ3D.
// Sugestao aprovada entra na busca do bot (services/rag.js -> retrieveApprovedSuggestions).

export const CATEGORIAS_SUGESTAO = ["resina", "impressora", "problema", "dica", "negocio", "outro"];
export const LIMITE_TITULO = 200;
export const LIMITE_CONTEUDO = 8000;

function texto(valor) {
  return typeof valor === "string" ? valor.trim() : "";
}

// Monta o documento novo. Atendente sempre fica como "pendente".
// Admin (superadmin) pode mandar aprovarDireto=true: entra ja aprovado (aba "Adicionar conhecimento").
export function dadosNovaSugestao(body = {}, usuario = {}) {
  const titulo = texto(body.titulo);
  const conteudo = texto(body.conteudo);
  if (!titulo || !conteudo) return { erro: "Título e conteúdo são obrigatórios." };
  if (titulo.length > LIMITE_TITULO) return { erro: `Título muito longo (máximo ${LIMITE_TITULO} caracteres).` };
  if (conteudo.length > LIMITE_CONTEUDO) return { erro: `Conteúdo muito longo (máximo ${LIMITE_CONTEUDO} caracteres).` };

  const ehAdmin = usuario.tipo === "superadmin";
  const categoria = CATEGORIAS_SUGESTAO.includes(body.categoria) ? body.categoria : "outro";
  const dados = {
    codigoAtendente: ehAdmin ? texto(body.codigoAtendente) || "ADMIN" : usuario.cod || texto(body.codigoAtendente) || "ATENDENTE",
    nomeAtendente: ehAdmin ? texto(body.nomeAtendente) || "Administrador" : usuario.nome || texto(body.nomeAtendente),
    categoria,
    titulo,
    conteudo,
  };
  if (ehAdmin && body.aprovarDireto === true) {
    dados.status = "aprovado";
    dados.observacaoAdmin = "Adicionado direto pelo ADM";
  }
  return { dados };
}

// Monta a atualizacao do PATCH /:id/status. Aceita tambem conteudo/titulo/categoria editados
// (antes o "Aprovar com edição" mandava o texto novo e o servidor ignorava).
export function dadosAtualizacaoSugestao(body = {}) {
  const { status } = body;
  if (!["aprovado", "rejeitado"].includes(status)) return { erro: "Status inválido." };
  const dados = { status, observacaoAdmin: texto(body.observacaoAdmin) };

  if (body.conteudo !== undefined) {
    const conteudo = texto(body.conteudo);
    if (!conteudo) return { erro: "O conteúdo não pode ficar vazio." };
    if (conteudo.length > LIMITE_CONTEUDO) return { erro: `Conteúdo muito longo (máximo ${LIMITE_CONTEUDO} caracteres).` };
    dados.conteudo = conteudo;
  }
  if (body.titulo !== undefined) {
    const titulo = texto(body.titulo);
    if (!titulo) return { erro: "O título não pode ficar vazio." };
    if (titulo.length > LIMITE_TITULO) return { erro: `Título muito longo (máximo ${LIMITE_TITULO} caracteres).` };
    dados.titulo = titulo;
  }
  if (body.categoria !== undefined && CATEGORIAS_SUGESTAO.includes(body.categoria)) {
    dados.categoria = body.categoria;
  }
  // Mantem a observacao antiga quando so o texto foi editado
  if (body.observacaoAdmin === undefined) delete dados.observacaoAdmin;
  return { dados };
}
