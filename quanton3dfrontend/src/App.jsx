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
import AdminContent from "./components/AdminContent";
import LimpezaContent from "./components/LimpezaContent";
import QualidadeContent from "./components/QualidadeContent";
import BotContent from "./components/BotContent";
import GaleriaContent from "./components/GaleriaContent";
import ChamadoTecnicoContent from "./components/ChamadoTecnicoContent";
import PainelAtendente from "./components/PainelAtendente";

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

      {/* ── GRADE 2x2: Fotos | Catálogo / Comunidade | Ferramentas ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "10px" }}>

        {/* FOTOS E PEÇAS */}
        <section className="panel" style={{ padding: "16px" }}>
          <button type="button" onClick={() => alternarSecao("colaboracao")}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(79,209,255,0.25)", background: "rgba(79,209,255,0.06)", cursor: "pointer", fontFamily: "inherit" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.1em", color: "#4fd1ff", textTransform: "uppercase" }}>📸 Fotos e Peças</span>
            <span style={{ color: "#4fd1ff", fontSize: "0.9rem", transform: secoesAbertas.colaboracao ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
          </button>
          {secoesAbertas.colaboracao && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
              <button type="button" onClick={() => setActiveModal("galeria")}
                style={{ width: "100%", padding: "9px 12px", borderRadius: "9px", border: "1px solid rgba(79,209,255,0.22)", background: "rgba(79,209,255,0.07)", color: "#eaf7ff", fontWeight: 700, cursor: "pointer", fontSize: "0.8rem", fontFamily: "inherit", textAlign: "left" }}>
                📷 Compartilhar minha peça
              </button>
              <button type="button" onClick={() => setActiveModal("galeriaPublica")}
                style={{ width: "100%", padding: "9px 12px", borderRadius: "9px", border: "1px solid rgba(79,209,255,0.22)", background: "rgba(79,209,255,0.07)", color: "#eaf7ff", fontWeight: 700, cursor: "pointer", fontSize: "0.8rem", fontFamily: "inherit", textAlign: "left" }}>
                🖼️ Ver fotos de clientes
              </button>
            </div>
          )}
        </section>

        {/* CATÁLOGO */}
        <section id="produtos" className="panel" style={{ padding: "16px" }}>
          <button type="button" onClick={() => alternarSecao("catalogo")}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(79,209,255,0.25)", background: "rgba(79,209,255,0.06)", cursor: "pointer", fontFamily: "inherit" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.1em", color: "#4fd1ff", textTransform: "uppercase" }}>🧪 Catálogo</span>
            <span style={{ color: "#4fd1ff", fontSize: "0.9rem", transform: secoesAbertas.catalogo ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
          </button>
          {secoesAbertas.catalogo && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
              <a href="https://quanton3d.com.br/produtos" target="_blank" rel="noreferrer"
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 12px", borderRadius: "9px", border: "1px solid rgba(73,230,139,0.3)", background: "rgba(73,230,139,0.06)", textDecoration: "none" }}>
                <span>🧪</span>
                <div>
                  <strong style={{ color: "#eaf7ff", display: "block", fontSize: "0.8rem" }}>Ver todas as resinas</strong>
                  <span style={{ color: "#8ba3be", fontSize: "0.7rem" }}>14 linhas exclusivas</span>
                </div>
              </a>
              <button type="button" onClick={() => setActiveModal("fispqs")}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 12px", borderRadius: "9px", border: "1px solid rgba(79,209,255,0.3)", background: "rgba(79,209,255,0.07)", cursor: "pointer", fontFamily: "inherit", textAlign: "left", width: "100%" }}>
                <span>📄</span>
                <div>
                  <strong style={{ color: "#eaf7ff", display: "block", fontSize: "0.8rem" }}>Fichas de Segurança</strong>
                  <span style={{ color: "#8ba3be", fontSize: "0.7rem" }}>FISPQ — 7 documentos</span>
                </div>
              </button>
            </div>
          )}
        </section>

        {/* COMUNIDADE */}
        <section id="servicos" className="panel" style={{ padding: "14px", margin: 0 }}>
          <button type="button" onClick={() => alternarSecao("comunidade")}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(184,156,255,0.25)", background: "rgba(184,156,255,0.06)", cursor: "pointer", fontFamily: "inherit" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.1em", color: "#b89cff", textTransform: "uppercase" }}>🤝 Comunidade</span>
            <span style={{ color: "#b89cff", fontSize: "0.9rem", transform: secoesAbertas.comunidade ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
          </button>
          {secoesAbertas.comunidade && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
              <button type="button" onClick={abrirParceiroModal}
                style={{ width: "100%", padding: "9px 12px", borderRadius: "9px", border: "1px solid rgba(184,156,255,0.3)", background: "rgba(184,156,255,0.07)", color: "#eaf7ff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: "0.8rem", textAlign: "left" }}>
                🤝 Quero ser parceiro
              </button>
              <button type="button" onClick={() => setActiveModal("parceirosPublico")}
                style={{ width: "100%", padding: "9px 12px", borderRadius: "9px", border: "1px solid rgba(184,156,255,0.3)", background: "rgba(184,156,255,0.07)", color: "#eaf7ff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: "0.8rem", textAlign: "left" }}>
                🏆 Ver parceiros e cursos
              </button>
            </div>
          )}
        </section>

        {/* FERRAMENTAS */}
        <section id="calculadoras" className="panel" style={{ padding: "16px" }}>
          <button type="button" onClick={() => alternarSecao("ferramentas")}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(184,156,255,0.25)", background: "rgba(184,156,255,0.06)", cursor: "pointer", fontFamily: "inherit" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.1em", color: "#b89cff", textTransform: "uppercase" }}>🛠️ Ferramentas</span>
            <span style={{ color: "#b89cff", fontSize: "0.9rem", transform: secoesAbertas.ferramentas ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
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
      </div>{/* fim grid 2x2 */}

      <section id="parametros" className="panel" style={{ padding: "16px 16px" }}>
        <button type="button" onClick={() => alternarSecao("consulta")}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(79,209,255,0.25)", background: "rgba(79,209,255,0.06)", cursor: "pointer", fontFamily: "inherit" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.1em", color: "#4fd1ff", textTransform: "uppercase" }}>⚡ Parâmetros de Impressão</span>
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

