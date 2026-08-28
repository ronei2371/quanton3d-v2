/* eslint-disable no-unused-vars, no-empty */
import React, { useCallback, useEffect, useState, useRef } from "react";
import api from "../../lib/api";
import "./admin-legacy.css";

const CAMPOS_CONFIGURACAO_GALERIA = [
  { name: "alturaCamada", label: "Altura camada", placeholder: "Ex.: 0,050 mm" },
  { name: "camadasBase", label: "Camadas de base", placeholder: "Ex.: 4" },
  { name: "exposicaoNormal", label: "Tempo exposição", placeholder: "Ex.: 2,100 s" },
  { name: "exposicaoBase", label: "Tempo exposição base", placeholder: "Ex.: 37,000 s" },
  { name: "contagemTransicao", label: "Contagem de transição", placeholder: "Ex.: 0" },
  { name: "tipoTransicao", label: "Tipo de transição", placeholder: "Ex.: Linear" },
  { name: "retardoDesligarUV", label: "Retardo desligar UV", placeholder: "Ex.: 2,000 s" },
  { name: "distElevacaoInferior", label: "Dist. elevação inferior", placeholder: "Ex.: 11,000 mm" },
  { name: "distElevacao", label: "Distância elevação", placeholder: "Ex.: 11,000 mm" },
  { name: "distRetracao", label: "Distância de retração", placeholder: "Ex.: 11,000 mm" },
  { name: "velElevacaoInferior", label: "Vel. elevação inferior", placeholder: "Ex.: 140,000 mm/min" },
  { name: "velElevacao", label: "Vel. elevação", placeholder: "Ex.: 140,000 mm/min" },
  { name: "velRetracaoInferior", label: "Vel. retração inferior", placeholder: "Ex.: 135,000 mm/min" },
  { name: "velRetracao", label: "Vel. retração", placeholder: "Ex.: 135,000 mm/min" },
];

function formatarDataHora(data) {
  if (!data) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(data));
}
function escaparHtml(texto) {
  const mapa = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return texto.replace(/[&<>"']/g, (c) => mapa[c]);
}
function formatarMarkdown(texto) {
  const seguro = escaparHtml(texto);
  return seguro
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code style=\"background:rgba(255,255,255,0.12);padding:2px 6px;border-radius:4px;font-size:0.88em\">$1</code>")
    .replace(/\n{2,}/g, "</p><p style=\"margin:8px 0\">")
    .replace(/\n/g, "<br/>");
}

export function AdminContent({ tokenAtendente }) {
  const [credenciais, setCredenciais] = useState({ user: "", password: "" });
  const [token, setToken] = useState(() => {
    if (tokenAtendente) return tokenAtendente;
    return localStorage.getItem("quanton3d_admin_token") || "";
  });
  const [aba, setAba] = useState("dashboard");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [dados, setDados] = useState({ clientes: [], formulacoes: [], chamados: [], mensagens: [], galeria: [], conversas: [], parceiros: [], totais: { width: "min(1100px, calc(100vw - 20px))", maxHeight: "calc(100vh - 30px)" } });
  const [filtroGaleria, setFiltroGaleria] = useState({ status: "pendente", dataInicio: "", dataFim: "" });
  const [salvandoId, setSalvandoId] = useState("");
  const [diagnostico, setDiagnostico] = useState({});
  const [novoParam, setNovoParam] = useState({ resina:"", impressora:"", alturaCamada:"", exposicaoNormal:"", exposicaoBase:"", camadasBase:"", codigoChitubox:"", liftSpeed:"", retractSpeed:"", confianca:"oficial" });
  const [salvandoParam, setSalvandoParam] = useState(false);
  const [msgParam, setMsgParam] = useState("");
  const [parametrosAdm, setParametrosAdm] = useState([]);
  const [buscaParam, setBuscaParam] = useState("");
  const [editandoParam, setEditandoParam] = useState(null); // id do parametro em edicao
  const [paramEdit, setParamEdit] = useState({}); // dados sendo editados
  const [sugestoesElio, setSugestoesElio] = useState([]);

  async function entrar(e) {
    e.preventDefault(); setErro("");
    try {
      setCarregando(true);
      const res = await api.post("/admin/login", credenciais);
      const novoToken = res.data?.token || "";
      if (!novoToken) { setErro("Login nao retornou token."); return; }
      localStorage.setItem("quanton3d_admin_token", novoToken);
      setToken(novoToken);
    } catch (err) { setErro(err?.response?.data?.error || "Credenciais invalidas."); }
    finally { setCarregando(false); }
  }

  const carregarDados = useCallback(async () => {
    if (!token) return;
    try {
      setCarregando(true); setErro("");
      const headers = { Authorization: "Bearer " + token };
      const [metricas, galeria, todosParams] = await Promise.all([
        api.get("/admin/metrics", { headers }),
        api.get("/gallery/admin", { headers, params: filtroGaleria }),
        api.get("/parametros", { headers }),
      ]);
      const listaParams = Array.isArray(todosParams.data?.data) ? todosParams.data.data : [];
      setParametrosAdm(listaParams);
      const m = metricas.data;
      let chamados = [];
      try { const r = await api.get("/bot-tickets", { headers }); chamados = Array.isArray(r.data?.botTickets) ? r.data.botTickets : []; } catch (_) {}
      let mensagens = [];
      try { const r = await api.get("/contact-messages", { headers }); mensagens = Array.isArray(r.data?.contactMessages) ? r.data.contactMessages : []; } catch (_) {}
      let parceiros = [];
      try { const r = await api.get("/partner-requests", { headers }); parceiros = Array.isArray(r.data?.partnerRequests) ? r.data.partnerRequests : []; } catch (_) {}
      // Formulações podem vir da métrica OU da rota direta
      let formulacoes = m.formulacoes || [];
      if (!formulacoes.length) {
        try {
          const fResp = await api.get("/formulacoes", { headers: { Authorization: "Bearer " + token } });
          formulacoes = Array.isArray(fResp.data?.data) ? fResp.data.data : [];
        } catch (_) {}
      }
      let conversas = [];
      try {
        const cResp = await api.get("/conversas", { headers, params: { limit: 100 } });
        conversas = Array.isArray(cResp.data?.data) ? cResp.data.data : [];
      } catch (_) {}
      const clientesCarregados = Array.isArray(m.clientes) ? m.clientes : [];
      carregarAtendentes();
      carregarLogs();
      try { const sResp = await api.get("/sugestoes-conhecimento", { headers }); setSugestoesElio(sResp.data?.sugestoes || []); } catch(_) {}
      setDados({ clientes: clientesCarregados, formulacoes, chamados, mensagens, galeria: Array.isArray(galeria.data?.data) ? galeria.data.data : [], conversas, parceiros, totais: m.totals || {} });
    } catch (err) {
      if (err?.response?.status === 401) { localStorage.removeItem("quanton3d_admin_token"); setToken(""); }
      setErro(err?.response?.data?.error || "Erro ao carregar dados.");
    } finally { setCarregando(false); }
  }, [token, filtroGaleria]);

  useEffect(() => { if (!token) return; const t = setTimeout(carregarDados, 0); return () => clearTimeout(t); }, [carregarDados, token]);

  async function atualizarGaleria(id, acao, extra) {
    try {
      setSalvandoId(id);
      await api.patch("/gallery/" + id + "/" + acao, extra || null, { headers: { Authorization: "Bearer " + token } });
      await carregarDados();
    } catch (err) { setErro(err?.response?.data?.error || "Erro ao atualizar."); }
    finally { setSalvandoId(""); }
  }

  async function salvarParametro() {
    if (!novoParam.resina.trim() || !novoParam.impressora.trim()) { setMsgParam("Resina e impressora são obrigatórias."); return; }
    try {
      setSalvandoParam(true); setMsgParam("");
      await api.post("/parametros", novoParam, { headers: { Authorization: "Bearer " + token } });
      setMsgParam("✅ Parâmetro salvo com sucesso!");
      setNovoParam({ resina:"", impressora:"", alturaCamada:"", exposicaoNormal:"", exposicaoBase:"", camadasBase:"", codigoChitubox:"", liftSpeed:"", retractSpeed:"", confianca:"oficial" });
      await carregarDados();
    } catch (err) { setMsgParam("❌ Erro ao salvar: " + (err?.response?.data?.error || err.message)); }
    finally { setSalvandoParam(false); }
  }

  async function deletarParametro(id) {
    if (!window.confirm("Confirma exclusão deste parâmetro?")) return;
    try {
      await api.delete("/parametros/" + id, { headers: { Authorization: "Bearer " + token } });
      setParametrosAdm(prev => prev.filter(p => p._id !== id));
    } catch (err) { setMsgParam("❌ Erro ao excluir."); }
  }

  function iniciarEdicaoParam(p) {
    setEditandoParam(p._id);
    setParamEdit({
      resina: p.resina || "", impressora: p.impressora || "",
      alturaCamada: p.alturaCamada || "", exposicaoNormal: p.exposicaoNormal || "",
      exposicaoBase: p.exposicaoBase || "", camadasBase: p.camadasBase || "",
      liftSpeed: p.liftSpeed || "", retractSpeed: p.retractSpeed || "",
      codigoChitubox: p.codigoChitubox || "", confianca: p.confianca || "oficial",
    });
  }

  function cancelarEdicaoParam() {
    setEditandoParam(null);
    setParamEdit({});
  }

  async function salvarEdicaoParam(id) {
    if (!paramEdit.resina?.trim() || !paramEdit.impressora?.trim()) { setMsgParam("Resina e impressora são obrigatórias."); return; }
    try {
      setSalvandoParam(true); setMsgParam("");
      await api.patch("/parametros/" + id, paramEdit, { headers: { Authorization: "Bearer " + token } });
      setMsgParam("✅ Parâmetro atualizado com sucesso!");
      setEditandoParam(null);
      setParamEdit({});
      await carregarDados();
    } catch (err) { setMsgParam("❌ Erro ao atualizar: " + (err?.response?.data?.error || err.message)); }
    finally { setSalvandoParam(false); }
  }

  const [edicaoConversa, setEdicaoConversa] = useState({}); // { [id]: textoEditado }
  const [salvandoConversa, setSalvandoConversa] = useState("");
  const [filtroConversas, setFiltroConversas] = useState("todas");

  const [atendentes, setAtendentes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [novoAt, setNovoAt] = useState({ nome: "", email: "", senha: "", permissoes: { acessoAdmCompleto: false, mudarStatusChamados: true, sugerirConhecimento: true, aprovarGaleria: false, acessarMetricas: false } });
  const [editandoPerms, setEditandoPerms] = useState(null);
  const [criandoAt, setCriandoAt] = useState(false);
  const [filtroClienteConv, setFiltroClienteConv] = useState("");

  const [buscaCliente, setBuscaCliente] = useState("");
  const [filtroOrigem, setFiltroOrigem] = useState("");
  const [clienteExpandido, setClienteExpandido] = useState("");
  const [contatoCopiado, setContatoCopiado] = useState("");
  const [clientesSelecionados, setClientesSelecionados] = useState([]);
  const [excluindoClientes, setExcluindoClientes] = useState(false);
  const [filtroVisitasInicio, setFiltroVisitasInicio] = useState("");
  const [filtroVisitasFim, setFiltroVisitasFim] = useState("");
  const [relatorioVisitas, setRelatorioVisitas] = useState(null);
  const [carregandoVisitas, setCarregandoVisitas] = useState(false);

  async function buscarRelatorioVisitas() {
    try {
      setCarregandoVisitas(true);
      const params = {};
      if (filtroVisitasInicio) params.startDate = filtroVisitasInicio;
      if (filtroVisitasFim) params.endDate = filtroVisitasFim;
      const res = await api.get("/visitas/relatorio", { headers: { Authorization: "Bearer " + token }, params });
      setRelatorioVisitas(res.data);
    } catch (err) {
      alert("Erro ao gerar relatório de visitas.");
    } finally {
      setCarregandoVisitas(false);
    }
  }

  async function excluirClientesSelecionados() {
    if (!clientesSelecionados.length) return;
    if (!window.confirm(`Excluir ${clientesSelecionados.length} cliente(s) selecionado(s)? Essa ação não pode ser desfeita.`)) return;
    try {
      setExcluindoClientes(true);
      await api.delete("/clientes/lote", { headers: { Authorization: "Bearer " + token }, data: { ids: clientesSelecionados } });
      setClientesSelecionados([]);
      await carregarDados();
    } catch (err) {
      alert("Erro ao excluir clientes selecionados.");
    } finally {
      setExcluindoClientes(false);
    }
  }

  async function salvarMelhoriaConversa(id) {
    try {
      setSalvandoConversa(id);
      const respostaMelhorada = edicaoConversa[id] || "";
      await api.patch("/conversas/" + id + "/salvar-melhoria", { respostaMelhorada }, { headers: { Authorization: "Bearer " + token } });
      await carregarDados();
    } catch (err) { alert("Erro ao salvar melhoria."); }
    finally { setSalvandoConversa(""); }
  }

  async function aprovarConversa(id) {
    try {
      setSalvandoConversa(id);
      const respostaMelhorada = edicaoConversa[id] || "";
      await api.patch("/conversas/" + id + "/aprovar", { respostaMelhorada, revisadoPor: "Admin" }, { headers: { Authorization: "Bearer " + token } });
      await carregarDados();
    } catch (err) { alert("Erro ao aprovar conversa."); }
    finally { setSalvandoConversa(""); }
  }

  async function desaprovarConversa(id) {
    try {
      setSalvandoConversa(id);
      await api.patch("/conversas/" + id + "/desaprovar", {}, { headers: { Authorization: "Bearer " + token } });
      await carregarDados();
    } catch (err) { alert("Erro ao desaprovar."); }
    finally { setSalvandoConversa(""); }
  }

  async function excluirConversa(id) {
    if (!window.confirm("Excluir esta conversa do histórico?")) return;
    try {
      await api.delete("/conversas/" + id, { headers: { Authorization: "Bearer " + token } });
      setDados(d => ({ ...d, conversas: d.conversas.filter(c => c._id !== id) }));
    } catch (err) { alert("Erro ao excluir."); }
  }

  async function marcarFeedbackRevisado(id) {
    try {
      await api.patch("/conversas/" + id + "/revisar-feedback", {}, { headers: { Authorization: "Bearer " + token } });
      await carregarDados();
    } catch (err) { alert("Erro ao marcar como revisado."); }
  }

  async function copiarContato(c) {
    const texto = `${c.nome || "Sem nome"}\n📱 ${c.telefone || "-"}\n✉️ ${c.email || "-"}\n🔗 ${c.origem || "-"}`;
    try { await navigator.clipboard.writeText(texto); }
    catch (_) { const a = document.createElement("textarea"); a.value = texto; document.body.appendChild(a); a.select(); document.execCommand("copy"); document.body.removeChild(a); }
    setContatoCopiado(c._id);
    setTimeout(() => setContatoCopiado(""), 2000);
  }

  async function carregarAtendentes() {
    try {
      const r = await api.get("/atendentes", { headers: { Authorization: "Bearer " + token } });
      setAtendentes(r.data?.atendentes || []);
    } catch (err) { console.error("Erro ao carregar atendentes:", err); }
  }

  async function carregarLogs() {
    try {
      const r = await api.get("/atendentes/logs?limit=200", { headers: { Authorization: "Bearer " + token } });
      setLogs(r.data?.logs || []);
    } catch (err) { console.error("Erro ao carregar logs:", err); }
  }

  async function criarAtendente() {
    if (!novoAt.nome || !novoAt.email || !novoAt.senha) {
      setErro("Preencha nome, email e senha."); return;
    }
    try {
      setCriandoAt(true);
      await api.post("/atendentes", novoAt, { headers: { Authorization: "Bearer " + token } });
      setNovoAt({ nome: "", email: "", senha: "", permissoes: { acessoAdmCompleto: false, mudarStatusChamados: true, sugerirConhecimento: true, aprovarGaleria: false, acessarMetricas: false } });
      await carregarAtendentes();
      setErro("");
    } catch (err) { setErro(err?.response?.data?.error || "Erro ao criar atendente."); }
    finally { setCriandoAt(false); }
  }

  async function toggleAtendente(id, ativo) {
    try {
      await api.patch("/atendentes/" + id + "/status", { ativo }, { headers: { Authorization: "Bearer " + token } });
      await carregarAtendentes();
    } catch (err) { setErro("Erro ao atualizar atendente."); }
  }

  const [sessoesAberta, setSessoesAberta] = useState(null);
  const [sessoesData, setSessoesData] = useState({});
  async function verSessoes(id) {
    if (sessoesAberta === id) { setSessoesAberta(null); return; }
    try {
      const r = await api.get("/atendentes/" + id + "/sessoes", { headers: { Authorization: "Bearer " + token } });
      setSessoesData(prev => ({ ...prev, [id]: r.data?.atendente || {} }));
      setSessoesAberta(id);
    } catch(e) { alert("Erro ao carregar sessões"); }
  }

  async function atualizarStatusMensagem(id, status) {
    try {
      await api.patch("/contact-messages/" + id + "/status", { status }, { headers: { Authorization: "Bearer " + token } });
      await carregarDados();
    } catch (err) { setErro(err?.response?.data?.error || "Erro ao atualizar mensagem."); }
  }

  async function atualizarStatusParceiro(id, status) {
    try {
      await api.patch("/partner-requests/" + id + "/status", { status }, { headers: { Authorization: "Bearer " + token } });
      await carregarDados();
    } catch (err) { alert("Erro ao atualizar status do parceiro."); }
  }

  const [legendaCopiadaId, setLegendaCopiadaId] = useState("");

  function montarLegenda(item) {
    const redes = item.redesSociais || {};
    const marcacoes = [redes.instagram, redes.tiktok, redes.facebook, redes.youtube].filter(Boolean).join(" ");
    const nomeOuMarcacao = marcacoes || item.nome || "nosso cliente";
    const resina = item.resina || "resina Quanton3D";
    const impressora = item.impressora ? ` na ${item.impressora}` : "";

    const hashtagResina = "#" + String(resina).replace(/[^a-zA-Z0-9À-ÿ]/g, "");

    return [
      `Peça feita por ${nomeOuMarcacao} usando ${resina}${impressora}! 🔥`,
      ``,
      `Configuração completa e mais dicas no nosso site: quanton3d.com.br`,
      ``,
      `#Quanton3D #Resina3D #Impressao3D ${hashtagResina} #Maker3D`,
    ].join("\n");
  }

  async function copiarLegenda(item) {
    const texto = montarLegenda(item);
    try {
      await navigator.clipboard.writeText(texto);
    } catch (_) {
      // Fallback pra navegadores sem permissão de clipboard
      const area = document.createElement("textarea");
      area.value = texto;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      document.body.removeChild(area);
    }
    setLegendaCopiadaId(item._id);
    setTimeout(() => setLegendaCopiadaId(""), 2500);
  }

  function sair() { localStorage.removeItem("quanton3d_admin_token"); setToken(""); }

  const CARD = ({ children }) => (
    <div style={{ border: "1px solid rgba(113,159,219,0.2)", borderRadius: "14px", padding: "14px", background: "rgba(255,255,255,0.04)", marginBottom: "10px" }}>{children}</div>
  );
  const BADGE = ({ status }) => {
    const cor = ["aprovado","fechado","resolvido"].includes(status) ? "#0aff87" : ["recusado","rejeitado"].includes(status) ? "#d73c3c" : status === "respondido" ? "#0092ff" : "#dc913c";
    const LABELS = { novo: "🆕 Novo", em_analise: "🔍 Em análise", respondido: "📞 Respondido", fechado: "✅ Fechado", pendente: "⏳ Pendente", em_contato: "📞 Em contato", resolvido: "✅ Resolvido", impossivel: "❌ Não é possível", aprovado: "✅ Aprovado", recusado: "❌ Recusado", rejeitado: "❌ Rejeitado" };
    return <span style={{ fontSize: "0.75rem", padding: "2px 10px", borderRadius: "999px", border: "1px solid " + cor + "44", background: cor + "18", color: cor, fontWeight: 800 }}>{LABELS[status] || status || "⏳ Pendente"}</span>;
  };

  if (!token) {
    return (
      <form className="admin-gallery-login" onSubmit={entrar}>
        <p>Painel administrativo Quanton3D. Entre com suas credenciais.</p>
        {erro && <div className="modal-error">{erro}</div>}
        <label><span>Usuario</span><input value={credenciais.user} onChange={(e) => setCredenciais((a) => ({ ...a, user: e.target.value }))} autoComplete="username" /></label>
        <label><span>Senha</span><input type="password" value={credenciais.password} onChange={(e) => setCredenciais((a) => ({ ...a, password: e.target.value }))} autoComplete="current-password" /></label>
        <button type="submit" className="submit-registration" disabled={carregando}>{carregando ? "Entrando..." : "Entrar no ADM"}</button>
      </form>
    );
  }

  const ABAS_ADM = [
    { id: "dashboard",    label: "Dashboard",    icon: "🏠", count: null },
    { id: "metricas",     label: "Métricas",     icon: "📊", count: null },
    { id: "clientes", label: "Clientes", icon: "👥", count: dados.clientes.length },
    { id: "chamados", label: "Chamados", icon: "🔧", count: dados.chamados.length },
    { id: "mensagens", label: "Mensagens", icon: "✉️", count: dados.mensagens.length },
    { id: "formulacoes", label: "Formulações", icon: "🧪", count: dados.formulacoes.length },
    { id: "galeria", label: "Galeria", icon: "📸", count: dados.galeria.length },
    { id: "parceiros", label: "Parceiros", icon: "🤝", count: dados.parceiros?.length || 0 },
    { id: "conversas", label: "Conversas Bot", icon: "🤖", count: dados.conversas?.length || 0 },
    { id: "parametros_adm", label: "Parâmetros", icon: "⚙️", count: null },
    { id: "atendentes", label: "Atendentes", icon: "👨‍💼", count: null },
    { id: "logs", label: "Logs", icon: "📋", count: null },
    { id: "sugestoes_elio", label: "Sugestões Assistente", icon: "💡", count: sugestoesElio.filter(s => s.status === "pendente").length },
    { id: "limpeza", label: "Limpeza", icon: "🧹", count: null },
  ];

  return (
    <div className="admin-gallery-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "8px", width: "100%", marginBottom: "8px" }}>
          {ABAS_ADM.map((a) => (
            <button key={a.id} type="button" onClick={() => setAba(a.id)}
              style={{
                padding: "10px 8px", borderRadius: "12px", fontSize: "0.72rem",
                border: aba === a.id ? "2px solid #0092ff" : "1px solid rgba(113,159,219,0.2)",
                background: aba === a.id ? "linear-gradient(135deg,rgba(37,99,235,0.3),rgba(124,58,237,0.3))" : "rgba(255,255,255,0.04)",
                color: aba === a.id ? "#0092ff" : "#9fb4c7",
                cursor: "pointer", fontWeight: aba === a.id ? "900" : "600",
                fontFamily: "inherit", display: "flex", flexDirection: "column",
                alignItems: "center", gap: "4px", transition: "all 0.2s",
                boxShadow: aba === a.id ? "0 4px 16px rgba(79,209,255,0.2)" : "none"
              }}>
              <span style={{ fontSize: "1.4rem", position: "relative" }}>
                {a.icon}
                {a.id === "sugestoes_elio" && sugestoesElio.filter(s => s.status === "pendente").length > 0 && (
                  <span style={{ position: "absolute", top: "-4px", right: "-8px", background: "#ff4444", color: "#fff", borderRadius: "999px", fontSize: "0.55rem", fontWeight: 900, padding: "1px 5px", lineHeight: 1.4 }}>
                    {sugestoesElio.filter(s => s.status === "pendente").length}
                  </span>
                )}
              </span>
              <span style={{ color: aba === a.id ? "#0092ff" : "#9fb4c7", fontSize: "0.7rem", fontWeight: 800, textAlign: "center", lineHeight: 1.2 }}>{a.label}</span>
              {a.count !== null && <span style={{ fontSize: "0.65rem", color: aba === a.id ? "#0092ff" : "#6b8aad", fontWeight: 700 }}>({a.count})</span>}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button type="button" onClick={carregarDados} disabled={carregando} style={{ padding: "7px 13px", borderRadius: "10px", border: "1px solid rgba(113,159,219,0.3)", background: "rgba(255,255,255,0.05)", color: "white", cursor: "pointer", fontSize: "0.82rem" }}>{carregando ? "..." : "Atualizar"}</button>
          <button type="button" onClick={sair} style={{ padding: "7px 13px", borderRadius: "10px", border: "1px solid rgba(255,107,107,0.4)", background: "rgba(255,107,107,0.1)", color: "#d73c3c", cursor: "pointer", fontSize: "0.82rem" }}>Sair</button>
        </div>
      </div>
      {erro && <div className="modal-error">{erro}</div>}
      {carregando && <div style={{ textAlign: "center", color: "#9fb4c7", padding: "20px" }}>Carregando...</div>}

      {aba === "dashboard" && (
        <div>
          {/* Saudação */}
          <div style={{ background: "linear-gradient(135deg, rgba(21,101,192,0.25), rgba(123,31,162,0.2))", border: "1px solid rgba(79,209,255,0.2)", borderRadius: "16px", padding: "20px 24px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "2.5rem" }}>👋</span>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 900, color: "#eaf7ff" }}>
                Bem-vindo ao Painel Quanton3D!
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#9fb4c7" }}>
                {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* Cards de resumo */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "20px" }}>
            {[
              { icon: "👥", label: "Clientes", valor: dados.clientes.length, cor: "#0092ff", bg: "rgba(79,209,255,0.08)", border: "rgba(79,209,255,0.2)", aba: "clientes" },
              { icon: "🔧", label: "Chamados", valor: dados.chamados.filter(c => c.status !== "fechado").length, cor: "#dc913c", bg: "rgba(255,209,102,0.08)", border: "rgba(255,209,102,0.2)", aba: "chamados", suffix: " abertos" },
              { icon: "✉️", label: "Mensagens", valor: dados.mensagens.length, cor: "#9650f5", bg: "rgba(184,156,255,0.08)", border: "rgba(184,156,255,0.2)", aba: "mensagens" },
              { icon: "🧪", label: "Formulações", valor: dados.formulacoes.length, cor: "#0aff87", bg: "rgba(73,230,139,0.08)", border: "rgba(73,230,139,0.2)", aba: "formulacoes" },
              { icon: "📸", label: "Galeria", valor: dados.galeria.filter(g => g.status === "pendente").length, cor: "#d73c3c", bg: "rgba(255,143,171,0.08)", border: "rgba(255,143,171,0.2)", aba: "galeria", suffix: " pendentes" },
              { icon: "💡", label: "Sugestões Assistente", valor: sugestoesElio.filter(s => s.status === "pendente").length, cor: "#dc913c", bg: "rgba(255,209,102,0.08)", border: "rgba(255,209,102,0.2)", aba: "sugestoes_elio", suffix: " pendentes" },
            ].map(item => (
              <button key={item.aba} type="button" onClick={() => setAba(item.aba)}
                style={{ background: item.bg, border: `1px solid ${item.border}`, borderRadius: "14px", padding: "16px 14px", textAlign: "center", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
                <div style={{ fontSize: "1.6rem", marginBottom: "6px" }}>{item.icon}</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 900, color: item.cor, lineHeight: 1 }}>{item.valor}</div>
                <div style={{ fontSize: "0.72rem", color: "#9fb4c7", marginTop: "4px", fontWeight: 600 }}>{item.label}{item.suffix || ""}</div>
              </button>
            ))}
          </div>

          {/* Alertas de pendências */}
          {(dados.chamados.filter(c => c.status === "novo").length > 0 || sugestoesElio.filter(s => s.status === "pendente").length > 0 || dados.galeria.filter(g => g.status === "pendente").length > 0) && (
            <div style={{ background: "rgba(255,209,102,0.05)", border: "1px solid rgba(255,209,102,0.2)", borderRadius: "14px", padding: "16px 20px", marginBottom: "20px" }}>
              <p style={{ fontWeight: 800, color: "#dc913c", fontSize: "0.88rem", margin: "0 0 10px" }}>⚠️ Itens que precisam da sua atenção:</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {dados.chamados.filter(c => c.status === "novo").length > 0 && (
                  <button type="button" onClick={() => setAba("chamados")}
                    style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,209,102,0.08)", border: "1px solid rgba(255,209,102,0.2)", borderRadius: "10px", padding: "10px 14px", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                    <span style={{ fontSize: "1.1rem" }}>🔧</span>
                    <span style={{ color: "#dc913c", fontWeight: 700, fontSize: "0.85rem" }}>{dados.chamados.filter(c => c.status === "novo").length} chamado(s) novo(s) aguardando atendimento</span>
                    <span style={{ marginLeft: "auto", color: "#dc913c", fontSize: "0.8rem" }}>Ver →</span>
                  </button>
                )}
                {sugestoesElio.filter(s => s.status === "pendente").length > 0 && (
                  <button type="button" onClick={() => setAba("sugestoes_elio")}
                    style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(79,209,255,0.08)", border: "1px solid rgba(79,209,255,0.2)", borderRadius: "10px", padding: "10px 14px", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                    <span style={{ fontSize: "1.1rem" }}>💡</span>
                    <span style={{ color: "#0092ff", fontWeight: 700, fontSize: "0.85rem" }}>{sugestoesElio.filter(s => s.status === "pendente").length} sugestão(ões) de conhecimento aguardando aprovação</span>
                    <span style={{ marginLeft: "auto", color: "#0092ff", fontSize: "0.8rem" }}>Ver →</span>
                  </button>
                )}
                {dados.galeria.filter(g => g.status === "pendente").length > 0 && (
                  <button type="button" onClick={() => setAba("galeria")}
                    style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,143,171,0.08)", border: "1px solid rgba(255,143,171,0.2)", borderRadius: "10px", padding: "10px 14px", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                    <span style={{ fontSize: "1.1rem" }}>📸</span>
                    <span style={{ color: "#d73c3c", fontWeight: 700, fontSize: "0.85rem" }}>{dados.galeria.filter(g => g.status === "pendente").length} foto(s) da galeria aguardando aprovação</span>
                    <span style={{ marginLeft: "auto", color: "#d73c3c", fontSize: "0.8rem" }}>Ver →</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Últimos clientes */}
          {dados.clientes.length > 0 && (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(79,209,255,0.1)", borderRadius: "14px", padding: "16px 20px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <p style={{ fontWeight: 800, color: "#0092ff", fontSize: "0.88rem", margin: 0 }}>👥 Últimos clientes cadastrados</p>
                <button type="button" onClick={() => setAba("clientes")}
                  style={{ fontSize: "0.75rem", color: "#0092ff", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>Ver todos →</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {dados.clientes.slice(-5).reverse().map(c => (
                  <div key={c._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: "8px", background: "rgba(79,209,255,0.04)", border: "1px solid rgba(79,209,255,0.08)" }}>
                    <div>
                      <span style={{ fontWeight: 700, color: "#eaf3ff", fontSize: "0.85rem" }}>{c.nome}</span>
                      <span style={{ color: "#9fb4c7", fontSize: "0.75rem", marginLeft: "10px" }}>📱 {c.telefone}</span>
                    </div>
                    <span style={{ color: "#6b8aad", fontSize: "0.72rem" }}>{new Date(c.createdAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acesso rápido */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(79,209,255,0.1)", borderRadius: "14px", padding: "16px 20px" }}>
            <p style={{ fontWeight: 800, color: "#9fb4c7", fontSize: "0.82rem", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>⚡ Acesso Rápido</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px" }}>
              {[
                { icon: "📊", label: "Ver Métricas", aba: "metricas" },
                { icon: "👨‍💼", label: "Atendentes", aba: "atendentes" },
                { icon: "⚙️", label: "Parâmetros", aba: "parametros" },
                { icon: "🧹", label: "Limpeza", aba: "limpeza" },
              ].map(item => (
                <button key={item.aba} type="button" onClick={() => setAba(item.aba)}
                  style={{ padding: "10px 8px", borderRadius: "10px", border: "1px solid rgba(79,209,255,0.12)", background: "rgba(79,209,255,0.04)", color: "#9fb4c7", cursor: "pointer", fontFamily: "inherit", fontSize: "0.78rem", fontWeight: 700, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", transition: "all 0.2s" }}>
                  <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {aba === "metricas" && (
        <div>
          {/* Relatório de visitantes por período */}
          <div style={{ background: "rgba(184,156,255,0.06)", border: "1px solid rgba(184,156,255,0.2)", borderRadius: "14px", padding: "16px", marginBottom: "16px" }}>
            <p style={{ margin: "0 0 12px", fontWeight: 800, color: "#9650f5", fontSize: "0.85rem" }}>📅 VISITANTES DO SITE POR PERÍODO</p>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "14px" }}>
              <div>
                <label style={{ fontSize: "0.72rem", color: "#9fb4c7", display: "block", marginBottom: "4px" }}>Data inicial</label>
                <input type="date" value={filtroVisitasInicio} onChange={e => setFiltroVisitasInicio(e.target.value)}
                  style={{ padding: "7px 10px", borderRadius: "8px", border: "1px solid rgba(184,156,255,0.25)", background: "rgba(4,10,24,0.7)", color: "#fff", fontSize: "0.82rem" }} />
              </div>
              <div>
                <label style={{ fontSize: "0.72rem", color: "#9fb4c7", display: "block", marginBottom: "4px" }}>Data final</label>
                <input type="date" value={filtroVisitasFim} onChange={e => setFiltroVisitasFim(e.target.value)}
                  style={{ padding: "7px 10px", borderRadius: "8px", border: "1px solid rgba(184,156,255,0.25)", background: "rgba(4,10,24,0.7)", color: "#fff", fontSize: "0.82rem" }} />
              </div>
              <button type="button" onClick={buscarRelatorioVisitas} disabled={carregandoVisitas}
                style={{ padding: "8px 16px", borderRadius: "8px", border: 0, background: "linear-gradient(135deg,#0092ff,#9650f5)", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: "0.8rem" }}>
                {carregandoVisitas ? "Carregando..." : "🔍 Gerar relatório"}
              </button>
            </div>

            {relatorioVisitas && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: "10px", marginBottom: "12px" }}>
                  <div style={{ background: "rgba(184,156,255,0.1)", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                    <span style={{ fontSize: "0.7rem", color: "#9fb4c7", display: "block" }}>Total de visitas</span>
                    <strong style={{ fontSize: "1.6rem", color: "#9650f5" }}>{relatorioVisitas.totalVisitas}</strong>
                  </div>
                  <div style={{ background: "rgba(79,209,255,0.1)", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                    <span style={{ fontSize: "0.7rem", color: "#9fb4c7", display: "block" }}>Visitantes únicos</span>
                    <strong style={{ fontSize: "1.6rem", color: "#0092ff" }}>{relatorioVisitas.visitantesUnicos}</strong>
                  </div>
                  <div style={{ background: "rgba(73,230,139,0.1)", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                    <span style={{ fontSize: "0.7rem", color: "#9fb4c7", display: "block" }}>Média por dia</span>
                    <strong style={{ fontSize: "1.6rem", color: "#0aff87" }}>
                      {relatorioVisitas.porDia.length > 0 ? (relatorioVisitas.visitantesUnicos / relatorioVisitas.porDia.length).toFixed(1) : "0"}
                    </strong>
                  </div>
                </div>

                {relatorioVisitas.porDia.length > 0 ? (
                  <div style={{ maxHeight: "220px", overflowY: "auto", display: "grid", gap: "5px" }}>
                    {relatorioVisitas.porDia.slice().reverse().map(d => (
                      <div key={d.dia} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "7px 12px" }}>
                        <span style={{ color: "#d3e4f8", fontSize: "0.82rem" }}>{new Date(d.dia + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", weekday: "short" })}</span>
                        <span style={{ background: "rgba(184,156,255,0.15)", color: "#9650f5", borderRadius: "999px", padding: "2px 10px", fontSize: "0.78rem", fontWeight: 800 }}>{d.visitantes} visitante{d.visitantes !== 1 ? "s" : ""}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#9fb4c7", fontSize: "0.82rem", margin: 0 }}>Nenhuma visita registrada nesse período.</p>
                )}
              </>
            )}
            {!relatorioVisitas && (
              <p style={{ color: "#8ba3be", fontSize: "0.78rem", margin: 0 }}>Selecione um período e clique em "Gerar relatório" para ver quantas pessoas visitaram o site por dia.</p>
            )}
          </div>

          {/* Clientes cadastrados no período filtrado */}
          {filtroVisitasInicio && relatorioVisitas && (() => {
            const inicio = new Date(filtroVisitasInicio + "T00:00:00");
            const fim = filtroVisitasFim ? new Date(filtroVisitasFim + "T23:59:59") : new Date();
            const clientesPeriodo = dados.clientes.filter(c => {
              const d = new Date(c.createdAt);
              return d >= inicio && d <= fim;
            });
            if (clientesPeriodo.length === 0) return null;
            return (
              <div style={{ background: "rgba(73,230,139,0.05)", border: "1px solid rgba(73,230,139,0.2)", borderRadius: "14px", padding: "14px 16px", marginBottom: "14px" }}>
                <p style={{ margin: "0 0 10px", fontWeight: 800, color: "#0aff87", fontSize: "0.82rem" }}>
                  👥 CLIENTES CADASTRADOS NO PERÍODO ({clientesPeriodo.length})
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {clientesPeriodo.map(c => (
                    <div key={c._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", flexWrap: "wrap", gap: "6px" }}>
                      <span style={{ fontWeight: 700, color: "#eaf3ff", fontSize: "0.85rem" }}>{c.nome || "Sem nome"}</span>
                      <div style={{ display: "flex", gap: "12px", fontSize: "0.75rem", color: "#9fb4c7" }}>
                        <span>📱 {c.telefone || "-"}</span>
                        <span>✉️ {c.email || "-"}</span>
                        <span style={{ color: "#6b8aad" }}>{new Date(c.createdAt).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}


          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "18px" }}>
            {[
              { icon: "👥", label: "Clientes", valor: dados.totais.clientes || 0, cor: "#0092ff" },
              { icon: "🧪", label: "Formulações", valor: dados.totais.formulacoes || 0, cor: "#9650f5" },
              { icon: "📸", label: "Galeria", valor: dados.totais.gallery || 0, cor: "#0aff87" },
              { icon: "📋", label: "Parâmetros", valor: dados.totais.parametros || 0, cor: "#dc913c" },
              { icon: "🔧", label: "Chamados", valor: dados.chamados.length || 0, cor: "#d73c3c" },
              { icon: "✉️", label: "Mensagens", valor: dados.mensagens.length || 0, cor: "#8bd3ff" },
              { icon: "✅", label: "Aprovadas", valor: dados.galeria.filter(g => g.status === "aprovado").length, cor: "#0aff87" },
              { icon: "⏳", label: "Pendentes", valor: dados.galeria.filter(g => g.status === "pendente").length, cor: "#dc913c" },
            ].map((item) => (
              <div key={item.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid " + item.cor + "33", borderRadius: "12px", padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "1.3rem", marginBottom: "4px" }}>{item.icon}</div>
                <p style={{ margin: "0 0 4px", fontSize: "0.7rem", color: "#9fb4c7", fontWeight: 700, textTransform: "uppercase" }}>{item.label}</p>
                <strong style={{ fontSize: "1.7rem", color: item.cor, display: "block", lineHeight: 1 }}>{item.valor}</strong>
              </div>
            ))}
          </div>

          <div style={{ background: "rgba(79,209,255,0.06)", border: "1px solid rgba(79,209,255,0.2)", borderRadius: "14px", padding: "16px", marginBottom: "14px" }}>
            <p style={{ margin: "0 0 12px", fontWeight: 800, color: "#0092ff", fontSize: "0.85rem" }}>📈 INDICADORES DE CONVERSÃO</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }}>
              {[
                { label: "Formulação / Cliente", valor: dados.totais.clientes > 0 ? ((dados.totais.formulacoes / dados.totais.clientes) * 100).toFixed(1) + "%" : "0%", cor: "#0aff87", desc: "Clientes que pediram formulação" },
                { label: "Chamado / Cliente", valor: dados.totais.clientes > 0 ? ((dados.chamados.length / dados.totais.clientes) * 100).toFixed(1) + "%" : "0%", cor: "#d73c3c", desc: "Clientes com chamado técnico" },
                { label: "Aprovação galeria", valor: dados.galeria.length > 0 ? ((dados.galeria.filter(g => g.status === "aprovado").length / dados.galeria.length) * 100).toFixed(1) + "%" : "0%", cor: "#0aff87", desc: "Fotos aprovadas do total" },
                { label: "Chamados abertos", valor: dados.chamados.filter(c => c.status !== "fechado" && c.status !== "resolvido").length, cor: "#dc913c", desc: "Aguardando resolução" },
              ].map(item => (
                <div key={item.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "12px" }}>
                  <p style={{ margin: "0 0 4px", color: "#9fb4c7", fontSize: "0.75rem" }}>{item.label}</p>
                  <strong style={{ color: item.cor, fontSize: "1.4rem", display: "block" }}>{item.valor}</strong>
                  <span style={{ color: "#8ba3be", fontSize: "0.7rem" }}>{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(113,159,219,0.15)", borderRadius: "14px", padding: "16px", marginBottom: "14px" }}>
            <p style={{ margin: "0 0 10px", fontWeight: 800, color: "#eaf3ff", fontSize: "0.85rem" }}>👥 CLIENTES ({dados.clientes.length})</p>
            {dados.clientes.length === 0 ? <p style={{ color: "#9fb4c7", fontSize: "0.85rem", margin: 0 }}>Nenhum cliente ainda.</p> :
              <div style={{ display: "grid", gap: "5px", maxHeight: "260px", overflowY: "auto" }}>
                {dados.clientes.map((c, i) => (
                  <div key={c._id || i} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1.5fr 1fr auto", gap: "8px", alignItems: "center", background: "rgba(79,209,255,0.04)", border: "1px solid rgba(79,209,255,0.1)", borderRadius: "8px", padding: "7px 10px", fontSize: "0.78rem" }}>
                    <span style={{ color: "#eaf3ff", fontWeight: 700 }}>{c.nome || "-"}</span>
                    <span style={{ color: "#9fb4c7" }}>📱 {c.telefone || "-"}</span>
                    <span style={{ color: "#9fb4c7", fontSize: "0.72rem" }}>{c.email || "-"}</span>
                    <span style={{ padding: "2px 7px", borderRadius: "999px", background: "rgba(79,209,255,0.1)", color: "#0092ff", fontSize: "0.7rem", fontWeight: 700 }}>{c.origem || "-"}</span>
                    <span style={{ color: "#8ba3be", fontSize: "0.68rem", whiteSpace: "nowrap" }}>{formatarDataHora(c.createdAt)}</span>
                  </div>
                ))}
              </div>
            }
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(113,159,219,0.15)", borderRadius: "14px", padding: "14px" }}>
              <p style={{ margin: "0 0 10px", fontWeight: 800, color: "#eaf3ff", fontSize: "0.85rem" }}>📣 ORIGEM DOS CLIENTES</p>
              {(() => {
                const freq = {};
                dados.clientes.forEach(c => { if (c.origem) freq[c.origem] = (freq[c.origem] || 0) + 1; });
                const sorted = Object.entries(freq).sort((a,b) => b[1] - a[1]);
                const total = dados.clientes.length || 1;
                const cores = ["#0092ff","#9650f5","#0aff87","#dc913c","#d73c3c","#8bd3ff"];
                return sorted.length > 0
                  ? <div style={{ display: "grid", gap: "5px" }}>{sorted.map(([o, n], i) => (
                      <div key={o} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "8px", alignItems: "center" }}>
                        <span style={{ color: "#d3e4f8", fontSize: "0.82rem" }}>{o}</span>
                        <strong style={{ color: cores[i%6], fontSize: "0.88rem" }}>{n}</strong>
                        <span style={{ color: "#9fb4c7", fontSize: "0.7rem" }}>{((n/total)*100).toFixed(0)}%</span>
                      </div>))}</div>
                  : <p style={{ color: "#9fb4c7", fontSize: "0.85rem", margin: 0 }}>Sem dados.</p>;
              })()}
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(113,159,219,0.15)", borderRadius: "14px", padding: "14px" }}>
              <p style={{ margin: "0 0 10px", fontWeight: 800, color: "#eaf3ff", fontSize: "0.85rem" }}>🧪 RESINAS NOS CHAMADOS</p>
              {(() => {
                const RESINAS = ["IRON","FLEXFORM","ALCHEMIST","ATHOM","POSEIDON","PYROBLAST","VULCAN","SPARK","SPIN","LOW SMELL","70/30","VELVET"];
                const texto = dados.chamados.map(c => (c.resina||"") + " " + (c.descricao||"")).join(" ").toUpperCase();
                const contagem = RESINAS.map(r => ({ r, n: (texto.match(new RegExp(r,"g"))||[]).length })).filter(x => x.n > 0).sort((a,b) => b.n-a.n);
                return contagem.length > 0
                  ? <div style={{ display: "grid", gap: "5px" }}>{contagem.map(({ r, n }) => (
                      <div key={r} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px", alignItems: "center" }}>
                        <span style={{ color: "#d3e4f8", fontSize: "0.82rem" }}>{r}</span>
                        <span style={{ background: "rgba(79,209,255,0.15)", color: "#0092ff", borderRadius: "999px", padding: "2px 8px", fontSize: "0.72rem", fontWeight: 800 }}>{n}x</span>
                      </div>))}</div>
                  : <p style={{ color: "#9fb4c7", fontSize: "0.85rem", margin: 0 }}>Sem dados.</p>;
              })()}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(113,159,219,0.15)", borderRadius: "14px", padding: "14px" }}>
              <p style={{ margin: "0 0 10px", fontWeight: 800, color: "#eaf3ff", fontSize: "0.85rem" }}>🔧 CHAMADOS RECENTES ({dados.chamados.length})</p>
              {dados.chamados.length === 0 ? <p style={{ color: "#9fb4c7", fontSize: "0.85rem", margin: 0 }}>Sem chamados.</p> :
                <div style={{ display: "grid", gap: "5px", maxHeight: "200px", overflowY: "auto" }}>
                  {dados.chamados.slice(0,8).map((c, i) => (
                    <div key={c._id||i} style={{ background: "rgba(255,107,107,0.04)", border: "1px solid rgba(255,107,107,0.1)", borderRadius: "7px", padding: "7px 10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <strong style={{ color: "#eaf3ff", fontSize: "0.78rem" }}>{c.nome || "-"}</strong>
                        <span style={{ color: "#9fb4c7", fontSize: "0.68rem" }}>{formatarDataHora(c.createdAt)}</span>
                      </div>
                      <p style={{ margin: "2px 0 0", color: "#d73c3c", fontSize: "0.72rem" }}>{c.problema || "-"} · {c.resina || "—"}</p>
                    </div>
                  ))}
                </div>
              }
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(113,159,219,0.15)", borderRadius: "14px", padding: "14px" }}>
              <p style={{ margin: "0 0 10px", fontWeight: 800, color: "#eaf3ff", fontSize: "0.85rem" }}>🧬 FORMULAÇÕES POR APLICAÇÃO</p>
              {(() => {
                const freq = {};
                dados.formulacoes.forEach(f => { const k = f.caracteristica || "Não informado"; freq[k] = (freq[k]||0)+1; });
                const sorted = Object.entries(freq).sort((a,b) => b[1]-a[1]);
                return sorted.length > 0
                  ? <div style={{ display: "grid", gap: "5px" }}>{sorted.map(([app, n]) => (
                      <div key={app} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(184,156,255,0.06)", borderRadius: "7px", padding: "6px 10px" }}>
                        <span style={{ color: "#d3e4f8", fontSize: "0.82rem" }}>{app}</span>
                        <span style={{ background: "rgba(184,156,255,0.15)", color: "#9650f5", borderRadius: "999px", padding: "2px 7px", fontSize: "0.72rem", fontWeight: 800 }}>{n}x</span>
                      </div>))}</div>
                  : <p style={{ color: "#9fb4c7", fontSize: "0.85rem", margin: 0 }}>Sem formulações.</p>;
              })()}
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(113,159,219,0.15)", borderRadius: "14px", padding: "14px" }}>
            <p style={{ margin: "0 0 10px", fontWeight: 800, color: "#eaf3ff", fontSize: "0.85rem" }}>✉️ MENSAGENS RECENTES ({dados.mensagens.length})</p>
            {dados.mensagens.length === 0 ? <p style={{ color: "#9fb4c7", fontSize: "0.85rem", margin: 0 }}>Nenhuma mensagem ainda.</p> :
              <div style={{ display: "grid", gap: "5px", maxHeight: "180px", overflowY: "auto" }}>
                {dados.mensagens.slice(0,6).map((m, i) => (
                  <div key={m._id||i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: "8px", alignItems: "center", background: "rgba(79,209,255,0.04)", border: "1px solid rgba(79,209,255,0.1)", borderRadius: "7px", padding: "7px 10px", fontSize: "0.78rem" }}>
                    <strong style={{ color: "#eaf3ff" }}>{m.nome || m.clienteNome || "-"}</strong>
                    <span style={{ color: "#9fb4c7" }}>{m.assunto || "Sem assunto"}</span>
                    <BADGE status={m.resolvido ? "resolvido" : "pendente"} />
                    <span style={{ color: "#8ba3be", fontSize: "0.68rem", whiteSpace: "nowrap" }}>{formatarDataHora(m.createdAt)}</span>
                  </div>
                ))}
              </div>
            }
          </div>
        </div>
      )}

      {aba === "galeria" && (
        <div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px", alignItems: "flex-end" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.82rem", color: "#9fb4c7" }}>Status
              <select value={filtroGaleria.status} onChange={(e) => setFiltroGaleria((a) => ({ ...a, status: e.target.value }))} style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid rgba(113,159,219,0.3)", background: "rgba(4,12,24,0.6)", color: "white", fontSize: "0.82rem" }}>
                <option value="pendente">Pendentes</option><option value="aprovado">Aprovados</option><option value="recusado">Recusados</option><option value="todos">Todos</option>
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.82rem", color: "#9fb4c7" }}>Data inicial
              <input type="date" value={filtroGaleria.dataInicio} onChange={(e) => setFiltroGaleria((a) => ({ ...a, dataInicio: e.target.value }))} style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid rgba(113,159,219,0.3)", background: "rgba(4,12,24,0.6)", color: "white", fontSize: "0.82rem" }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.82rem", color: "#9fb4c7" }}>Data final
              <input type="date" value={filtroGaleria.dataFim} onChange={(e) => setFiltroGaleria((a) => ({ ...a, dataFim: e.target.value }))} style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid rgba(113,159,219,0.3)", background: "rgba(4,12,24,0.6)", color: "white", fontSize: "0.82rem" }} />
            </label>
            <button type="button" onClick={carregarDados} style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid rgba(79,209,255,0.3)", background: "rgba(79,209,255,0.1)", color: "#0092ff", cursor: "pointer", fontSize: "0.82rem" }}>Filtrar</button>
          </div>
          {!carregando && dados.galeria.length === 0 && <div className="gallery-empty">Nenhum envio para os filtros selecionados.</div>}
          {dados.galeria.map((item) => (
            <CARD key={item._id}>
              {/* Cabeçalho com nome, status e data */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <strong style={{ fontSize: "1rem", color: "#eaf3ff" }}>{item.nome || "Sem nome"}</strong>
                  <div style={{ fontSize: "0.78rem", color: "#9fb4c7", marginTop: "2px" }}>
                    📱 {item.telefone || "-"} · ✉️ {item.email || "-"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <BADGE status={item.status} />
                  <small style={{ color: "#9fb4c7", fontSize: "0.72rem" }}>{formatarDataHora(item.createdAt)}</small>
                </div>
              </div>

              {/* Foto + Configurações lado a lado */}
              <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "14px", marginBottom: "12px" }}>
                {/* Foto */}
                <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: "10px", border: "1px solid rgba(113,159,219,0.2)", overflow: "hidden", minHeight: "180px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {item.imagem
                    ? <img src={item.imagem} alt="Envio do cliente" onClick={() => window.open(item.imagem, "_blank")}
                        style={{ width: "100%", maxHeight: "220px", objectFit: "contain", cursor: "pointer", display: "block" }}
                        onError={(e) => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}
                      />
                    : null}
                  <div style={{ display: item.imagem ? "none" : "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "#9pb4c7", fontSize: "0.82rem", padding: "20px" }}>
                    <span style={{ fontSize: "2rem" }}>📷</span>
                    <span style={{ color: "#9fb4c7" }}>Sem foto</span>
                  </div>
                </div>

                {/* Configurações usadas pelo cliente */}
                <div>
                  <p style={{ margin: "0 0 8px", fontSize: "0.75rem", fontWeight: 900, color: "#0092ff", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    ⚙️ Configurações usadas pelo cliente
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "8px" }}>
                    <div style={{ background: "rgba(79,209,255,0.08)", border: "1px solid rgba(79,209,255,0.2)", borderRadius: "8px", padding: "8px 10px" }}>
                      <span style={{ fontSize: "0.7rem", color: "#9fb4c7", display: "block" }}>Resina</span>
                      <strong style={{ fontSize: "0.88rem", color: "#0092ff" }}>{item.resina || "Não informada"}</strong>
                    </div>
                    <div style={{ background: "rgba(79,209,255,0.08)", border: "1px solid rgba(79,209,255,0.2)", borderRadius: "8px", padding: "8px 10px" }}>
                      <span style={{ fontSize: "0.7rem", color: "#9fb4c7", display: "block" }}>Impressora</span>
                      <strong style={{ fontSize: "0.88rem", color: "#eaf3ff" }}>{item.impressora || "Não informada"}</strong>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                    {CAMPOS_CONFIGURACAO_GALERIA.map((campo) => {
                      const v = item.parametros?.[campo.name];
                      return v ? (
                        <span key={campo.name} style={{ fontSize: "0.72rem", padding: "3px 8px", borderRadius: "6px", background: "rgba(26,115,232,0.12)", border: "1px solid rgba(26,115,232,0.2)", color: "#a8c4e8" }}>
                          <strong>{campo.label}:</strong> {v}
                        </span>
                      ) : null;
                    })}
                  </div>
                  {item.observacao && (
                    <p style={{ color: "#d3e4f8", fontSize: "0.82rem", margin: "8px 0 0", fontStyle: "italic", background: "rgba(255,255,255,0.03)", padding: "6px 8px", borderRadius: "6px" }}>
                      💬 {item.observacao}
                    </p>
                  )}

                  {/* Redes sociais — pra marcar o cliente ao divulgar a peça */}
                  {item.autorizaDivulgacao && (
                    <div style={{ marginTop: "8px", padding: "8px 10px", borderRadius: "8px", background: "rgba(184,156,255,0.06)", border: "1px solid rgba(184,156,255,0.2)" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#9650f5", textTransform: "uppercase", display: "block", marginBottom: "5px" }}>
                        📣 Autorizado pra divulgar
                      </span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {item.redesSociais?.instagram && <span style={{ fontSize: "0.75rem", padding: "3px 9px", borderRadius: "999px", background: "rgba(184,156,255,0.12)", color: "#9650f5" }}>📸 {item.redesSociais.instagram}</span>}
                        {item.redesSociais?.tiktok && <span style={{ fontSize: "0.75rem", padding: "3px 9px", borderRadius: "999px", background: "rgba(184,156,255,0.12)", color: "#9650f5" }}>🎵 {item.redesSociais.tiktok}</span>}
                        {item.redesSociais?.facebook && <span style={{ fontSize: "0.75rem", padding: "3px 9px", borderRadius: "999px", background: "rgba(184,156,255,0.12)", color: "#9650f5" }}>📘 {item.redesSociais.facebook}</span>}
                        {item.redesSociais?.youtube && <span style={{ fontSize: "0.75rem", padding: "3px 9px", borderRadius: "999px", background: "rgba(184,156,255,0.12)", color: "#9650f5" }}>▶️ {item.redesSociais.youtube}</span>}
                        {!item.redesSociais?.instagram && !item.redesSociais?.tiktok && !item.redesSociais?.facebook && !item.redesSociais?.youtube && (
                          <span style={{ fontSize: "0.75rem", color: "#8ba3be" }}>Cliente autorizou mas não deixou @ — usar nome mesmo.</span>
                        )}
                      </div>
                      <button type="button" onClick={() => copiarLegenda(item)}
                        style={{ marginTop: "10px", width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid rgba(184,156,255,0.35)", background: legendaCopiadaId === item._id ? "rgba(73,230,139,0.15)" : "rgba(184,156,255,0.1)", color: legendaCopiadaId === item._id ? "#0aff87" : "#9650f5", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800 }}>
                        {legendaCopiadaId === item._id ? "✅ Legenda copiada!" : "📋 Copiar legenda pronta"}
                      </button>
                    </div>
                  )}
                </div>
              </div>



              {/* Botões aprovar/recusar */}
              <div style={{ display: "flex", gap: "10px" }}>
                <button type="button"
                  onClick={() => atualizarGaleria(item._id, "aprovar", diagnostico[item._id] ? { diagnostico: diagnostico[item._id] } : null)}
                  disabled={salvandoId === item._id || item.status === "aprovado"}
                  style={{ flex: 1, padding: "9px", borderRadius: "8px", border: "1px solid rgba(73,230,139,0.4)", background: "rgba(73,230,139,0.12)", color: "#0aff87", cursor: "pointer", fontSize: "0.88rem", fontWeight: 900 }}>
                  ✅ Aprovar
                </button>
                <button type="button"
                  onClick={() => atualizarGaleria(item._id, "recusar")}
                  disabled={salvandoId === item._id || item.status === "recusado"}
                  style={{ flex: 1, padding: "9px", borderRadius: "8px", border: "1px solid rgba(255,107,107,0.4)", background: "rgba(255,107,107,0.1)", color: "#d73c3c", cursor: "pointer", fontSize: "0.88rem", fontWeight: 900 }}>
                  ❌ Recusar
                </button>
              </div>
            </CARD>
          ))}
        </div>
      )}

      {aba === "conversas" && (
        <div>
          <div style={{ background: "rgba(79,209,255,0.06)", border: "1px solid rgba(79,209,255,0.2)", borderRadius: "14px", padding: "14px 16px", marginBottom: "12px" }}>
            <p style={{ margin: 0, color: "#b8cfe8", fontSize: "0.85rem", lineHeight: 1.6 }}>
              💡 Veja as perguntas dos clientes e as respostas do Assistente. Edite e clique em <strong style={{ color: "#0092ff" }}>Aprovar</strong> para transformar em conhecimento validado. Casos marcados <strong style={{ color: "#d73c3c" }}>👎 Não ajudou</strong> pelo cliente aparecem destacados abaixo.
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
            {[
              { id: "todas", label: "Todas" },
              { id: "nao_satisfatoria", label: "👎 Não ajudou" },
              { id: "aprovadas", label: "✅ Aprovadas" },
            ].map(f => (
              <button key={f.id} type="button" onClick={() => setFiltroConversas(f.id)}
                style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid rgba(79,209,255,0.2)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700, fontFamily: "inherit",
                  background: filtroConversas === f.id ? "linear-gradient(135deg,#0092ff,#9650f5)" : "rgba(79,209,255,0.06)",
                  color: filtroConversas === f.id ? "#fff" : "#9fb4c7" }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Filtro por cliente */}
          {(() => {
            const clientesUnicos = [...new Map((dados.conversas || []).filter(c => c.clienteId && c.clienteNome).map(c => [c.clienteId, c.clienteNome])).entries()].sort((a,b) => a[1].localeCompare(b[1]));
            if (clientesUnicos.length === 0) return null;
            return (
              <div style={{ marginBottom: "14px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.78rem", color: "#9fb4c7", fontWeight: 700 }}>👤 Filtrar por cliente:</span>
                <select value={filtroClienteConv} onChange={e => setFiltroClienteConv(e.target.value)}
                  style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(79,209,255,0.25)", background: "rgba(15,23,42,0.8)", color: "#eaf3ff", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit" }}>
                  <option value="">Todos os clientes</option>
                  {clientesUnicos.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
                </select>
                {filtroClienteConv && (
                  <button type="button" onClick={() => setFiltroClienteConv("")}
                    style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid rgba(255,107,107,0.3)", background: "rgba(255,107,107,0.08)", color: "#d73c3c", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700 }}>
                    ✕ Limpar
                  </button>
                )}
              </div>
            );
          })()}

          {(!dados.conversas || dados.conversas.length === 0) && !carregando && (
            <div className="gallery-empty">Nenhuma conversa registrada ainda.</div>
          )}

          {(dados.conversas || [])
            .filter(c => (filtroConversas === "todas" ? true : filtroConversas === "nao_satisfatoria" ? c.feedback === "nao_satisfatoria" : filtroConversas === "aprovadas" ? c.aprovado : true) && (filtroClienteConv ? c.clienteId === filtroClienteConv : true))
            .map((c) => {
            const textoEditado = edicaoConversa[c._id] !== undefined ? edicaoConversa[c._id] : (c.respostaMelhorada || c.resposta);
            const foiEditado = textoEditado !== c.resposta;
            const naoAjudou = c.feedback === "nao_satisfatoria";
            return (
              <div key={c._id} style={{ border: naoAjudou && !c.revisadoFeedback ? "1px solid rgba(255,107,107,0.5)" : "1px solid rgba(113,159,219,0.2)", borderRadius: "14px", padding: "14px", background: naoAjudou && !c.revisadoFeedback ? "rgba(255,107,107,0.05)" : "rgba(255,255,255,0.04)", marginBottom: "10px" }}>
                {/* Cabeçalho */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "6px" }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    {naoAjudou && <span style={{ fontSize: "0.72rem", padding: "2px 10px", borderRadius: "999px", background: "rgba(255,107,107,0.15)", border: "1px solid rgba(255,107,107,0.35)", color: "#d73c3c", fontWeight: 800 }}>👎 Não ajudou {c.revisadoFeedback ? "(revisado)" : ""}</span>}
                    {c.feedback === "satisfatoria" && <span style={{ fontSize: "0.72rem", padding: "2px 10px", borderRadius: "999px", background: "rgba(73,230,139,0.1)", border: "1px solid rgba(73,230,139,0.25)", color: "#0aff87", fontWeight: 700 }}>👍 Ajudou</span>}
                    {c.aprovado && <span style={{ fontSize: "0.72rem", padding: "2px 10px", borderRadius: "999px", background: "rgba(73,230,139,0.15)", border: "1px solid rgba(73,230,139,0.3)", color: "#0aff87", fontWeight: 800 }}>✅ Aprovado</span>}
                    {c.ragUsado && <span style={{ fontSize: "0.72rem", padding: "2px 10px", borderRadius: "999px", background: "rgba(184,156,255,0.12)", border: "1px solid rgba(184,156,255,0.25)", color: "#9650f5", fontWeight: 700 }}>📋 Usou RAG</span>}
                    {c.resinaDetectada && <span style={{ fontSize: "0.72rem", padding: "2px 10px", borderRadius: "999px", background: "rgba(79,209,255,0.1)", border: "1px solid rgba(79,209,255,0.2)", color: "#0092ff", fontWeight: 700 }}>🧪 {c.resinaDetectada}</span>}
                    {c.impressoraDetectada && <span style={{ fontSize: "0.72rem", padding: "2px 10px", borderRadius: "999px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(113,159,219,0.2)", color: "#9fb4c7", fontWeight: 700 }}>🖨️ {c.impressoraDetectada}</span>}
                  </div>
                  <small style={{ color: "#8ba3be", fontSize: "0.72rem" }}>{formatarDataHora(c.createdAt)}</small>
                </div>

                {/* Configuração e foto do problema — só quando feedback negativo */}
                {naoAjudou && (c.fotoProblema || c.configuracaoCliente) && (
                  <div style={{ display: "grid", gridTemplateColumns: c.fotoProblema ? "140px 1fr" : "1fr", gap: "10px", marginBottom: "10px", background: "rgba(255,107,107,0.04)", border: "1px solid rgba(255,107,107,0.15)", borderRadius: "10px", padding: "10px" }}>
                    {c.fotoProblema && (
                      <img src={c.fotoProblema} alt="Foto do problema" onClick={() => window.open(c.fotoProblema, "_blank")}
                        style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "8px", cursor: "pointer", border: "1px solid rgba(255,107,107,0.25)" }} />
                    )}
                    <div>
                      <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#d73c3c", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>📷 Enviado pelo cliente após feedback negativo</span>
                      {c.configuracaoCliente && <p style={{ margin: 0, color: "#d3e4f8", fontSize: "0.8rem" }}>{c.configuracaoCliente}</p>}
                    </div>
                  </div>
                )}

                {/* Pergunta do cliente */}
                <div style={{ background: "rgba(79,209,255,0.06)", border: "1px solid rgba(79,209,255,0.18)", borderRadius: "10px", padding: "10px 12px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#0092ff", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>
                    👤 {c.clienteNome || "Cliente"} perguntou:
                  </span>
                  <p style={{ margin: 0, color: "#eaf3ff", fontSize: "0.88rem", lineHeight: 1.5 }}>{c.pergunta}</p>
                </div>

                {/* Resposta original do bot */}
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(113,159,219,0.12)", borderRadius: "10px", padding: "10px 12px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#9fb4c7", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>
                    🤖 Assistente respondeu ({c.fonte || "deepseek"}):
                  </span>
                  <p style={{ margin: 0, color: "#b8cfe8", fontSize: "0.82rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{c.resposta}</p>
                </div>

                {/* Campo de edição / melhoria */}
                <div style={{ marginBottom: "10px" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 800, color: foiEditado ? "#dc913c" : "#0aff87", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>
                    {foiEditado ? "✏️ Resposta melhorada (editada)" : "✏️ Editar / refinar resposta (opcional)"}
                  </span>
                  <textarea
                    value={textoEditado}
                    onChange={e => setEdicaoConversa(prev => ({ ...prev, [c._id]: e.target.value }))}
                    rows={3}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid " + (foiEditado ? "rgba(255,209,102,0.35)" : "rgba(73,230,139,0.25)"), background: "rgba(4,10,24,0.7)", color: "#ffffff", fontSize: "0.82rem", lineHeight: 1.5, resize: "vertical", fontFamily: "inherit" }}
                  />
                </div>

                {/* Botões de ação */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button type="button" onClick={() => salvarMelhoriaConversa(c._id)} disabled={salvandoConversa === c._id || !foiEditado}
                    style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(79,209,255,0.4)", background: "rgba(79,209,255,0.1)", color: "#0092ff", cursor: foiEditado ? "pointer" : "not-allowed", fontSize: "0.8rem", fontWeight: 800, opacity: foiEditado ? 1 : 0.4 }}>
                    {salvandoConversa === c._id ? "Salvando..." : "💾 Salvar melhoria"}
                  </button>
                  <button type="button" onClick={() => aprovarConversa(c._id)} disabled={salvandoConversa === c._id}
                    style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(73,230,139,0.4)", background: "rgba(73,230,139,0.12)", color: "#0aff87", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800 }}>
                    {salvandoConversa === c._id ? "Salvando..." : c.aprovado ? "🔄 Atualizar aprovação" : "✅ Aprovar como conhecimento"}
                  </button>
                  {c.aprovado && (
                    <button type="button" onClick={() => desaprovarConversa(c._id)} disabled={salvandoConversa === c._id}
                      style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(255,209,102,0.35)", background: "rgba(255,209,102,0.08)", color: "#dc913c", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800 }}>
                      ↩️ Remover aprovação
                    </button>
                  )}
                  {naoAjudou && !c.revisadoFeedback && (
                    <button type="button" onClick={() => marcarFeedbackRevisado(c._id)}
                      style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(184,156,255,0.35)", background: "rgba(184,156,255,0.08)", color: "#9650f5", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800 }}>
                      👁️ Marcar como revisado
                    </button>
                  )}
                  <button type="button" onClick={() => excluirConversa(c._id)}
                    style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(255,107,107,0.3)", background: "rgba(255,107,107,0.06)", color: "#d73c3c", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800 }}>
                    🗑️ Excluir
                  </button>
                </div>
                <p style={{ margin: "8px 0 0", fontSize: "0.7rem", color: "#8ba3be", lineHeight: 1.5 }}>
                  💡 <strong>Salvar melhoria</strong> guarda seu texto editado como rascunho. <strong>Aprovar</strong> libera oficialmente para o Assistente usar em respostas futuras.
                </p>
              </div>
            );
          })}
        </div>
      )}

      {aba === "parametros_adm" && (
        <div>
          {/* Formulário de cadastro */}
          <div style={{ background: "rgba(79,209,255,0.06)", border: "1px solid rgba(79,209,255,0.2)", borderRadius: "14px", padding: "18px", marginBottom: "20px" }}>
            <p style={{ margin: "0 0 14px", fontWeight: 800, color: "#0092ff", fontSize: "0.88rem" }}>➕ CADASTRAR NOVO PARÂMETRO</p>
            {msgParam && <div style={{ padding: "8px 12px", borderRadius: "8px", marginBottom: "12px", background: msgParam.startsWith("✅") ? "rgba(73,230,139,0.1)" : "rgba(255,107,107,0.1)", border: msgParam.startsWith("✅") ? "1px solid rgba(73,230,139,0.3)" : "1px solid rgba(255,107,107,0.3)", color: msgParam.startsWith("✅") ? "#0aff87" : "#d73c3c", fontSize: "0.85rem" }}>{msgParam}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
              {[
                { key: "resina", label: "Resina *", placeholder: "Ex: IRON" },
                { key: "impressora", label: "Impressora *", placeholder: "Ex: Elegoo Mars 4 Ultra" },
                { key: "alturaCamada", label: "Altura de camada", placeholder: "Ex: 0.05mm" },
                { key: "exposicaoNormal", label: "Exposição normal (s)", placeholder: "Ex: 2.1" },
                { key: "exposicaoBase", label: "Exposição base (s)", placeholder: "Ex: 35" },
                { key: "camadasBase", label: "Camadas base", placeholder: "Ex: 6" },
                { key: "codigoChitubox", label: "Código CHITUBOX", placeholder: "Cole o código do Fusion Material Center" },
                { key: "liftSpeed", label: "Vel. elevação (mm/min)", placeholder: "Ex: 120" },
                { key: "retractSpeed", label: "Vel. retração (mm/min)", placeholder: "Ex: 150" },
              ].map(({ key, label, placeholder }) => (
                <label key={key} style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.78rem", color: "#9fb4c7", fontWeight: 700 }}>
                  {label}
                  <input
                    value={novoParam[key]}
                    onChange={e => setNovoParam(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(79,209,255,0.2)", background: "rgba(4,10,24,0.7)", color: "#ffffff", fontSize: "0.85rem" }}
                  />
                </label>
              ))}
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "0.78rem", color: "#9fb4c7", fontWeight: 700, display: "block", marginBottom: "6px" }}>Confiança do parâmetro</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" onClick={() => setNovoParam(p => ({ ...p, confianca: "oficial" }))}
                  style={{ flex: 1, padding: "9px", borderRadius: "9px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.8rem", fontWeight: 800, border: "1px solid rgba(73,230,139,0.3)",
                    background: novoParam.confianca === "oficial" ? "rgba(73,230,139,0.18)" : "rgba(73,230,139,0.05)", color: "#0aff87" }}>
                  ✅ Testado pela Quanton3D
                </button>
                <button type="button" onClick={() => setNovoParam(p => ({ ...p, confianca: "estimado" }))}
                  style={{ flex: 1, padding: "9px", borderRadius: "9px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.8rem", fontWeight: 800, border: "1px solid rgba(255,209,102,0.3)",
                    background: novoParam.confianca === "estimado" ? "rgba(255,209,102,0.18)" : "rgba(255,209,102,0.05)", color: "#dc913c" }}>
                  ⚠️ Estimativa inicial
                </button>
              </div>
              <span style={{ fontSize: "0.72rem", color: "#8ba3be", marginTop: "4px", display: "block" }}>
                "Testado" = validado em impressão real pela equipe. "Estimativa" = baseado em resina/impressora parecida, ainda não confirmado.
              </span>
            </div>

            <button type="button" onClick={salvarParametro} disabled={salvandoParam}
              style={{ width: "100%", padding: "11px", borderRadius: "10px", border: 0, background: "linear-gradient(135deg,#0092ff,#9650f5)", color: "#fff", fontWeight: 900, cursor: "pointer", fontFamily: "inherit", fontSize: "0.9rem" }}>
              {salvandoParam ? "Salvando..." : "Salvar parâmetro"}
            </button>
          </div>

          {/* Busca e lista */}
          <div style={{ marginBottom: "12px" }}>
            <input
              value={buscaParam}
              onChange={e => setBuscaParam(e.target.value)}
              placeholder="Buscar por resina ou impressora..."
              style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(79,209,255,0.2)", background: "rgba(4,10,24,0.7)", color: "#ffffff", fontSize: "0.88rem" }}
            />
          </div>

          <p style={{ color: "#9fb4c7", fontSize: "0.78rem", marginBottom: "10px" }}>
            {parametrosAdm.filter(p => !buscaParam || p.resina?.toLowerCase().includes(buscaParam.toLowerCase()) || p.impressora?.toLowerCase().includes(buscaParam.toLowerCase())).length} parâmetro(s) encontrado(s)
          </p>

          <div style={{ display: "grid", gap: "8px", maxHeight: "450px", overflowY: "auto" }}>
            {parametrosAdm
              .filter(p => !buscaParam || p.resina?.toLowerCase().includes(buscaParam.toLowerCase()) || p.impressora?.toLowerCase().includes(buscaParam.toLowerCase()))
              .map((p) => (
                <div key={p._id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(113,159,219,0.15)", borderRadius: "10px", padding: "10px 12px" }}>
                  {editandoParam === p._id ? (
                    <div style={{ display: "grid", gap: "8px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <input value={paramEdit.resina} onChange={e => setParamEdit(a => ({ ...a, resina: e.target.value }))} placeholder="Resina" style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(79,209,255,0.25)", background: "rgba(4,10,24,0.7)", color: "#fff", fontSize: "0.82rem" }} />
                        <input value={paramEdit.impressora} onChange={e => setParamEdit(a => ({ ...a, impressora: e.target.value }))} placeholder="Impressora" style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(79,209,255,0.25)", background: "rgba(4,10,24,0.7)", color: "#fff", fontSize: "0.82rem" }} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                        <input value={paramEdit.alturaCamada} onChange={e => setParamEdit(a => ({ ...a, alturaCamada: e.target.value }))} placeholder="Altura camada" style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(79,209,255,0.25)", background: "rgba(4,10,24,0.7)", color: "#fff", fontSize: "0.82rem" }} />
                        <input value={paramEdit.exposicaoNormal} onChange={e => setParamEdit(a => ({ ...a, exposicaoNormal: e.target.value }))} placeholder="Exp. normal" style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(79,209,255,0.25)", background: "rgba(4,10,24,0.7)", color: "#fff", fontSize: "0.82rem" }} />
                        <input value={paramEdit.exposicaoBase} onChange={e => setParamEdit(a => ({ ...a, exposicaoBase: e.target.value }))} placeholder="Exp. base" style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(79,209,255,0.25)", background: "rgba(4,10,24,0.7)", color: "#fff", fontSize: "0.82rem" }} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                        <input value={paramEdit.camadasBase} onChange={e => setParamEdit(a => ({ ...a, camadasBase: e.target.value }))} placeholder="Camadas base" style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(79,209,255,0.25)", background: "rgba(4,10,24,0.7)", color: "#fff", fontSize: "0.82rem" }} />
                        <input value={paramEdit.liftSpeed} onChange={e => setParamEdit(a => ({ ...a, liftSpeed: e.target.value }))} placeholder="Lift speed" style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(79,209,255,0.25)", background: "rgba(4,10,24,0.7)", color: "#fff", fontSize: "0.82rem" }} />
                        <input value={paramEdit.retractSpeed} onChange={e => setParamEdit(a => ({ ...a, retractSpeed: e.target.value }))} placeholder="Retract speed" style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(79,209,255,0.25)", background: "rgba(4,10,24,0.7)", color: "#fff", fontSize: "0.82rem" }} />
                      </div>
                      <select value={paramEdit.confianca} onChange={e => setParamEdit(a => ({ ...a, confianca: e.target.value }))} style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(79,209,255,0.25)", background: "rgba(4,10,24,0.7)", color: "#fff", fontSize: "0.82rem" }}>
                        <option value="oficial">✅ Testado</option>
                        <option value="estimado">⚠️ Estimativa</option>
                      </select>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button type="button" onClick={() => salvarEdicaoParam(p._id)} disabled={salvandoParam}
                          style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #1565c0, #0092ff)", color: "#fff", cursor: "pointer", fontSize: "0.82rem", fontWeight: 700 }}>
                          {salvandoParam ? "Salvando..." : "💾 Salvar alterações"}
                        </button>
                        <button type="button" onClick={cancelarEdicaoParam}
                          style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid rgba(159,180,199,0.3)", background: "rgba(159,180,199,0.08)", color: "#9fb4c7", cursor: "pointer", fontSize: "0.82rem", fontWeight: 700 }}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px", flexWrap: "wrap" }}>
                          <strong style={{ color: "#0092ff", fontSize: "0.88rem" }}>{p.resina}</strong>
                          <span style={{ color: "#9fb4c7", fontSize: "0.82rem" }}>+</span>
                          <span style={{ color: "#eaf3ff", fontSize: "0.85rem" }}>{p.impressora}</span>
                          <span style={{ fontSize: "0.68rem", padding: "1px 8px", borderRadius: "999px", fontWeight: 800,
                            background: p.confianca === "estimado" ? "rgba(255,209,102,0.12)" : "rgba(73,230,139,0.12)",
                            color: p.confianca === "estimado" ? "#dc913c" : "#0aff87",
                            border: "1px solid " + (p.confianca === "estimado" ? "rgba(255,209,102,0.3)" : "rgba(73,230,139,0.3)") }}>
                            {p.confianca === "estimado" ? "⚠️ Estimativa" : "✅ Testado"}
                          </span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                          {[
                            p.alturaCamada && `📏 ${p.alturaCamada}`,
                            p.exposicaoNormal && `⚡ ${p.exposicaoNormal}s`,
                            p.exposicaoBase && `🔆 ${p.exposicaoBase}s base`,
                            p.camadasBase && `📚 ${p.camadasBase} camadas`,
                            p.liftSpeed && `⬆️ ${p.liftSpeed}mm/min`,
                            p.retractSpeed && `⬇️ ${p.retractSpeed}mm/min`,
                          ].filter(Boolean).map((info, i) => (
                            <span key={i} style={{ fontSize: "0.72rem", padding: "2px 7px", borderRadius: "6px", background: "rgba(26,115,232,0.12)", border: "1px solid rgba(26,115,232,0.2)", color: "#a8c4e8" }}>{info}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                        <button type="button" onClick={() => iniciarEdicaoParam(p)}
                          style={{ padding: "5px 10px", borderRadius: "8px", border: "1px solid rgba(26,115,232,0.3)", background: "rgba(26,115,232,0.08)", color: "#0092ff", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700 }}>
                          ✏️ Editar
                        </button>
                        <button type="button" onClick={() => deletarParametro(p._id)}
                          style={{ padding: "5px 10px", borderRadius: "8px", border: "1px solid rgba(255,107,107,0.3)", background: "rgba(255,107,107,0.08)", color: "#d73c3c", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700 }}>
                          Excluir
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            }
          </div>
        </div>
      )}

      {aba === "clientes" && (
        <div>

          {/* ── STATS POR ORIGEM ── */}
          {dados.clientes.length > 0 && (() => {
            const freq = {};
            dados.clientes.forEach(c => { const o = c.origem || "outros"; freq[o] = (freq[o] || 0) + 1; });
            const tops = Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0,6);
            const cores = { instagram:"#e1306c", site:"#0092ff", whatsapp:"#25d366", outros:"#9fb4c7", facebook:"#1877f2", youtube:"#ff0000" };
            return (
              <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", marginBottom:"14px" }}>
                {tops.map(([orig, qtd]) => (
                  <div key={orig} onClick={() => setFiltroOrigem(filtroOrigem === orig ? "" : orig)}
                    style={{ padding:"6px 12px", borderRadius:"999px", cursor:"pointer", fontSize:"0.75rem", fontWeight:800,
                      background: filtroOrigem === orig ? (cores[orig.toLowerCase()] || "#9650f5") + "33" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${filtroOrigem === orig ? (cores[orig.toLowerCase()] || "#9650f5") : "rgba(113,159,219,0.2)"}`,
                      color: filtroOrigem === orig ? (cores[orig.toLowerCase()] || "#9650f5") : "#9fb4c7" }}>
                    {orig} <span style={{ opacity:0.7 }}>({qtd})</span>
                  </div>
                ))}
                {filtroOrigem && <button type="button" onClick={() => setFiltroOrigem("")}
                  style={{ padding:"6px 10px", borderRadius:"999px", border:"1px solid rgba(255,107,107,0.3)", background:"rgba(255,107,107,0.08)", color:"#d73c3c", cursor:"pointer", fontSize:"0.73rem", fontWeight:800 }}>✕ limpar</button>}
              </div>
            );
          })()}

          {/* ── AVISO LIMITE ── */}
          {dados.clientes.length > 0 && dados.totais?.clientes > dados.clientes.length && (
            <div style={{ marginBottom:"12px", padding:"8px 14px", borderRadius:"8px", background:"rgba(255,209,102,0.07)", border:"1px solid rgba(255,209,102,0.25)", fontSize:"0.78rem", color:"#dc913c" }}>
              ⚠️ Exibindo os <strong>{dados.clientes.length}</strong> mais recentes. Total no banco: <strong>{dados.totais.clientes}</strong>.
            </div>
          )}

          {/* ── TOOLBAR: busca + selecionar + excluir ── */}
          <div style={{ display:"flex", gap:"8px", marginBottom:"12px", flexWrap:"wrap", alignItems:"center" }}>
            <input value={buscaCliente} onChange={e => setBuscaCliente(e.target.value)}
              placeholder="🔍 Buscar por nome, telefone, email ou CPF/CNPJ..."
              style={{ flex:1, minWidth:"200px", padding:"8px 12px", borderRadius:"8px", border:"1px solid rgba(113,159,219,0.3)", background:"rgba(255,255,255,0.05)", color:"#eaf3ff", fontSize:"0.82rem", fontFamily:"inherit" }} />
            {buscaCliente && <button type="button" onClick={() => setBuscaCliente("")}
              style={{ padding:"7px 10px", borderRadius:"8px", border:"1px solid rgba(255,107,107,0.3)", background:"rgba(255,107,107,0.08)", color:"#d73c3c", cursor:"pointer", fontSize:"0.78rem" }}>✕</button>}
          </div>

          {/* ── BARRA SELECIONAR/EXCLUIR ── */}
          {(() => {
            const filtrados = dados.clientes.filter(c => c && c._id)
              .filter(c => !filtroOrigem || (c.origem || "outros") === filtroOrigem)
              .filter(c => {
                if (!buscaCliente) return true;
                const q = buscaCliente.toLowerCase().replace(/\D/g, '') || buscaCliente.toLowerCase();
                const qNum = buscaCliente.replace(/\D/g, '');
                return (c.nome||"").toLowerCase().includes(buscaCliente.toLowerCase()) || (c.telefone||"").includes(buscaCliente) || (c.email||"").toLowerCase().includes(buscaCliente.toLowerCase()) || (qNum && (c.cpfCnpj||"").includes(qNum));
              });
            const suspeitos = filtrados.filter(c => /^(.)\1{2,}$/.test(c.nome?.replace(/\s/g,"")||"") || (c.nome||"").length < 3 || /^(kk|ll|xx|zz|qq|asd|qwe|teste|test)/i.test(c.nome||"")).length;
            return (
              <>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"10px", padding:"8px 12px", borderRadius:"10px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(113,159,219,0.12)", flexWrap:"wrap", gap:"8px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px", flexWrap:"wrap" }}>
                    <label style={{ display:"flex", alignItems:"center", gap:"6px", cursor:"pointer", fontSize:"0.8rem", color:"#9fb4c7" }}>
                      <input type="checkbox"
                        checked={clientesSelecionados.length === filtrados.length && filtrados.length > 0}
                        onChange={e => setClientesSelecionados(e.target.checked ? filtrados.map(c => c._id) : [])}
                      /> Selecionar todos ({filtrados.length})
                    </label>
                    {clientesSelecionados.length > 0 && <span style={{ fontSize:"0.78rem", color:"#d73c3c", fontWeight:700 }}>{clientesSelecionados.length} selecionado(s)</span>}
                    {suspeitos > 0 && <span style={{ fontSize:"0.72rem", color:"#dc913c" }}>⚠️ {suspeitos} possível(is) teste</span>}
                  </div>
                  <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                    {suspeitos > 0 && clientesSelecionados.length === 0 && (
                      <button type="button"
                        onClick={() => setClientesSelecionados(filtrados.filter(c => /^(.)\1{2,}$/.test(c.nome?.replace(/\s/g,"")||"") || (c.nome||"").length < 3 || /^(kk|ll|xx|zz|qq|asd|qwe|teste|test)/i.test(c.nome||"")).map(c => c._id))}
                        style={{ padding:"6px 12px", borderRadius:"8px", border:"1px solid rgba(255,209,102,0.35)", background:"rgba(255,209,102,0.08)", color:"#dc913c", cursor:"pointer", fontSize:"0.75rem", fontWeight:800 }}>
                        ⚠️ Selecionar suspeitos
                      </button>
                    )}
                    {clientesSelecionados.length > 0 && (
                      <button type="button" onClick={excluirClientesSelecionados} disabled={excluindoClientes}
                        style={{ padding:"6px 14px", borderRadius:"8px", border:"1px solid rgba(255,107,107,0.4)", background:"rgba(255,107,107,0.12)", color:"#d73c3c", cursor:"pointer", fontSize:"0.78rem", fontWeight:800 }}>
                        {excluindoClientes ? "Excluindo..." : "🗑️ Excluir selecionados"}
                      </button>
                    )}
                  </div>
                </div>

                {filtrados.length === 0 && (
                  <div className="gallery-empty">Nenhum cliente encontrado para esse filtro.</div>
                )}

                {filtrados.map((c) => {
                  const suspeito = /^(.)\1{2,}$/.test(c.nome?.replace(/\s/g,"")||"") || (c.nome||"").length < 3 || /^(kk|ll|xx|zz|qq|asd|qwe|teste|test)/i.test(c.nome||"");
                  const selecionado = clientesSelecionados.includes(c._id);
                  const expandido = clienteExpandido === c._id;
                  const corOrigem = { instagram:"#e1306c", site:"#0092ff", whatsapp:"#25d366", facebook:"#1877f2", youtube:"#ff0000" };
                  const origCor = corOrigem[(c.origem||"").toLowerCase()] || "#9fb4c7";
                  return (
                    <div key={c._id} style={{ border: selecionado ? "1px solid rgba(255,107,107,0.5)" : suspeito ? "1px solid rgba(255,209,102,0.35)" : "1px solid rgba(113,159,219,0.18)", borderRadius:"12px", padding:"10px 14px", background: selecionado ? "rgba(255,107,107,0.06)" : "rgba(255,255,255,0.04)", marginBottom:"8px", color:"#eaf3ff", boxSizing:"border-box" }}>

                      {/* linha principal */}
                      <div style={{ display:"grid", gridTemplateColumns:"20px 1fr auto", gap:"8px", alignItems:"center" }}>
                        <input type="checkbox" checked={selecionado} style={{ cursor:"pointer" }}
                          onChange={e => setClientesSelecionados(prev => e.target.checked ? [...prev, c._id] : prev.filter(id => id !== c._id))} />
                        <div style={{ overflow:"hidden" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:"6px", overflow:"hidden" }}>
                            <strong style={{ color:"#eaf3ff", fontSize:"0.88rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.nome || "Sem nome"}</strong>
                            {suspeito && <span style={{ fontSize:"0.62rem", padding:"1px 5px", borderRadius:"999px", background:"rgba(255,209,102,0.15)", color:"#dc913c", fontWeight:800, flexShrink:0 }}>⚠️ teste</span>}
                            {c.origem && <span style={{ fontSize:"0.62rem", padding:"1px 6px", borderRadius:"999px", background: origCor+"22", color: origCor, fontWeight:700, flexShrink:0, border:`1px solid ${origCor}44` }}>{c.origem}</span>}
                            {c.cpfCnpj && <span style={{ fontSize:"0.62rem", padding:"1px 6px", borderRadius:"999px", background:"rgba(73,230,139,0.12)", color:"#0aff87", fontWeight:700, flexShrink:0, border:"1px solid rgba(73,230,139,0.25)" }}>{c.tipoPessoa === "pj" ? "🏢 CNPJ" : "👤 CPF"} ✓</span>}
                          </div>
                          <div style={{ fontSize:"0.75rem", color:"#7a9bb5", marginTop:"2px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {c.telefone || "-"} · {c.email || "-"}
                          </div>
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"4px" }}>
                          <small style={{ color:"#6b8aad", fontSize:"0.68rem", whiteSpace:"nowrap" }}>{formatarDataHora(c.createdAt)}</small>
                          <button type="button" onClick={() => setClienteExpandido(expandido ? "" : c._id)}
                            style={{ padding:"2px 8px", borderRadius:"6px", border:"1px solid rgba(113,159,219,0.25)", background:"rgba(255,255,255,0.04)", color:"#9fb4c7", cursor:"pointer", fontSize:"0.68rem" }}>
                            {expandido ? "▲ menos" : "▼ mais"}
                          </button>
                        </div>
                      </div>

                      {/* painel expandido */}
                      {expandido && (
                        <div style={{ marginTop:"10px", paddingTop:"10px", borderTop:"1px solid rgba(113,159,219,0.12)" }}>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px", marginBottom:"8px" }}>
                            <div style={{ background:"rgba(79,209,255,0.06)", borderRadius:"8px", padding:"7px 10px" }}>
                              <div style={{ fontSize:"0.65rem", color:"#6b8aad", marginBottom:"2px" }}>TELEFONE</div>
                              <div style={{ fontSize:"0.82rem", color:"#eaf3ff", fontWeight:700 }}>{c.telefone || "-"}</div>
                            </div>
                            <div style={{ background:"rgba(79,209,255,0.06)", borderRadius:"8px", padding:"7px 10px" }}>
                              <div style={{ fontSize:"0.65rem", color:"#6b8aad", marginBottom:"2px" }}>EMAIL</div>
                              <div style={{ fontSize:"0.82rem", color:"#eaf3ff", wordBreak:"break-all" }}>{c.email || "-"}</div>
                            </div>
                            <div style={{ background:"rgba(79,209,255,0.06)", borderRadius:"8px", padding:"7px 10px" }}>
                              <div style={{ fontSize:"0.65rem", color:"#6b8aad", marginBottom:"2px" }}>ORIGEM</div>
                              <div style={{ fontSize:"0.82rem", color: origCor, fontWeight:700 }}>{c.origem || "-"}</div>
                            </div>
                            <div style={{ background:"rgba(79,209,255,0.06)", borderRadius:"8px", padding:"7px 10px" }}>
                              <div style={{ fontSize:"0.65rem", color:"#6b8aad", marginBottom:"2px" }}>CADASTRO</div>
                              <div style={{ fontSize:"0.82rem", color:"#eaf3ff" }}>{new Date(c.createdAt).toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" })}</div>
                            </div>
                            {c.cpfCnpj && (
                              <div style={{ background:"rgba(73,230,139,0.07)", borderRadius:"8px", padding:"7px 10px", border:"1px solid rgba(73,230,139,0.15)", gridColumn:"1 / -1" }}>
                                <div style={{ fontSize:"0.65rem", color:"#0aff87", marginBottom:"2px", fontWeight:800 }}>{c.tipoPessoa === "pj" ? "🏢 CNPJ" : "👤 CPF"}</div>
                                <div style={{ fontSize:"0.85rem", color:"#eaf3ff", fontWeight:700, letterSpacing:"0.05em" }}>{c.cpfCnpj}</div>
                                {c.nomeEmpresa && <div style={{ fontSize:"0.78rem", color:"#9fcfad", marginTop:"3px" }}>🏢 {c.nomeEmpresa}</div>}
                              </div>
                            )}
                            {!c.cpfCnpj && (
                              <div style={{ background:"rgba(255,209,102,0.05)", borderRadius:"8px", padding:"7px 10px", border:"1px solid rgba(255,209,102,0.12)", gridColumn:"1 / -1" }}>
                                <div style={{ fontSize:"0.72rem", color:"#9fb4c7" }}>⚠️ CPF/CNPJ não informado pelo cliente</div>
                              </div>
                            )}
                          </div>
                          {c.observacao && (
                            <div style={{ background:"rgba(184,156,255,0.07)", borderRadius:"8px", padding:"8px 10px", marginBottom:"8px", border:"1px solid rgba(184,156,255,0.15)" }}>
                              <div style={{ fontSize:"0.65rem", color:"#9650f5", marginBottom:"3px", fontWeight:800 }}>💬 OBSERVAÇÃO</div>
                              <div style={{ fontSize:"0.82rem", color:"#d3e4f8", lineHeight:1.5 }}>{c.observacao}</div>
                            </div>
                          )}
                          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                            <button type="button" onClick={() => copiarContato(c)}
                              style={{ padding:"6px 14px", borderRadius:"8px", border:"1px solid rgba(79,209,255,0.3)", background: contatoCopiado===c._id ? "rgba(73,230,139,0.12)" : "rgba(79,209,255,0.08)", color: contatoCopiado===c._id ? "#0aff87" : "#0092ff", cursor:"pointer", fontSize:"0.78rem", fontWeight:800 }}>
                              {contatoCopiado===c._id ? "✅ Copiado!" : "📋 Copiar contato"}
                            </button>
                            <a href={`https://wa.me/55${(c.telefone||"").replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
                              style={{ padding:"6px 14px", borderRadius:"8px", border:"1px solid rgba(37,211,102,0.35)", background:"rgba(37,211,102,0.08)", color:"#25d366", fontSize:"0.78rem", fontWeight:800, textDecoration:"none" }}>
                              💬 WhatsApp
                            </a>
                            <a href={`mailto:${c.email}`} target="_blank" rel="noreferrer"
                              style={{ padding:"6px 14px", borderRadius:"8px", border:"1px solid rgba(113,159,219,0.25)", background:"rgba(255,255,255,0.04)", color:"#9fb4c7", fontSize:"0.78rem", fontWeight:800, textDecoration:"none" }}>
                              ✉️ Email
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            );
          })()}
        </div>
      )}

      {aba === "formulacoes" && (
        <div>
          {dados.formulacoes.length === 0 && !carregando && (
            <div className="gallery-empty">Nenhuma formulação solicitada ainda.</div>
          )}
          {dados.formulacoes.map((f) => (
            <CARD key={f._id}>
              {/* Cabeçalho — nome + status + data */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <strong style={{ fontSize: "0.95rem", color: "#eaf3ff" }}>{f.nome || "Sem nome"}</strong>
                  <div style={{ fontSize: "0.78rem", color: "#9fb4c7", marginTop: "2px" }}>
                    📱 {f.telefone || "-"} · ✉️ {f.email || "-"}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    fontSize: "0.72rem", padding: "3px 10px", borderRadius: "999px", fontWeight: 800,
                    background: f.status === "resolvido" ? "rgba(73,230,139,0.12)" : f.status === "em_contato" ? "rgba(79,209,255,0.12)" : f.status === "impossivel" ? "rgba(255,107,107,0.12)" : "rgba(255,209,102,0.12)",
                    color: f.status === "resolvido" ? "#0aff87" : f.status === "em_contato" ? "#0092ff" : f.status === "impossivel" ? "#d73c3c" : "#dc913c",
                    border: `1px solid ${f.status === "resolvido" ? "rgba(73,230,139,0.3)" : f.status === "em_contato" ? "rgba(79,209,255,0.3)" : f.status === "impossivel" ? "rgba(255,107,107,0.3)" : "rgba(255,209,102,0.3)"}`,
                  }}>
                    {f.status === "resolvido" ? "✅ Resolvido" : f.status === "em_contato" ? "📞 Em contato" : f.status === "impossivel" ? "❌ Não é possível" : "⏳ Pendente"}
                  </span>
                  <small style={{ color: "#8ba3be", fontSize: "0.72rem" }}>{formatarDataHora(f.createdAt)}</small>
                </div>
              </div>

              {/* Botões de contato rápido */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                <a href={"https://wa.me/5531983340053?text=" + encodeURIComponent("Olá " + (f.nome || "") + ", recebi seu pedido de formulação personalizada para " + (f.caracteristica || "sua aplicação") + ". Vou te ajudar!")}
                  target="_blank" rel="noreferrer"
                  style={{ display:"flex", alignItems:"center", gap:"6px", padding:"7px 14px", borderRadius:"8px", border:"1px solid rgba(37,211,102,0.4)", background:"rgba(37,211,102,0.1)", color:"#25d366", fontSize:"0.8rem", fontWeight:800, textDecoration:"none" }}>
                  💬 WhatsApp Business
                </a>
                {f.email && <a href={"mailto:" + f.email}
                  target="_blank" rel="noreferrer"
                  style={{ display:"flex", alignItems:"center", gap:"6px", padding:"7px 14px", borderRadius:"8px", border:"1px solid rgba(113,159,219,0.25)", background:"rgba(255,255,255,0.04)", color:"#9fb4c7", fontSize:"0.8rem", fontWeight:800, textDecoration:"none" }}>
                  ✉️ Email
                </a>}
              </div>

              {/* Dados da formulação */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                <div style={{ background: "rgba(184,156,255,0.07)", border: "1px solid rgba(184,156,255,0.2)", borderRadius: "8px", padding: "8px 10px" }}>
                  <span style={{ fontSize: "0.68rem", color: "#9fb4c7", display: "block" }}>Aplicação desejada</span>
                  <strong style={{ fontSize: "0.85rem", color: "#9650f5" }}>{f.caracteristica || "Não informado"}</strong>
                </div>
                <div style={{ background: "rgba(79,209,255,0.06)", border: "1px solid rgba(79,209,255,0.15)", borderRadius: "8px", padding: "8px 10px" }}>
                  <span style={{ fontSize: "0.68rem", color: "#9fb4c7", display: "block" }}>Cor desejada</span>
                  <strong style={{ fontSize: "0.85rem", color: "#eaf3ff" }}>{f.cor || "Não informado"}</strong>
                </div>
              </div>

              {f.detalhes && (
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(113,159,219,0.12)", borderRadius: "8px", padding: "10px 12px", marginBottom: "12px" }}>
                  <p style={{ margin: 0, color: "#d3e4f8", fontSize: "0.82rem", lineHeight: 1.6 }}>💬 {f.detalhes}</p>
                </div>
              )}

              {/* Botões de ação */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button type="button"
                  onClick={async () => {
                    try {
                      await api.patch("/formulacoes/" + f._id + "/status", { status: "em_contato" }, { headers: { Authorization: "Bearer " + token } });
                      await carregarDados();
                    } catch(e) { alert("Erro ao atualizar"); }
                  }}
                  disabled={f.status === "em_contato"}
                  style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(79,209,255,0.35)", background: "rgba(79,209,255,0.1)", color: "#0092ff", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800, opacity: f.status === "em_contato" ? 0.4 : 1 }}>
                  📞 Já entrei em contato
                </button>
                <button type="button"
                  onClick={async () => {
                    try {
                      await api.patch("/formulacoes/" + f._id + "/status", { status: "resolvido" }, { headers: { Authorization: "Bearer " + token } });
                      await carregarDados();
                    } catch(e) { alert("Erro ao atualizar"); }
                  }}
                  disabled={f.status === "resolvido"}
                  style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(73,230,139,0.35)", background: "rgba(73,230,139,0.1)", color: "#0aff87", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800, opacity: f.status === "resolvido" ? 0.4 : 1 }}>
                  ✅ Resolvido
                </button>
                <button type="button"
                  onClick={async () => {
                    try {
                      await api.patch("/formulacoes/" + f._id + "/status", { status: "impossivel" }, { headers: { Authorization: "Bearer " + token } });
                      await carregarDados();
                    } catch(e) { alert("Erro ao atualizar"); }
                  }}
                  disabled={f.status === "impossivel"}
                  style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(255,107,107,0.35)", background: "rgba(255,107,107,0.08)", color: "#d73c3c", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800, opacity: f.status === "impossivel" ? 0.4 : 1 }}>
                  ❌ Não é possível
                </button>
                <button type="button"
                  onClick={async () => {
                    try {
                      await api.patch("/formulacoes/" + f._id + "/status", { status: "pendente" }, { headers: { Authorization: "Bearer " + token } });
                      await carregarDados();
                    } catch(e) { alert("Erro ao atualizar"); }
                  }}
                  style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(255,209,102,0.25)", background: "rgba(255,209,102,0.06)", color: "#dc913c", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800 }}>
                  ↩️ Reabrir
                </button>
              </div>
            </CARD>
          ))}
        </div>
      )}

      {aba === "chamados" && (
        <div>
          {dados.chamados.length === 0 && !carregando && <div className="gallery-empty">Nenhum chamado tecnico registrado.</div>}
          {dados.chamados.map((c) => (
            <CARD key={c._id}>
              {/* Cabeçalho */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "6px" }}>
                <div>
                  <strong style={{ fontSize: "0.95rem", color: "#eaf3ff" }}>{c.nome || "Sem nome"}</strong>
                  <div style={{ fontSize: "0.78rem", color: "#9fb4c7", marginTop: "2px" }}>
                    📱 {c.telefone || "-"} · ✉️ {c.email || "-"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <BADGE status={c.status || "novo"} />
                  <small style={{ color: "#9fb4c7", fontSize: "0.72rem" }}>{formatarDataHora(c.createdAt)}</small>
                </div>
              </div>

              {/* Ações rápidas de contato */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                <a href={"https://wa.me/5531983340053?text=" + encodeURIComponent("Olá " + (c.nome || "") + ", vi seu chamado técnico sobre " + (c.problema || c.resina || "sua impressora") + ". Posso te ajudar!")}
                  target="_blank" rel="noreferrer"
                  style={{ display:"flex", alignItems:"center", gap:"6px", padding:"7px 14px", borderRadius:"8px", border:"1px solid rgba(37,211,102,0.4)", background:"rgba(37,211,102,0.1)", color:"#25d366", fontSize:"0.8rem", fontWeight:800, textDecoration:"none" }}>
                  💬 WhatsApp Business
                </a>
                <a href={"mailto:" + (c.email || "")}
                  target="_blank" rel="noreferrer"
                  style={{ display:"flex", alignItems:"center", gap:"6px", padding:"7px 14px", borderRadius:"8px", border:"1px solid rgba(113,159,219,0.25)", background:"rgba(255,255,255,0.04)", color:"#9fb4c7", fontSize:"0.8rem", fontWeight:800, textDecoration:"none" }}>
                  ✉️ Email
                </a>
              </div>

              {/* Fotos + Dados lado a lado */}
              <div style={{ display: "grid", gridTemplateColumns: c.fotos?.length > 0 ? "1fr 1.5fr" : "1fr", gap: "14px", marginBottom: "10px" }}>
                {/* Fotos */}
                {c.fotos?.length > 0 && (
                  <div>
                    <p style={{ margin: "0 0 6px", fontSize: "0.72rem", fontWeight: 800, color: "#9fb4c7", textTransform: "uppercase" }}>📷 Fotos do problema</p>
                    <div style={{ display: "grid", gridTemplateColumns: c.fotos.length > 1 ? "1fr 1fr" : "1fr", gap: "6px" }}>
                      {c.fotos.map((foto, i) => {
                        const src = typeof foto === "string" ? foto : foto?.url || "";
                        if (!src) return null;
                        return (
                          <img key={i} src={src} alt={"Foto " + (i+1)}
                            onClick={() => window.open(src, "_blank")}
                            style={{ width: "100%", maxHeight: "140px", objectFit: "cover", borderRadius: "8px", border: "1px solid rgba(113,159,219,0.2)", cursor: "pointer", background: "rgba(0,0,0,0.3)" }}
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Dados */}
                <div>
                  {/* Resina + Impressora */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "8px" }}>
                    <div style={{ background: "rgba(79,209,255,0.06)", border: "1px solid rgba(79,209,255,0.15)", borderRadius: "8px", padding: "7px 10px" }}>
                      <span style={{ fontSize: "0.68rem", color: "#9fb4c7", display: "block" }}>Resina</span>
                      <strong style={{ fontSize: "0.82rem", color: "#0092ff" }}>{c.resina || "Não informada"}</strong>
                    </div>
                    <div style={{ background: "rgba(79,209,255,0.06)", border: "1px solid rgba(79,209,255,0.15)", borderRadius: "8px", padding: "7px 10px" }}>
                      <span style={{ fontSize: "0.68rem", color: "#9fb4c7", display: "block" }}>Impressora</span>
                      <strong style={{ fontSize: "0.82rem", color: "#eaf3ff" }}>{c.impressora || "Não informada"}</strong>
                    </div>
                  </div>

                  {/* Problema */}
                  <div style={{ background: "rgba(255,107,107,0.07)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: "8px", padding: "8px 10px", marginBottom: "8px" }}>
                    <strong style={{ fontSize: "0.78rem", color: "#d73c3c" }}>⚠️ Problema: </strong>
                    <span style={{ fontSize: "0.82rem", color: "#d3e4f8" }}>{c.problema || "-"}</span>
                  </div>

                  {/* Descrição / parâmetros */}
                  {c.descricao && (
                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(113,159,219,0.12)", borderRadius: "8px", padding: "8px 10px" }}>
                      <p style={{ margin: 0, color: "#9fb4c7", fontSize: "0.78rem", lineHeight: 1.6 }}>{c.descricao}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Botões de ação */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "6px" }}>
                <button type="button"
                  onClick={async () => {
                    try {
                      await api.patch("/bot-tickets/" + c._id + "/status", { status: "em_analise" }, { headers: { Authorization: "Bearer " + token } });
                      await carregarDados();
                    } catch(e) { alert("Erro ao atualizar"); }
                  }}
                  disabled={c.status === "em_analise"}
                  style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(255,209,102,0.35)", background: "rgba(255,209,102,0.1)", color: "#dc913c", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800, opacity: c.status === "em_analise" ? 0.4 : 1 }}>
                  🔍 Em análise
                </button>
                <button type="button"
                  onClick={async () => {
                    try {
                      await api.patch("/bot-tickets/" + c._id + "/status", { status: "respondido" }, { headers: { Authorization: "Bearer " + token } });
                      await carregarDados();
                    } catch(e) { alert("Erro ao atualizar"); }
                  }}
                  disabled={c.status === "respondido"}
                  style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(79,209,255,0.35)", background: "rgba(79,209,255,0.1)", color: "#0092ff", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800, opacity: c.status === "respondido" ? 0.4 : 1 }}>
                  📞 Já entrei em contato
                </button>
                <button type="button"
                  onClick={async () => {
                    try {
                      await api.patch("/bot-tickets/" + c._id + "/status", { status: "fechado" }, { headers: { Authorization: "Bearer " + token } });
                      await carregarDados();
                    } catch(e) { alert("Erro ao atualizar"); }
                  }}
                  disabled={c.status === "fechado"}
                  style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(73,230,139,0.35)", background: "rgba(73,230,139,0.1)", color: "#0aff87", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800, opacity: c.status === "fechado" ? 0.4 : 1 }}>
                  ✅ Resolvido
                </button>
                <button type="button"
                  onClick={async () => {
                    try {
                      await api.patch("/bot-tickets/" + c._id + "/status", { status: "novo" }, { headers: { Authorization: "Bearer " + token } });
                      await carregarDados();
                    } catch(e) { alert("Erro ao atualizar"); }
                  }}
                  style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(255,107,107,0.25)", background: "rgba(255,107,107,0.06)", color: "#d73c3c", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800 }}>
                  ↩️ Reabrir
                </button>
              </div>
            </CARD>
          ))}
        </div>
      )}

      {aba === "parceiros" && (
        <div>
          {(!dados.parceiros || dados.parceiros.length === 0) && !carregando && (
            <div className="gallery-empty">Nenhuma solicitação de parceria ainda.</div>
          )}
          {(dados.parceiros || []).map((p) => (
            <CARD key={p._id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <strong style={{ fontSize: "0.95rem", color: "#eaf3ff" }}>{p.nome || "Sem nome"}</strong>
                  <div style={{ fontSize: "0.78rem", color: "#9fb4c7", marginTop: "2px" }}>
                    📱 {p.telefone || "-"} · ✉️ {p.email || "-"}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <BADGE status={p.status} />
                  <small style={{ color: "#8ba3be", fontSize: "0.72rem" }}>{formatarDataHora(p.createdAt)}</small>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                <div style={{ background: "rgba(184,156,255,0.07)", border: "1px solid rgba(184,156,255,0.2)", borderRadius: "8px", padding: "8px 10px" }}>
                  <span style={{ fontSize: "0.68rem", color: "#9fb4c7", display: "block" }}>Tipo de solicitação</span>
                  <strong style={{ fontSize: "0.85rem", color: "#9650f5" }}>{p.tipo || "-"}</strong>
                </div>
                <div style={{ background: "rgba(79,209,255,0.06)", border: "1px solid rgba(79,209,255,0.15)", borderRadius: "8px", padding: "8px 10px" }}>
                  <span style={{ fontSize: "0.68rem", color: "#9fb4c7", display: "block" }}>Categoria</span>
                  <strong style={{ fontSize: "0.85rem", color: "#eaf3ff" }}>{p.categoria || "-"}</strong>
                </div>
              </div>

              <div style={{ marginBottom: "10px" }}>
                <strong style={{ color: "#eaf3ff", fontSize: "0.88rem", display: "block", marginBottom: "4px" }}>{p.titulo}</strong>
                <p style={{ margin: 0, color: "#d3e4f8", fontSize: "0.82rem", lineHeight: 1.6 }}>{p.descricao}</p>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px", fontSize: "0.78rem", color: "#9fb4c7" }}>
                {p.instagram && <span>📸 {p.instagram}</span>}
                {p.site && <span>🌐 {p.site}</span>}
                {p.portfolio && <span>💼 {p.portfolio}</span>}
                {(p.cidade || p.estado) && <span>📍 {p.cidade}{p.cidade && p.estado ? " - " : ""}{p.estado}</span>}
              </div>

              {p.fotos?.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: "6px", marginBottom: "10px" }}>
                  {p.fotos.map((foto, i) => (
                    <img key={i} src={foto.url} alt={"Foto " + (i + 1)} onClick={() => window.open(foto.url, "_blank")}
                      style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "8px", cursor: "pointer", border: "1px solid rgba(113,159,219,0.2)" }}
                      onError={(e) => { e.target.style.display = "none"; }} />
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button type="button" onClick={() => atualizarStatusParceiro(p._id, "aprovado")} disabled={p.status === "aprovado"}
                  style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(73,230,139,0.4)", background: "rgba(73,230,139,0.12)", color: "#0aff87", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800, opacity: p.status === "aprovado" ? 0.4 : 1 }}>
                  ✅ Aprovar
                </button>
                <button type="button" onClick={() => atualizarStatusParceiro(p._id, "rejeitado")} disabled={p.status === "rejeitado"}
                  style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(255,107,107,0.35)", background: "rgba(255,107,107,0.08)", color: "#d73c3c", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800, opacity: p.status === "rejeitado" ? 0.4 : 1 }}>
                  ❌ Rejeitar
                </button>
                <button type="button" onClick={() => atualizarStatusParceiro(p._id, "pendente")}
                  style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(255,209,102,0.25)", background: "rgba(255,209,102,0.06)", color: "#dc913c", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800 }}>
                  ↩️ Voltar pra pendente
                </button>
              </div>
            </CARD>
          ))}
        </div>
      )}

      {aba === "mensagens" && (
        <div>
          {dados.mensagens.length === 0 && !carregando && <div className="gallery-empty">Nenhuma mensagem de contato recebida.</div>}
          {dados.mensagens.map((m) => (
            <CARD key={m._id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                <strong>{m.nome || m.clienteNome || "Sem nome"}</strong>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}><BADGE status={m.status || (m.resolvido ? "resolvido" : "pendente")} /><small style={{ color: "#9fb4c7", fontSize: "0.75rem" }}>{formatarDataHora(m.createdAt)}</small></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "0.82rem", color: "#9fb4c7", marginBottom: "8px" }}>
                <span>Tel: {m.telefone || "-"}</span><span>Email: {m.email || "-"}</span><span>Assunto: {m.assunto || "-"}</span>
              </div>
              {m.mensagem && <div style={{ background: "rgba(26,115,232,0.08)", border: "1px solid rgba(26,115,232,0.2)", borderRadius: "8px", padding: "8px", marginBottom: "10px" }}>
                <p style={{ color: "#d3e4f8", fontSize: "0.82rem", margin: 0 }}>{m.mensagem}</p>
              </div>}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button type="button" onClick={() => atualizarStatusMensagem(m._id, "em_contato")} disabled={m.status === "em_contato"}
                  style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(79,209,255,0.35)", background: "rgba(79,209,255,0.08)", color: "#0092ff", cursor: "pointer", fontSize: "0.78rem", fontWeight: 800, opacity: m.status === "em_contato" ? 0.4 : 1 }}>
                  📞 Em contato
                </button>
                <button type="button" onClick={() => atualizarStatusMensagem(m._id, "resolvido")} disabled={m.status === "resolvido"}
                  style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(73,230,139,0.4)", background: "rgba(73,230,139,0.08)", color: "#0aff87", cursor: "pointer", fontSize: "0.78rem", fontWeight: 800, opacity: m.status === "resolvido" ? 0.4 : 1 }}>
                  ✅ Resolvido
                </button>
                <button type="button" onClick={() => atualizarStatusMensagem(m._id, "pendente")}
                  style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(255,209,102,0.3)", background: "rgba(255,209,102,0.06)", color: "#dc913c", cursor: "pointer", fontSize: "0.78rem", fontWeight: 800 }}>
                  ↩️ Pendente
                </button>
              </div>
            </CARD>
          ))}
        </div>
      )}
      {aba === "atendentes" && (
        <div>
          <div style={{ background: "rgba(79,209,255,0.06)", border: "1px solid rgba(79,209,255,0.2)", borderRadius: "14px", padding: "18px", marginBottom: "20px" }}>
            <p style={{ fontWeight: 900, color: "#0092ff", marginBottom: "14px", fontSize: "0.9rem" }}>➕ Novo Atendente</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
              <input value={novoAt.nome} onChange={e => setNovoAt(p => ({...p, nome: e.target.value}))} placeholder="Nome completo" autoComplete="off" name="at-nome" style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid rgba(113,159,219,0.3)", background: "rgba(4,10,24,0.9)", color: "#eaf3ff", WebkitTextFillColor: "#eaf3ff", caretColor: "#eaf3ff", fontFamily: "inherit", fontSize: "0.85rem", boxShadow: "0 0 0 9999px rgba(4,10,24,0.9) inset" }} />
              <input value={novoAt.email} onChange={e => setNovoAt(p => ({...p, email: e.target.value}))} placeholder="Email do atendente" type="text" autoComplete="off" name="at-email" style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid rgba(113,159,219,0.3)", background: "rgba(4,10,24,0.9)", color: "#eaf3ff", WebkitTextFillColor: "#eaf3ff", caretColor: "#eaf3ff", fontFamily: "inherit", fontSize: "0.85rem", boxShadow: "0 0 0 9999px rgba(4,10,24,0.9) inset" }} />
              <input value={novoAt.senha} onChange={e => setNovoAt(p => ({...p, senha: e.target.value}))} placeholder="Senha (mín. 6 caracteres)" type="password" autoComplete="new-password" name="at-senha" style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid rgba(113,159,219,0.3)", background: "rgba(4,10,24,0.9)", color: "#eaf3ff", WebkitTextFillColor: "#eaf3ff", caretColor: "#eaf3ff", fontFamily: "inherit", fontSize: "0.85rem", boxShadow: "0 0 0 9999px rgba(4,10,24,0.9) inset" }} />
            </div>
            <p style={{ fontWeight: 800, color: "#9650f5", fontSize: "0.82rem", margin: "0 0 10px" }}>🔐 Permissões:</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
              {[
                { key: "acessoAdmCompleto", label: "🔓 Acesso ADM completo (superadmin)" },
                { key: "mudarStatusChamados", label: "🔧 Mudar status de chamados" },
                { key: "sugerirConhecimento", label: "💡 Sugerir conhecimento (Assistente)" },
                { key: "aprovarGaleria", label: "📸 Aprovar fotos da galeria" },
                { key: "acessarMetricas", label: "📊 Ver métricas" },
              ].map(p => (
                <label key={p.key} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.82rem", color: "#c5d8e8" }}>
                  <input type="checkbox" checked={!!novoAt.permissoes[p.key]}
                    onChange={e => setNovoAt(prev => ({ ...prev, permissoes: { ...prev.permissoes, [p.key]: e.target.checked } }))}
                    style={{ width: "18px", height: "18px", accentColor: "#0092ff", cursor: "pointer" }} />
                  {p.label}
                </label>
              ))}
            </div>
            <button type="button" onClick={criarAtendente} disabled={criandoAt} style={{ padding: "9px 20px", borderRadius: "999px", border: "none", background: "linear-gradient(135deg,#0092ff,#9650f5)", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: "0.85rem", fontFamily: "inherit" }}>
              {criandoAt ? "Criando..." : "✅ Criar Atendente"}
            </button>
            <p style={{ marginTop: "8px", fontSize: "0.72rem", color: "#9fb4c7" }}>💡 Código gerado automaticamente (AT001, AT002...). Login via email e senha.</p>
          </div>
          {atendentes.length === 0 && <div className="gallery-empty">Nenhum atendente cadastrado ainda.</div>}
          {atendentes.map(at => {
            const perms = at.permissoes || {};
            const isExpanded = editandoPerms === at._id;
            const PERM_LABELS = [
              { key: "acessoAdmCompleto", label: "🔓 ADM completo", cor: "#dc913c" },
              { key: "mudarStatusChamados", label: "🔧 Chamados", cor: "#0092ff" },
              { key: "sugerirConhecimento", label: "💡 Sugestões", cor: "#9650f5" },
              { key: "aprovarGaleria", label: "📸 Galeria", cor: "#0aff87" },
              { key: "acessarMetricas", label: "📊 Métricas", cor: "#d73c3c" },
            ];
            async function salvarPerms(novasPerms) {
              try {
                await api.patch("/atendentes/" + at._id + "/permissoes", { permissoes: novasPerms }, { headers: { Authorization: "Bearer " + token } });
                await carregarAtendentes();
              } catch(e) { alert("Erro ao salvar permissões"); }
            }
            return (
            <div key={at._id} style={{ border: "1px solid rgba(113,159,219,0.2)", borderRadius: "12px", padding: "14px 16px", background: at.ativo ? "rgba(255,255,255,0.04)" : "rgba(255,107,107,0.04)", marginBottom: "10px", color: "#eaf3ff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{ background: at.ativo ? "rgba(73,230,139,0.15)" : "rgba(255,107,107,0.15)", color: at.ativo ? "#0aff87" : "#d73c3c", padding: "2px 10px", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 800 }}>{at.codigo}</span>
                    <strong>{at.nome}</strong>
                    {!at.ativo && <span style={{ color: "#d73c3c", fontSize: "0.72rem" }}>⛔ DESATIVADO</span>}
                    {perms.acessoAdmCompleto && <span style={{ background: "rgba(255,209,102,0.15)", color: "#dc913c", padding: "2px 8px", borderRadius: "999px", fontSize: "0.65rem", fontWeight: 800 }}>ADMIN</span>}
                    {at.ultimoAcesso && (new Date() - new Date(at.ultimoAcesso)) < 8 * 60 * 60 * 1000 && (
                      <span style={{ background: "rgba(73,230,139,0.15)", color: "#0aff87", padding: "2px 8px", borderRadius: "999px", fontSize: "0.62rem", fontWeight: 800 }}>🟢 online</span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#9fb4c7", marginTop: "4px" }}>
                    ✉️ {at.email} · Cadastro: {new Date(at.createdAt).toLocaleDateString("pt-BR")}
                    {at.ultimoAcesso && ` · Último acesso: ${new Date(at.ultimoAcesso).toLocaleString("pt-BR")}`}
                  </div>
                  {/* Badges de permissões */}
                  <div style={{ display: "flex", gap: "4px", marginTop: "6px", flexWrap: "wrap" }}>
                    {PERM_LABELS.filter(p => perms[p.key]).map(p => (
                      <span key={p.key} style={{ background: `${p.cor}15`, color: p.cor, padding: "1px 8px", borderRadius: "999px", fontSize: "0.62rem", fontWeight: 700 }}>{p.label}</span>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button type="button" onClick={() => verSessoes(at._id)}
                    style={{ padding: "6px 14px", borderRadius: "999px", border: "1px solid rgba(79,209,255,0.35)", background: sessoesAberta === at._id ? "rgba(79,209,255,0.2)" : "rgba(79,209,255,0.07)", color: "#0092ff", cursor: "pointer", fontSize: "0.78rem", fontWeight: 800, fontFamily: "inherit" }}>
                    🖥️ Sessões
                  </button>
                  <button type="button" onClick={() => setEditandoPerms(isExpanded ? null : at._id)}
                    style={{ padding: "6px 14px", borderRadius: "999px", border: "1px solid rgba(184,156,255,0.4)", background: isExpanded ? "rgba(184,156,255,0.2)" : "rgba(184,156,255,0.08)", color: "#9650f5", cursor: "pointer", fontSize: "0.78rem", fontWeight: 800, fontFamily: "inherit" }}>
                    🔐 Permissões
                  </button>
                  <button type="button" onClick={() => toggleAtendente(at._id, !at.ativo)}
                    style={{ padding: "6px 14px", borderRadius: "999px", border: at.ativo ? "1px solid rgba(255,107,107,0.4)" : "1px solid rgba(73,230,139,0.4)", background: at.ativo ? "rgba(255,107,107,0.1)" : "rgba(73,230,139,0.1)", color: at.ativo ? "#d73c3c" : "#0aff87", cursor: "pointer", fontSize: "0.78rem", fontWeight: 800, fontFamily: "inherit" }}>
                    {at.ativo ? "⛔ Desativar" : "✅ Ativar"}
                  </button>
                </div>
              </div>
              {/* Painel de sessões */}
              {sessoesAberta === at._id && (() => {
                const sd = sessoesData[at._id] || {};
                const sessoes = sd.sessoes || [];
                const agora = new Date();
                return (
                  <div style={{ marginTop: "12px", padding: "14px", borderRadius: "10px", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(79,209,255,0.15)" }}>
                    <p style={{ fontWeight: 800, color: "#0092ff", fontSize: "0.82rem", margin: "0 0 12px" }}>
                      🖥️ Histórico de sessões de {at.nome}
                    </p>
                    {sessoes.length === 0 && (
                      <p style={{ color: "#9fb4c7", fontSize: "0.8rem" }}>Nenhuma sessão registrada ainda.</p>
                    )}
                    {sessoes.map((s, i) => {
                      const loginEm = new Date(s.loginEm);
                      const expiresEm = s.expiresEm ? new Date(s.expiresEm) : null;
                      const ativa = expiresEm && expiresEm > agora;
                      const diffMin = Math.round((agora - loginEm) / 60000);
                      const tempo = diffMin < 60 ? diffMin + " min atrás" : diffMin < 1440 ? Math.round(diffMin/60) + "h atrás" : Math.round(diffMin/1440) + "d atrás";
                      return (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "10px", alignItems: "center", padding: "8px 10px", borderRadius: "8px", background: ativa ? "rgba(73,230,139,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${ativa ? "rgba(73,230,139,0.2)" : "rgba(113,159,219,0.1)"}`, marginBottom: "6px" }}>
                          <div style={{ fontSize: "1.2rem" }}>{s.dispositivo?.includes("Android") || s.dispositivo?.includes("iOS") ? "📱" : "💻"}</div>
                          <div>
                            <div style={{ fontSize: "0.8rem", color: "#eaf3ff", fontWeight: 700 }}>{s.dispositivo || "Dispositivo desconhecido"}</div>
                            <div style={{ fontSize: "0.72rem", color: "#9fb4c7", marginTop: "2px" }}>
                              🌐 IP: <strong style={{ color: "#7dd3fc" }}>{s.ip || "—"}</strong>
                              &nbsp;·&nbsp;{loginEm.toLocaleString("pt-BR")}
                            </div>
                          </div>
                          <div>
                            {ativa
                              ? <span style={{ background: "rgba(73,230,139,0.15)", color: "#0aff87", padding: "2px 10px", borderRadius: "999px", fontSize: "0.68rem", fontWeight: 800 }}>🟢 ATIVA</span>
                              : <span style={{ color: "#6b8aad", fontSize: "0.7rem" }}>{tempo}</span>
                            }
                          </div>
                        </div>
                      );
                    })}
                    {sd.ultimoIp && (
                      <p style={{ fontSize: "0.72rem", color: "#6b8aad", margin: "8px 0 0" }}>
                        Último acesso: <strong style={{ color: "#9fb4c7" }}>{sd.ultimoDispositivo}</strong> — IP: <strong style={{ color: "#7dd3fc" }}>{sd.ultimoIp}</strong>
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Painel de permissões expandido */}
              {isExpanded && (
                <div style={{ marginTop: "12px", padding: "14px", borderRadius: "10px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(184,156,255,0.15)" }}>
                  <p style={{ fontWeight: 800, color: "#9650f5", fontSize: "0.82rem", margin: "0 0 10px" }}>🔐 Permissões de {at.nome}:</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {PERM_LABELS.map(p => (
                      <label key={p.key} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.82rem", color: "#c5d8e8" }}>
                        <input type="checkbox" checked={!!perms[p.key]}
                          onChange={e => salvarPerms({ ...perms, [p.key]: e.target.checked })}
                          style={{ width: "18px", height: "18px", accentColor: "#0092ff", cursor: "pointer" }} />
                        {p.label}
                      </label>
                    ))}
                  </div>
                  <p style={{ fontSize: "0.68rem", color: "#6b8aad", marginTop: "8px", margin: "8px 0 0" }}>As alterações são salvas automaticamente ao marcar/desmarcar.</p>
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {aba === "logs" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <p style={{ fontWeight: 900, color: "#0092ff", fontSize: "0.9rem" }}>📋 Histórico de Ações ({logs.length})</p>
            <button type="button" onClick={carregarLogs} style={{ padding: "6px 14px", borderRadius: "999px", border: "1px solid rgba(79,209,255,0.3)", background: "rgba(79,209,255,0.08)", color: "#0092ff", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700, fontFamily: "inherit" }}>🔄 Atualizar</button>
          </div>
          {logs.length === 0 && <div className="gallery-empty">Nenhuma ação registrada ainda.</div>}
          {logs.map(log => (
            <div key={log._id} style={{ border: `1px solid ${log.bloqueada ? "rgba(255,107,107,0.3)" : "rgba(113,159,219,0.15)"}`, borderRadius: "10px", padding: "10px 14px", background: log.bloqueada ? "rgba(255,107,107,0.06)" : "rgba(255,255,255,0.03)", marginBottom: "8px", color: "#eaf3ff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "6px", marginBottom: "4px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {log.bloqueada && <span style={{ background: "rgba(255,107,107,0.2)", color: "#d73c3c", padding: "1px 8px", borderRadius: "999px", fontSize: "0.65rem", fontWeight: 800 }}>⛔ BLOQUEADA</span>}
                  <span style={{ background: log.tipo === "superadmin" ? "rgba(255,209,102,0.15)" : "rgba(79,209,255,0.1)", color: log.tipo === "superadmin" ? "#dc913c" : "#0092ff", padding: "1px 8px", borderRadius: "999px", fontSize: "0.68rem", fontWeight: 800 }}>{log.atendenteCod}</span>
                  <strong style={{ fontSize: "0.82rem" }}>{log.atendenteNome}</strong>
                </div>
                <small style={{ color: "#6b8aad", fontSize: "0.7rem" }}>{new Date(log.createdAt).toLocaleString("pt-BR")}</small>
              </div>
              <div style={{ fontSize: "0.78rem", color: "#b8cfe8" }}>
                <span style={{ color: "#9fb4c7" }}>[{log.modulo}]</span> {log.acao}
                {log.detalhe && <span style={{ color: "#7a9bb5" }}> — {log.detalhe}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {aba === "sugestoes_elio" && (
        <div>
          <p style={{ fontWeight: 900, color: "#0092ff", fontSize: "0.9rem", marginBottom: "14px" }}>💡 Sugestões de Conhecimento para o Assistente ({sugestoesElio.length})</p>
          {sugestoesElio.length === 0 && <div className="gallery-empty">Nenhuma sugestão enviada pelos atendentes.</div>}
          {sugestoesElio.map(s => {
            const cores = { pendente: "#dc913c", aprovado: "#0aff87", rejeitado: "#d73c3c" };
            const catIcons = { resina: "🧪", impressora: "🖨️", problema: "⚠️", dica: "💡", outro: "📝" };
            return (
              <div key={s._id} style={{ border: "1px solid rgba(113,159,219,0.2)", borderRadius: "12px", padding: "14px", background: "rgba(255,255,255,0.04)", marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                  <div>
                    <strong style={{ color: "#eaf3ff", fontSize: "0.92rem" }}>{s.titulo}</strong>
                    <div style={{ fontSize: "0.72rem", color: "#9fb4c7", marginTop: "2px" }}>
                      {catIcons[s.categoria] || "📝"} {s.categoria} · 👨‍💼 {s.codigoAtendente} ({s.nomeAtendente}) · {new Date(s.createdAt).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <span style={{ fontSize: "0.72rem", padding: "3px 10px", borderRadius: "999px", background: `${cores[s.status]}20`, color: cores[s.status], fontWeight: 800 }}>
                    {s.status === "pendente" ? "⏳ Pendente" : s.status === "aprovado" ? "✅ Aprovado" : "❌ Rejeitado"}
                  </span>
                </div>
                <p style={{ fontSize: "0.82rem", color: "#b8cfe8", margin: "0 0 10px", lineHeight: 1.6, background: "rgba(0,0,0,0.15)", padding: "10px 12px", borderRadius: "8px" }}>{s.conteudo}</p>
                {s.status === "pendente" && (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button type="button" onClick={async () => {
                      try {
                        await api.patch("/sugestoes-conhecimento/" + s._id + "/status", { status: "aprovado" }, { headers: { Authorization: "Bearer " + token } });
                        const r = await api.get("/sugestoes-conhecimento", { headers: { Authorization: "Bearer " + token } });
                        setSugestoesElio(r.data?.sugestoes || []);
                      } catch(e) { alert("Erro"); }
                    }}
                      style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(73,230,139,0.4)", background: "rgba(73,230,139,0.1)", color: "#0aff87", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800, fontFamily: "inherit" }}>
                      ✅ Aprovar
                    </button>
                    <button type="button" onClick={async () => {
                      const obs = prompt("Motivo da rejeição (opcional):");
                      try {
                        await api.patch("/sugestoes-conhecimento/" + s._id + "/status", { status: "rejeitado", observacaoAdmin: obs || "" }, { headers: { Authorization: "Bearer " + token } });
                        const r = await api.get("/sugestoes-conhecimento", { headers: { Authorization: "Bearer " + token } });
                        setSugestoesElio(r.data?.sugestoes || []);
                      } catch(e) { alert("Erro"); }
                    }}
                      style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(255,107,107,0.4)", background: "rgba(255,107,107,0.1)", color: "#d73c3c", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800, fontFamily: "inherit" }}>
                      ❌ Rejeitar
                    </button>
                  </div>
                )}
                {s.observacaoAdmin && <p style={{ fontSize: "0.75rem", color: "#dc913c", margin: "8px 0 0", fontStyle: "italic" }}>Obs: {s.observacaoAdmin}</p>}
              </div>
            );
          })}
        </div>
      )}

      {aba === "limpeza" && <LimpezaContent token={token} />}

    </div>
  );
}

function LimpezaContent({ token }) {
  const COLECOES = [
    { id: "clientes",        label: "👥 Clientes",          desc: "Cadastros de entrada do site" },
    { id: "visitas",         label: "👁️ Visitas",           desc: "Registros de visitas ao site" },
    { id: "conversas",       label: "💬 Conversas Assistente", desc: "Histórico de conversas com o bot" },
    { id: "bottickets",      label: "🔧 Chamados",          desc: "Chamados técnicos abertos" },
    { id: "contactmessages", label: "✉️ Mensagens",         desc: "Mensagens de contato" },
    { id: "formulacoes",     label: "🧪 Formulações",       desc: "Pedidos de formulação" },
    { id: "logacoes",        label: "📋 Logs de Ações",     desc: "Logs de ações dos atendentes" },
    { id: "partnerrequests", label: "🤝 Parceiros",         desc: "Pedidos de parceria" },
    { id: "galleryitems",    label: "📸 Fotos da Galeria",  desc: "Fotos enviadas por clientes" },
  ];
  const [selecionadas, setSelecionadas] = useState([]);
  const [confirmando, setConfirmando]   = useState(false);
  const [limpando, setLimpando]         = useState(false);
  const [resultado, setResultado]       = useState(null);
  const [confirmInput, setConfirmInput] = useState("");

  function toggleCol(id) {
    setSelecionadas(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function executarLimpeza() {
    if (confirmInput !== "LIMPAR") { alert('Digite "LIMPAR" para confirmar'); return; }
    try {
      setLimpando(true);
      const r = await api.delete("/admin/limpar-testes", {
        data: { colecoes: selecionadas },
        headers: { Authorization: "Bearer " + token }
      });
      setResultado(r.data.resultados);
      setConfirmando(false);
      setConfirmInput("");
      setSelecionadas([]);
    } catch(e) {
      alert("Erro: " + (e.response?.data?.error || e.message));
    } finally { setLimpando(false); }
  }

  return (
    <div>
      <div style={{ background: "rgba(255,107,107,0.05)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: "12px", padding: "16px 18px", marginBottom: "20px" }}>
        <p style={{ fontWeight: 900, color: "#d73c3c", fontSize: "0.9rem", margin: "0 0 6px" }}>⚠️ Limpeza de Dados</p>
        <p style={{ fontSize: "0.82rem", color: "#c49aab", margin: 0 }}>Selecione as coleções que deseja limpar. <strong style={{ color: "#d73c3c" }}>Esta ação é irreversível!</strong> Os parâmetros do Assistente, atendentes e sugestões aprovadas nunca são afetados.</p>
      </div>

      {resultado && (
        <div style={{ background: "rgba(73,230,139,0.07)", border: "1px solid rgba(73,230,139,0.25)", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px" }}>
          <p style={{ fontWeight: 800, color: "#0aff87", margin: "0 0 8px" }}>✅ Limpeza concluída!</p>
          {Object.entries(resultado).map(([col, qtd]) => (
            <p key={col} style={{ fontSize: "0.82rem", color: "#9fcfad", margin: "3px 0" }}>
              {COLECOES.find(c => c.id === col)?.label || col}: <strong>{qtd} registros removidos</strong>
            </p>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
        {COLECOES.map(c => (
          <label key={c.id} onClick={() => toggleCol(c.id)}
            style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", borderRadius: "10px", border: `1px solid ${selecionadas.includes(c.id) ? "rgba(255,107,107,0.4)" : "rgba(113,159,219,0.2)"}`, background: selecionadas.includes(c.id) ? "rgba(255,107,107,0.07)" : "rgba(255,255,255,0.03)", cursor: "pointer" }}>
            <input type="checkbox" checked={selecionadas.includes(c.id)} onChange={() => {}} style={{ accentColor: "#d73c3c", width: "16px", height: "16px" }} />
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#eaf3ff" }}>{c.label}</div>
              <div style={{ fontSize: "0.72rem", color: "#9fb4c7" }}>{c.desc}</div>
            </div>
          </label>
        ))}
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button type="button" onClick={() => setSelecionadas(COLECOES.map(c => c.id))}
          style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid rgba(255,107,107,0.3)", background: "rgba(255,107,107,0.08)", color: "#d73c3c", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, fontFamily: "inherit" }}>
          Selecionar tudo
        </button>
        <button type="button" onClick={() => setSelecionadas([])}
          style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid rgba(113,159,219,0.25)", background: "rgba(255,255,255,0.04)", color: "#9fb4c7", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, fontFamily: "inherit" }}>
          Limpar seleção
        </button>
      </div>

      {selecionadas.length > 0 && !confirmando && (
        <button type="button" onClick={() => setConfirmando(true)}
          style={{ marginTop: "14px", width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,107,107,0.4)", background: "rgba(255,107,107,0.12)", color: "#d73c3c", fontWeight: 900, cursor: "pointer", fontSize: "0.9rem", fontFamily: "inherit" }}>
          🗑️ Limpar {selecionadas.length} coleção(ões) selecionada(s)
        </button>
      )}

      {confirmando && (
        <div style={{ marginTop: "14px", padding: "16px", borderRadius: "12px", border: "2px solid rgba(255,107,107,0.4)", background: "rgba(255,107,107,0.06)" }}>
          <p style={{ color: "#d73c3c", fontWeight: 800, margin: "0 0 10px", fontSize: "0.9rem" }}>⚠️ Confirmação final — esta ação NÃO pode ser desfeita!</p>
          <p style={{ color: "#c49aab", fontSize: "0.82rem", margin: "0 0 12px" }}>Digite <strong style={{ color: "#d73c3c" }}>LIMPAR</strong> para confirmar:</p>
          <input value={confirmInput} onChange={e => setConfirmInput(e.target.value)}
            placeholder='Digite: LIMPAR'
            style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255,107,107,0.3)", background: "rgba(0,0,0,0.3)", color: "#eaf3ff", fontFamily: "inherit", fontSize: "0.9rem", marginBottom: "10px", boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" onClick={executarLimpeza} disabled={limpando || confirmInput !== "LIMPAR"}
              style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: confirmInput === "LIMPAR" ? "#d73c3c" : "rgba(255,107,107,0.2)", color: "#fff", fontWeight: 900, cursor: confirmInput === "LIMPAR" ? "pointer" : "not-allowed", fontFamily: "inherit", fontSize: "0.88rem" }}>
              {limpando ? "Limpando..." : "✅ Confirmar Limpeza"}
            </button>
            <button type="button" onClick={() => { setConfirmando(false); setConfirmInput(""); }}
              style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid rgba(113,159,219,0.25)", background: "rgba(255,255,255,0.04)", color: "#9fb4c7", cursor: "pointer", fontFamily: "inherit" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function QualidadeContent({ abrirGuia }) {
  return (
    <div className="modal-rich-content">
      <p>Conheça nossas resinas e encontre a ideal para sua aplicação.</p>
      <div className="modal-action-grid">
        <button type="button" onClick={() => abrirGuia("otimizacao")}>Otimização e pós-processamento</button>
        <button type="button" onClick={() => abrirGuia("calibracaoQuanton3D")}>Calibração Q3D</button>
        <button type="button" onClick={() => abrirGuia("diagnostico")}>Diagnóstico de problemas</button>
        <a href="https://quanton3d.com.br/produtos" target="_blank" rel="noreferrer">Ver todas as resinas no site</a>
      </div>
    </div>
  );
}

const RESINAS_BOT = [
  "ALCHEMIST","IRON","IRON 70/30","FLEXFORM","ATHOM DENTAL","ATHOM ALINHADORES",
  "ATHOM WASHABLE","POSEIDON","PYROBLAST","VULCAN CAST","SPIN","SPARK","LOW SMELL","VELVET SKIN","Não sei / Outra"
];

export function BotContent({ cliente }) {
  const [etapa, setEtapa] = useState("contexto"); // "contexto" | "chat"
  const [ctx, setCtx] = useState({ resina: "", impressora: "", altura: "0.05" });
  const [mensagens, setMensagens] = useState([]);
  const [pensando, setPensando] = useState(false);
  const [impressorasBot, setImpressorasBot] = useState([]);
  const [feedbackAberto, setFeedbackAberto] = useState(null); // índice da mensagem com form de feedback aberto
  const [fotoFeedback, setFotoFeedback] = useState(null);
  const [enviandoFeedback, setEnviandoFeedback] = useState(false);
  const [paramsFeedback, setParamsFeedback] = useState({ alturaCamada: "", exposicaoNormal: "", exposicaoBase: "", camadasBase: "" });
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [mensagens]);

  useEffect(() => {
    api.get("/parametros/impressoras").then(res => {
      const lista = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setImpressorasBot(lista.filter(Boolean).sort());
    }).catch(() => {});
  }, []);

  function iniciarChat() {
    const resina = ctx.resina || "não informada";
    const impressora = ctx.impressora.trim() || "não informada";
    const altura = ctx.altura || "0.05";
    const ctxTexto = resina !== "não informada" || impressora !== "não informada"
      ? `Estou usando a resina **${resina}**, impressora **${impressora}**, altura de camada **${altura}mm**.`
      : "";
    const boasVindas = `Olá ${cliente?.nome || ""}! 👋 Sou o **Assistente Quanton3D**.${ctxTexto ? `

Contexto registrado: ${ctxTexto}` : ""}

Como posso te ajudar hoje?`;
    setMensagens([{ text: boasVindas, isBot: true }]);
    setEtapa("chat");
  }

  async function enviar(userMsg) {
    if (!userMsg?.trim() || pensando) return;
    const novasMensagens = [...mensagens, { text: userMsg, isBot: false }];
    setMensagens(novasMensagens);
    setPensando(true);
    try {
      // Injeta contexto da configuração no início do histórico
      const ctxMsg = ctx.resina || ctx.impressora
        ? [{ role: "user", content: `Contexto: resina ${ctx.resina || "não informada"}, impressora ${ctx.impressora || "não informada"}, altura camada ${ctx.altura || "0.05"}mm` },
           { role: "assistant", content: "Contexto registrado. Pode me contar o problema." }]
        : [];

      const historico = [
        ...ctxMsg,
        ...novasMensagens.slice(-8).filter(m => m.text).map(m => ({ role: m.isBot ? "assistant" : "user", content: m.text }))
      ];

      const res = await api.post("/chat", { message: userMsg, historico, clienteId: cliente?._id, clienteNome: cliente?.nome || "" });
      const reply = res.data.data?.reply || res.data.reply || "Não consegui processar sua dúvida agora.";
      const conversaId = res.data.data?.conversaId || res.data.conversaId || null;
      setMensagens((prev) => [...prev, { text: reply, isBot: true, conversaId }]);
    } catch (err) {
      console.error("Erro ao conversar com bot:", err);
      setMensagens((prev) => [...prev, { text: "Desculpe, tive um problema técnico. Pode repetir?", isBot: true }]);
    } finally { setPensando(false); }
  }

  function fotoParaBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function enviarFeedback(conversaId, indice, satisfatoria) {
    if (!conversaId) return;
    if (satisfatoria) {
      try {
        await api.patch("/conversas/" + conversaId + "/feedback", { feedback: "satisfatoria" });
        setMensagens(prev => prev.map((m, i) => i === indice ? { ...m, feedbackEnviado: "satisfatoria" } : m));
      } catch (_) {}
      return;
    }
    // Não satisfatória — abre form para foto
    setFeedbackAberto(indice);
  }

  async function confirmarFeedbackNegativo(conversaId, indice) {
    setEnviandoFeedback(true);
    try {
      let foto = "";
      if (fotoFeedback) foto = await fotoParaBase64(fotoFeedback);
      const partesConfig = [
        `Resina: ${ctx.resina || "não informada"}`,
        `Impressora: ${ctx.impressora || "não informada"}`,
        `Altura de camada: ${paramsFeedback.alturaCamada || ctx.altura || "0.05"}mm`,
        paramsFeedback.exposicaoNormal && `Exposição normal: ${paramsFeedback.exposicaoNormal}s`,
        paramsFeedback.exposicaoBase && `Exposição base: ${paramsFeedback.exposicaoBase}s`,
        paramsFeedback.camadasBase && `Camadas base: ${paramsFeedback.camadasBase}`,
      ].filter(Boolean);
      const configuracaoCliente = partesConfig.join(" | ");
      await api.patch("/conversas/" + conversaId + "/feedback", { feedback: "nao_satisfatoria", foto, configuracaoCliente });
      setMensagens(prev => prev.map((m, i) => i === indice ? { ...m, feedbackEnviado: "nao_satisfatoria" } : m));
      setFeedbackAberto(null);
      setFotoFeedback(null);
      setParamsFeedback({ alturaCamada: "", exposicaoNormal: "", exposicaoBase: "", camadasBase: "" });
    } catch (err) {
      alert("Não consegui enviar seu feedback agora. Tente novamente.");
    } finally {
      setEnviandoFeedback(false);
    }
  }

  if (etapa === "contexto") return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, height: "100%", overflowY: "auto", padding: "8px 4px" }}>
      <div style={{ background: "rgba(79,209,255,0.08)", border: "1px solid rgba(79,209,255,0.2)", borderRadius: "14px", padding: "16px", marginBottom: "16px" }}>
        <p style={{ margin: "0 0 4px", fontWeight: 800, color: "#0092ff", fontSize: "0.85rem" }}>🤖 Assistente Técnico Quanton3D</p>
        <p style={{ margin: 0, color: "#b8cfe8", fontSize: "0.85rem", lineHeight: 1.55 }}>
          Para respostas precisas, informe sua configuração antes de começar. É rápido!
        </p>
      </div>

      <div style={{ display: "grid", gap: "14px" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "#b8cfe8", marginBottom: "6px" }}>
            🧪 Qual resina Quanton3D você está usando?
          </label>
          <select value={ctx.resina} onChange={e => setCtx(c => ({ ...c, resina: e.target.value }))}
            style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(79,209,255,0.25)", background: "rgba(4,10,24,0.7)", color: ctx.resina ? "#ffffff" : "#8ba3be", fontSize: "0.9rem" }}>
            <option value="">Selecione a resina (opcional)</option>
            {RESINAS_BOT.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "#b8cfe8", marginBottom: "6px" }}>
            🖨️ Qual sua impressora?
          </label>
          <select value={ctx.impressora} onChange={e => setCtx(c => ({ ...c, impressora: e.target.value }))}
            style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(79,209,255,0.25)", background: "rgba(4,10,24,0.7)", color: ctx.impressora ? "#ffffff" : "#8ba3be", fontSize: "0.9rem" }}>
            <option value="">Selecione a impressora (opcional)</option>
            {impressorasBot.map(i => <option key={i} value={i}>{i}</option>)}
            <option value="Não sei / Outra">Não sei / Outra</option>
          </select>
          {impressorasBot.length === 0 && (
            <input
              value={ctx.impressora}
              onChange={e => setCtx(c => ({ ...c, impressora: e.target.value }))}
              placeholder="Ex: Elegoo Mars 4 Ultra, Anycubic Photon M3..."
              style={{ width: "100%", marginTop: "8px", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(79,209,255,0.25)", background: "rgba(4,10,24,0.7)", color: "#ffffff", fontSize: "0.9rem" }}
            />
          )}
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "#b8cfe8", marginBottom: "6px" }}>
            📏 Altura de camada que está usando
          </label>
          <select value={ctx.altura} onChange={e => setCtx(c => ({ ...c, altura: e.target.value }))}
            style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(79,209,255,0.25)", background: "rgba(4,10,24,0.7)", color: "#ffffff", fontSize: "0.9rem" }}>
            <option value="0.01">0.01mm — máxima resolução</option>
            <option value="0.02">0.02mm — alta resolução</option>
            <option value="0.03">0.03mm — alta resolução</option>
            <option value="0.04">0.04mm — resolução média-alta</option>
            <option value="0.05">0.05mm — padrão recomendado</option>
            <option value="0.06">0.06mm — padrão</option>
            <option value="0.08">0.08mm — rápido</option>
            <option value="0.10">0.10mm — máxima velocidade</option>
          </select>
        </div>
      </div>

      <button type="button" onClick={iniciarChat}
        style={{ width: "100%", marginTop: "18px", padding: "14px", borderRadius: "12px", border: 0, background: "linear-gradient(135deg, #2563eb, #7c3aed)", color: "#ffffff", fontWeight: 900, fontSize: "0.95rem", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 24px rgba(37,99,235,0.3)" }}>
        Iniciar atendimento com o Assistente →
      </button>

      <button type="button" onClick={iniciarChat}
        style={{ width: "100%", marginTop: "8px", padding: "10px", borderRadius: "10px", border: "1px solid rgba(113,159,219,0.2)", background: "transparent", color: "#8ba3be", fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit" }}>
        Pular e começar sem informar configuração
      </button>
    </div>
  );

  return (
    <div className="bot-chat-container" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, height: "100%" }}>
      {(ctx.resina || ctx.impressora) && (
        <div style={{ padding: "8px 14px", background: "rgba(79,209,255,0.06)", borderBottom: "1px solid rgba(79,209,255,0.15)", fontSize: "0.78rem", color: "#8ba3be", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {ctx.resina && <span>🧪 {ctx.resina}</span>}
          {ctx.impressora && <span>🖨️ {ctx.impressora}</span>}
          {ctx.altura && <span>📏 {ctx.altura}mm</span>}
          <button type="button" onClick={() => setEtapa("contexto")} style={{ marginLeft: "auto", color: "#0092ff", background: "none", border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700 }}>Alterar</button>
        </div>
      )}
      <div className="chat-messages" ref={scrollRef} style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", scrollBehavior: "smooth", transform: "translateZ(0)", WebkitTransform: "translateZ(0)" }}>
        {mensagens.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.isBot ? "flex-start" : "flex-end", width: "100%", boxSizing: "border-box" }}>
            <div
              style={{ padding: "10px 14px", borderRadius: m.isBot ? "4px 18px 18px 18px" : "18px 4px 18px 18px", background: m.isBot ? "rgba(26,115,232,0.18)" : "rgba(79,209,255,0.18)", border: m.isBot ? "1px solid rgba(26,115,232,0.35)" : "1px solid rgba(79,209,255,0.35)", color: "#eaf3ff", fontSize: "0.92rem", lineHeight: 1.55, maxWidth: "85%", wordBreak: "break-word", overflowWrap: "break-word", boxSizing: "border-box" }}
              dangerouslySetInnerHTML={{ __html: `<p style="margin:0">${formatarMarkdown(m.text)}</p>` }}
            />

            {/* Feedback — só em respostas do bot que vieram do /chat (têm conversaId) */}
            {m.isBot && m.conversaId && !m.feedbackEnviado && feedbackAberto !== i && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px", padding: "0 4px" }}>
                <span style={{ fontSize: "0.72rem", color: "#8ba3be" }}>Essa resposta ajudou?</span>
                <button type="button" onClick={() => enviarFeedback(m.conversaId, i, true)}
                  style={{ padding: "3px 10px", borderRadius: "999px", border: "1px solid rgba(73,230,139,0.3)", background: "rgba(73,230,139,0.08)", color: "#0aff87", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700 }}>
                  👍 Sim
                </button>
                <button type="button" onClick={() => enviarFeedback(m.conversaId, i, false)}
                  style={{ padding: "3px 10px", borderRadius: "999px", border: "1px solid rgba(255,107,107,0.3)", background: "rgba(255,107,107,0.06)", color: "#d73c3c", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700 }}>
                  👎 Não
                </button>
              </div>
            )}

            {/* Form de feedback negativo — configurações estilo Chitubox + foto + envio */}
            {m.isBot && feedbackAberto === i && (
              <div style={{ marginTop: "8px", padding: "12px", borderRadius: "10px", background: "rgba(255,107,107,0.06)", border: "1px solid rgba(255,107,107,0.2)", width: "100%", maxWidth: "360px" }}>
                <p style={{ margin: "0 0 10px", fontSize: "0.78rem", color: "#d73c3c", fontWeight: 700 }}>
                  Poxa, desculpa! Confirma as configurações que está usando (o que souber) e manda uma foto do problema:
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "8px" }}>
                  <div>
                    <label style={{ fontSize: "0.68rem", color: "#9fb4c7", display: "block", marginBottom: "3px" }}>Altura de camada</label>
                    <input value={paramsFeedback.alturaCamada} onChange={e => setParamsFeedback(p => ({ ...p, alturaCamada: e.target.value }))}
                      placeholder={ctx.altura ? ctx.altura + "mm" : "Ex: 0.05mm"}
                      style={{ width: "100%", padding: "6px 8px", borderRadius: "7px", border: "1px solid rgba(255,107,107,0.25)", background: "rgba(4,10,24,0.7)", color: "#fff", fontSize: "0.78rem" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.68rem", color: "#9fb4c7", display: "block", marginBottom: "3px" }}>Camadas base</label>
                    <input value={paramsFeedback.camadasBase} onChange={e => setParamsFeedback(p => ({ ...p, camadasBase: e.target.value }))}
                      placeholder="Ex: 6"
                      style={{ width: "100%", padding: "6px 8px", borderRadius: "7px", border: "1px solid rgba(255,107,107,0.25)", background: "rgba(4,10,24,0.7)", color: "#fff", fontSize: "0.78rem" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.68rem", color: "#9fb4c7", display: "block", marginBottom: "3px" }}>Exposição normal (s)</label>
                    <input value={paramsFeedback.exposicaoNormal} onChange={e => setParamsFeedback(p => ({ ...p, exposicaoNormal: e.target.value }))}
                      placeholder="Ex: 2.1"
                      style={{ width: "100%", padding: "6px 8px", borderRadius: "7px", border: "1px solid rgba(255,107,107,0.25)", background: "rgba(4,10,24,0.7)", color: "#fff", fontSize: "0.78rem" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.68rem", color: "#9fb4c7", display: "block", marginBottom: "3px" }}>Exposição base (s)</label>
                    <input value={paramsFeedback.exposicaoBase} onChange={e => setParamsFeedback(p => ({ ...p, exposicaoBase: e.target.value }))}
                      placeholder="Ex: 35"
                      style={{ width: "100%", padding: "6px 8px", borderRadius: "7px", border: "1px solid rgba(255,107,107,0.25)", background: "rgba(4,10,24,0.7)", color: "#fff", fontSize: "0.78rem" }} />
                  </div>
                </div>

                <label style={{ display: "block", padding: "10px", borderRadius: "8px", border: "1px dashed rgba(255,107,107,0.3)", background: "rgba(0,0,0,0.2)", cursor: "pointer", textAlign: "center", marginBottom: "8px" }}>
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => setFotoFeedback(e.target.files?.[0] || null)} />
                  <span style={{ fontSize: "0.75rem", color: fotoFeedback ? "#0aff87" : "#9fb4c7" }}>
                    {fotoFeedback ? "✅ " + fotoFeedback.name : "📷 Anexar foto (opcional)"}
                  </span>
                </label>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button type="button" onClick={() => confirmarFeedbackNegativo(m.conversaId, i)} disabled={enviandoFeedback}
                    style={{ flex: 1, padding: "8px", borderRadius: "8px", border: 0, background: "linear-gradient(135deg,#0092ff,#9650f5)", color: "#fff", fontWeight: 800, fontSize: "0.78rem", cursor: "pointer" }}>
                    {enviandoFeedback ? "Enviando..." : "Enviar para análise"}
                  </button>
                  <button type="button" onClick={() => { setFeedbackAberto(null); setFotoFeedback(null); setParamsFeedback({ alturaCamada: "", exposicaoNormal: "", exposicaoBase: "", camadasBase: "" }); }}
                    style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "#8ba3be", fontSize: "0.78rem", cursor: "pointer" }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Confirmação de feedback enviado */}
            {m.isBot && m.feedbackEnviado && (
              <span style={{ marginTop: "6px", fontSize: "0.72rem", color: m.feedbackEnviado === "satisfatoria" ? "#0aff87" : "#dc913c" }}>
                {m.feedbackEnviado === "satisfatoria" ? "✅ Obrigado pelo retorno!" : "📨 Enviado para a equipe analisar. Obrigado!"}
              </span>
            )}
          </div>
        ))}
        {pensando && <div style={{ alignSelf: "flex-start", padding: "10px 16px", borderRadius: "4px 18px 18px 18px", background: "rgba(26,115,232,0.12)", border: "1px solid rgba(26,115,232,0.25)", color: "#9fb4c7", fontSize: "0.88rem" }}>⏳ Analisando base técnica...</div>}
      </div>
      <ChatInput onEnviar={enviar} pensando={pensando} />
    </div>
  );
}

// Componente separado — input isolado do resto do chat
// Assim digitar NÃO causa re-render das mensagens
const ChatInput = React.memo(function ChatInput({ onEnviar, pensando }) {
  const [valor, setValor] = useState("");
  function handleEnviar() {
    if (!valor.trim() || pensando) return;
    onEnviar(valor);
    setValor("");
  }
  return (
    <div style={{ display: "flex", gap: "10px", padding: "12px 16px", borderTop: "1px solid rgba(113,159,219,0.2)", flexShrink: 0 }}>
      <input
        value={valor}
        onChange={e => setValor(e.target.value)}
        onKeyPress={e => e.key === "Enter" && handleEnviar()}
        placeholder="Tire sua dúvida técnica..."
        style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(79,209,255,0.25)", borderRadius: "12px", padding: "10px 14px", color: "#eaf3ff", fontFamily: "inherit", fontSize: "0.9rem", outline: "none" }}
      />
      <button type="button" onClick={handleEnviar} disabled={pensando}
        style={{ whiteSpace: "nowrap", padding: "10px 18px", borderRadius: "10px", border: 0, background: "linear-gradient(135deg, #2563eb, #7c3aed)", color: "#fff", fontWeight: 900, cursor: "pointer", flexShrink: 0 }}>
        {pensando ? "..." : "Enviar"}
      </button>
    </div>
  );
});

function ParamItem({ label, value }) {
  return <div className="param-item"><span>{label}</span><strong>{value || "-"}</strong></div>;
}

function InfoCard({ title, text, onClick }) {
  return (
    <button type="button" className="info-card clickable-card" onClick={onClick}>
      <h3>{title}</h3><p>{text}</p>
    </button>
  );
}

function ServiceLine({ title, onClick }) {
  return (
    <button type="button" className="service-line" onClick={onClick}>
      <span>✓</span><strong>{title}</strong>
    </button>
  );
}


export function PainelAtendente({ atendente, onClose }) {
  const p = atendente.permissoes || {};
  const primeiraAba = p.verChamados !== false ? "chamados" : p.verMensagens !== false ? "mensagens" : p.verClientes !== false ? "clientes" : p.sugerirConhecimento ? "sugestoes" : "chamados";
  const [aba, setAba] = useState(primeiraAba);
  const [dados, setDados] = useState({ chamados: [], mensagens: [], clientes: [] });
  const [carregando, setCarregando] = useState(true);
  const token = localStorage.getItem("quanton3d_atendente_token");

  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true);
        const headers = { Authorization: "Bearer " + token };
        const [ch, msg, cl] = await Promise.all([
          api.get("/bot-tickets", { headers }),
          api.get("/contact-messages", { headers }),
          api.get("/clientes", { headers }),
        ]);
        setDados({
          chamados: ch.data?.botTickets || ch.data?.tickets || [],
          mensagens: msg.data?.contactMessages || [],
          clientes: cl.data?.clientes || cl.data?.data || [],
        });
      } catch (err) { console.error(err); }
      finally { setCarregando(false); }
    }
    carregar();
  }, []);

  const [sugestoes, setSugestoes] = useState([]);
  const [formSugestao, setFormSugestao] = useState({ categoria: "dica", titulo: "", conteudo: "" });
  const [enviandoSugestao, setEnviandoSugestao] = useState(false);

  useEffect(() => {
    async function carregarSugestoes() {
      try {
        const r = await api.get("/sugestoes-conhecimento", { headers: { Authorization: "Bearer " + token } });
        setSugestoes(r.data?.sugestoes || []);
      } catch(_) {}
    }
    carregarSugestoes();
  }, []);

  async function enviarSugestao() {
    if (!formSugestao.titulo.trim() || !formSugestao.conteudo.trim()) { alert("Preencha título e conteúdo."); return; }
    try {
      setEnviandoSugestao(true);
      await api.post("/sugestoes-conhecimento", {
        ...formSugestao,
        codigoAtendente: atendente.codigo,
        nomeAtendente: atendente.nome,
      }, { headers: { Authorization: "Bearer " + token } });
      setFormSugestao({ categoria: "dica", titulo: "", conteudo: "" });
      const r = await api.get("/sugestoes-conhecimento", { headers: { Authorization: "Bearer " + token } });
      setSugestoes(r.data?.sugestoes || []);
      alert("Sugestão enviada! O administrador será notificado.");
    } catch(e) { alert("Erro ao enviar sugestão."); }
    finally { setEnviandoSugestao(false); }
  }

  const ABAS = [
    p.verChamados !== false     && { id: "chamados",  label: "🔧 Chamados",   count: dados.chamados.length },
    p.verMensagens !== false    && { id: "mensagens", label: "✉️ Mensagens",  count: dados.mensagens.length },
    p.verClientes !== false     && { id: "clientes",  label: "👥 Clientes",   count: dados.clientes.length },
    p.sugerirConhecimento       && { id: "sugestoes", label: "💡 Sugestões",  count: sugestoes.length },
  ].filter(Boolean);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", color: "#eaf3ff" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid rgba(79,209,255,0.2)" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 900, background: "linear-gradient(135deg,#0092ff,#9650f5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            📋 Painel do Atendente
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#9fb4c7" }}>
            👨‍💼 {atendente.codigo} — {atendente.nome}
          </p>
        </div>
        <button type="button" onClick={onClose}
          style={{ padding: "8px 16px", borderRadius: "999px", border: "1px solid rgba(255,107,107,0.4)", background: "rgba(255,107,107,0.1)", color: "#d73c3c", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
          Fechar
        </button>
      </div>

      {/* Abas */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        {ABAS.map(a => (
          <button key={a.id} type="button" onClick={() => setAba(a.id)}
            style={{ padding: "10px 18px", borderRadius: "999px", border: aba === a.id ? "2px solid #0092ff" : "1px solid rgba(113,159,219,0.3)", background: aba === a.id ? "rgba(79,209,255,0.15)" : "rgba(255,255,255,0.04)", color: aba === a.id ? "#0092ff" : "#9fb4c7", cursor: "pointer", fontWeight: 800, fontFamily: "inherit", fontSize: "0.82rem" }}>
            {a.label} ({a.count})
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {carregando && <div style={{ textAlign: "center", color: "#9fb4c7", padding: "30px" }}>Carregando...</div>}

        {/* CHAMADOS */}
        {!carregando && aba === "chamados" && (
          <div>
            {dados.chamados.length === 0 && <div style={{ textAlign: "center", color: "#9fb4c7", padding: "30px" }}>Nenhum chamado.</div>}
            {dados.chamados.map(c => {
              const statusCores = { novo: { bg: "rgba(255,209,102,0.12)", border: "rgba(255,209,102,0.35)", color: "#dc913c", label: "Novo" }, em_analise: { bg: "rgba(79,209,255,0.12)", border: "rgba(79,209,255,0.35)", color: "#0092ff", label: "Em análise" }, respondido: { bg: "rgba(184,156,255,0.12)", border: "rgba(184,156,255,0.35)", color: "#9650f5", label: "Respondido" }, fechado: { bg: "rgba(73,230,139,0.12)", border: "rgba(73,230,139,0.35)", color: "#0aff87", label: "Resolvido" }, encaminhado: { bg: "rgba(255,107,107,0.12)", border: "rgba(255,107,107,0.35)", color: "#d73c3c", label: "Encaminhado" } };
              const st = statusCores[c.status] || statusCores.novo;
              const mudarStatus = async (novoStatus) => {
                try {
                  await api.patch("/bot-tickets/" + c._id + "/status", { status: novoStatus }, { headers: { Authorization: "Bearer " + token } });
                  const r = await api.get("/bot-tickets", { headers: { Authorization: "Bearer " + token } });
                  setDados(prev => ({ ...prev, chamados: r.data?.botTickets || [] }));
                } catch(e) { alert("Erro ao atualizar status"); }
              };
              return (
              <div key={c._id} style={{ border: "1px solid rgba(113,159,219,0.2)", borderRadius: "12px", padding: "14px", background: "rgba(255,255,255,0.04)", marginBottom: "10px", color: "#eaf3ff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "6px" }}>
                  <div>
                    <strong>{c.nome || "Cliente"}</strong>
                    <div style={{ fontSize: "0.72rem", color: "#9fb4c7" }}>📱 {c.telefone} · ✉️ {c.email || "-"}</div>
                  </div>
                  <span style={{ fontSize: "0.72rem", padding: "3px 10px", borderRadius: "999px", background: st.bg, border: "1px solid " + st.border, color: st.color, fontWeight: 800 }}>{st.label}</span>
                </div>
                {c.resina && <div style={{ fontSize: "0.78rem", color: "#0092ff", marginBottom: "4px" }}>🧪 {c.resina} {c.impressora ? "· 🖨️ " + c.impressora : ""}</div>}
                <div style={{ fontSize: "0.8rem", color: "#b8cfe8", marginBottom: "8px" }}>
                  🔧 {c.problema || "Sem descrição"}
                  {c.descricao && <p style={{ margin: "6px 0 0", fontSize: "0.78rem", color: "#9fb4c7" }}>{c.descricao}</p>}
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <a href={"https://wa.me/5531983340053?text=" + encodeURIComponent("Olá " + (c.nome||"") + ", vi seu chamado sobre " + (c.problema||c.resina||"") + ". Posso ajudar!")}
                    target="_blank" rel="noreferrer"
                    style={{ padding: "6px 14px", borderRadius: "999px", border: "1px solid rgba(37,211,102,0.4)", background: "rgba(37,211,102,0.1)", color: "#25d366", fontSize: "0.75rem", fontWeight: 800, textDecoration: "none" }}>
                    💬 WhatsApp
                  </a>
                  {atendente.permissoes?.mudarStatusChamados !== false && <>
                  <button type="button" onClick={() => mudarStatus("em_analise")} disabled={c.status === "em_analise"}
                    style={{ padding: "6px 14px", borderRadius: "999px", border: "1px solid rgba(255,209,102,0.35)", background: "rgba(255,209,102,0.1)", color: "#dc913c", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", opacity: c.status === "em_analise" ? 0.4 : 1 }}>
                    🔍 Em análise
                  </button>
                  <button type="button" onClick={() => mudarStatus("fechado")} disabled={c.status === "fechado"}
                    style={{ padding: "6px 14px", borderRadius: "999px", border: "1px solid rgba(73,230,139,0.35)", background: "rgba(73,230,139,0.1)", color: "#0aff87", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", opacity: c.status === "fechado" ? 0.4 : 1 }}>
                    ✅ Resolvido
                  </button>
                  </>}
                  {atendente.permissoes?.mudarStatusChamados !== false && c.status === "fechado" && (
                    <button type="button" onClick={() => mudarStatus("novo")}
                      style={{ padding: "6px 14px", borderRadius: "999px", border: "1px solid rgba(255,107,107,0.25)", background: "rgba(255,107,107,0.06)", color: "#d73c3c", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                      ↩️ Reabrir
                    </button>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}

        {/* MENSAGENS */}
        {!carregando && aba === "mensagens" && (
          <div>
            {dados.mensagens.length === 0 && <div style={{ textAlign: "center", color: "#9fb4c7", padding: "30px" }}>Nenhuma mensagem.</div>}
            {dados.mensagens.map(m => (
              <div key={m._id} style={{ border: "1px solid rgba(113,159,219,0.2)", borderRadius: "12px", padding: "14px", background: "rgba(255,255,255,0.04)", marginBottom: "10px", color: "#eaf3ff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <strong>{m.nome}</strong>
                  <span style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: "999px", background: m.status === "resolvido" ? "rgba(73,230,139,0.15)" : "rgba(255,209,102,0.15)", color: m.status === "resolvido" ? "#0aff87" : "#dc913c" }}>{m.status || "pendente"}</span>
                </div>
                <div style={{ fontSize: "0.78rem", color: "#9fb4c7", marginBottom: "6px" }}>📱 {m.telefone} · ✉️ {m.email}</div>
                <div style={{ fontSize: "0.82rem", color: "#b8cfe8", marginBottom: "8px" }}>{m.assunto}: {m.mensagem}</div>
                <a href={"https://wa.me/5531983340053?text=" + encodeURIComponent("Olá " + (m.nome||"") + ", recebi sua mensagem sobre " + (m.assunto||"") + ". Posso ajudar!")}
                  target="_blank" rel="noreferrer"
                  style={{ padding: "6px 14px", borderRadius: "999px", border: "1px solid rgba(37,211,102,0.4)", background: "rgba(37,211,102,0.1)", color: "#25d366", fontSize: "0.75rem", fontWeight: 800, textDecoration: "none" }}>
                  💬 WhatsApp
                </a>
              </div>
            ))}
          </div>
        )}

        {/* SUGESTÕES DE CONHECIMENTO */}
        {!carregando && aba === "sugestoes" && (
          <div>
            <div style={{ border: "1px solid rgba(79,209,255,0.2)", borderRadius: "12px", padding: "16px", background: "rgba(79,209,255,0.04)", marginBottom: "16px" }}>
              <p style={{ margin: "0 0 12px", fontWeight: 800, color: "#0092ff", fontSize: "0.85rem" }}>💡 Sugerir conhecimento pro Assistente</p>
              <div style={{ display: "grid", gap: "10px" }}>
                <select value={formSugestao.categoria} onChange={e => setFormSugestao(f => ({ ...f, categoria: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(113,159,219,0.3)", background: "rgba(0,0,0,0.3)", color: "#eaf3ff", fontFamily: "inherit", fontSize: "0.82rem" }}>
                  <option value="resina">🧪 Resina</option>
                  <option value="impressora">🖨️ Impressora</option>
                  <option value="problema">⚠️ Problema/Solução</option>
                  <option value="dica">💡 Dica Técnica</option>
                  <option value="outro">📝 Outro</option>
                </select>
                <input placeholder="Título (ex: Iron não adere em Elegoo Mars 3)" value={formSugestao.titulo}
                  onChange={e => setFormSugestao(f => ({ ...f, titulo: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(113,159,219,0.3)", background: "rgba(0,0,0,0.3)", color: "#eaf3ff", fontFamily: "inherit", fontSize: "0.82rem" }} />
                <textarea rows={4} placeholder="Conteúdo detalhado que o Assistente deveria saber..." value={formSugestao.conteudo}
                  onChange={e => setFormSugestao(f => ({ ...f, conteudo: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(113,159,219,0.3)", background: "rgba(0,0,0,0.3)", color: "#eaf3ff", fontFamily: "inherit", fontSize: "0.82rem", resize: "vertical" }} />
                <button type="button" onClick={enviarSugestao} disabled={enviandoSugestao}
                  style={{ padding: "10px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, rgba(21,101,192,0.4), rgba(79,209,255,0.2))", color: "#eaf7ff", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem" }}>
                  {enviandoSugestao ? "Enviando..." : "📤 Enviar Sugestão"}
                </button>
              </div>
            </div>
            {sugestoes.length === 0 && <div style={{ textAlign: "center", color: "#9fb4c7", padding: "20px" }}>Nenhuma sugestão enviada ainda.</div>}
            {sugestoes.map(s => {
              const cores = { pendente: "#dc913c", aprovado: "#0aff87", rejeitado: "#d73c3c" };
              return (
                <div key={s._id} style={{ border: "1px solid rgba(113,159,219,0.18)", borderRadius: "12px", padding: "12px 14px", background: "rgba(255,255,255,0.04)", marginBottom: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <strong style={{ fontSize: "0.88rem", color: "#eaf3ff" }}>{s.titulo}</strong>
                    <span style={{ fontSize: "0.7rem", padding: "2px 10px", borderRadius: "999px", background: `${cores[s.status]}20`, color: cores[s.status], fontWeight: 800 }}>
                      {s.status === "pendente" ? "⏳ Pendente" : s.status === "aprovado" ? "✅ Aprovado" : "❌ Rejeitado"}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#7dd3fc", marginBottom: "6px" }}>{s.categoria}</div>
                  <p style={{ fontSize: "0.8rem", color: "#b8cfe8", margin: 0, lineHeight: 1.5 }}>{s.conteudo}</p>
                  {s.observacaoAdmin && <p style={{ fontSize: "0.75rem", color: "#dc913c", margin: "8px 0 0", fontStyle: "italic" }}>Admin: {s.observacaoAdmin}</p>}
                </div>
              );
            })}
          </div>
        )}

        {/* CLIENTES */}
        {!carregando && aba === "clientes" && (
          <div>
            {dados.clientes.length === 0 && <div style={{ textAlign: "center", color: "#9pb4c7", padding: "30px" }}>Nenhum cliente.</div>}
            {dados.clientes.filter(c => c && c._id).map(c => (
              <div key={c._id} style={{ border: "1px solid rgba(113,159,219,0.18)", borderRadius: "12px", padding: "10px 14px", background: "rgba(255,255,255,0.04)", marginBottom: "8px", color: "#eaf3ff" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px", alignItems: "center" }}>
                  <strong style={{ fontSize: "0.88rem" }}>{c.nome}</strong>
                  <small style={{ color: "#6b8aad", fontSize: "0.7rem" }}>{c.origem}</small>
                </div>
                <div style={{ fontSize: "0.78rem", color: "#9fb4c7", marginTop: "4px" }}>
                  📱 {c.telefone} · ✉️ {c.email}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
