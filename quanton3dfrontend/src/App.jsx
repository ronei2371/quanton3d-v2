import { useCallback, useEffect, useState, useRef } from "react";
import api from "./api";
import "./App.css";
import ContactMessageModal from "./components/ContactMessageModal";
import PartnerRequestModal from "./components/PartnerRequestModal";
import CalculadoraExposicao from "./components/CalculadoraExposicao";
import CalculadoraVolume from "./components/CalculadoraVolume";
import CalculadoraTolerancia from "./components/CalculadoraTolerancia";
import CalculadoraCustos from "./components/CalculadoraCustos";

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
function formatarMarkdown(texto) {
  return texto
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code style=\"background:rgba(255,255,255,0.12);padding:2px 6px;border-radius:4px;font-size:0.88em\">$1</code>")
    .replace(/\n{2,}/g, "</p><p style=\"margin:8px 0\">")
    .replace(/\n/g, "<br/>");
}

function App() {
  const [clienteSalvoInicial] = useState(() => getClienteSalvo());
  const [privacidadeAceitaInicial] = useState(() => getPrivacidadeAceita());
  const [parametros, setParametros] = useState([]);
  const [resinaSelecionada, setResinaSelecionada] = useState("");
  const [impressoraSelecionada, setImpressoraSelecionada] = useState("");
  const [resultado, setResultado] = useState(null);
  const [cliente, setCliente] = useState(clienteSalvoInicial);
  const [mostrarPrivacidade, setMostrarPrivacidade] = useState(!privacidadeAceitaInicial);
  const [mostrarCadastro, setMostrarCadastro] = useState(privacidadeAceitaInicial && !clienteSalvoInicial);
  const [formCliente, setFormCliente] = useState({ nome: "", telefone: "", email: "", origem: "Instagram" });
  const [salvandoCliente, setSalvandoCliente] = useState(false);
  const [erroCadastro, setErroCadastro] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
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
  async function salvarCliente(e) {
    e.preventDefault(); setErroCadastro("");
    if (!formCliente.nome || !formCliente.telefone || !formCliente.email) { setErroCadastro("Preencha todos os campos obrigatórios."); return; }
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
      {mostrarPrivacidade && <PrivacidadeModal aceitarPrivacidade={aceitarPrivacidade} />}
      {mostrarCadastro && !mostrarPrivacidade && (
        <CadastroInicial formCliente={formCliente} salvandoCliente={salvandoCliente} erroCadastro={erroCadastro} alterarCliente={alterarCliente} salvarCliente={salvarCliente} />
      )}
      {activeGuide && <GuideModal guide={activeGuide} onClose={() => setActiveGuide(null)} />}
      <ContactMessageModal aberto={mostrarContatoMensagem} aoFechar={() => setMostrarContatoMensagem(false)} cliente={cliente} />
      {activeModal && (
        <SiteModal type={activeModal} cliente={cliente} onClose={() => setActiveModal(null)} abrirGuia={abrirGuia} abrirParceiroModal={abrirParceiroModal} />
      )}
      <PartnerRequestModal aberto={mostrarParceiroModal} aoFechar={() => setMostrarParceiroModal(false)} cliente={cliente} />

      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <img src="/logo-quanton3d.png" alt="Quanton3D" className="brand-logo" />
            <div>
              <h1 translate="no" style={{ margin: 0, fontSize: "1.2rem", color: "#eaf7ff", display: "flex", alignItems: "baseline", gap: "3px" }}>
                Quanton3D<sup style={{ fontSize: "0.55rem", color: "#4fd1ff", fontWeight: 700 }}>®</sup>
              </h1>
              <p style={{ margin: "3px 0 0", color: "#8ba3be", fontSize: "0.75rem" }}>Resinas UV SLA/DLP de Alta Performance</p>
            </div>
          </div>
          <nav className="main-nav">
            <button type="button" onClick={() => setActiveModal("adm")}>ADM</button>
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
          <button type="button" onClick={() => setActiveModal("bot")}>Falar com a ELIO 🤖</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
          {/* Grupo Atendimento */}
          <div>
            <p style={{ margin: "0 0 8px", fontSize: "0.7rem", fontWeight: 900, letterSpacing: "0.12em", color: "#4fd1ff", textTransform: "uppercase" }}>💬 Atendimento</p>
            <div className="home-actions" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
              {SERVICE_BUTTONS.filter(b => b.grupo === "atendimento").map((item) => (
                <button key={item.label} type="button" onClick={() => executarAcao(item)}
                  style={{ borderColor: item.kind === "whatsapp" ? "rgba(37,211,102,0.4)" : undefined, background: item.kind === "whatsapp" ? "rgba(37,211,102,0.08)" : undefined, color: item.kind === "whatsapp" ? "#25d366" : "#eaf7ff" }}>
                  {item.kind === "whatsapp" ? "📱 " : ""}{item.label}
                </button>
              ))}
            </div>
          </div>
          {/* Grupo Guias */}
          <div>
            <p style={{ margin: "0 0 8px", fontSize: "0.7rem", fontWeight: 900, letterSpacing: "0.12em", color: "#b89cff", textTransform: "uppercase" }}>📚 Guias Técnicos</p>
            <div className="home-actions">
              {SERVICE_BUTTONS.filter(b => b.grupo === "guias").map((item) => (
                <button key={item.label} type="button" onClick={() => executarAcao(item)}
                  style={{ borderColor: item.kind === "whatsapp" ? "rgba(37,211,102,0.4)" : undefined, background: item.kind === "whatsapp" ? "rgba(37,211,102,0.08)" : undefined, color: item.kind === "whatsapp" ? "#25d366" : "#eaf7ff" }}>
                  {item.kind === "whatsapp" ? "📱 " : ""}{item.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </section>

      <section className="experience-section">
        <span className="section-label">Colaboração técnica</span>
        <h2>Colabore com sua experiência de configuração</h2>
        <p>Envie uma foto da peça e os tempos usados no Chitubox para ajudar a Quanton3D a melhorar a base técnica e orientar outros clientes.</p>
        <div className="experience-actions">
          <button type="button" onClick={() => setActiveModal("galeria")}>📷 Compartilhar minhas configurações</button>
          <button type="button" onClick={() => setActiveModal("galeriaPublica")}>🖼️ Ver fotos de clientes</button>
        </div>
      </section>



      <section id="produtos" className="panel">
        <div className="panel-header">
          <div><span className="section-label">Catálogo Elite</span><h2>Nossas Resinas</h2></div>
        </div>
        <div className="cards-grid">
          <InfoCard title="Alta Qualidade" text="Conheça linhas, aplicações e FISPQs." onClick={() => setActiveModal("qualidade")} />
          <InfoCard title="Parâmetros detalhados" text="Guia completo de configuração Chitubox." onClick={() => abrirGuia("parametrosDetalhados")} />
          <InfoCard title="Parceiros e cursos" text="Veja parceiros e serviços recomendados." onClick={() => abrirGuia("parceiros")} />
        </div>

        {/* FISPQs — botão único abre modal com lista */}
        <div style={{ marginTop: "20px" }}>
          <button
            type="button"
            onClick={() => setActiveModal("fispqs")}
            style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 20px", borderRadius: "14px", border: "1px solid rgba(79,209,255,0.3)", background: "rgba(79,209,255,0.07)", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s ease", width: "100%" }}>
            <span style={{ fontSize: "1.4rem" }}>📄</span>
            <div style={{ textAlign: "left" }}>
              <strong style={{ color: "#eaf7ff", display: "block", fontSize: "0.92rem" }}>Fichas de Segurança — FISPQ</strong>
              <span style={{ color: "#8ba3be", fontSize: "0.78rem" }}>7 documentos disponíveis · POSEIDON, IRON, SPIN, SPARK, PYROBLAST, LOW SMELL, IRON 70/30</span>
            </div>
            <span style={{ marginLeft: "auto", color: "#4fd1ff", fontSize: "0.82rem", fontWeight: 700 }}>Ver →</span>
          </button>
        </div>
      </section>

      <section id="servicos" className="panel">
        <div className="panel-header">
          <div><span className="section-label">Guias técnicos</span><h2>Serviços e Suporte</h2></div>
        </div>
        <div className="service-list">
          <ServiceLine title="Nivelamento de plataforma" onClick={() => abrirGuia("nivelamento")} />
          <ServiceLine title="Configuração de fatiador" onClick={() => abrirGuia("fatiadores")} />
          <ServiceLine title="Calibração de resina" onClick={() => abrirGuia("calibracao")} />
          <ServiceLine title="Gabarito Quanton3D" onClick={() => abrirGuia("calibracaoQuanton3D")} />
          <ServiceLine title="Diagnóstico de problemas" onClick={() => abrirGuia("diagnostico")} />
          <ServiceLine title="Posicionamento de suportes" onClick={() => abrirGuia("suportes")} />
          <ServiceLine title="Manutenção de máquina" onClick={() => abrirGuia("manutencao")} />
          <ServiceLine title="Otimização e pós-processamento" onClick={() => abrirGuia("otimizacao")} />
        </div>
        <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid rgba(79,209,255,0.12)" }}>
          <p style={{ margin: "0 0 14px", fontSize: "0.7rem", fontWeight: 900, letterSpacing: "0.12em", color: "#b89cff", textTransform: "uppercase" }}>🤝 Parceria e Comunidade</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            <button type="button" onClick={abrirParceiroModal}
              style={{ padding: "12px 20px", borderRadius: "12px", border: "1px solid rgba(184,156,255,0.3)", background: "rgba(184,156,255,0.07)", color: "#eaf7ff", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", fontSize: "0.88rem" }}>
              🤝 Quero ser parceiro
            </button>
            <button type="button" onClick={() => abrirGuia("parceiros")}
              style={{ padding: "12px 20px", borderRadius: "12px", border: "1px solid rgba(184,156,255,0.3)", background: "rgba(184,156,255,0.07)", color: "#eaf7ff", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", fontSize: "0.88rem" }}>
              🏆 Ver parceiros e cursos
            </button>
            <button type="button" onClick={() => setActiveModal("sobre")}
              style={{ padding: "12px 20px", borderRadius: "12px", border: "1px solid rgba(184,156,255,0.3)", background: "rgba(184,156,255,0.07)", color: "#eaf7ff", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", fontSize: "0.88rem" }}>
              ℹ️ Saiba mais sobre nós
            </button>
          </div>
        </div>
      </section>

      <section id="calculadoras" className="panel">
        <div className="panel-header">
          <div><span className="section-label">Ferramentas</span><h2>Calculadoras Técnicas</h2></div>
        </div>
        <div className="selector-grid">
          <div className="field clickable-card" onClick={() => setActiveModal("calc_exp")}>
            <span>Calculadora de Exposição</span>
            <p style={{ fontSize: "0.85rem", color: "#9fb4c7" }}>Ajuste fino baseado na temperatura.</p>
          </div>
          <div className="field clickable-card" onClick={() => setActiveModal("calc_vol")}>
            <span>Calculadora de Volume</span>
            <p style={{ fontSize: "0.85rem", color: "#9fb4c7" }}>Estime o custo real da sua peça.</p>
          </div>
          <div className="field clickable-card" onClick={() => setActiveModal("calc_tolerancia")}>
            <span>Calculadora de Tolerância</span>
            <p style={{ fontSize: "0.85rem", color: "#9fb4c7" }}>Compensação X/Y para encaixes perfeitos.</p>
          </div>
          <div className="field clickable-card" onClick={() => setActiveModal("calc_custos")}>
            <span>Calculadora de Custos</span>
            <p style={{ fontSize: "0.85rem", color: "#9fb4c7" }}>Precifique seu job com margem real.</p>
          </div>
        </div>
      </section>



      <section id="parametros" className="panel">
        <div className="panel-header">
          <div><span className="section-label">Consulta rápida</span><h2>Parâmetros de impressão</h2></div>
          <div className="panel-actions">
            {carregando && <span className="loading-pill">Carregando...</span>}
            <button type="button" onClick={carregarParametros}>Atualizar</button>
          </div>
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
        {!resultado && <div className="empty-state"><h3>Selecione resina e impressora</h3><p>Os parâmetros técnicos aparecerão aqui automaticamente.</p></div>}
        {resultado && (
          <div className="result-card">
            <div className="result-header">
              <h3>{corrigirNomeResina(resultado.resina)} + {resultado.marca} {resultado.impressora}</h3>
              <button type="button" onClick={copiarParametros}>Copiar parâmetros</button>
            </div>
            <div className="params-grid">
              <ParamItem label="Altura de Camada" value={resultado.alturaCamada} />
              <ParamItem label="Tempo de Exposição" value={resultado.exposicaoNormal} />
              <ParamItem label="Exposição Base" value={resultado.exposicaoBase} />
              <ParamItem label="Camadas de Base" value={resultado.camadasBase} />
              <ParamItem label="Retardo UV" value={resultado.retardoUV} />
              <ParamItem label="Potência UV" value={resultado.potenciaUV} />
            </div>
          </div>
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

function SiteModal({ type, cliente, onClose, abrirGuia, abrirParceiroModal }) {
  const nomeFispq = type && type.startsWith("fispq_") ? "FISPQ — " + type.replace("fispq_","").replace(".pdf","") : null;
  const titles = {
    contato: "Fale Conosco", sobre: "Sobre a Quanton3D", formulacao: "Formulação Personalizada",
    galeria: "Galeria e Configurações", galeriaPublica: "Fotos e Configurações de Clientes",
    adm: "Painel Administrativo", qualidade: "Alta Qualidade",
    calc_exp: "Calculadora de Exposição", calc_vol: "Calculadora de Volume",
    calc_tolerancia: "Calculadora de Tolerância", calc_custos: "Calculadora de Custos e Orçamentos",
    bot: "Bot Quanton3D", chamado: "Chamado Técnico",
  };
  return (
    <div className="modal-backdrop">
      <section className="site-modal" style={(type === "calc_custos" || (type && type.startsWith("fispq_"))) ? { width: "min(1100px, calc(100vw - 32px))", maxHeight: "calc(100vh - 24px)", padding: "16px" } : {}}>
        <div className="guide-header">
          <h2>{nomeFispq || titles[type] || "Informações"}</h2>
          <button type="button" onClick={onClose}>Fechar</button>
        </div>
        {type === "contato" && <ContatoContent cliente={cliente} />}
        {type === "sobre" && <SobreContent abrirGuia={abrirGuia} abrirParceiroModal={abrirParceiroModal} />}
        {type === "formulacao" && <FormulacaoContent cliente={cliente} />}
        {type === "galeria" && <GaleriaContent cliente={cliente} ocultarAbas />}
        {type === "galeriaPublica" && <GaleriaContent cliente={cliente} initialAba="ver" ocultarAbas />}
        {type === "adm" && <AdminContent />}
        {type === "qualidade" && <QualidadeContent abrirGuia={abrirGuia} />}
        {type === "calc_exp" && <CalculadoraExposicao />}
        {type === "calc_vol" && <CalculadoraVolume />}
        {type === "calc_tolerancia" && <CalculadoraTolerancia />}
        {type === "calc_custos" && <CalculadoraCustos />}
        {type === "bot" && <BotContent cliente={cliente} />}
        {type === "chamado" && <ChamadoTecnicoContent cliente={cliente} />}
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
  return (
    <div className="modal-rich-content">
      <p>A Quanton3D é especialista em resinas UV de alta performance com mais de 20 anos de experiência em fabricação.</p>
      <div className="modal-action-grid">
        <button type="button" onClick={() => abrirGuia("parceiros")}>Ver parceiros</button>
        <button type="button" onClick={() => abrirGuia("diagnostico")}>Guia de diagnóstico</button>
        <button type="button" onClick={abrirParceiroModal}>Quero ser parceiro</button>
      </div>
    </div>
  );
}

function FormulacaoContent({ cliente }) {
  const [form, setForm] = useState({ caracteristica: "", cor: "", detalhes: "" });
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  async function enviar() {
    try {
      setEnviando(true);
      await api.post("/formulacoes", { ...form, clienteId: cliente?._id });
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
      formData.append("resina", form.resina);
      formData.append("impressora", form.impressora);
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

function GaleriaContent({ cliente, initialAba = "enviar", ocultarAbas = false }) {
  const [aba, setAba] = useState(initialAba);
  const [form, setForm] = useState({ resina: "", impressora: "", observacao: "", parametros: criarConfiguracaoVazia() });
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

  async function enviar(event) {
    event.preventDefault();
    if (!form.resina.trim() || !form.impressora.trim() || !foto) { alert("Preencha a resina, a impressora e envie uma foto."); return; }
    try {
      setEnviando(true);
      const formData = new FormData();
      formData.append("nome", cliente?.nome || "");
      formData.append("telefone", cliente?.telefone || "");
      formData.append("email", cliente?.email || "");
      formData.append("resina", form.resina);
      formData.append("impressora", form.impressora);
      formData.append("observacao", form.observacao);
      formData.append("clienteId", cliente?._id || "");
      formData.append("fotos", foto);
      Object.entries(form.parametros).forEach(([campo, valor]) => formData.append(`parametros.${campo}`, valor));
      await api.post("/gallery", formData);
      setSucesso(true);
      setForm({ resina: "", impressora: "", observacao: "", parametros: criarConfiguracaoVazia() });
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
            <label><span>Resina usada *</span><input value={form.resina} onChange={(e) => alterar("resina", e.target.value)} placeholder="Ex.: IRON Cinza" /></label>
            <label><span>Impressora *</span><input value={form.impressora} onChange={(e) => alterar("impressora", e.target.value)} placeholder="Ex.: Anycubic Photon M3 Max" /></label>
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
          <button type="submit" className="submit-registration" disabled={enviando}>{enviando ? "Enviando..." : "Enviar para aprovação"}</button>
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

function AdminContent() {
  const [credenciais, setCredenciais] = useState({ user: "", password: "" });
  const [token, setToken] = useState(() => localStorage.getItem("quanton3d_admin_token") || "");
  const [aba, setAba] = useState("galeria");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [dados, setDados] = useState({ clientes: [], formulacoes: [], chamados: [], mensagens: [], galeria: [], totais: {} });
  const [filtroGaleria, setFiltroGaleria] = useState({ status: "pendente", dataInicio: "", dataFim: "" });
  const [salvandoId, setSalvandoId] = useState("");
  const [diagnostico, setDiagnostico] = useState({});
  const [novoParam, setNovoParam] = useState({ resina:"", impressora:"", alturaCamada:"", exposicaoNormal:"", exposicaoBase:"", camadasBase:"", liftSpeed:"", retractSpeed:"" });
  const [salvandoParam, setSalvandoParam] = useState(false);
  const [msgParam, setMsgParam] = useState("");
  const [parametrosAdm, setParametrosAdm] = useState([]);
  const [buscaParam, setBuscaParam] = useState("");

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
      try { const r = await api.get("/contact-messages", { headers }); mensagens = Array.isArray(r.data?.messages) ? r.data.messages : []; } catch (_) {}
      setDados({ clientes: m.clientes || [], formulacoes: m.formulacoes || [], chamados, mensagens, galeria: Array.isArray(galeria.data?.data) ? galeria.data.data : [], totais: m.totals || {} });
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
      await api.post("/parametros", novoParam);
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

  function sair() { localStorage.removeItem("quanton3d_admin_token"); setToken(""); }

  const CARD = ({ children }) => (
    <div style={{ border: "1px solid rgba(113,159,219,0.2)", borderRadius: "14px", padding: "14px", background: "rgba(255,255,255,0.04)", marginBottom: "10px" }}>{children}</div>
  );
  const BADGE = ({ status }) => {
    const cor = ["aprovado","fechado","resolvido"].includes(status) ? "#49e68b" : status === "recusado" ? "#ff6b6b" : status === "respondido" ? "#4fd1ff" : "#ffd166";
    return <span style={{ fontSize: "0.75rem", padding: "2px 10px", borderRadius: "999px", border: "1px solid " + cor + "44", background: cor + "18", color: cor, fontWeight: 800 }}>{status || "pendente"}</span>;
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
    { id: "metricas", label: "Metricas" },
    { id: "parametros_adm", label: "Parametros" },
    { id: "galeria", label: "Galeria (" + dados.galeria.length + ")" },
    { id: "clientes", label: "Clientes (" + dados.clientes.length + ")" },
    { id: "formulacoes", label: "Formulacoes (" + dados.formulacoes.length + ")" },
    { id: "chamados", label: "Chamados (" + dados.chamados.length + ")" },
    { id: "mensagens", label: "Mensagens (" + dados.mensagens.length + ")" },
  ];

  return (
    <div className="admin-gallery-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {ABAS_ADM.map((a) => (
            <button key={a.id} type="button" onClick={() => setAba(a.id)}
              style={{ padding: "8px 14px", borderRadius: "10px", fontSize: "0.82rem", border: aba === a.id ? "2px solid #4fd1ff" : "1px solid rgba(113,159,219,0.3)", background: aba === a.id ? "rgba(79,209,255,0.15)" : "rgba(255,255,255,0.06)", color: aba === a.id ? "#4fd1ff" : "#eaf3ff", cursor: "pointer", fontWeight: aba === a.id ? "900" : "600", fontFamily: "inherit", WebkitTextFillColor: aba === a.id ? "#4fd1ff" : "#eaf3ff" }}>
              {a.label}
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

      {aba === "metricas" && (
        <div>
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
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
                      <strong style={{ color: "#4fd1ff", fontSize: "0.88rem" }}>{p.resina}</strong>
                      <span style={{ color: "#9fb4c7", fontSize: "0.82rem" }}>+</span>
                      <span style={{ color: "#eaf3ff", fontSize: "0.85rem" }}>{p.impressora}</span>
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
          {dados.clientes.length === 0 && !carregando && <div className="gallery-empty">Nenhum cliente cadastrado.</div>}
          {dados.clientes.map((c) => (
            <CARD key={c._id}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", flexWrap: "wrap", gap: "6px" }}>
                <strong>{c.nome || "Sem nome"}</strong><small style={{ color: "#9fb4c7" }}>{formatarDataHora(c.createdAt)}</small>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "0.82rem", color: "#9fb4c7" }}>
                <span>Tel: {c.telefone || "-"}</span><span>Email: {c.email || "-"}</span><span>Origem: {c.origem || "-"}</span>
              </div>
            </CARD>
          ))}
        </div>
      )}

      {aba === "formulacoes" && (
        <div>
          {dados.formulacoes.length === 0 && !carregando && <div className="gallery-empty">Nenhuma formulacao solicitada.</div>}
          {dados.formulacoes.map((f) => (
            <CARD key={f._id}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", flexWrap: "wrap", gap: "6px" }}>
                <strong>{f.caracteristica || "Sem aplicacao"}</strong><small style={{ color: "#9fb4c7" }}>{formatarDataHora(f.createdAt)}</small>
              </div>
              <p style={{ color: "#9fb4c7", fontSize: "0.82rem", margin: "4px 0" }}>Cor: {f.cor || "-"}</p>
              {f.detalhes && <p style={{ color: "#d3e4f8", fontSize: "0.82rem", margin: "4px 0" }}>{f.detalhes}</p>}
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
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}><BADGE status={m.resolvido ? "resolvido" : "pendente"} /><small style={{ color: "#9fb4c7", fontSize: "0.75rem" }}>{formatarDataHora(m.createdAt)}</small></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "0.82rem", color: "#9fb4c7", marginBottom: "8px" }}>
                <span>Tel: {m.telefone || "-"}</span><span>Email: {m.email || "-"}</span><span>Assunto: {m.assunto || "-"}</span>
              </div>
              {m.mensagem && <div style={{ background: "rgba(26,115,232,0.08)", border: "1px solid rgba(26,115,232,0.2)", borderRadius: "8px", padding: "8px" }}>
                <p style={{ color: "#d3e4f8", fontSize: "0.82rem", margin: 0 }}>{m.mensagem}</p>
              </div>}
            </CARD>
          ))}
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
  const [input, setInput] = useState("");
  const [pensando, setPensando] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [mensagens]);

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

  async function enviar() {
    if (!input.trim() || pensando) return;
    const userMsg = input;
    setInput("");
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

      const res = await api.post("/chat", { message: userMsg, historico, clienteId: cliente?._id });
      const reply = res.data.data?.reply || res.data.reply || "Não consegui processar sua dúvida agora.";
      setMensagens((prev) => [...prev, { text: reply, isBot: true }]);
    } catch (err) {
      console.error("Erro ao conversar com bot:", err);
      setMensagens((prev) => [...prev, { text: "Desculpe, tive um problema técnico. Pode repetir?", isBot: true }]);
    } finally { setPensando(false); }
  }

  if (etapa === "contexto") return (
    <div style={{ padding: "8px 4px" }}>
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
            🖨️ Qual sua impressora? (marca e modelo)
          </label>
          <input
            value={ctx.impressora}
            onChange={e => setCtx(c => ({ ...c, impressora: e.target.value }))}
            placeholder="Ex: Elegoo Mars 4 Ultra, Anycubic Photon M3..."
            style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(79,209,255,0.25)", background: "rgba(4,10,24,0.7)", color: "#ffffff", fontSize: "0.9rem" }}
          />
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
    <div className="bot-chat-container" style={{ display: "flex", flexDirection: "column", height: "60vh" }}>
      {(ctx.resina || ctx.impressora) && (
        <div style={{ padding: "8px 14px", background: "rgba(79,209,255,0.06)", borderBottom: "1px solid rgba(79,209,255,0.15)", fontSize: "0.78rem", color: "#8ba3be", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {ctx.resina && <span>🧪 {ctx.resina}</span>}
          {ctx.impressora && <span>🖨️ {ctx.impressora}</span>}
          {ctx.altura && <span>📏 {ctx.altura}mm</span>}
          <button type="button" onClick={() => setEtapa("contexto")} style={{ marginLeft: "auto", color: "#4fd1ff", background: "none", border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700 }}>Alterar</button>
        </div>
      )}
      <div className="chat-messages" ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {mensagens.map((m, i) => (
          <div key={i}
            style={{ alignSelf: m.isBot ? "flex-start" : "flex-end", maxWidth: "85%", padding: "10px 14px", borderRadius: m.isBot ? "4px 18px 18px 18px" : "18px 4px 18px 18px", background: m.isBot ? "rgba(26,115,232,0.18)" : "rgba(79,209,255,0.18)", border: m.isBot ? "1px solid rgba(26,115,232,0.35)" : "1px solid rgba(79,209,255,0.35)", color: "#eaf3ff", fontSize: "0.92rem", lineHeight: 1.55 }}
            dangerouslySetInnerHTML={{ __html: `<p style="margin:0">${formatarMarkdown(m.text)}</p>` }}
          />
        ))}
        {pensando && <div style={{ alignSelf: "flex-start", padding: "10px 16px", borderRadius: "4px 18px 18px 18px", background: "rgba(26,115,232,0.12)", border: "1px solid rgba(26,115,232,0.25)", color: "#9fb4c7", fontSize: "0.88rem" }}>⏳ Analisando base técnica...</div>}
      </div>
      <div style={{ display: "flex", gap: "10px", padding: "12px 16px", borderTop: "1px solid rgba(113,159,219,0.2)" }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === "Enter" && enviar()} placeholder="Tire sua dúvida técnica..." style={{ flex: 1 }} />
        <button type="button" onClick={enviar} disabled={pensando} style={{ whiteSpace: "nowrap", padding: "10px 18px", borderRadius: "10px", border: 0, background: "linear-gradient(135deg, #2563eb, #7c3aed)", color: "#fff", fontWeight: 900, cursor: "pointer" }}>{pensando ? "..." : "Enviar"}</button>
      </div>
    </div>
  );
}

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

export default App;
