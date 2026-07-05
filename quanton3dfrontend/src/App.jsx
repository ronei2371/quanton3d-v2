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
];
const ORIGENS = ["Instagram","YouTube","Google / Pesquisa","Indicação de amigo","Mercado Livre / Shopee","Já sou cliente","Outros"];
const SERVICE_BUTTONS = [
  { label: "FALE CONOSCO", kind: "modal", id: "contato" },
  { label: "SAIBA MAIS", kind: "modal", id: "sobre" },
  { label: "NIVELAMENTO DE PLATAFORMA", kind: "guide", id: "nivelamento" },
  { label: "CONFIGURAÇÃO DE FATIADOR", kind: "guide", id: "fatiadores" },
  { label: "ATENDIMENTO PRIORITÁRIO", kind: "whatsapp" },
  { label: "CALIBRAÇÃO DE RESINA", kind: "guide", id: "calibracao" },
  { label: "GABARITO QUANTON3D", kind: "guide", id: "calibracaoQuanton3D" },
  { label: "DIAGNÓSTICO DE FALHAS", kind: "guide", id: "diagnostico" },
  { label: "SUPORTES E POSICIONAMENTO", kind: "guide", id: "suportes" },
  { label: "MANUTENÇÃO DE MÁQUINA", kind: "guide", id: "manutencao" },
  { label: "OTIMIZAÇÃO DE PARÂMETROS", kind: "guide", id: "otimizacao" },
  { label: "CHAMADAS DE VÍDEO", kind: "whatsapp" },
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
            <div className="brand-mark">Q3D</div>
            <div><h1 translate="no">Quanton3D</h1><p>Resinas UV SLA/DLP de Alta Performance</p></div>
          </div>
          <nav className="main-nav">
            <button type="button" onClick={() => scrollToSection("produtos")}>Produtos</button>
            <button type="button" onClick={() => scrollToSection("servicos")}>Serviços</button>
            <button type="button" onClick={() => scrollToSection("parametros")}>Inf. Técnicas</button>
            <button type="button" onClick={() => scrollToSection("calculadoras")}>Calculadoras</button>
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
          <div className="bot-face">🤖</div>
          <button type="button" onClick={() => setActiveModal("bot")}>Clique para falar comigo! 🤖</button>
        </div>
        <div className="home-actions">
          {SERVICE_BUTTONS.map((item) => (
            <button key={item.label} type="button" onClick={() => executarAcao(item)}>{item.label}</button>
          ))}
        </div>
      </section>

      <section className="experience-section">
        <span className="section-label">Colaboração técnica</span>
        <h2>Colabore com sua experiência de configuração</h2>
        <p>Envie uma foto da peça e os tempos usados no Chitubox para ajudar a Quanton3D a melhorar a base técnica e orientar outros clientes.</p>
        <div className="experience-actions">
          <button type="button" onClick={() => setActiveModal("galeria")}>📷 Compartilhar minhas configurações</button>
          <button type="button" onClick={() => setActiveModal("galeriaPublica")}>🖼️ Ver fotos de clientes</button>
          <button type="button" onClick={abrirParceiroModal}>🤝 Quero ser parceiro</button>
          <button type="button" onClick={() => setActiveModal("chamado")}>🔧 Abrir chamado técnico</button>
        </div>
      </section>



      <section id="produtos" className="panel">
        <div className="panel-header">
          <div><span className="section-label">Catálogo Elite</span><h2>Nossas Resinas</h2></div>
        </div>
        <div className="cards-grid">
          <InfoCard title="Alta Qualidade" text="Conheça linhas, aplicações e FISPQs." onClick={() => setActiveModal("qualidade")} />
          <InfoCard title="Parâmetros detalhados" text="Abra o guia completo do Chitubox." onClick={() => abrirGuia("parametrosDetalhados")} />
          <InfoCard title="Parceiros e cursos" text="Veja parceiros e serviços recomendados." onClick={() => abrirGuia("parceiros")} />
          <InfoCard title="Quero ser parceiro" text="Envie sua proposta de divulgação." onClick={abrirParceiroModal} />
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

      <section id="formulacao" className="panel">
        <div className="panel-header">
          <div><span className="section-label">Formulação personalizada</span><h2>Precisa de uma resina com comportamento específico?</h2></div>
        </div>
        <p style={{ color: "#9fb4c7", marginBottom: "16px" }}>Desenvolvemos formulações sob medida para aplicações odontológicas, industriais, joalheria, ortopedia e muito mais.</p>
        <button type="button" className="submit-registration" onClick={() => setActiveModal("formulacao")}>Solicitar formulação personalizada</button>
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

      <section id="contato" className="panel">
        <div className="panel-header">
          <div><span className="section-label">Contato</span><h2>Atendimento Quanton3D</h2></div>
        </div>
        <p style={{ color: "#9fb4c7", marginBottom: "20px" }}>
          {cliente ? `Cliente ativo: ${cliente.nome}. O atendimento técnico usará seu cadastro para manter histórico.` : "Identifique-se para um atendimento mais personalizado."}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          <button type="button" style={{ padding: "14px 20px", fontWeight: 900, fontSize: "0.9rem", borderRadius: "12px", border: "1px solid rgba(79,209,255,0.3)", background: "rgba(79,209,255,0.1)", color: "#eaf3ff", cursor: "pointer", fontFamily: "inherit" }} onClick={abrirCadastro}>{cliente ? "Atualizar meus dados" : "Identificar-me"}</button>
          <button type="button" style={{ padding: "14px 20px", fontWeight: 900, fontSize: "0.9rem", borderRadius: "12px", border: "1px solid rgba(79,209,255,0.3)", background: "rgba(79,209,255,0.1)", color: "#eaf3ff", cursor: "pointer", fontFamily: "inherit" }} onClick={() => setMostrarContatoMensagem(true)}>Fale conosco</button>
          <button type="button" style={{ padding: "14px 20px", fontWeight: 900, fontSize: "0.9rem", borderRadius: "12px", border: "1px solid rgba(79,209,255,0.3)", background: "rgba(79,209,255,0.1)", color: "#eaf3ff", cursor: "pointer", fontFamily: "inherit" }} onClick={() => setActiveModal("chamado")}>🔧 Abrir chamado técnico</button>
          <button type="button" style={{ padding: "14px 20px", fontWeight: 900, fontSize: "0.9rem", borderRadius: "12px", border: "1px solid rgba(37,211,102,0.4)", background: "rgba(37,211,102,0.12)", color: "#25d366", cursor: "pointer", fontFamily: "inherit" }} onClick={() => window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer")}>WhatsApp</button>
        </div>
      </section>

      <footer className="site-footer">
        <span>Quanton3D © Suporte técnico e resinas UV de alta performance.</span>
        <div className="footer-social-links">
          {SOCIAL_LINKS.map((link) => <a key={link.label} href={link.url} target="_blank" rel="noreferrer">{link.label}</a>)}
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
          <label><span>E-mail</span><input value={formCliente.email} onChange={(e) => alterarCliente("email", e.target.value)} placeholder="seu@email.com" /></label>
          <label><span>Como nos conheceu?</span>
            <select value={formCliente.origem} onChange={(e) => alterarCliente("origem", e.target.value)}>
              {ORIGENS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
        </div>
        <div className="social-box">
          <strong>Siga a Quanton3D nas redes</strong>
          <div>{SOCIAL_LINKS.map((link) => <a key={link.label} href={link.url} target="_blank" rel="noreferrer">{link.label}</a>)}</div>
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
      <section className="site-modal" style={type === "calc_custos" ? { width: "min(1280px, calc(100vw - 32px))", maxHeight: "calc(100vh - 24px)", padding: "16px" } : {}}>
        <div className="guide-header">
          <h2>{titles[type] || "Informações"}</h2>
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
  const PROBLEMAS = ["Peça não adere à plataforma","Peça adere demais / não solta","Delaminação (camadas separando)","Warping / empenamento","Suporte difícil de remover","Peça porosa ou com buracos","Linhas visíveis entre camadas","FEP danificado","Outro problema"];
  const [form, setForm] = useState({ problema: "", resina: "", impressora: "", descricao: "" });
  const [fotos, setFotos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");

  async function enviar(e) {
    e.preventDefault();
    if (!form.problema || !form.resina || !form.impressora) { setErro("Preencha problema, resina e impressora."); return; }
    try {
      setEnviando(true); setErro("");
      const formData = new FormData();
      formData.append("clienteId", cliente?._id || "");
      formData.append("nome", cliente?.nome || "");
      formData.append("telefone", cliente?.telefone || "");
      formData.append("email", cliente?.email || "");
      formData.append("problema", form.problema);
      formData.append("resina", form.resina);
      formData.append("impressora", form.impressora);
      formData.append("descricao", form.descricao);
      fotos.forEach((foto) => formData.append("fotos", foto));
      await api.post("/bot-tickets", formData);
      setSucesso(true);
    } catch (err) { console.error("Erro ao abrir chamado:", err); setErro("Erro ao enviar chamado. Tente novamente."); }
    finally { setEnviando(false); }
  }

  if (sucesso) return (
    <div className="modal-success" style={{ textAlign: "center", padding: "32px" }}>
      <div style={{ fontSize: "2rem", marginBottom: "12px" }}>✅</div>
      <h3>Chamado registrado com sucesso!</h3>
      <p>Nossa equipe técnica analisará seu caso e entrará em contato pelo WhatsApp.</p>
    </div>
  );

  return (
    <div className="modal-rich-content">
      <p>Descreva o problema com sua impressão e nossa equipe técnica vai analisar e responder.</p>
      <form style={{ marginTop: "16px" }} onSubmit={enviar}>
        {erro && <div className="modal-error">{erro}</div>}
        <div className="form-grid">
          <label><span>Tipo de problema *</span>
            <select value={form.problema} onChange={(e) => setForm({ ...form, problema: e.target.value })}>
              <option value="">Selecione o problema</option>
              {PROBLEMAS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label><span>Resina usada *</span><input value={form.resina} onChange={(e) => setForm({ ...form, resina: e.target.value })} placeholder="Ex.: IRON Cinza" /></label>
          <label><span>Impressora *</span><input value={form.impressora} onChange={(e) => setForm({ ...form, impressora: e.target.value })} placeholder="Ex.: Elegoo Mars 4 Ultra" /></label>
          <label className="partner-grid-full"><span>Descrição detalhada</span><textarea rows="4" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descreva o problema: quando começou, parâmetros usados, temperatura ambiente, o que já tentou..." /></label>
          <label className="partner-grid-full"><span>Fotos do problema (até 4)</span><input type="file" accept="image/*" multiple onChange={(e) => setFotos(Array.from(e.target.files || []).slice(0, 4))} /></label>
        </div>
        {fotos.length > 0 && <p style={{ color: "#9fb4c7", fontSize: "0.85rem" }}>{fotos.length} foto(s) selecionada(s): {fotos.map(f => f.name).join(", ")}</p>}
        <button type="submit" className="submit-registration" disabled={enviando} style={{ marginTop: "16px" }}>{enviando ? "Enviando chamado..." : "Abrir Chamado Técnico"}</button>
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
      const [metricas, galeria] = await Promise.all([
        api.get("/admin/metrics", { headers }),
        api.get("/gallery/admin", { headers, params: filtroGaleria }),
      ]);
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
              <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                {item.imagem && <img src={item.imagem} alt="envio" style={{ width: "160px", height: "160px", objectFit: "contain", borderRadius: "10px", flexShrink: 0, border: "1px solid rgba(113,159,219,0.2)", background: "rgba(0,0,0,0.3)", cursor: "pointer" }} onClick={() => window.open(item.imagem, "_blank")} />}
                <div style={{ flex: 1, minWidth: "180px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                    <strong>{item.nome || "Sem nome"}</strong>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}><BADGE status={item.status} /><small style={{ color: "#9fb4c7", fontSize: "0.75rem" }}>{formatarDataHora(item.createdAt)}</small></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "0.82rem", color: "#9fb4c7", marginBottom: "8px" }}>
                    <span>Tel: {item.telefone || "-"}</span><span>Email: {item.email || "-"}</span>
                    <span>Resina: {item.resina || "-"}</span><span>Impressora: {item.impressora || "-"}</span>
                  </div>
                  {item.observacao && <p style={{ color: "#d3e4f8", fontSize: "0.82rem", margin: "4px 0", fontStyle: "italic" }}>{item.observacao}</p>}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", margin: "6px 0" }}>
                    {CAMPOS_CONFIGURACAO_GALERIA.map((campo) => {
                      const v = item.parametros?.[campo.name];
                      return v ? <span key={campo.name} style={{ fontSize: "0.72rem", padding: "2px 7px", borderRadius: "6px", background: "rgba(26,115,232,0.12)", border: "1px solid rgba(26,115,232,0.2)", color: "#a8c4e8" }}>{campo.label}: {v}</span> : null;
                    })}
                  </div>
                  <div style={{ marginTop: "8px", padding: "10px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(113,159,219,0.12)" }}>
                    <p style={{ fontSize: "0.75rem", color: "#9fb4c7", margin: "0 0 5px" }}>Diagnostico tecnico (opcional):</p>
                    <select value={diagnostico[item._id]?.tipo || ""} onChange={(e) => setDiagnostico((d) => ({ ...d, [item._id]: { ...d[item._id], tipo: e.target.value } }))}
                      style={{ width: "100%", padding: "5px 8px", borderRadius: "7px", border: "1px solid rgba(113,159,219,0.25)", background: "rgba(4,12,24,0.6)", color: "white", fontSize: "0.78rem", marginBottom: "5px" }}>
                      <option value="">Tipo de defeito (opcional)</option>
                      <option value="descolamento da base">Descolamento da base</option>
                      <option value="falha de suportes">Falha de suportes</option>
                      <option value="rachadura ou quebra">Rachadura ou quebra</option>
                      <option value="delaminacao">Delaminacao entre camadas</option>
                      <option value="warping ou deformacao">Warping ou deformacao</option>
                      <option value="problema de superficie">Problema de superficie</option>
                      <option value="excesso ou falta de cura">Excesso ou falta de cura</option>
                      <option value="problema de LCD">Problema de LCD</option>
                      <option value="outro">Outro</option>
                    </select>
                    <textarea value={diagnostico[item._id]?.texto || ""} onChange={(e) => setDiagnostico((d) => ({ ...d, [item._id]: { ...d[item._id], texto: e.target.value } }))}
                      placeholder="Diagnostico e solucao recomendada..." rows={2}
                      style={{ width: "100%", padding: "5px 8px", borderRadius: "7px", border: "1px solid rgba(113,159,219,0.25)", background: "rgba(4,12,24,0.6)", color: "white", fontSize: "0.78rem", resize: "vertical" }} />
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                    <button type="button" onClick={() => atualizarGaleria(item._id, "aprovar", diagnostico[item._id] ? { diagnostico: diagnostico[item._id] } : null)} disabled={salvandoId === item._id || item.status === "aprovado"}
                      style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid rgba(73,230,139,0.4)", background: "rgba(73,230,139,0.12)", color: "#49e68b", cursor: "pointer", fontSize: "0.82rem", fontWeight: 800 }}>Aprovar</button>
                    <button type="button" onClick={() => atualizarGaleria(item._id, "recusar")} disabled={salvandoId === item._id || item.status === "recusado"}
                      style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid rgba(255,107,107,0.4)", background: "rgba(255,107,107,0.1)", color: "#ff6b6b", cursor: "pointer", fontSize: "0.82rem", fontWeight: 800 }}>Recusar</button>
                  </div>
                </div>
              </div>
            </CARD>
          ))}
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                <strong>{c.nome || "Sem nome"}</strong>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}><BADGE status={c.status || "novo"} /><small style={{ color: "#9fb4c7", fontSize: "0.75rem" }}>{formatarDataHora(c.createdAt)}</small></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "0.82rem", color: "#9fb4c7", marginBottom: "8px" }}>
                <span>Tel: {c.telefone || "-"}</span><span>Email: {c.email || "-"}</span>
                <span>Resina: {c.resina || "-"}</span><span>Impressora: {c.impressora || "-"}</span>
              </div>
              <div style={{ background: "rgba(255,107,107,0.07)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: "8px", padding: "8px", marginBottom: "6px" }}>
                <strong style={{ fontSize: "0.82rem", color: "#ff6b6b" }}>Problema: </strong>
                <span style={{ fontSize: "0.82rem", color: "#d3e4f8" }}>{c.problema || "-"}</span>
              </div>
              {c.descricao && <p style={{ color: "#9fb4c7", fontSize: "0.82rem" }}>{c.descricao}</p>}
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

function BotContent({ cliente }) {
  const [mensagens, setMensagens] = useState([{ text: `Olá ${cliente?.nome || ""}! 👋 Sou o ELIO, assistente técnico da Quanton3D. Como posso te ajudar hoje?`, isBot: true }]);
  const [input, setInput] = useState("");
  const [pensando, setPensando] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [mensagens]);

  async function enviar() {
    if (!input.trim() || pensando) return;
    const userMsg = input;
    setInput("");
    setMensagens((prev) => [...prev, { text: userMsg, isBot: false }]);
    setPensando(true);
    try {
      const res = await api.post("/chat", { message: userMsg, clienteId: cliente?._id });
      const reply = res.data.data?.reply || res.data.reply || "Não consegui processar sua dúvida agora.";
      setMensagens((prev) => [...prev, { text: reply, isBot: true }]);
    } catch (err) {
      console.error("Erro ao conversar com bot:", err);
      setMensagens((prev) => [...prev, { text: "Desculpe, tive um problema técnico. Pode repetir?", isBot: true }]);
    } finally { setPensando(false); }
  }

  return (
    <div className="bot-chat-container" style={{ display: "flex", flexDirection: "column", height: "65vh" }}>
      <div className="chat-messages" ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {mensagens.map((m, i) => (
          <div key={i} className={`message-bubble ${m.isBot ? "bot" : "user"}`}
            style={{ alignSelf: m.isBot ? "flex-start" : "flex-end", maxWidth: "85%", padding: "10px 14px", borderRadius: m.isBot ? "4px 18px 18px 18px" : "18px 4px 18px 18px", background: m.isBot ? "rgba(26,115,232,0.18)" : "rgba(79,209,255,0.18)", border: m.isBot ? "1px solid rgba(26,115,232,0.35)" : "1px solid rgba(79,209,255,0.35)", color: "#eaf3ff", fontSize: "0.92rem", lineHeight: 1.55 }}
            dangerouslySetInnerHTML={{ __html: `<p style="margin:0">${formatarMarkdown(m.text)}</p>` }}
          />
        ))}
        {pensando && <div style={{ alignSelf: "flex-start", padding: "10px 16px", borderRadius: "4px 18px 18px 18px", background: "rgba(26,115,232,0.12)", border: "1px solid rgba(26,115,232,0.25)", color: "#9fb4c7", fontSize: "0.88rem" }}>⏳ Analisando base técnica...</div>}
      </div>
      <div className="chat-input-row" style={{ display: "flex", gap: "10px", padding: "12px 16px", borderTop: "1px solid rgba(113,159,219,0.2)" }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === "Enter" && enviar()} placeholder="Tire sua dúvida técnica..." style={{ flex: 1 }} />
        <button type="button" onClick={enviar} disabled={pensando} style={{ whiteSpace: "nowrap" }}>{pensando ? "..." : "Enviar"}</button>
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
