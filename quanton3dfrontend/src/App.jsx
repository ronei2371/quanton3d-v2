import React, { useCallback, useEffect, useState, useRef } from "react";
import api from "./api";
import "./App.css";
import ContactMessageModal from "./components/ContactMessageModal";
import PartnerRequestModal from "./components/PartnerRequestModal";
import CalculadoraExposicao from "./components/CalculadoraExposicao";
import CalculadoraVolume from "./components/CalculadoraVolume";
import CalculadoraTolerancia from "./components/CalculadoraTolerancia";
import CalculadoraCustos from "./components/CalculadoraCustos";
import CalculadoraTempo from "./components/CalculadoraTempo";
import CalculadoraCompensacao from "./components/CalculadoraCompensacao";

const WHATSAPP_URL = "https://wa.me/553132716935";
const SOCIAL_LINKS = [
  { label: "Instagram", url: "https://www.instagram.com/quanton3d" },
  { label: "YouTube", url: "https://www.youtube.com/@quanton3d" },
  { label: "Facebook", url: "https://www.facebook.com/quanton3d" },
  { label: "TikTok", url: "https://www.tiktok.com/@quanton3d" },
  { label: "WhatsApp", url: "https://wa.me/553132716935" },
  { label: "Site", url: "https://quanton3d.com.br" },
];
const ORIGENS = ["Instagram","YouTube","Google / Pesquisa","Indicação de amigo","Mercado Livre / Shopee","Já sou cliente","Outros"];
// Botões agrupados por tema
const SERVICE_BUTTONS = [
  // Atendimento
  { label: "FALE CONOSCO", kind: "modal", id: "contato", grupo: "atendimento" },
  { label: "CHAMADO TÉCNICO", kind: "modal", id: "chamado", grupo: "atendimento" },
  { label: "FORMULAÇÃO PERSONALIZADA", kind: "modal", id: "formulacao", grupo: "atendimento" },
  { label: "WHATSAPP", kind: "whatsapp", grupo: "atendimento" },
  // Guias técnicos
  { label: "NIVELAMENTO DE PLATAFORMA", kind: "guide", id: "nivelamento", grupo: "guias" },
  { label: "CONFIGURAÇÃO DE FATIADOR", kind: "guide", id: "fatiadores", grupo: "guias" },
  { label: "PARÂMETROS CHITUBOX", kind: "guide", id: "parametrosDetalhados", grupo: "guias" },
  { label: "CALIBRAÇÃO DE RESINA", kind: "guide", id: "calibracao", grupo: "guias" },
  { label: "GABARITO QUANTON3D", kind: "guide", id: "calibracaoQuanton3D", grupo: "guias" },
  { label: "DIAGNÓSTICO DE FALHAS", kind: "guide", id: "diagnostico", grupo: "guias" },
  { label: "SUPORTES E POSICIONAMENTO", kind: "guide", id: "suportes", grupo: "guias" },
  { label: "MANUTENÇÃO DE MÁQUINA", kind: "guide", id: "manutencao", grupo: "guias" },
  { label: "OTIMIZAÇÃO DE PARÂMETROS", kind: "guide", id: "otimizacao", grupo: "guias" },
  { label: "ATENDIMENTO PRIORITÁRIO", kind: "whatsapp", grupo: "guias" },
  { label: "CHAMADAS DE VÍDEO", kind: "whatsapp", grupo: "guias" },
];
const GUIDES = {
  nivelamento: { title: "Nivelamento de Plataforma", file: "/guias/guia-nivelamento.html" },
  fatiadores: { title: "Configuração de Fatiadores", file: "/guias/guia-configuracao-fatiadores.html" },
  calibracao: { title: "Calibração de Resina", file: "/guias/guia-calibracao-resina.html" },
  calibracaoQuanton3D: { title: "Calibração Quanton3D", file: "/guias/guia-calibracao-quanton3d.html" },
  manutencao: { title: "Manutenção de Impressora", file: "/guias/guia-manutencao-impressora.html" },
  otimizacao: { title: "Otimização e Pós-processamento", file: "/guias/guia-otimizacao-parametros.html" },
  diagnostico: { title: "Diagnóstico de Problemas", file: "/guias/guia-diagnostico-problemas.html" },
  suportes: { title: "Posicionamento de Suportes", file: "/guias/guia-posicionamento-suportes.html" },
  parceiros: { title: "Parceiros Quanton3D", file: "/guias/parceiros-quanton3d.html" },
  parametrosDetalhados: { title: "Parâmetros detalhados Chitubox", file: "/guias/secao-parametros-detalhados.html" },
};
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

function getClienteSalvo() {
  try { const s = localStorage.getItem("quanton3d_cliente"); return s ? JSON.parse(s) : null; } catch { return null; }
}
function getPrivacidadeAceita() {
  return localStorage.getItem("quanton3d_privacidade_aceita") === "true";
}
function limparTexto(valor) { return String(valor || "").trim(); }
function corrigirNomeResina(nome) {
  return limparTexto(nome)
    .replace(/^FERRO\s*70\/30\b/i, "IRON 70/30")
    .replace(/^FERRO\s*7030\b/i, "IRON 7030")
    .replace(/^FERRO\b/i, "IRON")
    .replace(/^Iron\b/i, "IRON")
    .replace(/^iron\b/i, "IRON");
}
function chaveResina(nome) { return corrigirNomeResina(nome).toUpperCase(); }
function criarConfiguracaoVazia() {
  return CAMPOS_CONFIGURACAO_GALERIA.reduce((acc, campo) => { acc[campo.name] = ""; return acc; }, {});
}
function formatarDataHora(data) {
  if (!data) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(data));
}
function escaparHtml(texto) {
  const mapa = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return texto.replace(/[&<>"']/g, (c) => mapa[c]);
}

// Sanitiza o texto ANTES de aplicar as tags de formatação —
// evita que HTML/script vindo do bot (IA) ou de qualquer fonte externa
// seja renderizado como código real (proteção contra XSS).
function formatarMarkdown(texto) {
  const seguro = escaparHtml(texto);
  return seguro
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code style=\"background:rgba(255,255,255,0.12);padding:2px 6px;border-radius:4px;font-size:0.88em\">$1</code>")
    .replace(/\n{2,}/g, "</p><p style=\"margin:8px 0\">")
    .replace(/\n/g, "<br/>");
}

function App() {
  // Controle de seções em acordeão (clica no título pra abrir/fechar os itens)
  const [secoesAbertas, setSecoesAbertas] = useState({});
  function alternarSecao(nome) { setSecoesAbertas(s => ({ ...s, [nome]: !s[nome] })); }

  const [clienteSalvoInicial] = useState(() => getClienteSalvo());
  const [privacidadeAceitaInicial] = useState(() => getPrivacidadeAceita());
  const [parametros, setParametros] = useState([]);
  const [resinaSelecionada, setResinaSelecionada] = useState("");
  const [impressoraSelecionada, setImpressoraSelecionada] = useState("");
  const [resultado, setResultado] = useState(null);
  const [cliente, setCliente] = useState(clienteSalvoInicial);
  const [temaClaro, setTemaClaro] = useState(() => localStorage.getItem("quanton3d_tema") === "claro");
  useEffect(() => {
    document.body.classList.toggle("tema-claro", temaClaro);
    localStorage.setItem("quanton3d_tema", temaClaro ? "claro" : "escuro");
  }, [temaClaro]);
  const [mostrarBoasVindas, setMostrarBoasVindas] = useState(!privacidadeAceitaInicial);
  const [mostrarPrivacidade, setMostrarPrivacidade] = useState(false);
  const [mostrarPerfil, setMostrarPerfil] = useState(false);
  const [mostrarCadastro, setMostrarCadastro] = useState(privacidadeAceitaInicial && !clienteSalvoInicial);
  const [formCliente, setFormCliente] = useState({ nome: "", telefone: "", email: "", origem: "Instagram" });
  const [salvandoCliente, setSalvandoCliente] = useState(false);
  const [erroCadastro, setErroCadastro] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [atendenteLogado, setAtendenteLogado] = useState(() => {
    try { return JSON.parse(localStorage.getItem("quanton3d_atendente")); } catch { return null; }
  });
  const [showLoginAtendente, setShowLoginAtendente] = useState(false);
  const [loginAtForm, setLoginAtForm] = useState({ email: "", senha: "" });
  const [loginAtErro, setLoginAtErro] = useState("");
  const [loginAtLoading, setLoginAtLoading] = useState(false);

  async function loginAtendente() {
    if (!loginAtForm.email || !loginAtForm.senha) { setLoginAtErro("Preencha email e senha."); return; }
    try {
      setLoginAtLoading(true);
      const r = await api.post("/atendentes/login", loginAtForm);
      if (r.data?.success) {
        setAtendenteLogado(r.data.atendente);
        localStorage.setItem("quanton3d_atendente", JSON.stringify(r.data.atendente));
        localStorage.setItem("quanton3d_atendente_token", r.data.token);
        setShowLoginAtendente(false);
        setLoginAtErro("");
        setLoginAtForm({ email: "", senha: "" });
      }
    } catch (err) {
      setLoginAtErro(err?.response?.data?.error || "Erro ao fazer login.");
    } finally { setLoginAtLoading(false); }
  }

  function logoutAtendente() {
    setAtendenteLogado(null);
    localStorage.removeItem("quanton3d_atendente");
    localStorage.removeItem("quanton3d_atendente_token");
  }
  const [activeGuide, setActiveGuide] = useState(null);
  const [mostrarContatoMensagem, setMostrarContatoMensagem] = useState(false);
  const [mostrarParceiroModal, setMostrarParceiroModal] = useState(false);

  async function carregarParametros() {
    try {
      setCarregando(true); setErro("");
      const res = await api.get("/parametros");
      const lista = res.data?.data || res.data?.parametros || [];
      setParametros(lista.map((item) => ({
        ...item,
        resina: corrigirNomeResina(item.resina),
        impressora: limparTexto(item.impressora),
        marca: limparTexto(item.marca),
      })));
    } catch (err) {
      console.error("Erro ao carregar parâmetros:", err);
      setErro("Não foi possível carregar os parâmetros técnicos.");
    } finally { setCarregando(false); }
  }

  useEffect(() => { const t = setTimeout(carregarParametros, 0); return () => clearTimeout(t); }, []);

  // Registra visita ao site — uma vez por sessão de navegador
  useEffect(() => {
    try {
      let sessionId = sessionStorage.getItem("quanton3d_session_id");
      if (!sessionId) {
        sessionId = "s_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
        sessionStorage.setItem("quanton3d_session_id", sessionId);
      }
      api.post("/visitas", { sessionId, pagina: window.location.pathname, origem: document.referrer || "" }).catch(() => {});
    } catch (_) {}
  }, []);

  const resinas = Array.from(new Set(parametros.map((item) => corrigirNomeResina(item.resina)).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const impressoras = Array.from(new Set(parametros.filter((item) => chaveResina(item.resina) === chaveResina(resinaSelecionada) && item.impressora).map((item) => item.marca ? `${item.marca} - ${item.impressora}` : item.impressora))).sort((a, b) => a.localeCompare(b));
  const totalImpressoras = new Set(parametros.filter((item) => item.impressora).map((item) => `${item.marca || ""}-${item.impressora}`)).size;

  function selecionarResina(nome) { setResinaSelecionada(nome); setImpressoraSelecionada(""); setResultado(null); }
  function selecionarImpressora(valor) {
    setImpressoraSelecionada(valor);
    const nomeModelo = valor.includes(" - ") ? valor.split(" - ").slice(1).join(" - ") : valor;
    const marcaModelo = valor.includes(" - ") ? valor.split(" - ")[0] : "";
    const p = parametros.find((item) => chaveResina(item.resina) === chaveResina(resinaSelecionada) && item.impressora === nomeModelo && (!marcaModelo || item.marca === marcaModelo));
    setResultado(p || null);
  }
  function aceitarPrivacidade() { localStorage.setItem("quanton3d_privacidade_aceita", "true"); setMostrarPrivacidade(false); setMostrarCadastro(!cliente); }
  function abrirCadastro() { setErroCadastro(""); if (!getPrivacidadeAceita()) { setMostrarPrivacidade(true); return; } setMostrarCadastro(true); }
  function alterarCliente(campo, valor) { setFormCliente((a) => ({ ...a, [campo]: valor })); }

  function validarTelefone(tel) {
    const digitos = String(tel || "").replace(/\D/g, "");
    // Telefone BR: DDD (2 dígitos, 11-99) + número (8 ou 9 dígitos) = 10 ou 11 dígitos
    if (digitos.length < 10 || digitos.length > 11) return false;
    const ddd = parseInt(digitos.slice(0, 2), 10);
    if (ddd < 11 || ddd > 99) return false;
    // Rejeita sequências óbvias tipo 0000000000, 1111111111, 1234567890
    if (/^(\d)\1+$/.test(digitos)) return false;
    if (digitos === "12345678900" || digitos === "1234567890") return false;
    return true;
  }

  function validarEmail(email) {
    const e = String(email || "").trim();
    // Regex de email padrão, exige domínio com ponto (ex: .com, .com.br)
    const regex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!regex.test(e)) return false;
    // Rejeita domínios de teste óbvios
    const dominiosInvalidos = ["teste.com", "test.com", "email.com", "exemplo.com", "asdf.com", "xxx.com"];
    const dominio = e.split("@")[1]?.toLowerCase();
    if (dominiosInvalidos.includes(dominio)) return false;
    return true;
  }

  async function salvarCliente(e) {
    e.preventDefault(); setErroCadastro("");
    if (!formCliente.nome || !formCliente.telefone || !formCliente.email) { setErroCadastro("Preencha todos os campos obrigatórios."); return; }
    if (formCliente.nome.trim().length < 2) { setErroCadastro("Digite um nome válido."); return; }
    if (!validarTelefone(formCliente.telefone)) { setErroCadastro("Telefone inválido. Use o formato DDD + número (ex: 31987654321)."); return; }
    if (!validarEmail(formCliente.email)) { setErroCadastro("E-mail inválido. Verifique se digitou corretamente."); return; }
    try {
      setSalvandoCliente(true);
      const res = await api.post("/clientes", formCliente);
      const novoCliente = res.data.data;
      setCliente(novoCliente);
      localStorage.setItem("quanton3d_cliente", JSON.stringify(novoCliente));
      setMostrarCadastro(false);
    } catch (err) { console.error("Erro ao salvar cliente:", err); setErroCadastro("Erro ao realizar cadastro."); }
    finally { setSalvandoCliente(false); }
  }
  function executarAcao(item) {
    if (item.kind === "guide") { setActiveGuide(GUIDES[item.id]); return; }
    if (item.kind === "modal" && item.id === "contato") { setMostrarContatoMensagem(true); return; }
    if (item.kind === "modal") { setActiveModal(item.id); return; }
    if (item.kind === "whatsapp") { window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer"); }
  }
  function abrirGuia(id) { setActiveGuide(GUIDES[id]); }
  function abrirParceiroModal() { setMostrarParceiroModal(true); }
  function scrollToSection(id) { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }
  function copiarParametros() {
    if (!resultado) return;
    const texto = `Parâmetros Quanton3D\nCliente: ${cliente?.nome || "-"}\nWhatsApp: ${cliente?.telefone || "-"}\nE-mail: ${cliente?.email || "-"}\nResina: ${corrigirNomeResina(resultado.resina)}\nMarca: ${resultado.marca || "-"}\nImpressora: ${resultado.impressora || "-"}\nAltura de camada: ${resultado.alturaCamada || "-"}\nCamadas base: ${resultado.camadasBase || "-"}\nExposição normal: ${resultado.exposicaoNormal || "-"}\nExposição base: ${resultado.exposicaoBase || "-"}\nRetardo UV: ${resultado.retardoUV || "-"}\nPotência UV: ${resultado.potenciaUV || "-"}`.trim();
    navigator.clipboard.writeText(texto);
    alert("Parâmetros copiados.");
  }

  return (
    <main className="app-shell">
      {mostrarBoasVindas && (
        <BoasVindasModal onEntrar={() => { setMostrarBoasVindas(false); setMostrarPrivacidade(true); }} />
      )}
      {!mostrarBoasVindas && mostrarPrivacidade && <PrivacidadeModal aceitarPrivacidade={aceitarPrivacidade} />}
      {mostrarPerfil && cliente && (
        <PerfilModal
          cliente={cliente}
          onClose={() => setMostrarPerfil(false)}
          onSalvo={(clienteAtualizado) => { setCliente(clienteAtualizado); localStorage.setItem("quanton3d_cliente", JSON.stringify(clienteAtualizado)); setMostrarPerfil(false); }}
        />
      )}
      {mostrarCadastro && !mostrarPrivacidade && (
        <CadastroInicial formCliente={formCliente} salvandoCliente={salvandoCliente} erroCadastro={erroCadastro} alterarCliente={alterarCliente} salvarCliente={salvarCliente} />
      )}
      {activeGuide && <GuideModal guide={activeGuide} onClose={() => setActiveGuide(null)} />}
      <ContactMessageModal aberto={mostrarContatoMensagem} aoFechar={() => setMostrarContatoMensagem(false)} cliente={cliente} />
      {showLoginAtendente && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowLoginAtendente(false)}>
          <div className="site-modal" style={{ maxWidth: "420px", padding: "32px" }}>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>👨‍💼</div>
              <h2 style={{ color: "#b89cff", margin: 0, fontSize: "1.2rem", fontWeight: 900 }}>Login de Atendente</h2>
              <p style={{ color: "#9fb4c7", fontSize: "0.78rem", marginTop: "4px" }}>Área exclusiva para a equipe Quanton3D</p>
            </div>
            {loginAtErro && <div style={{ background: "rgba(255,107,107,0.12)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", color: "#ff8fab", fontSize: "0.82rem" }}>{loginAtErro}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              <input
                value={loginAtForm.email}
                onChange={e => setLoginAtForm(p => ({...p, email: e.target.value}))}
                placeholder="Seu email"
                type="text"
                autoComplete="off"
                style={{ padding: "12px 16px", borderRadius: "10px", border: "1px solid rgba(184,156,255,0.3)", background: "rgba(4,10,24,0.9)", color: "#eaf3ff", WebkitTextFillColor: "#eaf3ff", caretColor: "#eaf3ff", fontFamily: "inherit", fontSize: "0.9rem", boxShadow: "0 0 0 9999px rgba(4,10,24,0.9) inset" }}
              />
              <input
                value={loginAtForm.senha}
                onChange={e => setLoginAtForm(p => ({...p, senha: e.target.value}))}
                onKeyDown={e => e.key === "Enter" && loginAtendente()}
                placeholder="Sua senha"
                type="password"
                autoComplete="new-password"
                style={{ padding: "12px 16px", borderRadius: "10px", border: "1px solid rgba(184,156,255,0.3)", background: "rgba(4,10,24,0.9)", color: "#eaf3ff", WebkitTextFillColor: "#eaf3ff", caretColor: "#eaf3ff", fontFamily: "inherit", fontSize: "0.9rem", boxShadow: "0 0 0 9999px rgba(4,10,24,0.9) inset" }}
              />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="button" onClick={loginAtendente} disabled={loginAtLoading}
                style={{ flex: 1, padding: "12px", borderRadius: "999px", border: "none", background: "linear-gradient(135deg,#7c3aed,#b89cff)", color: "#fff", fontWeight: 900, cursor: "pointer", fontSize: "0.9rem", fontFamily: "inherit" }}>
                {loginAtLoading ? "Entrando..." : "✅ Entrar"}
              </button>
              <button type="button" onClick={() => { setShowLoginAtendente(false); setLoginAtErro(""); }}
                style={{ padding: "12px 20px", borderRadius: "999px", border: "1px solid rgba(113,159,219,0.3)", background: "transparent", color: "#9fb4c7", cursor: "pointer", fontFamily: "inherit" }}>
                Cancelar
              </button>
            </div>
            <p style={{ textAlign: "center", marginTop: "16px", fontSize: "0.72rem", color: "#6b8aad" }}>
              Código e credenciais fornecidos pelo administrador
            </p>
          </div>
        </div>
      )}

      {activeModal && (
        <SiteModal type={activeModal} cliente={cliente} onClose={() => setActiveModal(null)} abrirGuia={abrirGuia} abrirParceiroModal={abrirParceiroModal} setActiveModal={setActiveModal} atendenteLogado={atendenteLogado} />
      )}
      <PartnerRequestModal aberto={mostrarParceiroModal} aoFechar={() => setMostrarParceiroModal(false)} cliente={cliente} />

      <header className="site-header">
        <div className="header-inner">
          <div className="brand" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <img src="/logo-quanton3d.png" alt="Quanton3D" className="brand-logo" />
            <div>
              <h1 translate="no" style={{ margin: 0, fontSize: "1.2rem", color: "#eaf7ff", display: "flex", alignItems: "baseline", gap: "3px" }}>
                Quanton3D<sup style={{ fontSize: "0.55rem", color: "#4fd1ff", fontWeight: 700 }}>®</sup>
              </h1>
              <p style={{ margin: "3px 0 0", color: "#8ba3be", fontSize: "0.75rem" }}>Resinas UV SLA/DLP de Alta Performance</p>
            </div>
            <button type="button" onClick={() => setActiveModal("sobre")}
              style={{ padding: "5px 14px", borderRadius: "999px", border: "1px solid rgba(79,209,255,0.3)", background: "rgba(79,209,255,0.08)", color: "#7dd3fc", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              ℹ️ Quem Somos
            </button>
            <button type="button" onClick={() => setTemaClaro(prev => !prev)}
              style={{ padding: "5px 14px", borderRadius: "999px", border: "1px solid rgba(79,209,255,0.25)", background: "rgba(79,209,255,0.06)", color: "#7dd3fc", fontSize: "0.72rem", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", fontWeight: 700 }}>
              {temaClaro ? "🌙 Modo escuro" : "☀️ Modo claro"}
            </button>
          </div>
          <nav className="main-nav">
            {!atendenteLogado && (
              <button type="button" onClick={() => setActiveModal("adm")}>ADM</button>
            )}
            {atendenteLogado ? (
              <>
              <button type="button" onClick={() => setActiveModal(atendenteLogado?.permissoes?.acessoAdmCompleto ? "adm" : "painel_atendente")}
                style={{ background: "rgba(184,156,255,0.12)", borderColor: "rgba(184,156,255,0.4)", color: "#b89cff" }}>
                {atendenteLogado?.permissoes?.acessoAdmCompleto ? "🔓 ADM" : "📋 Painel"}
              </button>
              <button type="button" onClick={logoutAtendente}
                style={{ background: "rgba(73,230,139,0.12)", borderColor: "rgba(73,230,139,0.4)", color: "#49e68b" }}>
                👨‍💼 {atendenteLogado.codigo}
              </button>
              </>
            ) : (
              <button type="button" onClick={() => setShowLoginAtendente(true)}
                style={{ background: "rgba(184,156,255,0.1)", borderColor: "rgba(184,156,255,0.35)", color: "#b89cff" }}>
                👨‍💼 Atendente
              </button>
            )}

            <button type="button" onClick={abrirCadastro}>
              {cliente ? `👤 ${cliente.nome.split(" ")[0]}` : "Cliente"}
            </button>
          </nav>
        </div>
      </header>

      {cliente && (
        <div className="client-chip">
          <strong>Cliente ativo:</strong> {cliente.nome} • {cliente.telefone}
          <button type="button" onClick={abrirCadastro} style={{ marginLeft: "12px", fontSize: "0.75rem", padding: "2px 8px" }}>Atualizar dados</button>
          <button type="button" onClick={() => setMostrarPerfil(true)}
            style={{ marginLeft: "6px", fontSize: "0.75rem", padding: "2px 8px", background: "rgba(73,230,139,0.12)", border: "1px solid rgba(73,230,139,0.3)", color: "#49e68b", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" }}>
            {cliente.cpfCnpj ? "✅ Perfil completo" : "📋 Completar perfil"}
          </button>
        </div>
      )}

      <section className="hero-home">
        <div className="assistant-card">
          <div className="bot-face">
            <div className="elio-container">
              <img
                src="/elio-avatar.jpg"
                alt="Assistente Quanton3D"
                className="elio-avatar"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <div className="elio-fallback" style={{ display: "none", width: "150px", height: "150px", borderRadius: "50%", background: "linear-gradient(135deg,#0a1530,#1a3060)", border: "2px solid rgba(79,209,255,0.6)", alignItems: "center", justifyContent: "center", fontSize: "4rem" }}>
                🤖
              </div>
              <div className="elio-glow-ring" />
              <div className="elio-particles">
                {[...Array(8)].map((_, i) => <span key={i} className={"elio-particle elio-particle-" + i} />)}
              </div>
            </div>
          </div>
          <button type="button" onClick={() => setActiveModal("bot")}>Assistente IA Quanton3D</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
          {/* Grupo Atendimento — acordeão */}
          <div style={{ gridColumn: secoesAbertas.atendimento ? "1 / -1" : "auto" }}>
            <button type="button" onClick={() => alternarSecao("atendimento")}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(79,209,255,0.25)", background: "rgba(79,209,255,0.06)", cursor: "pointer", fontFamily: "inherit" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.1em", color: "#4fd1ff", textTransform: "uppercase" }}>💬 Atendimento</span>
              <span style={{ color: "#4fd1ff", fontSize: "0.9rem", transform: secoesAbertas.atendimento ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
            </button>
            {secoesAbertas.atendimento && (
              <div className="home-actions" style={{ gridTemplateColumns: "repeat(2, 1fr)", marginTop: "8px" }}>
                {SERVICE_BUTTONS.filter(b => b.grupo === "atendimento").map((item) => (
                  <button key={item.label} type="button" onClick={() => executarAcao(item)}
                    style={{ borderColor: item.kind === "whatsapp" ? "rgba(37,211,102,0.4)" : undefined, background: item.kind === "whatsapp" ? "rgba(37,211,102,0.08)" : undefined, color: item.kind === "whatsapp" ? "#25d366" : "#eaf7ff" }}>
                    {item.kind === "whatsapp" ? "📱 " : ""}{item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Grupo Guias — acordeão */}
          <div style={{ gridColumn: secoesAbertas.guias ? "1 / -1" : "auto" }}>
            <button type="button" onClick={() => alternarSecao("guias")}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(184,156,255,0.25)", background: "rgba(184,156,255,0.06)", cursor: "pointer", fontFamily: "inherit" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.1em", color: "#b89cff", textTransform: "uppercase" }}>📚 Guias Técnicos</span>
              <span style={{ color: "#b89cff", fontSize: "0.9rem", transform: secoesAbertas.guias ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
            </button>
            {secoesAbertas.guias && (
              <div className="home-actions" style={{ marginTop: "8px" }}>
                {SERVICE_BUTTONS.filter(b => b.grupo === "guias").map((item) => (
                  <button key={item.label} type="button" onClick={() => executarAcao(item)}
                    style={{ borderColor: item.kind === "whatsapp" ? "rgba(37,211,102,0.4)" : undefined, background: item.kind === "whatsapp" ? "rgba(37,211,102,0.08)" : undefined, color: item.kind === "whatsapp" ? "#25d366" : "#eaf7ff" }}>
                    {item.kind === "whatsapp" ? "📱 " : ""}{item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section style={{ padding: "12px 18px", borderRadius: "14px", background: "rgba(12,24,52,0.75)", border: "1px solid rgba(79,209,255,0.15)", marginBottom: "16px", ...(secoesAbertas.colaboracao ? { width: "100%", display: "block" } : {}) }}>
        <button type="button" onClick={() => alternarSecao("colaboracao")}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(79,209,255,0.25)", background: "rgba(79,209,255,0.06)", cursor: "pointer", fontFamily: "inherit" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.1em", color: "#4fd1ff", textTransform: "uppercase" }}>📸 Fotos e Peças</span>
          <span style={{ color: "#4fd1ff", fontSize: "0.9rem", transform: secoesAbertas.colaboracao ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>▾</span>
        </button>
        {secoesAbertas.colaboracao && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
            <button type="button" onClick={() => setActiveModal("galeria")} style={{ padding: "8px 14px", borderRadius: "9px", border: "1px solid rgba(79,209,255,0.22)", background: "rgba(79,209,255,0.07)", color: "#eaf7ff", fontWeight: 700, cursor: "pointer", fontSize: "0.8rem", fontFamily: "inherit" }}>📷 Compartilhar minha peça</button>
            <button type="button" onClick={() => setActiveModal("galeriaPublica")} style={{ padding: "8px 14px", borderRadius: "9px", border: "1px solid rgba(79,209,255,0.22)", background: "rgba(79,209,255,0.07)", color: "#eaf7ff", fontWeight: 700, cursor: "pointer", fontSize: "0.8rem", fontFamily: "inherit" }}>🖼️ Ver fotos de clientes</button>
          </div>
        )}
      </section>



      <section id="produtos" className="panel" style={{ padding: "16px 20px", ...(secoesAbertas.catalogo ? { width: "100%", display: "block" } : {}) }}>
        <button type="button" onClick={() => alternarSecao("catalogo")}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(79,209,255,0.25)", background: "rgba(79,209,255,0.06)", cursor: "pointer", fontFamily: "inherit" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.1em", color: "#4fd1ff", textTransform: "uppercase" }}>🧪 Catálogo</span>
          <span style={{ color: "#4fd1ff", fontSize: "1rem", transform: secoesAbertas.catalogo ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
        </button>

        {secoesAbertas.catalogo && (
          <>
            {/* Ver todas as resinas */}
            <div style={{ marginTop: "12px" }}>
              <a href="https://quanton3d.com.br/produtos" target="_blank" rel="noreferrer"
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 20px", borderRadius: "14px", border: "1px solid rgba(73,230,139,0.3)", background: "rgba(73,230,139,0.06)", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s ease", width: "100%", textDecoration: "none" }}>
                <span style={{ fontSize: "1.4rem" }}>🧪</span>
                <div style={{ textAlign: "left" }}>
                  <strong style={{ color: "#eaf7ff", display: "block", fontSize: "0.92rem" }}>Ver todas as resinas Quanton3D</strong>
                  <span style={{ color: "#8ba3be", fontSize: "0.78rem" }}>14 linhas exclusivas — PYROBLAST, IRON, POSEIDON, FLEXFORM, SPIN, ATHOM e muito mais</span>
                </div>
                <span style={{ marginLeft: "auto", color: "#49e68b", fontSize: "0.82rem", fontWeight: 700 }}>Ver →</span>
              </a>
            </div>

            {/* FISPQs */}
            <div style={{ marginTop: "10px" }}>
              <button type="button" onClick={() => setActiveModal("fispqs")}
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 20px", borderRadius: "14px", border: "1px solid rgba(79,209,255,0.3)", background: "rgba(79,209,255,0.07)", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s ease", width: "100%" }}>
                <span style={{ fontSize: "1.4rem" }}>📄</span>
                <div style={{ textAlign: "left" }}>
                  <strong style={{ color: "#eaf7ff", display: "block", fontSize: "0.92rem" }}>Fichas de Segurança — FISPQ</strong>
                  <span style={{ color: "#8ba3be", fontSize: "0.78rem" }}>7 documentos disponíveis · POSEIDON, IRON, SPIN, SPARK, PYROBLAST, LOW SMELL, IRON 70/30</span>
                </div>
                <span style={{ marginLeft: "auto", color: "#4fd1ff", fontSize: "0.82rem", fontWeight: 700 }}>Ver →</span>
              </button>
            </div>
          </>
        )}
      </section>

      <section id="servicos" className="panel" style={{ padding: "14px 18px", ...(secoesAbertas.comunidade ? { width: "100%", display: "block" } : {}) }}>
        <button type="button" onClick={() => alternarSecao("comunidade")}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(79,209,255,0.25)", background: "rgba(79,209,255,0.06)", cursor: "pointer", fontFamily: "inherit" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.1em", color: "#4fd1ff", textTransform: "uppercase" }}>🤝 Comunidade</span>
          <span style={{ color: "#4fd1ff", fontSize: "1rem", transform: secoesAbertas.comunidade ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
        </button>
        {secoesAbertas.comunidade && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "14px" }}>
            <button type="button" onClick={abrirParceiroModal}
              style={{ padding: "10px 18px", borderRadius: "10px", border: "1px solid rgba(184,156,255,0.3)", background: "rgba(184,156,255,0.07)", color: "#eaf7ff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: "0.82rem" }}>
              🤝 Quero ser parceiro
            </button>
            <button type="button" onClick={() => setActiveModal("parceirosPublico")}
              style={{ padding: "10px 18px", borderRadius: "10px", border: "1px solid rgba(184,156,255,0.3)", background: "rgba(184,156,255,0.07)", color: "#eaf7ff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: "0.82rem" }}>
              🏆 Ver parceiros e cursos
            </button>

          </div>
        )}
      </section>

      <section id="calculadoras" className="panel" style={{ padding: "14px 18px", ...(secoesAbertas.ferramentas ? { width: "100%", display: "block" } : {}) }}>
        <button type="button" onClick={() => alternarSecao("ferramentas")}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(79,209,255,0.25)", background: "rgba(79,209,255,0.06)", cursor: "pointer", fontFamily: "inherit" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.1em", color: "#4fd1ff", textTransform: "uppercase" }}>🛠️ Ferramentas</span>
          <span style={{ color: "#4fd1ff", fontSize: "1rem", transform: secoesAbertas.ferramentas ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
        </button>

        {secoesAbertas.ferramentas && (
          <div style={{ marginTop: "14px" }}>

            {/* ── CALCULADORAS DE CUSTO — destaque principal ── */}
            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#ffd166", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "20px", height: "1px", background: "#ffd166", display: "inline-block" }} />
                💰 Calculadoras de Custo
                <span style={{ flex: 1, height: "1px", background: "rgba(255,209,102,0.2)", display: "inline-block" }} />
              </div>

              {/* Card grande com as 2 calculadoras e explicação */}
              <div style={{ background: "rgba(255,209,102,0.05)", border: "1px solid rgba(255,209,102,0.2)", borderRadius: "14px", padding: "16px", marginBottom: "10px" }}>
                <p style={{ fontSize: "0.78rem", color: "#c9a84c", margin: "0 0 12px", lineHeight: 1.5 }}>
                  Temos <strong style={{ color: "#ffd166" }}>2 calculadoras de custo</strong> — escolha conforme sua necessidade:
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {/* Simples */}
                  <div onClick={() => setActiveModal("calc_vol")} style={{ cursor: "pointer", background: "rgba(79,209,255,0.06)", border: "1px solid rgba(79,209,255,0.25)", borderRadius: "12px", padding: "14px", transition: "all 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(79,209,255,0.5)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(79,209,255,0.25)"}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <span style={{ fontSize: "1.3rem" }}>⚡</span>
                      <div>
                        <div style={{ fontWeight: 800, color: "#4fd1ff", fontSize: "0.88rem" }}>Modo Simples</div>
                        <div style={{ fontSize: "0.68rem", color: "#9fb4c7" }}>Resultado em segundos</div>
                      </div>
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "#9fb4c7", margin: "0 0 10px", lineHeight: 1.5 }}>
                      Informe resina, volume e tempo — veja o custo na hora. Sem cadastro, sem complicação.
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {["Resina", "Energia", "Falha", "Custo/peça"].map(t => (
                        <span key={t} style={{ fontSize: "0.65rem", padding: "2px 8px", borderRadius: "999px", background: "rgba(79,209,255,0.1)", border: "1px solid rgba(79,209,255,0.2)", color: "#7dd3fc" }}>{t}</span>
                      ))}
                    </div>
                  </div>

                  {/* Avançado */}
                  <div onClick={() => setActiveModal("calc_custos")} style={{ cursor: "pointer", background: "rgba(184,156,255,0.06)", border: "1px solid rgba(184,156,255,0.25)", borderRadius: "12px", padding: "14px", transition: "all 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(184,156,255,0.5)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(184,156,255,0.25)"}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <span style={{ fontSize: "1.3rem" }}>🔬</span>
                      <div>
                        <div style={{ fontWeight: 800, color: "#b89cff", fontSize: "0.88rem" }}>Modo Avançado</div>
                        <div style={{ fontSize: "0.68rem", color: "#9fb4c7" }}>Orçamento profissional</div>
                      </div>
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "#9fb4c7", margin: "0 0 10px", lineHeight: 1.5 }}>
                      Orçamento completo com cliente, mão de obra, frete, impostos, PDF e histórico.
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {["Cliente", "Mão de obra", "Frete", "Impostos", "PDF", "Histórico"].map(t => (
                        <span key={t} style={{ fontSize: "0.65rem", padding: "2px 8px", borderRadius: "999px", background: "rgba(184,156,255,0.1)", border: "1px solid rgba(184,156,255,0.2)", color: "#c9b0ff" }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Toggle simples/avançado em destaque */}
                <div style={{ marginTop: "12px", padding: "10px 14px", borderRadius: "10px", background: "rgba(73,230,139,0.05)", border: "1px solid rgba(73,230,139,0.18)", display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "1rem" }}>💡</span>
                  <p style={{ fontSize: "0.78rem", color: "#9fcfad", margin: 0, lineHeight: 1.5 }}>
                    Na <strong style={{ color: "#49e68b" }}>Calculadora Avançada</strong>, use o botão <strong style={{ color: "#4fd1ff" }}>⚡ Modo Simples</strong> no topo para esconder os campos que não precisa — ou <strong style={{ color: "#b89cff" }}>🔬 Modo Avançado</strong> para ver tudo.
                  </p>
                </div>
              </div>
            </div>

            {/* ── OUTRAS FERRAMENTAS ── */}
            <div>
              <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#4fd1ff", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "20px", height: "1px", background: "#4fd1ff", display: "inline-block" }} />
                🛠️ Outras Ferramentas
                <span style={{ flex: 1, height: "1px", background: "rgba(79,209,255,0.2)", display: "inline-block" }} />
              </div>
              <div className="selector-grid">
                <div className="field clickable-card" onClick={() => setActiveModal("calc_exp")}>
                  <span>📐 Calculadora de Exposição</span>
                  <p style={{ fontSize: "0.82rem", color: "#9fb4c7" }}>Parâmetros UV reais por resina e impressora. Ajuste fino por temperatura e altura de camada.</p>
                </div>
                <div className="field clickable-card" onClick={() => setActiveModal("calc_tolerancia")}>
                  <span>📏 Calculadora de Tolerância</span>
                  <p style={{ fontSize: "0.82rem", color: "#9fb4c7" }}>Compensação X/Y para encaixes perfeitos entre peças impressas.</p>
                </div>
                <div className="field clickable-card" onClick={() => setActiveModal("calc_tempo")}>
                  <span>⏱️ Tempo de Impressão</span>
                  <p style={{ fontSize: "0.82rem", color: "#9fb4c7" }}>Calcule e compare tempos por camadas, delays e rest time.</p>
                </div>
                <div className="field clickable-card" onClick={() => setActiveModal("calc_compensacao")}>
                  <span>🔧 Compensação Chitubox/Lychee</span>
                  <p style={{ fontSize: "0.82rem", color: "#9fb4c7" }}>Calibre a estimativa do fatiador com o tempo real da impressora.</p>
                </div>
              </div>
            </div>

          </div>
        )}
      </section>



      <section id="parametros" className="panel" style={{ padding: "14px 18px", ...(secoesAbertas.parametros ? { width: "100%", display: "block" } : {}) }}>
        <button type="button" onClick={() => alternarSecao("consulta")}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="section-label">⚡ Consulta rápida</span>
            <span style={{ color: "#eaf7ff", fontWeight: 800, fontSize: "0.9rem" }}>Parâmetros de impressão</span>
          </div>
          <span style={{ color: "#4fd1ff", fontSize: "1rem", transform: secoesAbertas.consulta ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
        </button>

        {secoesAbertas.consulta && (
        <>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px", marginTop: "12px", marginBottom: "8px" }}>
          {carregando && <span className="loading-pill">Carregando...</span>}
          <button type="button" onClick={carregarParametros} style={{ padding: "7px 13px", borderRadius: "8px", border: "1px solid rgba(79,209,255,0.2)", background: "rgba(79,209,255,0.06)", color: "#9fb4c7", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Atualizar</button>
        </div>
        {erro && <div className="error-box">{erro}</div>}
        <div className="selector-grid">
          <label className="field resin-field">
            <span>1. Selecione a Resina</span>
            <select value={resinaSelecionada} onChange={(e) => selecionarResina(e.target.value)} disabled={carregando}>
              <option value="">Selecione a resina</option>
              {resinas.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label className="field printer-field">
            <span>2. Selecione a Impressora</span>
            <select value={impressoraSelecionada} onChange={(e) => selecionarImpressora(e.target.value)} disabled={!resinaSelecionada || impressoras.length === 0}>
              <option value="">{resinaSelecionada ? "Selecione a impressora" : "Escolha uma resina primeiro"}</option>
              {impressoras.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </label>
        </div>
        {!resultado && <div className="empty-state"><h3>Selecione resina e impressora</h3><p>A configuração inicial recomendada aparecerá aqui automaticamente.</p></div>}
        {resultado && (
          <div className="result-card">
            <div className="result-header">
              <h3>{corrigirNomeResina(resultado.resina)} + {resultado.marca} {resultado.impressora}</h3>
              <button type="button" onClick={copiarParametros}>Copiar parâmetros</button>
            </div>

            {/* Selo de confiança do parâmetro */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "999px", marginBottom: "12px",
              background: resultado.confianca === "estimado" ? "rgba(255,209,102,0.12)" : "rgba(73,230,139,0.12)",
              border: "1px solid " + (resultado.confianca === "estimado" ? "rgba(255,209,102,0.3)" : "rgba(73,230,139,0.3)") }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 800, color: resultado.confianca === "estimado" ? "#ffd166" : "#49e68b" }}>
                {resultado.confianca === "estimado" ? "⚠️ Estimativa inicial" : "✅ Testado pela Quanton3D"}
              </span>
            </div>

            <div className="params-grid">
              <ParamItem label="Altura de Camada" value={resultado.alturaCamada} />
              <ParamItem label="Tempo de Exposição" value={resultado.exposicaoNormal} />
              <ParamItem label="Exposição Base" value={resultado.exposicaoBase} />
              <ParamItem label="Camadas de Base" value={resultado.camadasBase} />
              <ParamItem label="Retardo UV" value={resultado.retardoUV} />
              <ParamItem label="Potência UV" value={resultado.potenciaUV} />
            </div>

            <p style={{ margin: "12px 0 0", fontSize: "0.75rem", color: "#8ba3be", lineHeight: 1.5 }}>
              💡 Essa é uma configuração inicial recomendada. Pequenos ajustes podem ser necessários conforme temperatura ambiente, manutenção da impressora e estado do FEP.
            </p>
          </div>
        )}
        </>
        )}
      </section>



      <footer className="site-footer">
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontWeight: 700, color: "#eaf7ff", fontSize: "0.85rem" }}>Quanton3D © Suporte técnico e resinas UV de alta performance.</span>
          <span style={{ color: "#8ba3be", fontSize: "0.78rem" }}>Copyright Quanton 3D LTDA · CNPJ 11.165.962/0001-17 · 2026. Todos os direitos reservados.</span>
        </div>
        <div className="footer-social-links">
          {SOCIAL_LINKS.map((link) => (
            <a key={link.label} href={link.url} target="_blank" rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", padding: "5px 12px", borderRadius: "999px", border: "1px solid rgba(79,209,255,0.2)", background: "rgba(79,209,255,0.06)", color: "#4fd1ff", fontSize: "0.78rem", fontWeight: 700, textDecoration: "none" }}>
              {link.label}
            </a>
          ))}
        </div>
      </footer>
    </main>
  );
}

function PerfilModal({ cliente, onClose, onSalvo }) {
  const [tipo, setTipo] = useState(cliente.tipoPessoa || "pf");
  const [cpfCnpj, setCpfCnpj] = useState(cliente.cpfCnpj || "");
  const [nomeEmpresa, setNomeEmpresa] = useState(cliente.nomeEmpresa || "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  function formatarDoc(val, tipo) {
    const d = val.replace(/\D/g, "");
    if (tipo === "pf") {
      return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4").slice(0, 14);
    } else {
      return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5").slice(0, 18);
    }
  }

  async function salvar() {
    const digits = cpfCnpj.replace(/\D/g, "");
    if (cpfCnpj && tipo === "pf" && digits.length !== 11) { setErro("CPF deve ter 11 dígitos."); return; }
    if (cpfCnpj && tipo === "pj" && digits.length !== 14) { setErro("CNPJ deve ter 14 dígitos."); return; }
    if (tipo === "pj" && !nomeEmpresa.trim()) { setErro("Informe o nome da empresa."); return; }
    try {
      setSalvando(true); setErro("");
      const r = await api.patch(`/clientes/${cliente._id}/perfil`, { cpfCnpj: digits, tipoPessoa: tipo, nomeEmpresa });
      onSalvo(r.data.cliente);
    } catch(e) {
      setErro(e.response?.data?.error || "Erro ao salvar. Tente novamente.");
    } finally { setSalvando(false); }
  }

  const iStyle = { width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(79,209,255,0.25)", background: "rgba(4,10,24,0.8)", color: "#eaf3ff", fontFamily: "inherit", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" };

  return (
    <div className="modal-backdrop">
      <section className="registration-modal" style={{ maxWidth: "460px" }}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📋</div>
          <h2 style={{ margin: 0, color: "#eaf7ff", fontSize: "1.1rem" }}>Completar Perfil</h2>
          <p style={{ margin: "8px 0 0", color: "#9fb4c7", fontSize: "0.82rem", lineHeight: 1.6 }}>
            Deixe seu CPF ou CNPJ para ser localizado rapidamente no nosso cadastro da Quanton3D e ter um atendimento ainda mais ágil.
          </p>
          <p style={{ margin: "6px 0 0", fontSize: "0.78rem" }}>
            <strong style={{ color: "#49e68b" }}>Não é obrigatório</strong>
            <span style={{ color: "#6b8aad" }}> — você pode preencher quando quiser.</span>
          </p>
        </div>

        {/* Info do cliente */}
        <div style={{ background: "rgba(79,209,255,0.05)", border: "1px solid rgba(79,209,255,0.15)", borderRadius: "10px", padding: "12px 14px", marginBottom: "18px" }}>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#c5d8e8" }}>
            👤 <strong>{cliente.nome}</strong> · 📱 {cliente.telefone}
          </p>
        </div>

        {/* Tipo de pessoa */}
        <p style={{ fontSize: "0.78rem", fontWeight: 800, color: "#9fb4c7", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Tipo de pessoa</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
          {[{ id: "pf", label: "👤 Pessoa Física", sub: "CPF" }, { id: "pj", label: "🏢 Pessoa Jurídica", sub: "CNPJ" }].map(t => (
            <button key={t.id} type="button" onClick={() => { setTipo(t.id); setCpfCnpj(""); }}
              style={{ padding: "12px", borderRadius: "10px", border: `1px solid ${tipo === t.id ? "rgba(79,209,255,0.5)" : "rgba(113,159,219,0.2)"}`, background: tipo === t.id ? "rgba(79,209,255,0.1)" : "rgba(255,255,255,0.03)", color: tipo === t.id ? "#4fd1ff" : "#9fb4c7", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: "0.82rem" }}>
              <div>{t.label}</div>
              <div style={{ fontSize: "0.7rem", opacity: 0.7, marginTop: "3px" }}>{t.sub}</div>
            </button>
          ))}
        </div>

        {/* CPF ou CNPJ */}
        <div style={{ marginBottom: "14px" }}>
          <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#9fb4c7", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {tipo === "pf" ? "CPF" : "CNPJ"} <span style={{ color: "#6b8aad", fontWeight: 400 }}>(opcional)</span>
          </label>
          <input value={cpfCnpj} onChange={e => setCpfCnpj(formatarDoc(e.target.value, tipo))}
            placeholder={tipo === "pf" ? "000.000.000-00" : "00.000.000/0000-00"}
            style={iStyle} maxLength={tipo === "pf" ? 14 : 18} />
        </div>

        {/* Nome da empresa (só PJ) */}
        {tipo === "pj" && (
          <div style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#9fb4c7", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Nome da Empresa
            </label>
            <input value={nomeEmpresa} onChange={e => setNomeEmpresa(e.target.value)}
              placeholder="Razão social ou nome fantasia"
              style={iStyle} />
          </div>
        )}

        {/* Aviso LGPD */}
        <div style={{ background: "rgba(73,230,139,0.05)", border: "1px solid rgba(73,230,139,0.15)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px" }}>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "#9fcfad", lineHeight: 1.5 }}>
            🔒 Seus dados são protegidos pela LGPD. Usamos apenas para identificação e histórico de compras.
          </p>
        </div>

        {erro && <p style={{ color: "#ff8fab", fontSize: "0.82rem", margin: "0 0 12px", textAlign: "center" }}>{erro}</p>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <button type="button" onClick={onClose}
            style={{ padding: "11px", borderRadius: "10px", border: "1px solid rgba(113,159,219,0.25)", background: "rgba(255,255,255,0.04)", color: "#9fb4c7", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
            Agora não
          </button>
          <button type="button" onClick={salvar} disabled={salvando}
            style={{ padding: "11px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#1565c0,#7c3aed)", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 900, fontSize: "0.9rem" }}>
            {salvando ? "Salvando..." : "✅ Salvar"}
          </button>
        </div>
      </section>
    </div>
  );
}

function BoasVindasModal({ onEntrar }) {
  const [saindo, setSaindo] = useState(false);
  function handleEntrar() {
    setSaindo(true);
    setTimeout(onEntrar, 600);
  }
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      textAlign: "center", padding: "32px 20px",
      backgroundImage: "linear-gradient(rgba(4,10,24,0.55), rgba(4,10,24,0.72)), url('/fundo-boas-vindas.jpg')",
      backgroundSize: "cover", backgroundPosition: "center",
      animation: saindo ? "bvFadeOut 0.6s ease forwards" : "bvFadeIn 1s ease",
    }}>
      <style>{`
        @keyframes bvFadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes bvFadeOut { from { opacity:1; } to { opacity:0; } }
        @keyframes bvSlideDown { from { opacity:0; transform:translateY(-30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes bvSlideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes bvGlow { from { filter:drop-shadow(0 0 10px rgba(79,209,255,0.3)); } to { filter:drop-shadow(0 0 28px rgba(79,209,255,0.8)); } }
        @keyframes bvPulse { 0%,100% { box-shadow:0 8px 32px rgba(21,101,192,0.4),0 0 20px rgba(79,209,255,0.2); } 50% { box-shadow:0 12px 40px rgba(21,101,192,0.7),0 0 40px rgba(79,209,255,0.4); } }
        .bv-btn:hover { transform:translateY(-3px) !important; }
      `}</style>

      {/* Linha de luz */}
      <div style={{ position: "absolute", width: "100%", height: "1px", top: "52%", left: 0, background: "linear-gradient(90deg, transparent 0%, rgba(0,100,255,0.15) 20%, rgba(0,150,255,0.5) 50%, rgba(0,100,255,0.15) 80%, transparent 100%)", pointerEvents: "none" }} />

      {/* Logo */}
      <div style={{ animation: "bvSlideDown 0.8s ease", marginBottom: "24px" }}>
        <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg,#0a1530,#1a3060)", border: "2px solid rgba(79,209,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.2rem", margin: "0 auto 16px", boxShadow: "0 0 30px rgba(79,209,255,0.3)" }}>
          ⚛️
        </div>
      </div>

      {/* Nome principal */}
      <h1 style={{ fontSize: "clamp(3rem, 12vw, 6.5rem)", fontWeight: 900, letterSpacing: "-2px", lineHeight: 1, margin: "0 0 10px", background: "linear-gradient(135deg, #ffffff 0%, #4fd1ff 50%, #b89cff 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "bvGlow 2s ease-in-out infinite alternate, bvSlideDown 0.8s ease" }}>
        Quanton3D<sup style={{ fontSize: "0.3em", WebkitTextFillColor: "#4fd1ff", verticalAlign: "super" }}>®</sup>
      </h1>

      {/* Taglines */}
      <p style={{ fontSize: "clamp(0.82rem, 2.5vw, 1.05rem)", color: "rgba(196,216,232,0.9)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, margin: "0 0 6px", animation: "bvSlideUp 1s ease 0.3s both" }}>
        Resinas UV SLA/DLP de Alta Performance
      </p>
      <p style={{ fontSize: "clamp(0.72rem, 2vw, 0.88rem)", color: "rgba(130,160,190,0.8)", margin: "0 0 36px", animation: "bvSlideUp 1s ease 0.45s both" }}>
        Fabricação nacional · Belo Horizonte, MG · Desde 2020
      </p>

      {/* Divisor */}
      <div style={{ width: "min(400px, 80vw)", height: "1px", background: "linear-gradient(90deg, transparent, #4fd1ff, transparent)", marginBottom: "32px", animation: "bvSlideUp 1s ease 0.55s both" }} />

      {/* Badges */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center", marginBottom: "40px", animation: "bvSlideUp 1s ease 0.65s both" }}>
        {["🧪 14 linhas exclusivas", "🇧🇷 100% nacional", "🏆 Pioneer no Brasil"].map(b => (
          <span key={b} style={{ padding: "6px 16px", borderRadius: "999px", background: "rgba(79,209,255,0.1)", border: "1px solid rgba(79,209,255,0.3)", color: "#7dd3fc", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.05em" }}>{b}</span>
        ))}
      </div>

      {/* Botão entrar */}
      <button type="button" onClick={handleEntrar} className="bv-btn"
        style={{ padding: "16px 52px", borderRadius: "999px", background: "linear-gradient(135deg,#1565c0,#7c3aed)", border: "1px solid rgba(79,209,255,0.4)", color: "#fff", fontSize: "1rem", fontWeight: 900, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.05em", animation: "bvSlideUp 1s ease 0.8s both, bvPulse 2s ease 1.8s infinite", transition: "transform 0.3s" }}>
        ▶ Acessar o Suporte Técnico
      </button>

      {/* Rodapé */}
      <p style={{ position: "absolute", bottom: "16px", fontSize: "0.68rem", color: "rgba(100,130,160,0.6)", letterSpacing: "0.05em" }}>
        © 2025 Quanton3D LTDA · quanton3d.com.br
      </p>
    </div>
  );
}

function PrivacidadeModal({ aceitarPrivacidade }) {
  const [confirmouAceite, setConfirmouAceite] = useState(false);
  return (
    <div className="modal-backdrop">
      <section className="privacy-modal">
        <div className="modal-icon">🔐</div>
        <h2>Termo de Privacidade e Consentimento</h2>
        <p>Antes de acessar o suporte técnico da Quanton3D, leia com atenção este termo.</p>
        <div className="privacy-content">
          <h3>1. Dados que poderão ser coletados</h3>
          <p>A Quanton3D poderá coletar nome, WhatsApp, e-mail, origem do contato, mensagens enviadas, dúvidas técnicas, resina/impressora utilizada, parâmetros de impressão, pedidos de formulação e imagens enviadas voluntariamente.</p>
          <h3>2. Finalidade do uso dos dados</h3>
          <p>Os dados serão utilizados para liberar o acesso ao suporte técnico, responder dúvidas, manter histórico de atendimento, organizar pedidos de formulação e melhorar a base de conhecimento da Quanton3D.</p>
          <h3>3. Uso de imagens enviadas</h3>
          <p>Imagens poderão ser usadas para análise técnica. Não serão publicadas sem autorização específica.</p>
          <h3>4. Compartilhamento e segurança</h3>
          <p>A Quanton3D não vende seus dados. Medidas razoáveis serão adotadas para proteger as informações.</p>
          <h3>5. Direitos do usuário</h3>
          <p>Você poderá solicitar acesso, correção ou exclusão dos seus dados pessoais a qualquer momento.</p>
          <h3>6. Consentimento</h3>
          <p>Ao marcar a opção abaixo, você confirma que leu este termo e autoriza a Quanton3D a tratar seus dados.</p>
        </div>
        <label className="privacy-accept-row">
          <input type="checkbox" checked={confirmouAceite} onChange={(e) => setConfirmouAceite(e.target.checked)} />
          <span>Li e aceito o Termo de Privacidade e autorizo o uso dos meus dados.</span>
        </label>
        <button className="submit-registration" disabled={!confirmouAceite} onClick={aceitarPrivacidade}>Aceitar e continuar</button>
      </section>
    </div>
  );
}

function CadastroInicial({ formCliente, salvandoCliente, erroCadastro, alterarCliente, salvarCliente }) {
  return (
    <div className="modal-backdrop">
      <form className="registration-modal" onSubmit={salvarCliente}>
        <h2>Seja bem-vindo!</h2>
        <p>Identifique-se para liberar o suporte técnico especializado.</p>
        {erroCadastro && <div className="modal-error">{erroCadastro}</div>}
        <div className="form-grid">
          <label><span>Seu Nome</span><input value={formCliente.nome} onChange={(e) => alterarCliente("nome", e.target.value)} placeholder="Digite seu nome" /></label>
          <label><span>WhatsApp</span><input value={formCliente.telefone} onChange={(e) => alterarCliente("telefone", e.target.value)} placeholder="DDD + número" /></label>
          <label><span>E-mail</span><input value={formCliente.email} onChange={(e) => alterarCliente("email", e.target.value)} placeholder="seu@email.com" style={{ color: "#ffffff", background: "rgba(4,10,24,0.7)" }} /></label>
          <label><span>Como nos conheceu?</span>
            <select value={formCliente.origem} onChange={(e) => alterarCliente("origem", e.target.value)}>
              {ORIGENS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
        </div>
        <div className="social-box">
          <strong>Siga a Quanton3D nas redes</strong>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
            {SOCIAL_LINKS.map((link) => (
              <a key={link.label} href={link.url} target="_blank" rel="noreferrer"
                style={{ display: "inline-flex", alignItems: "center", padding: "5px 12px", borderRadius: "999px", border: "1px solid rgba(79,209,255,0.25)", background: "rgba(79,209,255,0.07)", color: "#4fd1ff", fontSize: "0.8rem", fontWeight: 700, textDecoration: "none" }}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <button className="submit-registration" type="submit" disabled={salvandoCliente}>{salvandoCliente ? "Salvando..." : "Entrar no Suporte Técnico"}</button>
      </form>
    </div>
  );
}

function GuideModal({ guide, onClose }) {
  return (
    <div className="modal-backdrop">
      <section className="guide-modal">
        <div className="guide-header"><h2>{guide.title}</h2><button type="button" onClick={onClose}>Fechar</button></div>
        <iframe title={guide.title} src={guide.file} className="guide-frame" />
      </section>
    </div>
  );
}

function SiteModal({ type, cliente, onClose, abrirGuia, abrirParceiroModal, setActiveModal, atendenteLogado }) {
  const nomeFispq = type && type.startsWith("fispq_") ? "FISPQ — " + type.replace("fispq_","").replace(".pdf","") : null;
  const titles = {
    contato: "Fale Conosco", sobre: "Sobre a Quanton3D", formulacao: "Formulação Personalizada",
    galeria: "Galeria e Configurações", galeriaPublica: "Fotos e Configurações de Clientes",
    adm: "Painel Administrativo", qualidade: "Alta Qualidade",
    calc_exp: "Calculadora de Exposição", calc_vol: "Calculadora de Volume",
    calc_tolerancia: "Calculadora de Tolerância", calc_custos: "Calculadora de Custos e Orçamentos", calc_tempo: "Calculadora de Tempo de Impressão", calc_compensacao: "Compensação de Tempo — Chitubox",
    bot: "Bot Quanton3D", chamado: "Chamado Técnico", parceirosPublico: "Parceiros e Cursos Quanton3D",
  };
  return (
    <div className="modal-backdrop">
      <section className="site-modal" style={
          (type === "calc_custos" || type === "calc_exp" || type === "calc_vol" || type === "calc_tolerancia" || type === "calc_tempo" || type === "calc_compensacao" || type === "parceirosPublico" || type === "sobre" || (type && type.startsWith("fispq_")))
            ? { width: "min(1400px, calc(100vw - 16px))", height: "calc(100vh - 16px)", maxHeight: "calc(100vh - 16px)", padding: "12px" }
            : type === "bot"
            ? { width: "98vw", maxWidth: "98vw", height: "98vh", maxHeight: "98vh", padding: "12px 14px", backgroundImage: "url(/fundo-bot-novo.webp)", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", border: "1px solid rgba(184,156,255,0.4)", display: "flex", flexDirection: "column", overflow: "hidden" }
            : { width: "min(1100px, calc(100vw - 20px))", maxHeight: "calc(100vh - 30px)" }
        }>
        <div className="guide-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: "clamp(0.82rem, 3vw, 1.1rem)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#eaf7ff" }}>
              {nomeFispq || titles[type] || "Informações"}
            </h2>
          </div>
          <button type="button" onClick={onClose}
            style={{ flexShrink: 0, padding: "5px 12px", borderRadius: "999px", border: "1px solid rgba(255,107,107,0.3)", background: "rgba(255,107,107,0.1)", color: "#ff8fab", fontWeight: 800, fontSize: "0.72rem", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", lineHeight: 1.2 }}>
            ✕ Fechar
          </button>
        </div>
        {type === "contato" && <ContatoContent cliente={cliente} />}
        {type === "sobre" && <SobreContent abrirGuia={abrirGuia} abrirParceiroModal={abrirParceiroModal} />}
        {type === "formulacao" && <FormulacaoContent cliente={cliente} />}
        {type === "galeria" && <GaleriaContent cliente={cliente} ocultarAbas />}
        {type === "galeriaPublica" && <GaleriaContent cliente={cliente} initialAba="ver" ocultarAbas />}
        {type === "adm" && (!atendenteLogado || atendenteLogado?.permissoes?.acessoAdmCompleto) && <AdminContent tokenAtendente={atendenteLogado?.permissoes?.acessoAdmCompleto ? localStorage.getItem("quanton3d_atendente_token") : null} />}
        {type === "painel_atendente" && atendenteLogado && !atendenteLogado?.permissoes?.acessoAdmCompleto && <PainelAtendente atendente={atendenteLogado} onClose={() => setActiveModal(null)} />}
        {type === "adm" && atendenteLogado && !atendenteLogado?.permissoes?.acessoAdmCompleto && (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔒</div>
            <h2 style={{ color: "#ff8fab", marginBottom: "8px" }}>Acesso Negado</h2>
            <p style={{ color: "#9fb4c7" }}>Atendentes não têm acesso ao painel administrativo.</p>
          </div>
        )}
        {type === "qualidade" && <QualidadeContent abrirGuia={abrirGuia} />}
        {type === "calc_exp" && <CalculadoraExposicao />}
        {type === "calc_vol" && <CalculadoraVolume />}
        {type === "calc_tolerancia" && <CalculadoraTolerancia />}
        {type === "calc_custos" && <CalculadoraCustos cliente={cliente} />}
        {type === "calc_tempo" && <CalculadoraTempo />}
        {type === "calc_compensacao" && <CalculadoraCompensacao />}
        {type === "bot" && <BotContent cliente={cliente} style={{ flex: 1, minHeight: 0 }} />}
        {type === "chamado" && <ChamadoTecnicoContent cliente={cliente} />}
        {type === "parceirosPublico" && <ParceirosPublicoContent abrirParceiroModal={abrirParceiroModal} />}
        {type === "fispqs" && (
          <div>
            <p style={{ color: "#8ba3be", marginBottom: "16px", fontSize: "0.88rem" }}>Selecione a resina para abrir a Ficha de Informações de Segurança de Produto Químico (FISPQ).</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
              {[
                { nome: "POSEIDON", cor: "#4fd1ff", arquivo: "POSEIDON.pdf" },
                { nome: "IRON 70/30", cor: "#b89cff", arquivo: "IRON7030.pdf" },
                { nome: "IRON", cor: "#ff8fab", arquivo: "IRON.pdf" },
                { nome: "SPIN", cor: "#49e68b", arquivo: "SPIN.pdf" },
                { nome: "SPARK", cor: "#ffd166", arquivo: "SPARK.pdf" },
                { nome: "PYROBLAST", cor: "#ff6b6b", arquivo: "PYRO.pdf" },
                { nome: "LOW SMELL", cor: "#8bd3ff", arquivo: "LOWSMELL.pdf" },
              ].map((item) => (
                <button key={item.nome} type="button" onClick={() => setActiveModal("fispq_" + item.arquivo)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "18px 12px", borderRadius: "14px", border: "1px solid " + item.cor + "44", background: item.cor + "0d", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s ease" }}>
                  <span style={{ fontSize: "1.8rem" }}>📄</span>
                  <strong style={{ color: item.cor, fontSize: "0.85rem", fontWeight: 800 }}>{item.nome}</strong>
                  <span style={{ color: "#8ba3be", fontSize: "0.72rem" }}>FISPQ · PDF</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {type && type.startsWith("fispq_") && (
          <div style={{ width: "100%", height: "75vh" }}>
            <iframe
              src={"/docs/" + type.replace("fispq_", "")}
              title="FISPQ"
              style={{ width: "100%", height: "100%", border: "none", borderRadius: "8px" }}
            />
          </div>
        )}
      </section>
    </div>
  );
}

// Só monta o link se o texto realmente parecer um endereço de site (evita erro tipo "pintor" virar https://pintor)
function pareceLink(texto) {
  if (!texto) return false;
  const t = texto.trim();
  if (t.startsWith("http://") || t.startsWith("https://")) return true;
  // Precisa ter um ponto seguido de pelo menos 2 letras (ex: .com, .com.br) pra parecer domínio real
  return /\.[a-zA-Z]{2,}/.test(t) && !t.includes(" ");
}

function montarLink(texto) {
  const t = texto.trim();
  return t.startsWith("http") ? t : `https://${t}`;
}

function ParceirosPublicoContent({ abrirParceiroModal }) {
  const [parceiros, setParceiros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get("/partner-requests/public/aprovados")
      .then(res => {
        const lista = Array.isArray(res.data?.partners) ? res.data.partners : [];
        setParceiros(lista);
      })
      .catch(() => setErro("Não foi possível carregar os parceiros agora. Tente novamente em instantes."))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <div style={{ padding: "8px 4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
        <p style={{ margin: 0, color: "#9fb4c7", fontSize: "0.85rem" }}>
          Conheça parceiros, cursos e serviços recomendados pela comunidade Quanton3D.
        </p>
        <button type="button" onClick={abrirParceiroModal}
          style={{ padding: "9px 18px", borderRadius: "10px", border: 0, background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "#fff", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
          🤝 Quero ser parceiro
        </button>
      </div>

      {carregando && <p style={{ color: "#9fb4c7", fontSize: "0.85rem" }}>Carregando parceiros...</p>}
      {erro && <div className="error-box">{erro}</div>}

      {!carregando && !erro && parceiros.length === 0 && (
        <div className="empty-state">
          <h3>Ainda não temos parceiros publicados</h3>
          <p>Seja o primeiro! Clique em "Quero ser parceiro" para enviar sua solicitação.</p>
        </div>
      )}

      {!carregando && parceiros.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {parceiros.map((p) => (
            <div key={p._id} style={{ background: "rgba(79,209,255,0.05)", border: "1px solid rgba(79,209,255,0.18)", borderRadius: "14px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {p.fotos?.[0]?.url && (
                <div style={{ width: "100%", minHeight: "220px", maxHeight: "340px", borderRadius: "10px", background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  <img src={p.fotos[0].url} alt={p.titulo} style={{ width: "100%", height: "100%", maxHeight: "340px", objectFit: "contain" }} />
                </div>
              )}
              <div>
                <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#4fd1ff", textTransform: "uppercase", letterSpacing: "0.05em" }}>{p.categoria || "Parceiro"}</span>
                <h3 style={{ margin: "4px 0 6px", fontSize: "1rem", color: "#eaf7ff" }}>{p.titulo}</h3>
                <p style={{ margin: 0, color: "#9fb4c7", fontSize: "0.82rem", lineHeight: 1.6 }}>{p.descricao}</p>
              </div>
              {(p.cidade || p.estado) && (
                <span style={{ fontSize: "0.78rem", color: "#8ba3be" }}>📍 {p.cidade}{p.cidade && p.estado ? " - " : ""}{p.estado}</span>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "auto", paddingTop: "8px", borderTop: "1px solid rgba(79,209,255,0.1)" }}>
                {p.instagram && (
                  pareceLink(p.instagram)
                    ? <a href={p.instagram.startsWith("http") ? p.instagram : `https://instagram.com/${p.instagram.replace("@","")}`} target="_blank" rel="noreferrer" style={{ fontSize: "0.78rem", color: "#4fd1ff", fontWeight: 700 }}>📸 Instagram</a>
                    : <span style={{ fontSize: "0.78rem", color: "#9fb4c7" }}>📸 {p.instagram}</span>
                )}
                {p.site && (
                  pareceLink(p.site)
                    ? <a href={montarLink(p.site)} target="_blank" rel="noreferrer" style={{ fontSize: "0.78rem", color: "#4fd1ff", fontWeight: 700 }}>🌐 Site</a>
                    : <span style={{ fontSize: "0.78rem", color: "#9fb4c7" }}>🌐 {p.site}</span>
                )}
                {p.portfolio && (
                  pareceLink(p.portfolio)
                    ? <a href={montarLink(p.portfolio)} target="_blank" rel="noreferrer" style={{ fontSize: "0.78rem", color: "#4fd1ff", fontWeight: 700 }}>💼 Portfólio</a>
                    : <span style={{ fontSize: "0.78rem", color: "#9fb4c7" }}>💼 {p.portfolio}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ContatoContent() {
  return (
    <div className="modal-rich-content">
      <p>Escolha uma forma de atendimento especializado.</p>
      <div className="modal-action-grid">
        <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">WhatsApp</a>
        <a href="mailto:atendimento@quanton3d.com.br">E-mail</a>
      </div>
    </div>
  );
}

function SobreContent({ abrirGuia, abrirParceiroModal }) {
  const [resinaSel, setResinaSel] = useState(0);
  const driveImg = (id, sz = 800) => id ? `https://drive.google.com/thumbnail?id=${id}&sz=w${sz}` : null;
  const resinas = [
    { id: "1EWI86JbINRFnfK1xZT_8cH0COX0-g7l2", nome: "PYROBLAST", cat: "Uso Geral", desc: "Básica e econômica, indicada para iniciantes e avançados. Alta precisão, dureza Shore D 73, impressão rápida com fluidez. Ideal para peças decorativas, artísticas e protótipos funcionais.", specs: "Odor médio | Viscosidade baixa | Densidade 1,296 g/cm³" },
    { id: "1TBXQTL5KUEbYlAC9jzCiLvyjKSXpGxSk", nome: "IRON", cat: "Engenharia", desc: "A primeira resina do Brasil com altíssima resistência mecânica e baixo custo. Alongamento de 50%, excelente memória elástica e resistência a impactos reais em peças técnicas acima de 2mm.", specs: "Odor baixo | Shore D 55 | Densidade 1,09 g/cm³" },
    { id: "1yQdfGOoKAohRUcii2jYCrca7B2p-1HuD", nome: "POSEIDON", cat: "Uso Geral", desc: "Rígida com leve flexibilidade, dispensa o uso de álcool — lavável em água. Detalhamento impecável, baixo odor e ampla compatibilidade. Ideal para protótipos, miniaturas e peças funcionais.", specs: "Odor baixo | Shore D 64 | Densidade 1,10 g/cm³" },
    { id: "1z5bF_xbFE65HLygNpGJDd-UtF-nWy8Bh", nome: "FLEXFORM", cat: "Engenharia", desc: "Desenvolvida para protótipos e peças que exigem alta flexibilidade e resistência. Adapta-se a diversas formas sem comprometer a integridade estrutural. Excelente precisão dimensional.", specs: "Ultra flexibilidade | Peças industriais" },
    { id: "1KdOOVOQJZDDzcrCBMZrX9x6YViKsAE8D", nome: "SPIN", cat: "Action Figures", desc: "Maior rigidez e velocidade de impressão para peças de grande formato com alto nível de detalhes. Rigidez com leve flexibilidade — ideal para protótipos funcionais e encaixes que exigem firmeza.", specs: "Odor médio | Shore D 73 | Densidade 1,39 g/cm³" },
    { id: "1DjhUGrp2zdI7QCAumNnvCDhWAvoBSR0d", nome: "ATHOM DENTAL", cat: "Odontologia", desc: "Alta precisão para modelos de estudo, troquéis e protótipos dentários. Desenvolvida para fluxo digital odontológico com qualidade excepcional. Dica: para modelos com encaixe, prefira a Spin.", specs: "Alta precisão | Uso externo" },
    { id: "1Q46F4CJ3ARAjFKcoPQDgYUGf4_lu5_7S", nome: "ATHOM ALINHADORES", cat: "Odontologia", desc: "Projetada para modelos que exigem resistência à temperatura em termoformação. Baixíssima variação dimensional para alinhadores, contenções, placas de bruxismo e protetores bucais.", specs: "Resistência térmica | Baixa contração" },
    { id: "1T8JReoS9HmNb0xgzdKb3qCh1z8T2_a_s", nome: "ATHOM WASHABLE", cat: "Odontologia", desc: "Lavável em água, elimina o álcool do processo. Alta rigidez com leve flexibilidade, detalhamento superficial excepcional. Ideal para modelos odontológicos de alta precisão.", specs: "Lavável em água | Baixo odor" },
    { id: "1MYbXZtKp_Q_3DO7LvhK4A487HABuqzOP", nome: "SPARK", cat: "Action Figures", desc: "Acabamento cristalino e visual limpo com alta rigidez. Altamente pigmentada, permite personalização com cores vibrantes. Cura rápida que reduz tempo de produção.", specs: "Translúcida rígida | Cura rápida" },
    { id: "1PEF-C5mrOasfjXk0U5mqVX2Sp2j66Bs4", nome: "70/30", cat: "Engenharia", desc: "Fórmula balanceada que combina 70% de rigidez com 30% de flexibilidade. Alta resistência com elevado nível de detalhes, perfeita para peças que exigem equilíbrio mecânico.", specs: "Alta resistência | Detalhamento fino" },
    { id: "1DA_QGLGvZsDXKksBB2XSXPmj75pSKXDI", nome: "LOWSMELL", cat: "Uso Geral", desc: "Resina rígida com odor praticamente imperceptível. Cura rápida e excelente precisão, ideal para ambientes fechados e uso profissional contínuo sem desconforto.", specs: "Baixíssimo odor | Rígida" },
    { id: "1GSCMNZ0ArGM3oyHDaGNKYhykyf-djNFN", nome: "ALCHEMIST", cat: "Action Figures", desc: "Efeitos especiais em cores translúcidas e vibrantes, exclusivas da Quanton3D. Rápida polimerização, durabilidade e acabamento refinado. Perfeita para colecionáveis e itens de decoração.", specs: "Translúcida | Cores vibrantes" },
    { id: null, nome: "VULCAN CAST", cat: "Fundição", desc: "Desenvolvida para cera perdida e fundição de precisão. Alta taxa de cinzas mínima após queima, permitindo fundição em ouro, prata e outros metais. Ideal para joias e peças de alta fidelidade.", specs: "Fundição de precisão | Queima limpa" },
    { id: null, nome: "VELVET SKIN", cat: "Uso Geral", desc: "Superfície com acabamento aveludado único. Textura especial que dispensa acabamento manual, ideal para produtos finais e protótipos com aparência premium.", specs: "Acabamento aveludado | Peças finais" },
  ];
  const r = resinas[resinaSel];

  return (
    <div className="sobre-container">
      {/* HERO */}
      <div className="sobre-hero">
        <div className="sobre-hero-text">
          <div className="sobre-badge">Fundada em abril de 2020</div>
          <h2 className="sobre-titulo">Quanton3D</h2>
          <p className="sobre-lema">Para quem transforma resina em resultado.</p>
        </div>
        <div className="sobre-fundadores">
          <div className="sobre-fundador-card">
            <img src={driveImg("1DKLHuIybHolw5qlQ8t_75FXDX8LDVH67", 400)} alt="Ronei Fonseca" loading="lazy" />
            <span>Ronei Fonseca</span>
            <small>Fundador &amp; Desenvolvimento</small>
          </div>
          <div className="sobre-fundador-card">
            <img src={driveImg("1ax4Q7JkZNr444UsOPZkUZcXRyMKfTjwT", 400)} alt="Gislene" loading="lazy" />
            <span>Gislene</span>
            <small>Cofundadora &amp; Gestão</small>
          </div>
        </div>
      </div>

      {/* HISTÓRIA COMPLETA */}
      <div className="sobre-section">
        <h3>🏭 O Começo de Tudo: Desafio e União</h3>
        <p>
          A Quanton3D não nasceu apenas para ser mais uma marca no mercado — ela nasceu de uma virada de chave em um momento histórico. 
          Fundada em <strong>abril de 2020</strong>, no início da pandemia da COVID-19 em <strong>Belo Horizonte (MG)</strong>, a empresa ganhou vida 
          através da coragem e da união de seus fundadores, <strong>Ronei e Gislene</strong>.
        </p>
        <p style={{ marginTop: "12px" }}>
          Trabalhando lado a lado como casal e sócios, eles decidiram transformar um período de incertezas globais em uma oportunidade 
          para revolucionar a manufatura digital no Brasil. Trazendo na bagagem uma sólida experiência industrial — vinda da 
          <strong> fabricação técnica de manequins</strong> —, o casal aplicou o rigor de produção, o olho clínico para o acabamento e a 
          seriedade comercial no universo da impressão 3D.
        </p>
      </div>

      {/* PIONEIRISMO */}
      <div className="sobre-section">
        <h3>🏆 Pioneirismo Nacional e o Verdadeiro Preço Justo</h3>
        <p>
          Antes da Quanton3D, os profissionais brasileiros sofriam com o monopólio de insumos importados e insustentavelmente caros, 
          que limitavam o crescimento do mercado de impressão 3D. Fomos a <strong>primeira fábrica nacional</strong> focada em entregar resinas 
          de altíssima performance com um preço genuinamente justo.
        </p>
        <p style={{ marginTop: "12px" }}>
          Entramos no mercado revolucionando e provando que qualidade não precisa ser sinônimo de preço abusivo: iniciamos nossa 
          trajetória oferecendo o <strong>quilo da resina na faixa de R$ 170,00</strong>. Esse marco histórico não apenas democratizou o acesso 
          para milhares de novos makers, clínicas e laboratórios, mas também forçou o mercado nacional a se reposicionar.
        </p>
        <p style={{ marginTop: "12px", fontStyle: "italic", color: "#b89cff" }}>
          Para nós, não é só sobre vender resina. É sobre o que você consegue criar com ela.
        </p>
      </div>

      {/* VALORES */}
      <div className="sobre-section">
        <h3>🎯 Nossos Valores e Compromisso Industrial</h3>
        <div className="sobre-valores-grid">
          <div className="sobre-valor-card">
            <div className="sobre-valor-icon">🔬</div>
            <h4>Qualidade e Rigor Técnico</h4>
            <p>Nossas fórmulas passam por testes rigorosos para oferecer cura rápida, baixíssima contração e estabilidade dimensional impecável.</p>
          </div>
          <div className="sobre-valor-card">
            <div className="sobre-valor-icon">🤝</div>
            <h4>Suporte Próximo</h4>
            <p>Atendemos de forma humana, técnica e rápida, ajudando quem imprime a calibrar suas máquinas e alcançar a peça perfeita.</p>
          </div>
          <div className="sobre-valor-card">
            <div className="sobre-valor-icon">🛡️</div>
            <h4>Responsabilidade e Segurança</h4>
            <p>Indústria totalmente regularizada: Certificado IBAMA, Licença Ambiental, AVCB Bombeiros e certificação CRQ – 2ª Região.</p>
          </div>
        </div>
      </div>

      {/* NOSSAS RESINAS — LAYOUT GRANDE COM CARACTERÍSTICAS */}
      <div className="sobre-section">
        <h3>🧪 Nossas Resinas — 14 Linhas Exclusivas</h3>
        <div className="sobre-resina-tabs">
          {resinas.map((res, i) => (
            <button key={i} className={`sobre-resina-tab ${i === resinaSel ? "active" : ""}`} onClick={() => setResinaSel(i)}>
              {res.nome}
            </button>
          ))}
        </div>
        <div className="sobre-resina-detalhe">
          <div className="sobre-resina-img-wrap">
            {r.id
              ? <img src={driveImg(r.id, 800)} alt={r.nome} loading="lazy" />
              : <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "300px", borderRadius: "12px", border: "1px dashed rgba(79,209,255,0.2)", background: "rgba(0,0,0,0.2)", color: "#4fd1ff", gap: "12px" }}>
                  <span style={{ fontSize: "3rem" }}>🧪</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#9fb4c7" }}>Foto em breve</span>
                  <span style={{ fontSize: "0.72rem", color: "#6b8aad" }}>Envie a foto no Drive</span>
                </div>
            }
          </div>
          <div className="sobre-resina-info">
            <div className="sobre-resina-cat">{r.cat}</div>
            <h4>{r.nome}</h4>
            <p>{r.desc}</p>
            <div className="sobre-resina-specs">{r.specs}</div>
            <a href={`https://quanton3d.com.br`} target="_blank" rel="noopener noreferrer" className="sobre-resina-comprar">
              🛒 Ver na loja
            </a>
          </div>
        </div>
      </div>

      {/* ONDE ESTAMOS */}
      <div className="sobre-section">
        <h3>📍 Onde Estamos</h3>
        <p>
          Nossa fábrica e centro de distribuição ficam estrategicamente localizados na <strong>Avenida Dom Pedro II, 5056 — Jardim Montanhês, 
          Belo Horizonte – MG</strong>. Daqui, enviamos tecnologia e inovação diariamente para laboratórios, clínicas, estúdios de arte e 
          indústrias em todos os cantos do Brasil.
        </p>
      </div>

      {/* AÇÕES */}
      <div className="sobre-actions">
        <a href="https://quanton3d.com.br" target="_blank" rel="noopener noreferrer" className="sobre-action-btn sobre-action-primary">
          🛒 Visite nossa loja
        </a>
        <a href="https://wa.me/5531983340053?text=Ol%C3%A1%2C%20vim%20pelo%20site%20Quanton3D!" target="_blank" rel="noopener noreferrer" className="sobre-action-btn sobre-action-whatsapp">
          💬 Fale no WhatsApp
        </a>
        <button type="button" onClick={abrirParceiroModal} className="sobre-action-btn">
          🤝 Quero ser parceiro
        </button>
      </div>
    </div>
  );
}

function FormulacaoContent({ cliente }) {
  const [form, setForm] = useState({ caracteristica: "", cor: "", detalhes: "" });
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  async function enviar() {
    if (!form.caracteristica.trim()) { alert("Informe a aplicação desejada."); return; }
    try {
      setEnviando(true);
      await api.post("/formulacoes", {
        nome: cliente?.nome || "Não informado",
        telefone: cliente?.telefone || "Não informado",
        email: cliente?.email || "",
        caracteristica: form.caracteristica,
        cor: form.cor,
        detalhes: form.detalhes,
        clienteId: cliente?._id,
      });
      setSucesso(true);
    } catch (err) { console.error("Erro ao enviar formulação:", err); alert("Erro ao enviar pedido."); }
    finally { setEnviando(false); }
  }
  if (sucesso) return <div className="modal-success">Pedido enviado com sucesso! Nossa equipe entrará em contato.</div>;
  return (
    <div className="modal-rich-content">
      <p>Solicite uma resina com propriedades específicas para sua aplicação.</p>
      <div className="modal-form-layout" style={{ marginTop: "20px" }}>
        <div className="form-grid">
          <label><span>Aplicação</span><input value={form.caracteristica} onChange={(e) => setForm({ ...form, caracteristica: e.target.value })} placeholder="Ex.: Guia Cirúrgico, Joalheria, Industrial" /></label>
          <label><span>Cor desejada</span><input value={form.cor} onChange={(e) => setForm({ ...form, cor: e.target.value })} placeholder="Ex.: Transparente, Branco, Rosa" /></label>
          <label className="partner-grid-full"><span>Detalhes da necessidade</span><textarea rows="4" value={form.detalhes} onChange={(e) => setForm({ ...form, detalhes: e.target.value })} placeholder="Descreva a aplicação, propriedades desejadas (flexibilidade, resistência, biocompatibilidade), volume estimado..." /></label>
        </div>
        <button type="button" className="submit-registration" onClick={enviar} disabled={enviando}>{enviando ? "Enviando..." : "Solicitar Estudo"}</button>
      </div>
    </div>
  );
}

function ChamadoTecnicoContent({ cliente }) {
  const PROBLEMAS = [
    "Peça não adere à plataforma",
    "Peça adere demais / não solta",
    "Delaminação (camadas separando)",
    "Warping / empenamento",
    "Suporte difícil de remover",
    "Peça porosa ou com buracos",
    "Linhas visíveis entre camadas",
    "FEP danificado",
    "Peça racha após alguns dias",
    "Resina vazando da peça",
    "Peça ficou branca / opaca após cura",
    "Peça amarelada após cura UV",
    "Cheiro muito forte / fumaça",
    "Tela LCD com manchas",
    "Outro problema",
  ];

  const [resinas, setResinas] = useState([]);
  const [impressoras, setImpressoras] = useState([]);
  const [form, setForm] = useState({
    problema: "", resina: "", impressora: "",
    alturaCamada: "", exposicaoNormal: "", exposicaoBase: "",
    camadasBase: "", temperatura: "", tentativas: "", observacao: "",
  });
  const [fotos, setFotos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get("/parametros").then(res => {
      const lista = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data?.parametros) ? res.data.parametros : [];
      const rs = [...new Set(lista.map(p => p.resina).filter(Boolean))].sort();
      const im = [...new Set(lista.map(p => p.impressora).filter(Boolean))].sort();
      setResinas(rs);
      setImpressoras(im);
    }).catch(() => {});
  }, []);

  function set(campo, valor) { setForm(f => ({ ...f, [campo]: valor })); }

  async function enviar(e) {
    e.preventDefault();
    if (!form.problema || !form.resina || !form.impressora) {
      setErro("Preencha pelo menos: tipo de problema, resina e impressora.");
      return;
    }
    try {
      setEnviando(true); setErro("");
      const descricao = [
        form.alturaCamada && `Altura de camada: ${form.alturaCamada}mm`,
        form.exposicaoNormal && `Exposição normal: ${form.exposicaoNormal}s`,
        form.exposicaoBase && `Exposição base: ${form.exposicaoBase}s`,
        form.camadasBase && `Camadas base: ${form.camadasBase}`,
        form.temperatura && `Temperatura ambiente: ${form.temperatura}°C`,
        form.tentativas && `O que já tentou: ${form.tentativas}`,
        form.observacao && `Observações: ${form.observacao}`,
      ].filter(Boolean).join(" | ");

      const formData = new FormData();
      formData.append("clienteId", cliente?._id || "");
      formData.append("nome", cliente?.nome || "");
      formData.append("telefone", cliente?.telefone || "");
      formData.append("email", cliente?.email || "");
      formData.append("problema", form.problema);
      formData.append("resina", form.resina === "outra" ? (form.resinaCustom || "Outra") : form.resina);
      formData.append("impressora", form.impressora === "outra" ? (form.impressoraCustom || "Outra") : form.impressora);
      formData.append("descricao", descricao);
      fotos.forEach(foto => formData.append("fotos", foto));
      await api.post("/bot-tickets", formData);
      setSucesso(true);
    } catch (err) {
      console.error("Erro ao abrir chamado:", err);
      setErro("Erro ao enviar chamado. Tente novamente.");
    } finally { setEnviando(false); }
  }

  const S = {
    section: { marginBottom: "16px" },
    title: { fontSize: "0.72rem", fontWeight: 900, color: "#4fd1ff", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px", padding: "6px 10px", background: "rgba(79,209,255,0.08)", borderRadius: "8px", display: "block" },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
    field: { display: "flex", flexDirection: "column", gap: "5px" },
    label: { fontSize: "0.78rem", fontWeight: 700, color: "#9fb4c7" },
    input: { padding: "9px 11px", borderRadius: "9px", border: "1px solid rgba(79,209,255,0.22)", background: "rgba(4,10,24,0.7)", color: "#ffffff", fontSize: "0.88rem" },
    select: { padding: "9px 11px", borderRadius: "9px", border: "1px solid rgba(79,209,255,0.22)", background: "rgba(4,10,24,0.7)", color: "#ffffff", fontSize: "0.88rem" },
  };

  if (sucesso) return (
    <div style={{ textAlign: "center", padding: "36px" }}>
      <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>✅</div>
      <h3 style={{ color: "#49e68b", margin: "0 0 10px" }}>Chamado registrado com sucesso!</h3>
      <p style={{ color: "#9fb4c7" }}>Nossa equipe técnica analisará seu caso e entrará em contato pelo WhatsApp <strong style={{ color: "#eaf3ff" }}>(31) 3271-6935</strong>.</p>
    </div>
  );

  return (
    <div>
      <p style={{ color: "#9fb4c7", marginBottom: "18px", fontSize: "0.88rem" }}>
        Preencha os campos abaixo. Quanto mais detalhes, mais rápido conseguimos resolver!
      </p>

      <form onSubmit={enviar}>
        {erro && <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", color: "#ff8fab", marginBottom: "14px", fontSize: "0.85rem" }}>{erro}</div>}

        {/* Bloco 1 — Identificação */}
        <div style={S.section}>
          <span style={S.title}>🔍 Identificação do problema</span>
          <div style={S.grid2}>
            <div style={S.field}>
              <label style={S.label}>Tipo de problema *</label>
              <select value={form.problema} onChange={e => set("problema", e.target.value)} style={S.select}>
                <option value="">Selecione o problema</option>
                {PROBLEMAS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={S.field}>
              <label style={S.label}>Resina usada *</label>
              <select value={form.resina} onChange={e => set("resina", e.target.value)} style={S.select}>
                <option value="">Selecione a resina</option>
                {resinas.map(r => <option key={r} value={r}>{r}</option>)}
                <option value="Outra">Outra (não listada)</option>
              </select>
            </div>
            <div style={{ ...S.field, gridColumn: "1/-1" }}>
              <label style={S.label}>Impressora *</label>
              <select value={form.impressora} onChange={e => set("impressora", e.target.value)} style={S.select}>
                <option value="">Selecione a impressora</option>
                {impressoras.map(i => <option key={i} value={i}>{i}</option>)}
                <option value="Outra">Outra (não listada)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bloco 2 — Parâmetros usados */}
        <div style={S.section}>
          <span style={S.title}>⚙️ Parâmetros que você está usando (estilo Chitubox)</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px" }}>
            {[
              { campo: "alturaCamada", label: "Altura de camada", placeholder: "Ex: 0.05mm" },
              { campo: "exposicaoNormal", label: "Exposição normal (s)", placeholder: "Ex: 2.1" },
              { campo: "exposicaoBase", label: "Exposição base (s)", placeholder: "Ex: 35" },
              { campo: "camadasBase", label: "Camadas base", placeholder: "Ex: 6" },
            ].map(({ campo, label, placeholder }) => (
              <div key={campo} style={S.field}>
                <label style={S.label}>{label}</label>
                <input value={form[campo]} onChange={e => set(campo, e.target.value)} placeholder={placeholder} style={S.input} />
              </div>
            ))}
          </div>
        </div>

        {/* Bloco 3 — Contexto */}
        <div style={S.section}>
          <span style={S.title}>🌡️ Contexto e tentativas</span>
          <div style={S.grid2}>
            <div style={S.field}>
              <label style={S.label}>Temperatura ambiente (°C)</label>
              <input value={form.temperatura} onChange={e => set("temperatura", e.target.value)} placeholder="Ex: 22" style={S.input} />
            </div>
            <div style={{ ...S.field, gridColumn: "1/-1" }}>
              <label style={S.label}>O que você já tentou para resolver?</label>
              <input value={form.tentativas} onChange={e => set("tentativas", e.target.value)} placeholder="Ex: aumentei exposição base, nivelei a plataforma..." style={S.input} />
            </div>
            <div style={{ ...S.field, gridColumn: "1/-1" }}>
              <label style={S.label}>Observações adicionais</label>
              <textarea value={form.observacao} onChange={e => set("observacao", e.target.value)} rows={3}
                placeholder="Quando começou? É sempre ou às vezes? Algum detalhe importante..."
                style={{ ...S.input, resize: "vertical", minHeight: "72px" }} />
            </div>
          </div>
        </div>

        {/* Fotos */}
        <div style={S.section}>
          <span style={S.title}>📷 Fotos do problema (até 4)</span>
          <label style={{ display: "block", padding: "14px", borderRadius: "10px", border: "2px dashed rgba(79,209,255,0.3)", background: "rgba(79,209,255,0.04)", cursor: "pointer", textAlign: "center" }}>
            <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => setFotos(Array.from(e.target.files || []).slice(0, 4))} />
            {fotos.length > 0
              ? <span style={{ color: "#49e68b", fontWeight: 700 }}>✅ {fotos.length} foto(s): {fotos.map(f => f.name).join(", ")}</span>
              : <span style={{ color: "#9fb4c7", fontSize: "0.85rem" }}>📁 Clique para selecionar fotos da peça com problema</span>
            }
          </label>
        </div>

        <button type="submit" disabled={enviando}
          style={{ width: "100%", padding: "14px", borderRadius: "12px", border: 0, background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "#ffffff", fontWeight: 900, fontSize: "0.95rem", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 24px rgba(37,99,235,0.3)" }}>
          {enviando ? "Enviando chamado..." : "🔧 Abrir Chamado Técnico"}
        </button>
      </form>
    </div>
  );
}

const RESINAS_QUANTON = [
  "ALCHEMIST", "IRON", "IRON 70/30", "FLEXFORM", "POSEIDON",
  "PYROBLAST", "VULCAN CAST", "SPIN", "SPARK", "LOW SMELL", "VELVET SKIN",
  "ATHOM DENTAL", "ATHOM ALINHADORES", "ATHOM WASHABLE",
];

const IMPRESSORAS_COMUNS = [
  "Anycubic Photon Mono", "Anycubic Photon Mono X", "Anycubic Photon Mono X 6K",
  "Anycubic Photon M3", "Anycubic Photon M3 Max", "Anycubic Photon M3 Plus",
  "Anycubic Photon M5", "Anycubic Photon M5s", "Anycubic Photon M7",
  "Elegoo Mars 2", "Elegoo Mars 3", "Elegoo Mars 4", "Elegoo Mars 4 Ultra",
  "Elegoo Saturn", "Elegoo Saturn 2", "Elegoo Saturn 3 Ultra", "Elegoo Saturn 4 Ultra",
  "Elegoo Jupiter", "Elegoo Jupiter SE",
  "Creality Halot One", "Creality Halot Mage", "Creality Halot Mage Pro",
  "Phrozen Sonic Mini 8K", "Phrozen Sonic Mighty 8K",
  "Bambu Lab",
];

function GaleriaContent({ cliente, initialAba = "enviar", ocultarAbas = false }) {
  const [aba, setAba] = useState(initialAba);
  const [form, setForm] = useState({ resina: "", impressora: "", observacao: "", parametros: criarConfiguracaoVazia(), redes: { instagram: "", tiktok: "", facebook: "", youtube: "" }, autorizaDivulgacao: false });
  const [foto, setFoto] = useState(null);
  const [itens, setItens] = useState([]);
  const [carregandoItens, setCarregandoItens] = useState(false);
  const [erroItens, setErroItens] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (aba !== "ver") return undefined;
    let ativo = true;
    async function carregarGaleria() {
      try {
        setCarregandoItens(true); setErroItens("");
        const resposta = await api.get("/gallery");
        const lista = Array.isArray(resposta.data?.data) ? resposta.data.data : [];
        if (ativo) setItens(lista);
      } catch (err) { console.error("Erro ao carregar galeria:", err); if (ativo) setErroItens("Não foi possível carregar as fotos aprovadas agora."); }
      finally { if (ativo) setCarregandoItens(false); }
    }
    carregarGaleria();
    return () => { ativo = false; };
  }, [aba]);

  function alterar(campo, valor) { setForm((a) => ({ ...a, [campo]: valor })); }
  function alterarParametro(campo, valor) { setForm((a) => ({ ...a, parametros: { ...a.parametros, [campo]: valor } })); }
  function alterarRede(campo, valor) { setForm((a) => ({ ...a, redes: { ...a.redes, [campo]: valor } })); }

  async function enviar(event) {
    event.preventDefault();
    const resinaFinal = form.resina === "outra" ? form.resinaCustom : form.resina;
    const impressoraFinal = form.impressora === "outra" ? form.impressoraCustom : form.impressora;
    if (!resinaFinal?.trim() || !impressoraFinal?.trim() || !foto) { alert("Preencha a resina, a impressora e envie uma foto."); return; }
    try {
      setEnviando(true);
      const formData = new FormData();
      formData.append("nome", cliente?.nome || "");
      formData.append("telefone", cliente?.telefone || "");
      formData.append("email", cliente?.email || "");
      formData.append("resina", form.resina === "outra" ? (form.resinaCustom || "Outra") : form.resina);
      formData.append("impressora", form.impressora === "outra" ? (form.impressoraCustom || "Outra") : form.impressora);
      formData.append("observacao", form.observacao);
      formData.append("clienteId", cliente?._id || "");
      formData.append("fotos", foto);
      formData.append("autorizaDivulgacao", form.autorizaDivulgacao ? "true" : "false");
      Object.entries(form.parametros).forEach(([campo, valor]) => formData.append(`parametros.${campo}`, valor));
      Object.entries(form.redes).forEach(([campo, valor]) => formData.append(`redesSociais.${campo}`, valor));
      await api.post("/gallery", formData);
      setSucesso(true);
      setForm({ resina: "", impressora: "", observacao: "", parametros: criarConfiguracaoVazia(), redes: { instagram: "", tiktok: "", facebook: "", youtube: "" }, autorizaDivulgacao: false });
      setFoto(null);
    } catch (err) { console.error("Erro ao enviar para galeria:", err); alert("Erro ao enviar para galeria."); }
    finally { setEnviando(false); }
  }

  return (
    <div className="modal-rich-content gallery-content">
      <p>{aba === "ver" && ocultarAbas ? "Veja fotos aprovadas de clientes e configurações reais." : "Envie uma foto real da peça e as configurações do Chitubox."}</p>
      {!ocultarAbas && (
        <div className="gallery-tabs" role="tablist">
          <button type="button" className={aba === "enviar" ? "active" : ""} onClick={() => setAba("enviar")}>📷 Enviar configuração</button>
          <button type="button" className={aba === "ver" ? "active" : ""} onClick={() => setAba("ver")}>Ver fotos de clientes</button>
        </div>
      )}
      {aba === "enviar" ? (
        <form className="modal-form-layout" style={{ marginTop: "20px" }} onSubmit={enviar}>
          {sucesso && <div className="modal-success">Enviado! Aguarda aprovação para aparecer para outros clientes.</div>}
          <div className="form-grid gallery-form-grid">
            <label><span>Resina usada *</span>
              <select value={form.resina} onChange={e => alterar("resina", e.target.value)}
                style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(113,159,219,0.3)", background: "rgba(4,10,24,0.85)", color: form.resina ? "#eaf3ff" : "#6b8aad", fontSize: "0.88rem", fontFamily: "inherit", width: "100%" }}>
                <option value="">Selecione a resina...</option>
                {RESINAS_QUANTON.map(r => <option key={r} value={r}>{r}</option>)}
                <option value="outra">Outra (não listada)</option>
              </select>
              {form.resina === "outra" && <input value={form.resinaCustom || ""} onChange={e => alterar("resinaCustom", e.target.value)} placeholder="Digite o nome da resina" style={{ marginTop: "6px", padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(113,159,219,0.3)", background: "rgba(4,10,24,0.85)", color: "#eaf3ff", fontSize: "0.88rem", width: "100%", boxSizing: "border-box" }} />}
            </label>
            <label><span>Impressora *</span>
              <select value={form.impressora} onChange={e => alterar("impressora", e.target.value)}
                style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(113,159,219,0.3)", background: "rgba(4,10,24,0.85)", color: form.impressora ? "#eaf3ff" : "#6b8aad", fontSize: "0.88rem", fontFamily: "inherit", width: "100%" }}>
                <option value="">Selecione a impressora...</option>
                {IMPRESSORAS_COMUNS.map(i => <option key={i} value={i}>{i}</option>)}
                <option value="outra">Outra (não listada)</option>
              </select>
              {form.impressora === "outra" && <input value={form.impressoraCustom || ""} onChange={e => alterar("impressoraCustom", e.target.value)} placeholder="Digite o modelo da impressora" style={{ marginTop: "6px", padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(113,159,219,0.3)", background: "rgba(4,10,24,0.85)", color: "#eaf3ff", fontSize: "0.88rem", width: "100%", boxSizing: "border-box" }} />}
            </label>
            <label className="partner-grid-full"><span>Foto do trabalho *</span><input type="file" accept="image/*" onChange={(e) => setFoto(e.target.files?.[0] || null)} /></label>
          </div>
          <div className="gallery-config-box">
            <h3>Configurações do Chitubox</h3>
            <p>Preencha o que souber. Deixe em branco o que não souber.</p>
            <div className="form-grid gallery-settings-grid">
              {CAMPOS_CONFIGURACAO_GALERIA.map((campo) => (
                <label key={campo.name}><span>{campo.label}</span><input value={form.parametros[campo.name]} onChange={(e) => alterarParametro(campo.name, e.target.value)} placeholder={campo.placeholder} /></label>
              ))}
            </div>
          </div>
          <label className="gallery-observation"><span>Observações para o próximo cliente</span><textarea rows="4" value={form.observacao} onChange={(e) => alterar("observacao", e.target.value)} placeholder="Ex.: temperatura ambiente, suporte usado, ajustes que fez..." /></label>

          <div style={{ marginTop: "16px", padding: "14px", borderRadius: "12px", background: "rgba(184,156,255,0.06)", border: "1px solid rgba(184,156,255,0.2)" }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", marginBottom: form.autorizaDivulgacao ? "14px" : 0 }}>
              <input type="checkbox" checked={form.autorizaDivulgacao} onChange={e => alterar("autorizaDivulgacao", e.target.checked)} style={{ marginTop: "3px" }} />
              <span style={{ fontSize: "0.85rem", color: "#d3e4f8", lineHeight: 1.5 }}>
                📸 Autorizo a Quanton3D a divulgar essa peça nas redes sociais oficiais, dando os créditos a mim.
              </span>
            </label>

            {form.autorizaDivulgacao && (
              <div>
                <p style={{ margin: "0 0 10px", fontSize: "0.78rem", color: "#9fb4c7" }}>Ótimo! Deixa seu @ pra gente te marcar (opcional, preencha o que tiver):</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <input value={form.redes.instagram} onChange={e => alterarRede("instagram", e.target.value)} placeholder="📸 @ do Instagram" style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(184,156,255,0.25)", background: "rgba(4,10,24,0.7)", color: "#fff", fontSize: "0.82rem" }} />
                  <input value={form.redes.tiktok} onChange={e => alterarRede("tiktok", e.target.value)} placeholder="🎵 @ do TikTok" style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(184,156,255,0.25)", background: "rgba(4,10,24,0.7)", color: "#fff", fontSize: "0.82rem" }} />
                  <input value={form.redes.facebook} onChange={e => alterarRede("facebook", e.target.value)} placeholder="📘 Facebook" style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(184,156,255,0.25)", background: "rgba(4,10,24,0.7)", color: "#fff", fontSize: "0.82rem" }} />
                  <input value={form.redes.youtube} onChange={e => alterarRede("youtube", e.target.value)} placeholder="▶️ Canal do YouTube" style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(184,156,255,0.25)", background: "rgba(4,10,24,0.7)", color: "#fff", fontSize: "0.82rem" }} />
                </div>
              </div>
            )}
          </div>

          <button type="submit" className="submit-registration" style={{ marginTop: "16px" }} disabled={enviando}>{enviando ? "Enviando..." : "Enviar para aprovação"}</button>
        </form>
      ) : (
        <div className="gallery-approved-list">
          {carregandoItens && <div className="gallery-empty">Carregando fotos aprovadas...</div>}
          {erroItens && <div className="modal-error">{erroItens}</div>}
          {!carregandoItens && !erroItens && itens.length === 0 && <div className="gallery-empty">Ainda não há fotos aprovadas.</div>}
          {itens.map((item) => (
            <article className="gallery-approved-card" key={item._id || item.imagem} style={{ border: "1px solid rgba(113,159,219,0.2)", borderRadius: "16px", overflow: "hidden", background: "rgba(255,255,255,0.04)", marginBottom: "16px" }}>
              {item.imagem && (
                <img
                  src={item.imagem}
                  alt={`Peca impressa com ${item.resina || "resina"}`}
                  style={{ width: "100%", maxHeight: "340px", objectFit: "contain", background: "rgba(0,0,0,0.3)", display: "block" }}
                />
              )}
              <div style={{ padding: "14px" }}>
                <h3 style={{ margin: "0 0 4px", fontSize: "1rem", color: "#eaf3ff" }}>{item.resina || "Resina nao informada"}</h3>
                <p style={{ margin: "0 0 8px", color: "#9fb4c7", fontSize: "0.85rem" }}>{item.impressora || "Impressora nao informada"}</p>
                {item.observacao && <p className="gallery-note" style={{ color: "#d3e4f8", fontSize: "0.85rem", fontStyle: "italic", margin: "0 0 8px" }}>{item.observacao}</p>}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                  {CAMPOS_CONFIGURACAO_GALERIA.map((campo) => {
                    const valor = item.parametros?.[campo.name];
                    return valor ? <span key={campo.name} style={{ fontSize: "0.72rem", padding: "2px 7px", borderRadius: "6px", background: "rgba(26,115,232,0.12)", border: "1px solid rgba(26,115,232,0.2)", color: "#a8c4e8" }}><strong>{campo.label}:</strong> {valor}</span> : null;
                  })}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminContent({ tokenAtendente }) {
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
  const [novoParam, setNovoParam] = useState({ resina:"", impressora:"", alturaCamada:"", exposicaoNormal:"", exposicaoBase:"", camadasBase:"", liftSpeed:"", retractSpeed:"", confianca:"oficial" });
  const [salvandoParam, setSalvandoParam] = useState(false);
  const [msgParam, setMsgParam] = useState("");
  const [parametrosAdm, setParametrosAdm] = useState([]);
  const [buscaParam, setBuscaParam] = useState("");
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
      setNovoParam({ resina:"", impressora:"", alturaCamada:"", exposicaoNormal:"", exposicaoBase:"", camadasBase:"", liftSpeed:"", retractSpeed:"" });
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
    const cor = ["aprovado","fechado","resolvido"].includes(status) ? "#49e68b" : ["recusado","rejeitado"].includes(status) ? "#ff6b6b" : status === "respondido" ? "#4fd1ff" : "#ffd166";
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
    { id: "sugestoes_elio", label: "Sugestões ELIO", icon: "💡", count: sugestoesElio.filter(s => s.status === "pendente").length },
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
                border: aba === a.id ? "2px solid #4fd1ff" : "1px solid rgba(113,159,219,0.2)",
                background: aba === a.id ? "linear-gradient(135deg,rgba(37,99,235,0.3),rgba(124,58,237,0.3))" : "rgba(255,255,255,0.04)",
                color: aba === a.id ? "#4fd1ff" : "#9fb4c7",
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
              <span style={{ color: aba === a.id ? "#4fd1ff" : "#9fb4c7", fontSize: "0.7rem", fontWeight: 800, textAlign: "center", lineHeight: 1.2 }}>{a.label}</span>
              {a.count !== null && <span style={{ fontSize: "0.65rem", color: aba === a.id ? "#4fd1ff" : "#6b8aad", fontWeight: 700 }}>({a.count})</span>}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button type="button" onClick={carregarDados} disabled={carregando} style={{ padding: "7px 13px", borderRadius: "10px", border: "1px solid rgba(113,159,219,0.3)", background: "rgba(255,255,255,0.05)", color: "white", cursor: "pointer", fontSize: "0.82rem" }}>{carregando ? "..." : "Atualizar"}</button>
          <button type="button" onClick={sair} style={{ padding: "7px 13px", borderRadius: "10px", border: "1px solid rgba(255,107,107,0.4)", background: "rgba(255,107,107,0.1)", color: "#ff6b6b", cursor: "pointer", fontSize: "0.82rem" }}>Sair</button>
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
              { icon: "👥", label: "Clientes", valor: dados.clientes.length, cor: "#4fd1ff", bg: "rgba(79,209,255,0.08)", border: "rgba(79,209,255,0.2)", aba: "clientes" },
              { icon: "🔧", label: "Chamados", valor: dados.chamados.filter(c => c.status !== "fechado").length, cor: "#ffd166", bg: "rgba(255,209,102,0.08)", border: "rgba(255,209,102,0.2)", aba: "chamados", suffix: " abertos" },
              { icon: "✉️", label: "Mensagens", valor: dados.mensagens.length, cor: "#b89cff", bg: "rgba(184,156,255,0.08)", border: "rgba(184,156,255,0.2)", aba: "mensagens" },
              { icon: "🧪", label: "Formulações", valor: dados.formulacoes.length, cor: "#49e68b", bg: "rgba(73,230,139,0.08)", border: "rgba(73,230,139,0.2)", aba: "formulacoes" },
              { icon: "📸", label: "Galeria", valor: dados.galeria.filter(g => g.status === "pendente").length, cor: "#ff8fab", bg: "rgba(255,143,171,0.08)", border: "rgba(255,143,171,0.2)", aba: "galeria", suffix: " pendentes" },
              { icon: "💡", label: "Sugestões ELIO", valor: sugestoesElio.filter(s => s.status === "pendente").length, cor: "#ffd166", bg: "rgba(255,209,102,0.08)", border: "rgba(255,209,102,0.2)", aba: "sugestoes_elio", suffix: " pendentes" },
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
              <p style={{ fontWeight: 800, color: "#ffd166", fontSize: "0.88rem", margin: "0 0 10px" }}>⚠️ Itens que precisam da sua atenção:</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {dados.chamados.filter(c => c.status === "novo").length > 0 && (
                  <button type="button" onClick={() => setAba("chamados")}
                    style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,209,102,0.08)", border: "1px solid rgba(255,209,102,0.2)", borderRadius: "10px", padding: "10px 14px", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                    <span style={{ fontSize: "1.1rem" }}>🔧</span>
                    <span style={{ color: "#ffd166", fontWeight: 700, fontSize: "0.85rem" }}>{dados.chamados.filter(c => c.status === "novo").length} chamado(s) novo(s) aguardando atendimento</span>
                    <span style={{ marginLeft: "auto", color: "#ffd166", fontSize: "0.8rem" }}>Ver →</span>
                  </button>
                )}
                {sugestoesElio.filter(s => s.status === "pendente").length > 0 && (
                  <button type="button" onClick={() => setAba("sugestoes_elio")}
                    style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(79,209,255,0.08)", border: "1px solid rgba(79,209,255,0.2)", borderRadius: "10px", padding: "10px 14px", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                    <span style={{ fontSize: "1.1rem" }}>💡</span>
                    <span style={{ color: "#4fd1ff", fontWeight: 700, fontSize: "0.85rem" }}>{sugestoesElio.filter(s => s.status === "pendente").length} sugestão(ões) de conhecimento aguardando aprovação</span>
                    <span style={{ marginLeft: "auto", color: "#4fd1ff", fontSize: "0.8rem" }}>Ver →</span>
                  </button>
                )}
                {dados.galeria.filter(g => g.status === "pendente").length > 0 && (
                  <button type="button" onClick={() => setAba("galeria")}
                    style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,143,171,0.08)", border: "1px solid rgba(255,143,171,0.2)", borderRadius: "10px", padding: "10px 14px", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                    <span style={{ fontSize: "1.1rem" }}>📸</span>
                    <span style={{ color: "#ff8fab", fontWeight: 700, fontSize: "0.85rem" }}>{dados.galeria.filter(g => g.status === "pendente").length} foto(s) da galeria aguardando aprovação</span>
                    <span style={{ marginLeft: "auto", color: "#ff8fab", fontSize: "0.8rem" }}>Ver →</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Últimos clientes */}
          {dados.clientes.length > 0 && (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(79,209,255,0.1)", borderRadius: "14px", padding: "16px 20px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <p style={{ fontWeight: 800, color: "#4fd1ff", fontSize: "0.88rem", margin: 0 }}>👥 Últimos clientes cadastrados</p>
                <button type="button" onClick={() => setAba("clientes")}
                  style={{ fontSize: "0.75rem", color: "#4fd1ff", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>Ver todos →</button>
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
            <p style={{ margin: "0 0 12px", fontWeight: 800, color: "#b89cff", fontSize: "0.85rem" }}>📅 VISITANTES DO SITE POR PERÍODO</p>
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
                style={{ padding: "8px 16px", borderRadius: "8px", border: 0, background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: "0.8rem" }}>
                {carregandoVisitas ? "Carregando..." : "🔍 Gerar relatório"}
              </button>
            </div>

            {relatorioVisitas && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: "10px", marginBottom: "12px" }}>
                  <div style={{ background: "rgba(184,156,255,0.1)", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                    <span style={{ fontSize: "0.7rem", color: "#9fb4c7", display: "block" }}>Total de visitas</span>
                    <strong style={{ fontSize: "1.6rem", color: "#b89cff" }}>{relatorioVisitas.totalVisitas}</strong>
                  </div>
                  <div style={{ background: "rgba(79,209,255,0.1)", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                    <span style={{ fontSize: "0.7rem", color: "#9fb4c7", display: "block" }}>Visitantes únicos</span>
                    <strong style={{ fontSize: "1.6rem", color: "#4fd1ff" }}>{relatorioVisitas.visitantesUnicos}</strong>
                  </div>
                  <div style={{ background: "rgba(73,230,139,0.1)", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                    <span style={{ fontSize: "0.7rem", color: "#9fb4c7", display: "block" }}>Média por dia</span>
                    <strong style={{ fontSize: "1.6rem", color: "#49e68b" }}>
                      {relatorioVisitas.porDia.length > 0 ? (relatorioVisitas.visitantesUnicos / relatorioVisitas.porDia.length).toFixed(1) : "0"}
                    </strong>
                  </div>
                </div>

                {relatorioVisitas.porDia.length > 0 ? (
                  <div style={{ maxHeight: "220px", overflowY: "auto", display: "grid", gap: "5px" }}>
                    {relatorioVisitas.porDia.slice().reverse().map(d => (
                      <div key={d.dia} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "7px 12px" }}>
                        <span style={{ color: "#d3e4f8", fontSize: "0.82rem" }}>{new Date(d.dia + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", weekday: "short" })}</span>
                        <span style={{ background: "rgba(184,156,255,0.15)", color: "#b89cff", borderRadius: "999px", padding: "2px 10px", fontSize: "0.78rem", fontWeight: 800 }}>{d.visitantes} visitante{d.visitantes !== 1 ? "s" : ""}</span>
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
                <p style={{ margin: "0 0 10px", fontWeight: 800, color: "#49e68b", fontSize: "0.82rem" }}>
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
              { icon: "👥", label: "Clientes", valor: dados.totais.clientes || 0, cor: "#4fd1ff" },
              { icon: "🧪", label: "Formulações", valor: dados.totais.formulacoes || 0, cor: "#b89cff" },
              { icon: "📸", label: "Galeria", valor: dados.totais.gallery || 0, cor: "#49e68b" },
              { icon: "📋", label: "Parâmetros", valor: dados.totais.parametros || 0, cor: "#ffd166" },
              { icon: "🔧", label: "Chamados", valor: dados.chamados.length || 0, cor: "#ff8fab" },
              { icon: "✉️", label: "Mensagens", valor: dados.mensagens.length || 0, cor: "#8bd3ff" },
              { icon: "✅", label: "Aprovadas", valor: dados.galeria.filter(g => g.status === "aprovado").length, cor: "#49e68b" },
              { icon: "⏳", label: "Pendentes", valor: dados.galeria.filter(g => g.status === "pendente").length, cor: "#ffd166" },
            ].map((item) => (
              <div key={item.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid " + item.cor + "33", borderRadius: "12px", padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "1.3rem", marginBottom: "4px" }}>{item.icon}</div>
                <p style={{ margin: "0 0 4px", fontSize: "0.7rem", color: "#9fb4c7", fontWeight: 700, textTransform: "uppercase" }}>{item.label}</p>
                <strong style={{ fontSize: "1.7rem", color: item.cor, display: "block", lineHeight: 1 }}>{item.valor}</strong>
              </div>
            ))}
          </div>

          <div style={{ background: "rgba(79,209,255,0.06)", border: "1px solid rgba(79,209,255,0.2)", borderRadius: "14px", padding: "16px", marginBottom: "14px" }}>
            <p style={{ margin: "0 0 12px", fontWeight: 800, color: "#4fd1ff", fontSize: "0.85rem" }}>📈 INDICADORES DE CONVERSÃO</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }}>
              {[
                { label: "Formulação / Cliente", valor: dados.totais.clientes > 0 ? ((dados.totais.formulacoes / dados.totais.clientes) * 100).toFixed(1) + "%" : "0%", cor: "#49e68b", desc: "Clientes que pediram formulação" },
                { label: "Chamado / Cliente", valor: dados.totais.clientes > 0 ? ((dados.chamados.length / dados.totais.clientes) * 100).toFixed(1) + "%" : "0%", cor: "#ff8fab", desc: "Clientes com chamado técnico" },
                { label: "Aprovação galeria", valor: dados.galeria.length > 0 ? ((dados.galeria.filter(g => g.status === "aprovado").length / dados.galeria.length) * 100).toFixed(1) + "%" : "0%", cor: "#49e68b", desc: "Fotos aprovadas do total" },
                { label: "Chamados abertos", valor: dados.chamados.filter(c => c.status !== "fechado" && c.status !== "resolvido").length, cor: "#ffd166", desc: "Aguardando resolução" },
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
                    <span style={{ padding: "2px 7px", borderRadius: "999px", background: "rgba(79,209,255,0.1)", color: "#4fd1ff", fontSize: "0.7rem", fontWeight: 700 }}>{c.origem || "-"}</span>
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
                const cores = ["#4fd1ff","#b89cff","#49e68b","#ffd166","#ff8fab","#8bd3ff"];
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
                        <span style={{ background: "rgba(79,209,255,0.15)", color: "#4fd1ff", borderRadius: "999px", padding: "2px 8px", fontSize: "0.72rem", fontWeight: 800 }}>{n}x</span>
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
                      <p style={{ margin: "2px 0 0", color: "#ff8fab", fontSize: "0.72rem" }}>{c.problema || "-"} · {c.resina || "—"}</p>
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
                        <span style={{ background: "rgba(184,156,255,0.15)", color: "#b89cff", borderRadius: "999px", padding: "2px 7px", fontSize: "0.72rem", fontWeight: 800 }}>{n}x</span>
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
            <button type="button" onClick={carregarDados} style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid rgba(79,209,255,0.3)", background: "rgba(79,209,255,0.1)", color: "#4fd1ff", cursor: "pointer", fontSize: "0.82rem" }}>Filtrar</button>
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
                  <p style={{ margin: "0 0 8px", fontSize: "0.75rem", fontWeight: 900, color: "#4fd1ff", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    ⚙️ Configurações usadas pelo cliente
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "8px" }}>
                    <div style={{ background: "rgba(79,209,255,0.08)", border: "1px solid rgba(79,209,255,0.2)", borderRadius: "8px", padding: "8px 10px" }}>
                      <span style={{ fontSize: "0.7rem", color: "#9fb4c7", display: "block" }}>Resina</span>
                      <strong style={{ fontSize: "0.88rem", color: "#4fd1ff" }}>{item.resina || "Não informada"}</strong>
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
                      <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#b89cff", textTransform: "uppercase", display: "block", marginBottom: "5px" }}>
                        📣 Autorizado pra divulgar
                      </span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {item.redesSociais?.instagram && <span style={{ fontSize: "0.75rem", padding: "3px 9px", borderRadius: "999px", background: "rgba(184,156,255,0.12)", color: "#b89cff" }}>📸 {item.redesSociais.instagram}</span>}
                        {item.redesSociais?.tiktok && <span style={{ fontSize: "0.75rem", padding: "3px 9px", borderRadius: "999px", background: "rgba(184,156,255,0.12)", color: "#b89cff" }}>🎵 {item.redesSociais.tiktok}</span>}
                        {item.redesSociais?.facebook && <span style={{ fontSize: "0.75rem", padding: "3px 9px", borderRadius: "999px", background: "rgba(184,156,255,0.12)", color: "#b89cff" }}>📘 {item.redesSociais.facebook}</span>}
                        {item.redesSociais?.youtube && <span style={{ fontSize: "0.75rem", padding: "3px 9px", borderRadius: "999px", background: "rgba(184,156,255,0.12)", color: "#b89cff" }}>▶️ {item.redesSociais.youtube}</span>}
                        {!item.redesSociais?.instagram && !item.redesSociais?.tiktok && !item.redesSociais?.facebook && !item.redesSociais?.youtube && (
                          <span style={{ fontSize: "0.75rem", color: "#8ba3be" }}>Cliente autorizou mas não deixou @ — usar nome mesmo.</span>
                        )}
                      </div>
                      <button type="button" onClick={() => copiarLegenda(item)}
                        style={{ marginTop: "10px", width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid rgba(184,156,255,0.35)", background: legendaCopiadaId === item._id ? "rgba(73,230,139,0.15)" : "rgba(184,156,255,0.1)", color: legendaCopiadaId === item._id ? "#49e68b" : "#b89cff", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800 }}>
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
                  style={{ flex: 1, padding: "9px", borderRadius: "8px", border: "1px solid rgba(73,230,139,0.4)", background: "rgba(73,230,139,0.12)", color: "#49e68b", cursor: "pointer", fontSize: "0.88rem", fontWeight: 900 }}>
                  ✅ Aprovar
                </button>
                <button type="button"
                  onClick={() => atualizarGaleria(item._id, "recusar")}
                  disabled={salvandoId === item._id || item.status === "recusado"}
                  style={{ flex: 1, padding: "9px", borderRadius: "8px", border: "1px solid rgba(255,107,107,0.4)", background: "rgba(255,107,107,0.1)", color: "#ff6b6b", cursor: "pointer", fontSize: "0.88rem", fontWeight: 900 }}>
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
              💡 Veja as perguntas dos clientes e as respostas do ELIO. Edite e clique em <strong style={{ color: "#4fd1ff" }}>Aprovar</strong> para transformar em conhecimento validado. Casos marcados <strong style={{ color: "#ff8fab" }}>👎 Não ajudou</strong> pelo cliente aparecem destacados abaixo.
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
                  background: filtroConversas === f.id ? "linear-gradient(135deg,#2563eb,#7c3aed)" : "rgba(79,209,255,0.06)",
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
                    style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid rgba(255,107,107,0.3)", background: "rgba(255,107,107,0.08)", color: "#ff8fab", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700 }}>
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
                    {naoAjudou && <span style={{ fontSize: "0.72rem", padding: "2px 10px", borderRadius: "999px", background: "rgba(255,107,107,0.15)", border: "1px solid rgba(255,107,107,0.35)", color: "#ff8fab", fontWeight: 800 }}>👎 Não ajudou {c.revisadoFeedback ? "(revisado)" : ""}</span>}
                    {c.feedback === "satisfatoria" && <span style={{ fontSize: "0.72rem", padding: "2px 10px", borderRadius: "999px", background: "rgba(73,230,139,0.1)", border: "1px solid rgba(73,230,139,0.25)", color: "#49e68b", fontWeight: 700 }}>👍 Ajudou</span>}
                    {c.aprovado && <span style={{ fontSize: "0.72rem", padding: "2px 10px", borderRadius: "999px", background: "rgba(73,230,139,0.15)", border: "1px solid rgba(73,230,139,0.3)", color: "#49e68b", fontWeight: 800 }}>✅ Aprovado</span>}
                    {c.ragUsado && <span style={{ fontSize: "0.72rem", padding: "2px 10px", borderRadius: "999px", background: "rgba(184,156,255,0.12)", border: "1px solid rgba(184,156,255,0.25)", color: "#b89cff", fontWeight: 700 }}>📋 Usou RAG</span>}
                    {c.resinaDetectada && <span style={{ fontSize: "0.72rem", padding: "2px 10px", borderRadius: "999px", background: "rgba(79,209,255,0.1)", border: "1px solid rgba(79,209,255,0.2)", color: "#4fd1ff", fontWeight: 700 }}>🧪 {c.resinaDetectada}</span>}
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
                      <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#ff8fab", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>📷 Enviado pelo cliente após feedback negativo</span>
                      {c.configuracaoCliente && <p style={{ margin: 0, color: "#d3e4f8", fontSize: "0.8rem" }}>{c.configuracaoCliente}</p>}
                    </div>
                  </div>
                )}

                {/* Pergunta do cliente */}
                <div style={{ background: "rgba(79,209,255,0.06)", border: "1px solid rgba(79,209,255,0.18)", borderRadius: "10px", padding: "10px 12px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#4fd1ff", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>
                    👤 {c.clienteNome || "Cliente"} perguntou:
                  </span>
                  <p style={{ margin: 0, color: "#eaf3ff", fontSize: "0.88rem", lineHeight: 1.5 }}>{c.pergunta}</p>
                </div>

                {/* Resposta original do bot */}
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(113,159,219,0.12)", borderRadius: "10px", padding: "10px 12px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#9fb4c7", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>
                    🤖 ELIO respondeu ({c.fonte || "deepseek"}):
                  </span>
                  <p style={{ margin: 0, color: "#b8cfe8", fontSize: "0.82rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{c.resposta}</p>
                </div>

                {/* Campo de edição / melhoria */}
                <div style={{ marginBottom: "10px" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 800, color: foiEditado ? "#ffd166" : "#49e68b", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>
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
                    style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(79,209,255,0.4)", background: "rgba(79,209,255,0.1)", color: "#4fd1ff", cursor: foiEditado ? "pointer" : "not-allowed", fontSize: "0.8rem", fontWeight: 800, opacity: foiEditado ? 1 : 0.4 }}>
                    {salvandoConversa === c._id ? "Salvando..." : "💾 Salvar melhoria"}
                  </button>
                  <button type="button" onClick={() => aprovarConversa(c._id)} disabled={salvandoConversa === c._id}
                    style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(73,230,139,0.4)", background: "rgba(73,230,139,0.12)", color: "#49e68b", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800 }}>
                    {salvandoConversa === c._id ? "Salvando..." : c.aprovado ? "🔄 Atualizar aprovação" : "✅ Aprovar como conhecimento"}
                  </button>
                  {c.aprovado && (
                    <button type="button" onClick={() => desaprovarConversa(c._id)} disabled={salvandoConversa === c._id}
                      style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(255,209,102,0.35)", background: "rgba(255,209,102,0.08)", color: "#ffd166", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800 }}>
                      ↩️ Remover aprovação
                    </button>
                  )}
                  {naoAjudou && !c.revisadoFeedback && (
                    <button type="button" onClick={() => marcarFeedbackRevisado(c._id)}
                      style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(184,156,255,0.35)", background: "rgba(184,156,255,0.08)", color: "#b89cff", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800 }}>
                      👁️ Marcar como revisado
                    </button>
                  )}
                  <button type="button" onClick={() => excluirConversa(c._id)}
                    style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(255,107,107,0.3)", background: "rgba(255,107,107,0.06)", color: "#ff8fab", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800 }}>
                    🗑️ Excluir
                  </button>
                </div>
                <p style={{ margin: "8px 0 0", fontSize: "0.7rem", color: "#8ba3be", lineHeight: 1.5 }}>
                  💡 <strong>Salvar melhoria</strong> guarda seu texto editado como rascunho. <strong>Aprovar</strong> libera oficialmente para o ELIO usar em respostas futuras.
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
            <p style={{ margin: "0 0 14px", fontWeight: 800, color: "#4fd1ff", fontSize: "0.88rem" }}>➕ CADASTRAR NOVO PARÂMETRO</p>
            {msgParam && <div style={{ padding: "8px 12px", borderRadius: "8px", marginBottom: "12px", background: msgParam.startsWith("✅") ? "rgba(73,230,139,0.1)" : "rgba(255,107,107,0.1)", border: msgParam.startsWith("✅") ? "1px solid rgba(73,230,139,0.3)" : "1px solid rgba(255,107,107,0.3)", color: msgParam.startsWith("✅") ? "#49e68b" : "#ff8fab", fontSize: "0.85rem" }}>{msgParam}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
              {[
                { key: "resina", label: "Resina *", placeholder: "Ex: IRON" },
                { key: "impressora", label: "Impressora *", placeholder: "Ex: Elegoo Mars 4 Ultra" },
                { key: "alturaCamada", label: "Altura de camada", placeholder: "Ex: 0.05mm" },
                { key: "exposicaoNormal", label: "Exposição normal (s)", placeholder: "Ex: 2.1" },
                { key: "exposicaoBase", label: "Exposição base (s)", placeholder: "Ex: 35" },
                { key: "camadasBase", label: "Camadas base", placeholder: "Ex: 6" },
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
                    background: novoParam.confianca === "oficial" ? "rgba(73,230,139,0.18)" : "rgba(73,230,139,0.05)", color: "#49e68b" }}>
                  ✅ Testado pela Quanton3D
                </button>
                <button type="button" onClick={() => setNovoParam(p => ({ ...p, confianca: "estimado" }))}
                  style={{ flex: 1, padding: "9px", borderRadius: "9px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.8rem", fontWeight: 800, border: "1px solid rgba(255,209,102,0.3)",
                    background: novoParam.confianca === "estimado" ? "rgba(255,209,102,0.18)" : "rgba(255,209,102,0.05)", color: "#ffd166" }}>
                  ⚠️ Estimativa inicial
                </button>
              </div>
              <span style={{ fontSize: "0.72rem", color: "#8ba3be", marginTop: "4px", display: "block" }}>
                "Testado" = validado em impressão real pela equipe. "Estimativa" = baseado em resina/impressora parecida, ainda não confirmado.
              </span>
            </div>

            <button type="button" onClick={salvarParametro} disabled={salvandoParam}
              style={{ width: "100%", padding: "11px", borderRadius: "10px", border: 0, background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "#fff", fontWeight: 900, cursor: "pointer", fontFamily: "inherit", fontSize: "0.9rem" }}>
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
                <div key={p._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(113,159,219,0.15)", borderRadius: "10px", padding: "10px 12px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px", flexWrap: "wrap" }}>
                      <strong style={{ color: "#4fd1ff", fontSize: "0.88rem" }}>{p.resina}</strong>
                      <span style={{ color: "#9fb4c7", fontSize: "0.82rem" }}>+</span>
                      <span style={{ color: "#eaf3ff", fontSize: "0.85rem" }}>{p.impressora}</span>
                      <span style={{ fontSize: "0.68rem", padding: "1px 8px", borderRadius: "999px", fontWeight: 800,
                        background: p.confianca === "estimado" ? "rgba(255,209,102,0.12)" : "rgba(73,230,139,0.12)",
                        color: p.confianca === "estimado" ? "#ffd166" : "#49e68b",
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
                  <button type="button" onClick={() => deletarParametro(p._id)}
                    style={{ padding: "5px 10px", borderRadius: "8px", border: "1px solid rgba(255,107,107,0.3)", background: "rgba(255,107,107,0.08)", color: "#ff8fab", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700, flexShrink: 0 }}>
                    Excluir
                  </button>
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
            const cores = { instagram:"#e1306c", site:"#4fd1ff", whatsapp:"#25d366", outros:"#9fb4c7", facebook:"#1877f2", youtube:"#ff0000" };
            return (
              <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", marginBottom:"14px" }}>
                {tops.map(([orig, qtd]) => (
                  <div key={orig} onClick={() => setFiltroOrigem(filtroOrigem === orig ? "" : orig)}
                    style={{ padding:"6px 12px", borderRadius:"999px", cursor:"pointer", fontSize:"0.75rem", fontWeight:800,
                      background: filtroOrigem === orig ? (cores[orig.toLowerCase()] || "#b89cff") + "33" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${filtroOrigem === orig ? (cores[orig.toLowerCase()] || "#b89cff") : "rgba(113,159,219,0.2)"}`,
                      color: filtroOrigem === orig ? (cores[orig.toLowerCase()] || "#b89cff") : "#9fb4c7" }}>
                    {orig} <span style={{ opacity:0.7 }}>({qtd})</span>
                  </div>
                ))}
                {filtroOrigem && <button type="button" onClick={() => setFiltroOrigem("")}
                  style={{ padding:"6px 10px", borderRadius:"999px", border:"1px solid rgba(255,107,107,0.3)", background:"rgba(255,107,107,0.08)", color:"#ff8fab", cursor:"pointer", fontSize:"0.73rem", fontWeight:800 }}>✕ limpar</button>}
              </div>
            );
          })()}

          {/* ── AVISO LIMITE ── */}
          {dados.clientes.length > 0 && dados.totais?.clientes > dados.clientes.length && (
            <div style={{ marginBottom:"12px", padding:"8px 14px", borderRadius:"8px", background:"rgba(255,209,102,0.07)", border:"1px solid rgba(255,209,102,0.25)", fontSize:"0.78rem", color:"#ffd166" }}>
              ⚠️ Exibindo os <strong>{dados.clientes.length}</strong> mais recentes. Total no banco: <strong>{dados.totais.clientes}</strong>.
            </div>
          )}

          {/* ── TOOLBAR: busca + selecionar + excluir ── */}
          <div style={{ display:"flex", gap:"8px", marginBottom:"12px", flexWrap:"wrap", alignItems:"center" }}>
            <input value={buscaCliente} onChange={e => setBuscaCliente(e.target.value)}
              placeholder="🔍 Buscar por nome, telefone, email ou CPF/CNPJ..."
              style={{ flex:1, minWidth:"200px", padding:"8px 12px", borderRadius:"8px", border:"1px solid rgba(113,159,219,0.3)", background:"rgba(255,255,255,0.05)", color:"#eaf3ff", fontSize:"0.82rem", fontFamily:"inherit" }} />
            {buscaCliente && <button type="button" onClick={() => setBuscaCliente("")}
              style={{ padding:"7px 10px", borderRadius:"8px", border:"1px solid rgba(255,107,107,0.3)", background:"rgba(255,107,107,0.08)", color:"#ff8fab", cursor:"pointer", fontSize:"0.78rem" }}>✕</button>}
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
                    {clientesSelecionados.length > 0 && <span style={{ fontSize:"0.78rem", color:"#ff8fab", fontWeight:700 }}>{clientesSelecionados.length} selecionado(s)</span>}
                    {suspeitos > 0 && <span style={{ fontSize:"0.72rem", color:"#ffd166" }}>⚠️ {suspeitos} possível(is) teste</span>}
                  </div>
                  <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                    {suspeitos > 0 && clientesSelecionados.length === 0 && (
                      <button type="button"
                        onClick={() => setClientesSelecionados(filtrados.filter(c => /^(.)\1{2,}$/.test(c.nome?.replace(/\s/g,"")||"") || (c.nome||"").length < 3 || /^(kk|ll|xx|zz|qq|asd|qwe|teste|test)/i.test(c.nome||"")).map(c => c._id))}
                        style={{ padding:"6px 12px", borderRadius:"8px", border:"1px solid rgba(255,209,102,0.35)", background:"rgba(255,209,102,0.08)", color:"#ffd166", cursor:"pointer", fontSize:"0.75rem", fontWeight:800 }}>
                        ⚠️ Selecionar suspeitos
                      </button>
                    )}
                    {clientesSelecionados.length > 0 && (
                      <button type="button" onClick={excluirClientesSelecionados} disabled={excluindoClientes}
                        style={{ padding:"6px 14px", borderRadius:"8px", border:"1px solid rgba(255,107,107,0.4)", background:"rgba(255,107,107,0.12)", color:"#ff8fab", cursor:"pointer", fontSize:"0.78rem", fontWeight:800 }}>
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
                  const corOrigem = { instagram:"#e1306c", site:"#4fd1ff", whatsapp:"#25d366", facebook:"#1877f2", youtube:"#ff0000" };
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
                            {suspeito && <span style={{ fontSize:"0.62rem", padding:"1px 5px", borderRadius:"999px", background:"rgba(255,209,102,0.15)", color:"#ffd166", fontWeight:800, flexShrink:0 }}>⚠️ teste</span>}
                            {c.origem && <span style={{ fontSize:"0.62rem", padding:"1px 6px", borderRadius:"999px", background: origCor+"22", color: origCor, fontWeight:700, flexShrink:0, border:`1px solid ${origCor}44` }}>{c.origem}</span>}
                            {c.cpfCnpj && <span style={{ fontSize:"0.62rem", padding:"1px 6px", borderRadius:"999px", background:"rgba(73,230,139,0.12)", color:"#49e68b", fontWeight:700, flexShrink:0, border:"1px solid rgba(73,230,139,0.25)" }}>{c.tipoPessoa === "pj" ? "🏢 CNPJ" : "👤 CPF"} ✓</span>}
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
                                <div style={{ fontSize:"0.65rem", color:"#49e68b", marginBottom:"2px", fontWeight:800 }}>{c.tipoPessoa === "pj" ? "🏢 CNPJ" : "👤 CPF"}</div>
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
                              <div style={{ fontSize:"0.65rem", color:"#b89cff", marginBottom:"3px", fontWeight:800 }}>💬 OBSERVAÇÃO</div>
                              <div style={{ fontSize:"0.82rem", color:"#d3e4f8", lineHeight:1.5 }}>{c.observacao}</div>
                            </div>
                          )}
                          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                            <button type="button" onClick={() => copiarContato(c)}
                              style={{ padding:"6px 14px", borderRadius:"8px", border:"1px solid rgba(79,209,255,0.3)", background: contatoCopiado===c._id ? "rgba(73,230,139,0.12)" : "rgba(79,209,255,0.08)", color: contatoCopiado===c._id ? "#49e68b" : "#4fd1ff", cursor:"pointer", fontSize:"0.78rem", fontWeight:800 }}>
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
                            <button type="button" onClick={async () => {
                              if (!window.confirm(`Excluir o cliente "${c.nome}"? Essa ação não pode ser desfeita.`)) return;
                              try {
                                await api.delete("/clientes/" + c._id, { headers: { Authorization: "Bearer " + token } });
                                setDados(prev => ({ ...prev, clientes: prev.clientes.filter(x => x._id !== c._id) }));
                              } catch(e) { alert("Erro ao excluir cliente."); }
                            }}
                              style={{ padding:"6px 14px", borderRadius:"8px", border:"1px solid rgba(255,107,107,0.3)", background:"rgba(255,107,107,0.08)", color:"#ff8fab", cursor:"pointer", fontSize:"0.78rem", fontWeight:800, fontFamily:"inherit" }}>
                              🗑️ Excluir
                            </button>
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
                    color: f.status === "resolvido" ? "#49e68b" : f.status === "em_contato" ? "#4fd1ff" : f.status === "impossivel" ? "#ff8fab" : "#ffd166",
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
                  <strong style={{ fontSize: "0.85rem", color: "#b89cff" }}>{f.caracteristica || "Não informado"}</strong>
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
                  style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(79,209,255,0.35)", background: "rgba(79,209,255,0.1)", color: "#4fd1ff", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800, opacity: f.status === "em_contato" ? 0.4 : 1 }}>
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
                  style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(73,230,139,0.35)", background: "rgba(73,230,139,0.1)", color: "#49e68b", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800, opacity: f.status === "resolvido" ? 0.4 : 1 }}>
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
                  style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(255,107,107,0.35)", background: "rgba(255,107,107,0.08)", color: "#ff8fab", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800, opacity: f.status === "impossivel" ? 0.4 : 1 }}>
                  ❌ Não é possível
                </button>
                <button type="button"
                  onClick={async () => {
                    try {
                      await api.patch("/formulacoes/" + f._id + "/status", { status: "pendente" }, { headers: { Authorization: "Bearer " + token } });
                      await carregarDados();
                    } catch(e) { alert("Erro ao atualizar"); }
                  }}
                  style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(255,209,102,0.25)", background: "rgba(255,209,102,0.06)", color: "#ffd166", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800 }}>
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
                      <strong style={{ fontSize: "0.82rem", color: "#4fd1ff" }}>{c.resina || "Não informada"}</strong>
                    </div>
                    <div style={{ background: "rgba(79,209,255,0.06)", border: "1px solid rgba(79,209,255,0.15)", borderRadius: "8px", padding: "7px 10px" }}>
                      <span style={{ fontSize: "0.68rem", color: "#9fb4c7", display: "block" }}>Impressora</span>
                      <strong style={{ fontSize: "0.82rem", color: "#eaf3ff" }}>{c.impressora || "Não informada"}</strong>
                    </div>
                  </div>

                  {/* Problema */}
                  <div style={{ background: "rgba(255,107,107,0.07)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: "8px", padding: "8px 10px", marginBottom: "8px" }}>
                    <strong style={{ fontSize: "0.78rem", color: "#ff6b6b" }}>⚠️ Problema: </strong>
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
                  style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(255,209,102,0.35)", background: "rgba(255,209,102,0.1)", color: "#ffd166", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800, opacity: c.status === "em_analise" ? 0.4 : 1 }}>
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
                  style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(79,209,255,0.35)", background: "rgba(79,209,255,0.1)", color: "#4fd1ff", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800, opacity: c.status === "respondido" ? 0.4 : 1 }}>
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
                  style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(73,230,139,0.35)", background: "rgba(73,230,139,0.1)", color: "#49e68b", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800, opacity: c.status === "fechado" ? 0.4 : 1 }}>
                  ✅ Resolvido
                </button>
                <button type="button"
                  onClick={async () => {
                    try {
                      await api.patch("/bot-tickets/" + c._id + "/status", { status: "novo" }, { headers: { Authorization: "Bearer " + token } });
                      await carregarDados();
                    } catch(e) { alert("Erro ao atualizar"); }
                  }}
                  style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(255,107,107,0.25)", background: "rgba(255,107,107,0.06)", color: "#ff8fab", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800 }}>
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
                  <strong style={{ fontSize: "0.85rem", color: "#b89cff" }}>{p.tipo || "-"}</strong>
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
                  style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(73,230,139,0.4)", background: "rgba(73,230,139,0.12)", color: "#49e68b", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800, opacity: p.status === "aprovado" ? 0.4 : 1 }}>
                  ✅ Aprovar
                </button>
                <button type="button" onClick={() => atualizarStatusParceiro(p._id, "rejeitado")} disabled={p.status === "rejeitado"}
                  style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(255,107,107,0.35)", background: "rgba(255,107,107,0.08)", color: "#ff8fab", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800, opacity: p.status === "rejeitado" ? 0.4 : 1 }}>
                  ❌ Rejeitar
                </button>
                <button type="button" onClick={() => atualizarStatusParceiro(p._id, "pendente")}
                  style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(255,209,102,0.25)", background: "rgba(255,209,102,0.06)", color: "#ffd166", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800 }}>
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
                  style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(79,209,255,0.35)", background: "rgba(79,209,255,0.08)", color: "#4fd1ff", cursor: "pointer", fontSize: "0.78rem", fontWeight: 800, opacity: m.status === "em_contato" ? 0.4 : 1 }}>
                  📞 Em contato
                </button>
                <button type="button" onClick={() => atualizarStatusMensagem(m._id, "resolvido")} disabled={m.status === "resolvido"}
                  style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(73,230,139,0.4)", background: "rgba(73,230,139,0.08)", color: "#49e68b", cursor: "pointer", fontSize: "0.78rem", fontWeight: 800, opacity: m.status === "resolvido" ? 0.4 : 1 }}>
                  ✅ Resolvido
                </button>
                <button type="button" onClick={() => atualizarStatusMensagem(m._id, "pendente")}
                  style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(255,209,102,0.3)", background: "rgba(255,209,102,0.06)", color: "#ffd166", cursor: "pointer", fontSize: "0.78rem", fontWeight: 800 }}>
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
            <p style={{ fontWeight: 900, color: "#4fd1ff", marginBottom: "14px", fontSize: "0.9rem" }}>➕ Novo Atendente</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
              <input value={novoAt.nome} onChange={e => setNovoAt(p => ({...p, nome: e.target.value}))} placeholder="Nome completo" autoComplete="off" name="at-nome" style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid rgba(113,159,219,0.3)", background: "rgba(4,10,24,0.9)", color: "#eaf3ff", WebkitTextFillColor: "#eaf3ff", caretColor: "#eaf3ff", fontFamily: "inherit", fontSize: "0.85rem", boxShadow: "0 0 0 9999px rgba(4,10,24,0.9) inset" }} />
              <input value={novoAt.email} onChange={e => setNovoAt(p => ({...p, email: e.target.value}))} placeholder="Email do atendente" type="text" autoComplete="off" name="at-email" style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid rgba(113,159,219,0.3)", background: "rgba(4,10,24,0.9)", color: "#eaf3ff", WebkitTextFillColor: "#eaf3ff", caretColor: "#eaf3ff", fontFamily: "inherit", fontSize: "0.85rem", boxShadow: "0 0 0 9999px rgba(4,10,24,0.9) inset" }} />
              <input value={novoAt.senha} onChange={e => setNovoAt(p => ({...p, senha: e.target.value}))} placeholder="Senha (mín. 6 caracteres)" type="password" autoComplete="new-password" name="at-senha" style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid rgba(113,159,219,0.3)", background: "rgba(4,10,24,0.9)", color: "#eaf3ff", WebkitTextFillColor: "#eaf3ff", caretColor: "#eaf3ff", fontFamily: "inherit", fontSize: "0.85rem", boxShadow: "0 0 0 9999px rgba(4,10,24,0.9) inset" }} />
            </div>
            <p style={{ fontWeight: 800, color: "#b89cff", fontSize: "0.82rem", margin: "0 0 10px" }}>🔐 Permissões:</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
              {[
                { key: "acessoAdmCompleto", label: "🔓 Acesso ADM completo (superadmin)" },
                { key: "mudarStatusChamados", label: "🔧 Mudar status de chamados" },
                { key: "sugerirConhecimento", label: "💡 Sugerir conhecimento (ELIO)" },
                { key: "aprovarGaleria", label: "📸 Aprovar fotos da galeria" },
                { key: "acessarMetricas", label: "📊 Ver métricas" },
              ].map(p => (
                <label key={p.key} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.82rem", color: "#c5d8e8" }}>
                  <input type="checkbox" checked={!!novoAt.permissoes[p.key]}
                    onChange={e => setNovoAt(prev => ({ ...prev, permissoes: { ...prev.permissoes, [p.key]: e.target.checked } }))}
                    style={{ width: "18px", height: "18px", accentColor: "#4fd1ff", cursor: "pointer" }} />
                  {p.label}
                </label>
              ))}
            </div>
            <button type="button" onClick={criarAtendente} disabled={criandoAt} style={{ padding: "9px 20px", borderRadius: "999px", border: "none", background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: "0.85rem", fontFamily: "inherit" }}>
              {criandoAt ? "Criando..." : "✅ Criar Atendente"}
            </button>
            <p style={{ marginTop: "8px", fontSize: "0.72rem", color: "#9fb4c7" }}>💡 Código gerado automaticamente (AT001, AT002...). Login via email e senha.</p>
          </div>
          {atendentes.length === 0 && <div className="gallery-empty">Nenhum atendente cadastrado ainda.</div>}
          {atendentes.map(at => {
            const perms = at.permissoes || {};
            const isExpanded = editandoPerms === at._id;
            const PERM_LABELS = [
              { key: "acessoAdmCompleto", label: "🔓 ADM completo", cor: "#ffd166" },
              { key: "mudarStatusChamados", label: "🔧 Chamados", cor: "#4fd1ff" },
              { key: "sugerirConhecimento", label: "💡 Sugestões", cor: "#b89cff" },
              { key: "aprovarGaleria", label: "📸 Galeria", cor: "#49e68b" },
              { key: "acessarMetricas", label: "📊 Métricas", cor: "#ff8fab" },
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
                    <span style={{ background: at.ativo ? "rgba(73,230,139,0.15)" : "rgba(255,107,107,0.15)", color: at.ativo ? "#49e68b" : "#ff8fab", padding: "2px 10px", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 800 }}>{at.codigo}</span>
                    <strong>{at.nome}</strong>
                    {!at.ativo && <span style={{ color: "#ff8fab", fontSize: "0.72rem" }}>⛔ DESATIVADO</span>}
                    {perms.acessoAdmCompleto && <span style={{ background: "rgba(255,209,102,0.15)", color: "#ffd166", padding: "2px 8px", borderRadius: "999px", fontSize: "0.65rem", fontWeight: 800 }}>ADMIN</span>}
                    {at.ultimoAcesso && (new Date() - new Date(at.ultimoAcesso)) < 8 * 60 * 60 * 1000 && (
                      <span style={{ background: "rgba(73,230,139,0.15)", color: "#49e68b", padding: "2px 8px", borderRadius: "999px", fontSize: "0.62rem", fontWeight: 800 }}>🟢 online</span>
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
                    style={{ padding: "6px 14px", borderRadius: "999px", border: "1px solid rgba(79,209,255,0.35)", background: sessoesAberta === at._id ? "rgba(79,209,255,0.2)" : "rgba(79,209,255,0.07)", color: "#4fd1ff", cursor: "pointer", fontSize: "0.78rem", fontWeight: 800, fontFamily: "inherit" }}>
                    🖥️ Sessões
                  </button>
                  <button type="button" onClick={() => setEditandoPerms(isExpanded ? null : at._id)}
                    style={{ padding: "6px 14px", borderRadius: "999px", border: "1px solid rgba(184,156,255,0.4)", background: isExpanded ? "rgba(184,156,255,0.2)" : "rgba(184,156,255,0.08)", color: "#b89cff", cursor: "pointer", fontSize: "0.78rem", fontWeight: 800, fontFamily: "inherit" }}>
                    🔐 Permissões
                  </button>
                  <button type="button" onClick={() => toggleAtendente(at._id, !at.ativo)}
                    style={{ padding: "6px 14px", borderRadius: "999px", border: at.ativo ? "1px solid rgba(255,107,107,0.4)" : "1px solid rgba(73,230,139,0.4)", background: at.ativo ? "rgba(255,107,107,0.1)" : "rgba(73,230,139,0.1)", color: at.ativo ? "#ff8fab" : "#49e68b", cursor: "pointer", fontSize: "0.78rem", fontWeight: 800, fontFamily: "inherit" }}>
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
                    <p style={{ fontWeight: 800, color: "#4fd1ff", fontSize: "0.82rem", margin: "0 0 12px" }}>
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
                              ? <span style={{ background: "rgba(73,230,139,0.15)", color: "#49e68b", padding: "2px 10px", borderRadius: "999px", fontSize: "0.68rem", fontWeight: 800 }}>🟢 ATIVA</span>
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
                  <p style={{ fontWeight: 800, color: "#b89cff", fontSize: "0.82rem", margin: "0 0 10px" }}>🔐 Permissões de {at.nome}:</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {PERM_LABELS.map(p => (
                      <label key={p.key} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.82rem", color: "#c5d8e8" }}>
                        <input type="checkbox" checked={!!perms[p.key]}
                          onChange={e => salvarPerms({ ...perms, [p.key]: e.target.checked })}
                          style={{ width: "18px", height: "18px", accentColor: "#4fd1ff", cursor: "pointer" }} />
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
            <p style={{ fontWeight: 900, color: "#4fd1ff", fontSize: "0.9rem" }}>📋 Histórico de Ações ({logs.length})</p>
            <button type="button" onClick={carregarLogs} style={{ padding: "6px 14px", borderRadius: "999px", border: "1px solid rgba(79,209,255,0.3)", background: "rgba(79,209,255,0.08)", color: "#4fd1ff", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700, fontFamily: "inherit" }}>🔄 Atualizar</button>
          </div>
          {logs.length === 0 && <div className="gallery-empty">Nenhuma ação registrada ainda.</div>}
          {logs.map(log => (
            <div key={log._id} style={{ border: `1px solid ${log.bloqueada ? "rgba(255,107,107,0.3)" : "rgba(113,159,219,0.15)"}`, borderRadius: "10px", padding: "10px 14px", background: log.bloqueada ? "rgba(255,107,107,0.06)" : "rgba(255,255,255,0.03)", marginBottom: "8px", color: "#eaf3ff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "6px", marginBottom: "4px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {log.bloqueada && <span style={{ background: "rgba(255,107,107,0.2)", color: "#ff8fab", padding: "1px 8px", borderRadius: "999px", fontSize: "0.65rem", fontWeight: 800 }}>⛔ BLOQUEADA</span>}
                  <span style={{ background: log.tipo === "superadmin" ? "rgba(255,209,102,0.15)" : "rgba(79,209,255,0.1)", color: log.tipo === "superadmin" ? "#ffd166" : "#4fd1ff", padding: "1px 8px", borderRadius: "999px", fontSize: "0.68rem", fontWeight: 800 }}>{log.atendenteCod}</span>
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
          <p style={{ fontWeight: 900, color: "#4fd1ff", fontSize: "0.9rem", marginBottom: "14px" }}>💡 Sugestões de Conhecimento para o ELIO ({sugestoesElio.length})</p>
          {sugestoesElio.length === 0 && <div className="gallery-empty">Nenhuma sugestão enviada pelos atendentes.</div>}
          {sugestoesElio.map(s => {
            const cores = { pendente: "#ffd166", aprovado: "#49e68b", rejeitado: "#ff8fab" };
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
                      style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(73,230,139,0.4)", background: "rgba(73,230,139,0.1)", color: "#49e68b", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800, fontFamily: "inherit" }}>
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
                      style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(255,107,107,0.4)", background: "rgba(255,107,107,0.1)", color: "#ff8fab", cursor: "pointer", fontSize: "0.8rem", fontWeight: 800, fontFamily: "inherit" }}>
                      ❌ Rejeitar
                    </button>
                  </div>
                )}
                {s.observacaoAdmin && <p style={{ fontSize: "0.75rem", color: "#ffd166", margin: "8px 0 0", fontStyle: "italic" }}>Obs: {s.observacaoAdmin}</p>}
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
    { id: "conversas",       label: "💬 Conversas ELIO",    desc: "Histórico de conversas com o bot" },
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
        <p style={{ fontWeight: 900, color: "#ff8fab", fontSize: "0.9rem", margin: "0 0 6px" }}>⚠️ Limpeza de Dados</p>
        <p style={{ fontSize: "0.82rem", color: "#c49aab", margin: 0 }}>Selecione as coleções que deseja limpar. <strong style={{ color: "#ff8fab" }}>Esta ação é irreversível!</strong> Os parâmetros do ELIO, atendentes e sugestões aprovadas nunca são afetados.</p>
      </div>

      {resultado && (
        <div style={{ background: "rgba(73,230,139,0.07)", border: "1px solid rgba(73,230,139,0.25)", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px" }}>
          <p style={{ fontWeight: 800, color: "#49e68b", margin: "0 0 8px" }}>✅ Limpeza concluída!</p>
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
            <input type="checkbox" checked={selecionadas.includes(c.id)} onChange={() => {}} style={{ accentColor: "#ff8fab", width: "16px", height: "16px" }} />
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#eaf3ff" }}>{c.label}</div>
              <div style={{ fontSize: "0.72rem", color: "#9fb4c7" }}>{c.desc}</div>
            </div>
          </label>
        ))}
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button type="button" onClick={() => setSelecionadas(COLECOES.map(c => c.id))}
          style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid rgba(255,107,107,0.3)", background: "rgba(255,107,107,0.08)", color: "#ff8fab", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, fontFamily: "inherit" }}>
          Selecionar tudo
        </button>
        <button type="button" onClick={() => setSelecionadas([])}
          style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid rgba(113,159,219,0.25)", background: "rgba(255,255,255,0.04)", color: "#9fb4c7", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, fontFamily: "inherit" }}>
          Limpar seleção
        </button>
      </div>

      {selecionadas.length > 0 && !confirmando && (
        <button type="button" onClick={() => setConfirmando(true)}
          style={{ marginTop: "14px", width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,107,107,0.4)", background: "rgba(255,107,107,0.12)", color: "#ff8fab", fontWeight: 900, cursor: "pointer", fontSize: "0.9rem", fontFamily: "inherit" }}>
          🗑️ Limpar {selecionadas.length} coleção(ões) selecionada(s)
        </button>
      )}

      {confirmando && (
        <div style={{ marginTop: "14px", padding: "16px", borderRadius: "12px", border: "2px solid rgba(255,107,107,0.4)", background: "rgba(255,107,107,0.06)" }}>
          <p style={{ color: "#ff8fab", fontWeight: 800, margin: "0 0 10px", fontSize: "0.9rem" }}>⚠️ Confirmação final — esta ação NÃO pode ser desfeita!</p>
          <p style={{ color: "#c49aab", fontSize: "0.82rem", margin: "0 0 12px" }}>Digite <strong style={{ color: "#ff8fab" }}>LIMPAR</strong> para confirmar:</p>
          <input value={confirmInput} onChange={e => setConfirmInput(e.target.value)}
            placeholder='Digite: LIMPAR'
            style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255,107,107,0.3)", background: "rgba(0,0,0,0.3)", color: "#eaf3ff", fontFamily: "inherit", fontSize: "0.9rem", marginBottom: "10px", boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" onClick={executarLimpeza} disabled={limpando || confirmInput !== "LIMPAR"}
              style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: confirmInput === "LIMPAR" ? "#dc2626" : "rgba(255,107,107,0.2)", color: "#fff", fontWeight: 900, cursor: confirmInput === "LIMPAR" ? "pointer" : "not-allowed", fontFamily: "inherit", fontSize: "0.88rem" }}>
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

function BotContent({ cliente }) {
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
    const boasVindas = `Olá ${cliente?.nome || ""}! 👋 Sou o **ELIO**, assistente técnico da Quanton3D.${ctxTexto ? `

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
        <p style={{ margin: "0 0 4px", fontWeight: 800, color: "#4fd1ff", fontSize: "0.85rem" }}>🤖 ELIO — Assistente Técnico Quanton3D</p>
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
        Iniciar atendimento com o ELIO →
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
          <button type="button" onClick={() => setEtapa("contexto")} style={{ marginLeft: "auto", color: "#4fd1ff", background: "none", border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700 }}>Alterar</button>
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
                  style={{ padding: "3px 10px", borderRadius: "999px", border: "1px solid rgba(73,230,139,0.3)", background: "rgba(73,230,139,0.08)", color: "#49e68b", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700 }}>
                  👍 Sim
                </button>
                <button type="button" onClick={() => enviarFeedback(m.conversaId, i, false)}
                  style={{ padding: "3px 10px", borderRadius: "999px", border: "1px solid rgba(255,107,107,0.3)", background: "rgba(255,107,107,0.06)", color: "#ff8fab", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700 }}>
                  👎 Não
                </button>
              </div>
            )}

            {/* Form de feedback negativo — configurações estilo Chitubox + foto + envio */}
            {m.isBot && feedbackAberto === i && (
              <div style={{ marginTop: "8px", padding: "12px", borderRadius: "10px", background: "rgba(255,107,107,0.06)", border: "1px solid rgba(255,107,107,0.2)", width: "100%", maxWidth: "360px" }}>
                <p style={{ margin: "0 0 10px", fontSize: "0.78rem", color: "#ff8fab", fontWeight: 700 }}>
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
                  <span style={{ fontSize: "0.75rem", color: fotoFeedback ? "#49e68b" : "#9fb4c7" }}>
                    {fotoFeedback ? "✅ " + fotoFeedback.name : "📷 Anexar foto (opcional)"}
                  </span>
                </label>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button type="button" onClick={() => confirmarFeedbackNegativo(m.conversaId, i)} disabled={enviandoFeedback}
                    style={{ flex: 1, padding: "8px", borderRadius: "8px", border: 0, background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "#fff", fontWeight: 800, fontSize: "0.78rem", cursor: "pointer" }}>
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
              <span style={{ marginTop: "6px", fontSize: "0.72rem", color: m.feedbackEnviado === "satisfatoria" ? "#49e68b" : "#ffd166" }}>
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


function PainelAtendente({ atendente, onClose }) {
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
          <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 900, background: "linear-gradient(135deg,#4fd1ff,#b89cff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            📋 Painel do Atendente
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#9fb4c7" }}>
            👨‍💼 {atendente.codigo} — {atendente.nome}
          </p>
        </div>
        <button type="button" onClick={onClose}
          style={{ padding: "8px 16px", borderRadius: "999px", border: "1px solid rgba(255,107,107,0.4)", background: "rgba(255,107,107,0.1)", color: "#ff8fab", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
          Fechar
        </button>
      </div>

      {/* Abas */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        {ABAS.map(a => (
          <button key={a.id} type="button" onClick={() => setAba(a.id)}
            style={{ padding: "10px 18px", borderRadius: "999px", border: aba === a.id ? "2px solid #4fd1ff" : "1px solid rgba(113,159,219,0.3)", background: aba === a.id ? "rgba(79,209,255,0.15)" : "rgba(255,255,255,0.04)", color: aba === a.id ? "#4fd1ff" : "#9fb4c7", cursor: "pointer", fontWeight: 800, fontFamily: "inherit", fontSize: "0.82rem" }}>
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
              const statusCores = { novo: { bg: "rgba(255,209,102,0.12)", border: "rgba(255,209,102,0.35)", color: "#ffd166", label: "Novo" }, em_analise: { bg: "rgba(79,209,255,0.12)", border: "rgba(79,209,255,0.35)", color: "#4fd1ff", label: "Em análise" }, respondido: { bg: "rgba(184,156,255,0.12)", border: "rgba(184,156,255,0.35)", color: "#b89cff", label: "Respondido" }, fechado: { bg: "rgba(73,230,139,0.12)", border: "rgba(73,230,139,0.35)", color: "#49e68b", label: "Resolvido" }, encaminhado: { bg: "rgba(255,107,107,0.12)", border: "rgba(255,107,107,0.35)", color: "#ff8fab", label: "Encaminhado" } };
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
                {c.resina && <div style={{ fontSize: "0.78rem", color: "#4fd1ff", marginBottom: "4px" }}>🧪 {c.resina} {c.impressora ? "· 🖨️ " + c.impressora : ""}</div>}
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
                    style={{ padding: "6px 14px", borderRadius: "999px", border: "1px solid rgba(255,209,102,0.35)", background: "rgba(255,209,102,0.1)", color: "#ffd166", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", opacity: c.status === "em_analise" ? 0.4 : 1 }}>
                    🔍 Em análise
                  </button>
                  <button type="button" onClick={() => mudarStatus("fechado")} disabled={c.status === "fechado"}
                    style={{ padding: "6px 14px", borderRadius: "999px", border: "1px solid rgba(73,230,139,0.35)", background: "rgba(73,230,139,0.1)", color: "#49e68b", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", opacity: c.status === "fechado" ? 0.4 : 1 }}>
                    ✅ Resolvido
                  </button>
                  </>}
                  {atendente.permissoes?.mudarStatusChamados !== false && c.status === "fechado" && (
                    <button type="button" onClick={() => mudarStatus("novo")}
                      style={{ padding: "6px 14px", borderRadius: "999px", border: "1px solid rgba(255,107,107,0.25)", background: "rgba(255,107,107,0.06)", color: "#ff8fab", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
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
                  <span style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: "999px", background: m.status === "resolvido" ? "rgba(73,230,139,0.15)" : "rgba(255,209,102,0.15)", color: m.status === "resolvido" ? "#49e68b" : "#ffd166" }}>{m.status || "pendente"}</span>
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
              <p style={{ margin: "0 0 12px", fontWeight: 800, color: "#4fd1ff", fontSize: "0.85rem" }}>💡 Sugerir conhecimento pro ELIO</p>
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
                <textarea rows={4} placeholder="Conteúdo detalhado que o ELIO deveria saber..." value={formSugestao.conteudo}
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
              const cores = { pendente: "#ffd166", aprovado: "#49e68b", rejeitado: "#ff8fab" };
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
                  {s.observacaoAdmin && <p style={{ fontSize: "0.75rem", color: "#ffd166", margin: "8px 0 0", fontStyle: "italic" }}>Admin: {s.observacaoAdmin}</p>}
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

export default App;
