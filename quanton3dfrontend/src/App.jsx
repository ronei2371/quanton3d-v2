import PartnerRequestModal from "./components/PartnerRequestModal";
import ContactMessageModal from "./components/ContactMessageModal";
import Ferramentas from "./components/Ferramentas";
import BotTicketModal from "./components/BotTicketModal";
import AdminUnifiedPanel from "./components/AdminUnifiedPanel";
import { useEffect, useMemo, useState } from "react";
import api from "./api";
import "./App.css";

const ORIGENS = [
  "Instagram",
  "Facebook",
  "TikTok",
  "YouTube",
  "Google / Pesquisa",
  "Indicação de amigo",
  "Mercado Livre / Shopee",
  "Já sou cliente",
  "Outros",
];

const WHATSAPP_URL = "https://wa.me/553132716935";

const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://www.instagram.com/quanton3d" },
  { label: "Facebook", href: "https://www.facebook.com/quanton3d" },
  { label: "TikTok", href: "https://www.tiktok.com/@quanton3d" },
  { label: "YouTube", href: "https://www.youtube.com/@quanton3d" },
];

const SERVICE_BUTTONS = [
  { label: "FALE CONOSCO", kind: "modal", id: "contato" },
  { label: "SAIBA MAIS", kind: "modal", id: "sobre" },
  { label: "FORMULAÇÃO PERSONALIZADA", kind: "modal", id: "formulacao" },
  { label: "NIVELAMENTO DE PLATAFORMA", kind: "guide", id: "nivelamento" },
  { label: "CONFIGURAÇÃO DE FATIADOR", kind: "guide", id: "fatiadores" },
  { label: "ATENDIMENTO PRIORITÁRIO", kind: "whatsapp" },
  { label: "CALIBRAÇÃO DE RESINA", kind: "guide", id: "calibracao" },
  { label: "MANUTENÇÃO DE MÁQUINA", kind: "guide", id: "manutencao" },
  { label: "OTIMIZAÇÃO DE PARÂMETROS", kind: "guide", id: "otimizacao" },
  { label: "PARÂMETROS DE IMPRESSÃO", kind: "scroll", id: "parametros" },
];

const GUIDES = {
  nivelamento: {
    title: "Nivelamento de Plataforma",
    file: "/guias/guia-nivelamento.html",
  },
  fatiadores: {
    title: "Configuração de Fatiadores",
    file: "/guias/guia-configuracao-fatiador.html",
  },
  calibracao: {
    title: "Calibração de Resina",
    file: "/guias/guia-calibracao-resina.html",
  },
  manutencao: {
    title: "Manutenção de Impressora",
    file: "/guias/guia-manutencao-maquina.html",
  },
  otimizacao: {
    title: "Otimização e Pós-processamento",
    file: "/guias/guia-otimizacao-parametros.html",
  },
  diagnostico: {
    title: "Diagnóstico de Problemas",
    file: "/guias/guia-diagnostico-problemas.html",
  },
  parceiros: {
    title: "Parceiros Quanton3D",
    file: "/guias/parceiros-quanton3d.html",
  },
};

function App() {
  const [parametros, setParametros] = useState([]);
  const [resinaSelecionada, setResinaSelecionada] = useState("");
  const [impressoraSelecionada, setImpressoraSelecionada] = useState("");
  const [resultado, setResultado] = useState(null);
  const [mostrarAdminUnificado, setMostrarAdminUnificado] = useState(false);
  const [mostrarBotTicket, setMostrarBotTicket] = useState(false);
  const [cliente, setCliente] = useState(null);
  const [mostrarPrivacidade, setMostrarPrivacidade] = useState(false);
  const [mostrarCadastro, setMostrarCadastro] = useState(false);

  const [formCliente, setFormCliente] = useState({
    nome: "",
    telefone: "",
    email: "",
    origem: "Instagram",
  });

  const [salvandoCliente, setSalvandoCliente] = useState(false);
  const [erroCadastro, setErroCadastro] = useState("");
  const [sucessoCadastro, setSucessoCadastro] = useState("");

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [activeGuide, setActiveGuide] = useState(null);
  const [mostrarParceiroModal, setMostrarParceiroModal] = useState(false);
  const [mostrarContatoMensagem, setMostrarContatoMensagem] = useState(false);

  useEffect(() => {
    carregarParametros();
    carregarEstadoInicial();
  }, []);

  function carregarEstadoInicial() {
    const privacidadeAceita = localStorage.getItem("quanton3d_privacidade_aceita") === "true";
    const clienteLocal = carregarClienteLocal();

    if (!privacidadeAceita) {
      setMostrarPrivacidade(true);
      return;
    }

    if (!clienteLocal) {
      setMostrarCadastro(true);
    }
  }

  function carregarClienteLocal() {
    try {
      const salvo = localStorage.getItem("quanton3d_cliente");
      if (!salvo) return null;
      const clienteSalvo = JSON.parse(salvo);
      if (clienteSalvo?.nome) {
        setCliente(clienteSalvo);
        setFormCliente({
          nome: clienteSalvo.nome || "",
          telefone: clienteSalvo.telefone || "",
          email: clienteSalvo.email || "",
          origem: clienteSalvo.origem || "Instagram",
        });
        return clienteSalvo;
      }
      return null;
    } catch {
      return null;
    }
  }

  function aceitarPrivacidade() {
    localStorage.setItem("quanton3d_privacidade_aceita", "true");
    setMostrarPrivacidade(false);
    if (!cliente) {
      setMostrarCadastro(true);
    }
  }

  async function carregarParametros() {
    try {
      setCarregando(true);
      const resposta = await api.get("/parametros");
      setParametros(resposta.data.parametros || []);
    } catch (error) {
      console.error("Erro ao carregar parâmetros:", error);
      setErro("Erro ao carregar base técnica.");
    } finally {
      setCarregando(false);
    }
  }

  const resinas = useMemo(() => {
    const unicas = new Set();
    parametros.forEach((item) => item.resina && unicas.add(item.resina));
    return Array.from(unicas).sort();
  }, [parametros]);

  const impressoras = useMemo(() => {
    if (!resinaSelecionada) return [];
    const unicas = new Set();
    parametros.forEach((item) => {
      if (item.resina === resinaSelecionada && item.impressora) {
        const label = item.marca ? `${item.marca} - ${item.impressora}` : item.impressora;
        unicas.add(label);
      }
    });
    return Array.from(unicas).sort();
  }, [parametros, resinaSelecionada]);

  function selecionarResina(valor) {
    setResinaSelecionada(valor);
    setImpressoraSelecionada("");
    setResultado(null);
  }

  function selecionarImpressora(valor) {
    setImpressoraSelecionada(valor);
    const nomeModelo = valor.includes(" - ") ? valor.split(" - ").slice(1).join(" - ") : valor;
    const marcaModelo = valor.includes(" - ") ? valor.split(" - ")[0] : "";
    const encontrado = parametros.find((item) => 
      item.resina === resinaSelecionada && 
      item.impressora === nomeModelo && 
      (!marcaModelo || item.marca === marcaModelo)
    );
    setResultado(encontrado || null);
  }

  async function salvarCliente(event) {
    event.preventDefault();
    setErroCadastro("");
    setSucessoCadastro("");
    
    if (!formCliente.nome || !formCliente.telefone || !formCliente.email) {
      setErroCadastro("Preencha os campos obrigatórios.");
      return;
    }

    try {
      setSalvandoCliente(true);
      const resposta = await api.post("/clientes", formCliente);
      const clienteSalvo = resposta.data.cliente;
      if (clienteSalvo) {
        localStorage.setItem("quanton3d_cliente", JSON.stringify(clienteSalvo));
        setCliente(clienteSalvo);
        setSucessoCadastro("Acesso liberado! Bem-vindo.");
        setTimeout(() => {
          setMostrarCadastro(false);
          setSucessoCadastro("");
        }, 1500);
      }
    } catch (error) {
      setErroCadastro("Erro ao salvar cadastro.");
    } finally {
      setSalvandoCliente(false);
    }
  }

  function executarAcao(item) {
    if (item.kind === "guide") {
      setActiveGuide(GUIDES[item.id]);
    } else if (item.kind === "scroll") {
      const el = document.getElementById(item.id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else if (item.kind === "modal") {
      if (item.id === "contato") setMostrarContatoMensagem(true);
      else setActiveModal(item.id);
    } else if (item.kind === "whatsapp") {
      window.open(WHATSAPP_URL, "_blank");
    }
  }

  return (
    <main className="app-shell">
      {mostrarPrivacidade && (
        <div className="modal-backdrop">
          <section className="site-modal privacy-modal" style={{ maxWidth: "600px" }}>
            <div className="guide-header">
              <div><span className="section-label">Quanton3D</span><h2>Privacidade e Termos</h2></div>
            </div>
            <div className="modal-rich-content" style={{ padding: "20px" }}>
              <p>Para acessar nossa base técnica e suporte, coletamos dados básicos de contato. Ao continuar, você concorda com nossa política de uso.</p>
              <div className="privacy-text-box" style={{ background: "#f8fafc", padding: "15px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.9rem", maxHeight: "250px", overflowY: "auto", margin: "15px 0" }}>
                <strong>1. Coleta de Dados:</strong> Solicitamos seu nome, e-mail e WhatsApp para identificar seu acesso e permitir suporte técnico personalizado.<br/><br/>
                <strong>2. Uso das Informações:</strong> Seus dados são usados exclusivamente para melhorar sua experiência com as resinas Quanton3D e manter seu histórico de suporte.<br/><br/>
                <strong>3. Segurança:</strong> A Quanton3D não compartilha seus dados com terceiros. Suas informações são armazenadas de forma segura.<br/><br/>
                <strong>4. Consentimento:</strong> Ao clicar em aceitar, você autoriza o processamento desses dados para as finalidades descritas.
              </div>
              <button type="button" className="submit-registration" onClick={aceitarPrivacidade}>Aceitar e Continuar</button>
            </div>
          </section>
        </div>
      )}

      {mostrarCadastro && !mostrarPrivacidade && (
        <div className="modal-backdrop">
          <section className="site-modal register-modal" style={{ maxWidth: "500px" }}>
            <div className="guide-header">
              <div><span className="section-label">Acesso Elite</span><h2>Identificação</h2></div>
              <button type="button" onClick={() => setMostrarCadastro(false)}>✕</button>
            </div>
            <div className="modal-rich-content" style={{ padding: "20px" }}>
              <p>Olá! Identifique-se para liberar o acesso total aos guias e parâmetros da Quanton3D.</p>
              {erroCadastro && <div className="modal-error">{erroCadastro}</div>}
              {sucessoCadastro && <div className="modal-success">{sucessoCadastro}</div>}
              <form onSubmit={salvarCliente} className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
                <label><span>Seu Nome *</span><input required value={formCliente.nome} onChange={(e) => setFormCliente({...formCliente, nome: e.target.value})} placeholder="Ex.: João Silva" /></label>
                <label><span>WhatsApp *</span><input required value={formCliente.telefone} onChange={(e) => setFormCliente({...formCliente, telefone: e.target.value})} placeholder="Ex.: 31 99999-9999" /></label>
                <label><span>E-mail *</span><input required type="email" value={formCliente.email} onChange={(e) => setFormCliente({...formCliente, email: e.target.value})} placeholder="Ex.: joao@email.com" /></label>
                <label><span>Como nos conheceu?</span>
                  <select value={formCliente.origem} onChange={(e) => setFormCliente({...formCliente, origem: e.target.value})}>
                    {ORIGENS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </label>
                <button type="submit" className="submit-registration" disabled={salvandoCliente}>{salvandoCliente ? "Salvando..." : "Liberar Acesso"}</button>
              </form>
            </div>
          </section>
        </div>
      )}

      {activeGuide && (
        <div className="modal-backdrop">
          <section className="guide-modal">
            <div className="guide-header">
              <div><span className="section-label">Guia Técnico</span><h2>{activeGuide.title}</h2></div>
              <button type="button" onClick={() => setActiveGuide(null)}>Fechar</button>
            </div>
            <iframe src={activeGuide.file} title={activeGuide.title} className="guide-frame"></iframe>
          </section>
        </div>
      )}

      <ContactMessageModal aberto={mostrarContatoMensagem} aoFechar={() => setMostrarContatoMensagem(false)} cliente={cliente} />
      <AdminUnifiedPanel aberto={mostrarAdminUnificado} aoFechar={() => setMostrarAdminUnificado(false)} />
      <BotTicketModal aberto={mostrarBotTicket} aoFechar={() => setMostrarBotTicket(false)} cliente={cliente} resinas={resinas} impressoras={impressoras} />
      
      {activeModal && (
        <SiteModal 
          type={activeModal} 
          cliente={cliente} 
          onClose={() => setActiveModal(null)} 
          abrirGuia={(id) => setActiveGuide(GUIDES[id])} 
          abrirParceiroModal={() => setMostrarParceiroModal(true)}
          resinas={resinas}
          impressoras={impressoras}
        />
      )}

      <PartnerRequestModal aberto={mostrarParceiroModal} aoFechar={() => setMostrarParceiroModal(false)} cliente={cliente} />

      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-mark">Q3D</div>
            <div><h1>Quanton3D</h1><p>Resinas UV de Alta Performance</p></div>
          </div>
          <nav className="main-nav">
            <button type="button" onClick={() => document.getElementById("produtos").scrollIntoView({behavior:"smooth"})}>Produtos</button>
            <button type="button" onClick={() => document.getElementById("servicos").scrollIntoView({behavior:"smooth"})}>Serviços</button>
            <button type="button" onClick={() => document.getElementById("parametros").scrollIntoView({behavior:"smooth"})}>Parâmetros</button>
            <button type="button" onClick={() => setMostrarAdminUnificado(true)}>Admin</button>
            <button type="button" onClick={() => setMostrarCadastro(true)}>Cliente</button>
          </nav>
        </div>
      </header>

      {cliente && <div className="client-chip"><strong>Cliente:</strong> {cliente.nome}</div>}

      <section className="hero-home">
        <div className="assistant-card">
          <div className="bot-face">🤖</div>
          <button type="button" onClick={() => setMostrarBotTicket(true)}>Falar com o Bot 🤖</button>
        </div>
        <div className="home-actions">
          {SERVICE_BUTTONS.map(btn => (
            <button key={btn.label} type="button" onClick={() => executarAcao(btn)}>{btn.label}</button>
          ))}
        </div>
      </section>

      <section id="parametros" className="panel">
        <div className="panel-header">
          <div><span className="section-label">Consulta</span><h2>Parâmetros Técnicos</h2></div>
          <button type="button" onClick={carregarParametros}>Atualizar</button>
        </div>
        <div className="selector-grid">
          <label className="field"><span>Resina</span>
            <select value={resinaSelecionada} onChange={(e) => selecionarResina(e.target.value)}>
              <option value="">Selecione</option>
              {resinas.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label className="field"><span>Impressora</span>
            <select value={impressoraSelecionada} onChange={(e) => selecionarImpressora(e.target.value)} disabled={!resinaSelecionada}>
              <option value="">Selecione</option>
              {impressoras.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </label>
        </div>
        {resultado && (
          <div className="result-card">
            <h3>{resultado.resina} - {resultado.impressora}</h3>
            <div className="params-grid">
              <div className="param-item"><span>Exposição</span><strong>{resultado.exposicaoNormal}s</strong></div>
              <div className="param-item"><span>Camada</span><strong>{resultado.alturaCamada}mm</strong></div>
              <div className="param-item"><span>Exp. Base</span><strong>{resultado.exposicaoBase}s</strong></div>
              <div className="param-item"><span>Camadas Base</span><strong>{resultado.camadasBase}</strong></div>
            </div>
          </div>
        )}
      </section>

      <section id="calculadoras"><Ferramentas /></section>

      <section id="servicos" className="content-section">
        <h2>Suporte e Serviços</h2>
        <div className="cards-grid">
          <div className="info-card clickable-card" onClick={() => setActiveModal("formulacao")}><h3>Formulações</h3><p>Cores e propriedades sob medida.</p></div>
          <div className="info-card clickable-card" onClick={() => setActiveGuide(GUIDES.nivelamento)}><h3>Treinamento</h3><p>Guias técnicos de engenharia.</p></div>
          <div className="info-card clickable-card" onClick={() => setMostrarBotTicket(true)}><h3>Diagnóstico</h3><p>Bot inteligente para falhas.</p></div>
        </div>
      </section>

      <footer className="site-footer">
        <p>© 2025 Quanton3D • Elite Technical Support</p>
        <div className="social-footer">
          {SOCIAL_LINKS.map(link => <a key={link.label} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>)}
        </div>
      </footer>
    </main>
  );
}

function SiteModal({ type, cliente, onClose, abrirGuia, abrirParceiroModal, resinas, impressoras }) {
  const titles = { contato: "Fale Conosco", sobre: "Sobre a Quanton3D", formulacao: "Formulação Personalizada" };
  return (
    <div className="modal-backdrop">
      <section className="site-modal">
        <div className="guide-header">
          <h2>{titles[type] || "Informações"}</h2>
          <button type="button" onClick={onClose}>Fechar</button>
        </div>
        <div className="modal-rich-content" style={{ padding: "20px" }}>
          {type === "sobre" && (
            <div className="modal-action-grid">
              <button type="button" onClick={() => abrirGuia("parceiros")}>Ver Parceiros</button>
              <button type="button" onClick={() => abrirGuia("diagnostico")}>Guia de Diagnóstico</button>
              <button type="button" onClick={abrirParceiroModal}>Quero ser Parceiro</button>
            </div>
          )}
          {type === "formulacao" && <FormulacaoContent cliente={cliente} />}
        </div>
      </section>
    </div>
  );
}

function FormulacaoContent({ cliente }) {
  const [form, setForm] = useState({ nome: cliente?.nome || "", telefone: cliente?.telefone || "", aplicacao: "" });
  const [sucesso, setSucesso] = useState("");
  const enviar = async (e) => {
    e.preventDefault();
    try {
      await api.post("/formulacoes", form);
      setSucesso("Pedido enviado com sucesso!");
      setTimeout(() => setSucesso(""), 3000);
    } catch { alert("Erro ao enviar."); }
  };
  return (
    <form onSubmit={enviar} className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
      {sucesso && <div className="modal-success">{sucesso}</div>}
      <label><span>Nome</span><input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} /></label>
      <label><span>WhatsApp</span><input value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} /></label>
      <label><span>Aplicação</span><textarea value={form.aplicacao} onChange={e => setForm({...form, aplicacao: e.target.value})} /></label>
      <button type="submit" className="submit-registration">Enviar Pedido</button>
    </form>
  );
}

export default App;
